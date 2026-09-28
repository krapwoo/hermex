/**
 * Live/recon previews for the reusable-component-family catalog entries added alongside the
 * production token system (Avatar's bot-mark addition, Divider, Tag, Shimmer/Skeleton,
 * List/ListItem, Banner, Attachment, Inline Reference Link, and the Disclosure Row / Reference
 * Chip / Composer / Transcript Activity secondary patterns). Extracted out of hermesSections.tsx
 * (same reasoning as HermesSemanticColorReference.tsx / HermesIconReference.tsx /
 * HermesMotionReference.tsx) so that file stays a metadata/SectionDef list, not a growing pile of
 * preview JSX.
 *
 * Where the generic component library IS the real shared primitive (Divider, Shimmer, List,
 * ListItem, Badge, Button, Banner), these previews render it directly. Where Hermex's own SwiftUI
 * chrome has no generic equivalent (the exact Tag size/opacity table, Attachment, Inline Reference
 * Link, the static bot mark, the Composer mock), previews are hand-built "recon" approximations of
 * the real values — the same convention hermesSections.tsx's own local `recon` StyleSheet already
 * uses, deliberately not this repo's own template tokens.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { AccordionList, Avatar, Badge, Banner, Button, Card, Checkbox, Divider, Dropdown, List, ListItem, Radio, Shimmer, SkeletonGroup, Toast, Tooltip, TopNav } from '../../components';
import { Icon } from '../../../icons/Icon.native';
import type { IconName } from '../../../icons';
import { DS_ICON_SIZE, DS_RADIUS } from '../../../tokens';
import { HERMES_COLOR_RAMPS, HERMES_SEMANTIC_COLORS } from './hermesColorCatalogData';
import { HERMES_ATTACHMENT_SIZE } from './hermesAttachmentSize';
import { HERMES_ICON_SIZE } from './hermesIconSize';
import { HERMES_ICON_AVATAR_PAIRING } from './hermesIconSize';

const preview = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' },
  caption: { fontSize: 11, color: '#8a8a8a', lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#1c1c1e' },

  // Divider
  dividerCard: { width: 220, gap: 8, padding: 12, borderRadius: 12 },
  dividerLightCard: { backgroundColor: '#ffffff' },
  dividerDarkCard: { backgroundColor: '#1c1c1e' },

  // Tag
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  tagText: { fontWeight: '600' },

  // Buttons — Hermex Brand Primary and Adaptive Glass compose shared tokens over native controls.
  buttonBrandPrimary: { backgroundColor: HERMES_COLOR_RAMPS.Gold[500] },
  buttonBrandPrimaryLabel: { color: '#000000' },
  buttonGlassSurface: { backgroundColor: 'rgba(240,240,245,0.85)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)' },

  // Bot mark
  botMarkPreview: {
    gap: 12, flexBasis: 220, flexGrow: 1, maxWidth: '100%', minWidth: 0,
  },
  botMarkBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#2c2c2e',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  botEye: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  avatarSystemImageCell: { alignItems: 'center', gap: 4 },

  // Attachment
  // Sized from HERMES_ATTACHMENT_SIZE.messageGridCell at each call site (not a fixed width/height
  // here) — this base style only supplies the shared look (surface, radius, border, content layout).
  // borderRadius reads DS_RADIUS.medium directly (the same token Card's own outer radius uses) —
  // never a second, independently-chosen Attachment-only radius value, per spec §4.3.
  tileBox: {
    borderRadius: DS_RADIUS.medium, backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.10)',
  },
  tileName: { fontSize: 10, fontWeight: '500', color: '#1c1c1e', textAlign: 'center', paddingHorizontal: 6 },
  tileExt: { fontSize: 9, fontWeight: '700' },
  // Compact Card composition — the normal (non-mini) message/composer tile's outer surface, per
  // spec §4.3: the real Card component (density="compact" supplies the reduced, not default-16pt,
  // padding); this override style only replaces Card's own white/shadowed chrome with the tile's own
  // tinted, flat surface. The sent-message tile uses GridAttachmentCell's centered vertical anatomy;
  // the composer tile keeps its horizontal icon-panel/text anatomy.
  messageFileTile: {
    backgroundColor: '#f2f2f7', shadowOpacity: 0, elevation: 0,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)',
  },
  composerFileTile: {
    backgroundColor: '#f2f2f7', shadowOpacity: 0, elevation: 0,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)',
  },
  // Sized from HERMES_ATTACHMENT_SIZE.fileIconPanelWidth/fileIconPanelHeight at each call site.
  fileIconPanel: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  composerTileText: { flex: 1, gap: 2 },
  composerTileName: { fontSize: 11, fontWeight: '500', color: '#1c1c1e' },
  composerTileDetail: { fontSize: 10, color: '#6d6d72' },
  // Mini-preview thumbnail — deliberately NOT Card/Compact Card anatomy (30x30 is too small for
  // 16pt/12pt content padding to read as anything but a solid square); see spec §4.3. Sized from
  // HERMES_ATTACHMENT_SIZE.compactPreview at the call site.
  miniPreviewThumb: {
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  // Positioned from HERMES_ATTACHMENT_SIZE.removeOverlap at the call site.
  attachmentRemove: { position: 'absolute' },
  attachmentFailureBadge: { position: 'absolute', bottom: -4, right: -4 },
  attachmentRetry: { marginTop: 4 },

  // TopNav — a bounded, clipped frame so the full-width bar reads as one contained specimen rather
  // than stretching to the whole documentation column.
  topNavShell: {
    width: 320, borderRadius: 12, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)',
  },
  topNavActionButton: { minWidth: 44, minHeight: 44 },

  // Disclosure / Log Row
  logRow: {
    width: 260, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32,
    paddingVertical: 4,
  },
  logIconSlot: { width: 20, alignItems: 'center' },
  logSummary: { flex: 1, fontSize: 13, color: '#1c1c1e' },
  logStatus: { fontSize: 11, fontWeight: '700', color: '#34C759' },
  logBody: {
    marginLeft: 26, marginTop: 4, padding: 8, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)', maxHeight: 60,
  },
  logBodyText: { fontSize: 11, fontFamily: 'Menlo', color: '#3a3a3c' },

  // Inline Reference Link — deliberately no capsule fill/outline; accent color + underline-on-
  // focus/press is the only affordance, visually distinct from Tag's filled pill.
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkGlyph: { fontSize: 13, color: '#3478F6' },
  linkText: { fontSize: 13, fontWeight: '600', color: '#3478F6' },
  linkTextFocused: { textDecorationLine: 'underline' },
  linkTextPressed: { color: '#1c5cd6' },

  // Static Skeleton (production-faithful — no animation)
  skeletonFill: { backgroundColor: 'rgba(120,120,128,0.16)' },
  skeletonTextLine: { height: 12, borderRadius: 4, width: '100%' },
  skeletonCircle: { width: 40, height: 40, borderRadius: 20 },
  skeletonCapsule: { width: 72, height: 24, borderRadius: 999 },
  skeletonRect: { width: 120, height: 64, borderRadius: 0 },
  skeletonRoundedRect: { width: 120, height: 64, borderRadius: 12 },
  skeletonCard: { width: 200, height: 88, borderRadius: 16 },

  // Native iOS patterns and the Hermex-owned Segmented Control reconstruction.
  nativeSearch: {
    width: 280, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#efeff4',
  },
  nativeSearchInput: { flex: 1, minWidth: 0, fontSize: 16, color: '#1c1c1e', paddingVertical: 0 },
  nativeFieldGroup: { gap: 4, width: 280 },
  nativeFieldInput: {
    minHeight: 44, fontSize: 16, color: '#1c1c1e', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, backgroundColor: '#efeff4',
  },
  composerTextInputRow: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(120,120,128,0.16)',
  },
  segmentedFixedTrack: {
    width: 280, flexDirection: 'row', gap: 4, paddingHorizontal: 4,
    borderRadius: 999, backgroundColor: 'rgba(120,120,128,0.16)',
  },
  segmentedTouchTarget: { minHeight: 44, justifyContent: 'center' },
  segmentedPill: {
    height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 999,
  },
  segmentedFixedOption: { flex: 1 },
  scrollingSegmentText: { fontSize: 14, color: '#6d6d72' },
  scrollingSegmentTextSelected: { color: '#1c1c1e', fontWeight: '600' },

  // Composer pattern mock
  composerSurface: {
    width: 320, borderRadius: 24, backgroundColor: 'rgba(240,240,245,0.85)', padding: 10, gap: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  composerInputRow: {
    minHeight: 36, borderRadius: 18, backgroundColor: '#ffffff', paddingHorizontal: 12,
    justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.10)',
  },
  composerInputText: { fontSize: 13, color: '#8a8a8a' },
  composerActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  composerValidationText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  composerSendButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#3478F6',
    alignItems: 'center', justifyContent: 'center',
  },
  composerSendGlyph: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // SessionListItem — streaming/attention affordances beyond plain ListItem
  streamDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  attentionText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },

  // Checkbox/Radio — adaptive Color.primary selected-fill swatch (same Light/Dark frame precedent
  // as HermesSemanticColorReference.tsx's SampleFrame, kept local since it's a one-off two-frame
  // pair rather than a full role gallery).
  adaptiveSwatchCell: { alignItems: 'center', gap: 4 },
  adaptiveSwatchFrame: {
    width: 64, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
  },
  adaptiveSwatchFrameLight: { backgroundColor: '#F2F2F7', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)' },
  adaptiveSwatchFrameDark: { backgroundColor: '#1C1C1E' },
  adaptiveSwatchSquare: { width: 20, height: 20, borderRadius: 4 },
  adaptiveSwatchCircle: { width: 20, height: 20, borderRadius: 10 },
  adaptiveSwatchLabel: { fontSize: 9, fontWeight: '700', color: '#8a8a8a', fontFamily: 'Menlo' },
});

// ─── Checkbox/Radio — adaptive Color.primary selected-fill demo ────────────────
// The approved decision is adaptive semantic black/white (Color.primary), not a fixed accent —
// reuses `color.text.primary`'s own previewLight/previewDark facts rather than a second, hand-typed
// pair of hex literals.
function AdaptiveSelectedFillSwatch({ shape }: { shape: 'square' | 'circle' }) {
  const primary = HERMES_SEMANTIC_COLORS['color.text.primary'];
  const fill = shape === 'circle' ? preview.adaptiveSwatchCircle : preview.adaptiveSwatchSquare;
  return (
    <View style={preview.row}>
      <View style={preview.adaptiveSwatchCell}>
        <View style={[preview.adaptiveSwatchFrame, preview.adaptiveSwatchFrameLight]}>
          <View style={[fill, { backgroundColor: primary.previewLight }]} />
        </View>
        <Text style={preview.adaptiveSwatchLabel}>Light · {primary.previewLight}</Text>
      </View>
      <View style={preview.adaptiveSwatchCell}>
        <View style={[preview.adaptiveSwatchFrame, preview.adaptiveSwatchFrameDark]}>
          <View style={[fill, { backgroundColor: primary.previewDark }]} />
        </View>
        <Text style={preview.adaptiveSwatchLabel}>Dark · {primary.previewDark}</Text>
      </View>
    </View>
  );
}

// ─── Avatar umbrella — static bot mark ───────────────────────────────────────
export function BotMarkPreview() {
  return (
    <View style={preview.botMarkPreview}>
      <View style={preview.botMarkBox}>
        <View style={preview.botEye} />
        <View style={preview.botEye} />
      </View>
      <Text style={preview.caption}>
        Static illustration only — BotAnimatedFaceView's blink/idle timeline and
        BotInteractiveFaceView's drag-to-gaze/tap-to-react behavior aren't reconstructed here.
      </Text>
    </View>
  );
}

// ─── Avatar — system-image identity (production HermesAvatar, used inside Content Unavailable) ──
// Driven directly off HERMES_ICON_AVATAR_PAIRING (the same source HermesIconReference's own
// IconAvatarPairingGallery reads) so the three approved avatar/icon diameters can't drift into a
// second, hand-typed copy here. Overrides the generic Avatar's default half-diameter icon ratio via
// `iconSize`, matching production HermesAvatar's fixed pairing rather than the template's own
// proportional default.
export function AvatarSystemImageIdentityPreview() {
  return (
    <View style={preview.row}>
      {Object.entries(HERMES_ICON_AVATAR_PAIRING).map(([key, { avatar, icon }]) => (
        <View key={key} style={preview.avatarSystemImageCell}>
          <Avatar size={avatar} iconSize={icon} iconName="menu" backgroundColor="#8E8E93" accessibilityLabel="No skills available" />
          <Text style={preview.caption}>{avatar} · icon {icon}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function HermexDividerPreview() {
  return (
    <View style={preview.row}>
      <View style={[preview.dividerCard, preview.dividerLightCard]}>
        <Text style={[preview.label, { color: '#1c1c1e' }]}>Light background — default opacity</Text>
        <Divider />
        <Text style={preview.caption}>Component-owned default (0.72) — matches SettingsDivider</Text>
      </View>
      <View style={[preview.dividerCard, preview.dividerLightCard]}>
        <Text style={[preview.label, { color: '#1c1c1e' }]}>Light background — full strength</Text>
        <Divider opacity={1} />
        <Text style={preview.caption}>Caller override via the opacity prop — Card's footer divider</Text>
      </View>
      <View style={[preview.dividerCard, preview.dividerDarkCard]}>
        <Text style={[preview.label, { color: '#ffffff' }]}>Dark background</Text>
        <Divider style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <Text style={[preview.caption, { color: '#8a8a8a' }]}>Adapts — never a fixed light-only gray</Text>
      </View>
    </View>
  );
}

// ─── Tag (display-only — was Status Capsule) ────────────────────────────────
function TagSwatch({
  label, tint, hPad, vPad, opacity = 0.12, iconGlyph,
}: { label: string; tint: string; hPad: number; vPad: number; opacity?: number; iconGlyph?: string }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: hPad, paddingVertical: vPad, borderRadius: 999,
        backgroundColor: `${tint}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      }}
    >
      {iconGlyph ? <Text style={{ color: tint, fontSize: 10 }}>{iconGlyph}</Text> : null}
      <Text style={[preview.tagText, { color: tint, fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

export function TagGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>size: compact (8/2 padding)</Text>
      <View style={preview.tagRow}>
        <TagSwatch label="Cached" tint="#FF9500" hPad={8} vPad={2} />
        <TagSwatch label="Read-only" tint="#8E8E93" hPad={8} vPad={2} />
        <TagSwatch label="claude-code" tint="#3478F6" hPad={8} vPad={2} />
      </View>
      <Text style={preview.caption}>Sessions' Cached/Read-only/source tags, hidden from VoiceOver (decorative)</Text>
      <View style={preview.tagRow}>
        <TagSwatch label="Modified" tint="#FFCC00" hPad={8} vPad={2} opacity={0.18} />
        <TagSwatch label="Staged" tint="#34C759" hPad={8} vPad={2} opacity={0.18} />
      </View>
      <Text style={preview.caption}>Workspace/Git's change-kind tag (0.18 fill)</Text>
      <View style={preview.tagRow}>
        <TagSwatch label="Running" tint="#34C759" hPad={8} vPad={4} iconGlyph="●" />
        <TagSwatch label="Selected" tint="#3478F6" hPad={8} vPad={4} />
      </View>
      <Text style={preview.caption}>size: regular (8/4 padding, optional icon) — Tasks' status tag, Settings' profile tag</Text>
      <View style={preview.tagRow}>
        <TagSwatch label="Connected" tint="#34C759" hPad={12} vPad={8} />
      </View>
      <Text style={preview.caption}>size: prominent (12/8 padding, caption not caption2) — Settings' connection tag</Text>
      <Text style={[preview.label, { marginTop: 4 }]}>Every Tag instance above is display-only</Text>
      <Text style={preview.caption}>
        No Tag prop, example, or styling is interactive anywhere in this section — a tappable file
        reference is a distinct component, Inline Reference Link, never a styled Tag (see that
        section for the visual and semantic contrast).
      </Text>
      <Text style={[preview.label, { marginTop: 4 }]}>Closest generic equivalent</Text>
      <View style={preview.tagRow}>
        <Badge variant="warning" label="Cached" />
        <Badge variant="neutral" label="Read-only" />
        <Badge variant="positive" label="Staged" />
      </View>
      <Text style={preview.caption}>
        Badge's 5 closed semantic variants are the closest generic model — production drives each
        tag from an arbitrary SwiftUI Color per status, not a fixed enum.
      </Text>
    </View>
  );
}

// ─── Inline Reference Link ────────────────────────────────────────────────────
/**
 * A real, focusable link — not a recon picture — since the whole point of this family is contrast
 * with Tag's non-interactive capsule: keyboard Tab reaches it, Enter/Space activates it, and its
 * pressed/focus states are genuinely observable in the running preview.
 */
export function InlineReferenceLinkPreview() {
  const [focused, setFocused] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  const Link = ({ fileName }: { fileName: string }) => (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${fileName} in the source viewer`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPressIn={() => setPressedKey(fileName)}
      onPressOut={() => setPressedKey(null)}
      onPress={() => setOpened(fileName)}
      style={preview.linkRow}
    >
      <Text style={preview.linkGlyph}>◆</Text>
      <Text
        style={[
          preview.linkText,
          focused && preview.linkTextFocused,
          pressedKey === fileName && preview.linkTextPressed,
        ]}
      >
        {fileName}
      </Text>
    </Pressable>
  );

  return (
    <View style={preview.stack}>
      <View style={preview.row}>
        <Link fileName="App.swift" />
        <Link fileName="ChatComposerAttachmentStripView.swift" />
      </View>
      <Text style={preview.caption}>
        Tab/click to focus, press to activate — this is a real Pressable with
        accessibilityRole="link", not a static picture. Underline appears on focus; the accent color
        deepens on press. No capsule fill or tag-like outline at any state.
      </Text>
      <Text style={preview.caption}>
        {opened ? `Last activated: opens "${opened}" in the source viewer.` : 'Not yet activated in this preview.'}
      </Text>
    </View>
  );
}

// ─── Button (decision + tactile cross-reference) ─────────────────────────────
export function ButtonDecisionAndTactilePreview() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Sizes (extra small → large)</Text>
      <View style={preview.row}>
        <Button label="XS" size="extraSmall" variant="secondary" onPress={() => {}} />
        <Button label="Small" size="small" variant="secondary" onPress={() => {}} />
        <Button label="Medium" size="medium" variant="secondary" onPress={() => {}} />
        <Button label="Large" size="large" variant="secondary" onPress={() => {}} />
      </View>
      <Text style={preview.caption}>
        Generic Button's own size scale, extended with `extraSmall` for a compact chrome-level
        action (never a primary action's only affordance) — the closest reusable model for
        Hermex's extra-small-through-large size requirement.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Emphasis roles (Brand Primary/Neutral/Primary/Secondary/Destructive)</Text>
      <View style={preview.row}>
        <Button label="Brand primary" variant="primary" size="medium" style={preview.buttonBrandPrimary} textStyle={preview.buttonBrandPrimaryLabel} onPress={() => {}} />
        <Button label="Neutral" variant="tertiary" size="medium" onPress={() => {}} />
        <Button label="Approve" variant="primary" size="medium" onPress={() => {}} />
        <Button label="Not now" variant="secondary" size="medium" onPress={() => {}} />
        <Button label="Deny" variant="destructive" size="medium" onPress={() => {}} />
      </View>
      <Text style={preview.caption}>
        Brand Primary uses Hermex Gold 500 with Gold 600 pressed and a black label. Neutral maps to
        the generic Button's `tertiary` variant; Primary/Secondary/Destructive map onto the
        identically-named generic variants. Pending Request's Yes/No/Approve/Deny controls keep that
        decision mapping; the Tip Jar CTA uses Brand Primary.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Adaptive Glass surface (composition, not a variant)</Text>
      <View style={preview.row}>
        <Button
          label="Glass"
          variant="secondary"
          size="medium"
          style={preview.buttonGlassSurface}
          onPress={() => {}}
        />
      </View>
      <Text style={preview.caption}>
        Glass is demonstrated here as a plain style composition on top of an existing variant — the
        same translucent surface as the Adaptive Glass Material entry — never a duplicated
        `variant="glass"` value or a second fallback/accessibility branch of its own.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Content configurations</Text>
      <View style={preview.row}>
        <Button label="Label only" size="medium" variant="secondary" onPress={() => {}} />
        <Button showIcon showLabel={false} iconName="add" size="medium" variant="secondary" onPress={() => {}} />
        <Button label="Leading" showIcon iconName="add" iconPosition="leading" size="medium" variant="secondary" onPress={() => {}} />
        <Button label="Trailing" showIcon iconName="add" iconPosition="trailing" size="medium" variant="secondary" onPress={() => {}} />
      </View>
      <Text style={preview.caption}>label-only · icon-only · icon-leading · icon-trailing</Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Disabled and pending</Text>
      <View style={preview.row}>
        <Button label="Disabled" size="medium" variant="secondary" disabled onPress={() => {}} />
        <Button label="Pending" size="medium" variant="secondary" loading onPress={() => {}} />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>Press-only variants (HermesButtonPressOnlyStyle)</Text>
      <View style={preview.row}>
        <Button label="Send" showIcon showLabel={false} iconName="add" size="medium" onPress={() => {}} />
      </View>
      <Text style={preview.caption}>
        icon · compactControl · capsule · card · thumbnail — HermesButtonPressOnlyStyle's Chrome cases
        — apply press scale/opacity/shadow feedback to a native SwiftUI Button whose own shape/fill
        stays caller-owned, through the same applyingHermesButtonPressFeedback helper HermesButtonStyle's
        Standard Press Feedback uses (Reduce-Motion-safe; a spring/scale response drops out when
        Reduce Motion is on) — not a separate variant/label API, so they aren't reproduced as distinct
        RN examples here. Glass is a surface option composing Adaptive Glass (see that Material
        entry), not a duplicated fallback. Physical haptics remain a separate, opt-in concern from
        this press-feedback chrome.
      </Text>
    </View>
  );
}

// ─── Skeleton — static, production-faithful (no animation) ──────────────────
/**
 * Deliberately NOT the animated `Shimmer` component below — production's `SkeletonPlaceholder` is
 * static (a platform `.redacted(reason: .placeholder)` treatment), so this gallery reproduces that
 * static appearance for every required shape instead of introducing/describing continuous shimmer.
 */
export function HermesSkeletonGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Text line</Text>
      <View style={{ gap: 6, width: 220 }}>
        <View style={[preview.skeletonFill, preview.skeletonTextLine]} />
        <View style={[preview.skeletonFill, preview.skeletonTextLine, { width: '70%' }]} />
      </View>
      <Text style={preview.label}>Circle / avatar · Block · Rounded rectangle · Content-shaped card</Text>
      <View style={preview.row}>
        <View style={[preview.skeletonFill, preview.skeletonCircle]} accessibilityLabel="Loading" />
        <View style={[preview.skeletonFill, preview.skeletonRect]} accessibilityLabel="Loading" />
        <View style={[preview.skeletonFill, preview.skeletonRoundedRect]} />
        <View style={[preview.skeletonFill, preview.skeletonCard]} />
      </View>
      <Text style={preview.label}>Grouped composition (one accessibility announcement)</Text>
      <SkeletonGroup style={{ flexDirection: 'row', gap: 10, alignItems: 'center', width: 240 }}>
        <View style={[preview.skeletonFill, preview.skeletonCircle, { width: 40, height: 40, borderRadius: 20 }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[preview.skeletonFill, preview.skeletonTextLine]} />
          <View style={[preview.skeletonFill, preview.skeletonTextLine, { width: '60%' }]} />
        </View>
      </SkeletonGroup>
      <Text style={preview.caption}>
        Every shape here is static — no pulse, no loop — matching production's shared text-line,
        block, circle, and rounded-rectangle Skeleton shapes. Content-shaped cards keep
        `.skeletonPlaceholder()` when the final view already owns the right geometry. Reduce Motion
        needs no separate fallback here because nothing in this gallery ever animates.
      </Text>
    </View>
  );
}

// ─── Search — Hermex-owned `.hermesSearch` wrapper over native `.searchable` ─
const SEARCH_FAMILY_SAMPLE_SESSIONS = ['Refactor auth module', 'Investigate flaky test', 'Update onboarding copy'];

export function SearchFamilyGallery() {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const trimmed = query.trim().toLowerCase();
  const results = trimmed.length === 0
    ? SEARCH_FAMILY_SAMPLE_SESSIONS
    : SEARCH_FAMILY_SAMPLE_SESSIONS.filter((session) => session.toLowerCase().includes(trimmed));
  return (
    <View style={preview.stack}>
      <View style={preview.nativeSearch} accessibilityRole="search">
        <Icon name="search" size={DS_ICON_SIZE.sm} color="#6d6d72" />
        <TextInput
          ref={searchInputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search sessions"
          accessibilityLabel="Search sessions"
          style={preview.nativeSearchInput}
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => {
              setQuery('');
              searchInputRef.current?.focus();
            }}
          >
            <Icon name="clear" size={DS_ICON_SIZE.sm} color="#6d6d72" />
          </Pressable>
        )}
      </View>
      {results.length > 0 ? (
        <View style={preview.stack}>
          {results.map((session) => (
            <Text key={session} style={preview.label}>{session}</Text>
          ))}
        </View>
      ) : (
        <Text style={preview.caption}>No results for “{query}”.</Text>
      )}
      <Text style={preview.caption}>
        `.hermesSearch(text:placement:prompt:)` is a thin Hermex-owned wrapper that forwards straight
        to SwiftUI's native `.searchable` modifier — this reconstruction documents its prompt, focus,
        clear, and no-results behavior. Native iOS still owns placement, focus, keyboard, clear,
        dictation, VoiceOver, and Dynamic Type; this preview introduces no custom Hermex field chrome.
      </Text>
    </View>
  );
}

// ─── Text Input — Hermex-owned HermesTextField/HermesSecureField/HermesNumberField wrappers ─
export function HermesTextInputFamilyGallery() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [quantity, setQuantity] = useState('');
  return (
    <View style={preview.stack}>
      <View style={preview.nativeFieldGroup}>
        <Text style={preview.label}>Single-line — HermesTextField</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Hermes address"
          accessibilityLabel="Hermes address"
          style={preview.nativeFieldInput}
        />
      </View>
      <View style={preview.nativeFieldGroup}>
        <Text style={preview.label}>Secure entry — HermesSecureField</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          accessibilityLabel="Password"
          secureTextEntry
          style={preview.nativeFieldInput}
        />
      </View>
      <View style={preview.nativeFieldGroup}>
        <Text style={preview.label}>Number — HermesNumberField</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Quantity"
          accessibilityLabel="Quantity"
          style={preview.nativeFieldInput}
        />
      </View>
      <Text style={preview.caption}>
        Native reconstructions of `HermesTextField`, `HermesSecureField`, and `HermesNumberField` —
        three thin wrappers that forward straight to native TextField, SecureField, and the typed
        TextField(value:format:) path. Production owns focus, keyboard, autocorrection,
        capitalization, content type, and locale-aware number parsing/formatting through these native
        controls, not through custom Hermex field chrome. TextEditor (long-form body text) and Search
        stay outside this family — see their own entries.
      </Text>
    </View>
  );
}

interface SegmentedPreviewOption {
  value: string;
  label: string;
  count?: number;
}

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

function SegmentedPreviewOptionView({
  option,
  selected,
  fill,
  onPress,
}: {
  option: SegmentedPreviewOption;
  selected: boolean;
  fill?: boolean;
  onPress: () => void;
}) {
  const reduceMotion = useReduceMotion();
  const selectionProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      selectionProgress.setValue(selected ? 1 : 0);
      return;
    }
    Animated.timing(selectionProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [reduceMotion, selected, selectionProgress]);

  const backgroundColor = selectionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={option.count == null ? option.label : `${option.label}, ${option.count}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        preview.segmentedTouchTarget,
        fill && preview.segmentedFixedOption,
        pressed && { opacity: 0.72 },
      ]}
    >
      <Animated.View style={[preview.segmentedPill, { backgroundColor }]}>
        <Text style={[preview.scrollingSegmentText, selected && preview.scrollingSegmentTextSelected]}>
          {option.label}{option.count == null ? '' : `  ${option.count}`}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function FixedSegmentedControlPreview() {
  const options: SegmentedPreviewOption[] = [
    { value: 'cost', label: 'Cost' },
    { value: 'tokens', label: 'Tokens' },
  ];
  const [value, setValue] = useState('tokens');

  return (
    <View accessibilityRole="tablist" style={preview.segmentedFixedTrack}>
      {options.map((option) => (
        <SegmentedPreviewOptionView
          key={option.value}
          option={option}
          selected={option.value === value}
          fill
          onPress={() => setValue(option.value)}
        />
      ))}
    </View>
  );
}

function ScrollingSegmentedControlPreview() {
  const options = [
    { value: 'backlog', label: 'Backlog', count: 8 },
    { value: 'ready', label: 'Ready', count: 3 },
    { value: 'doing', label: 'In progress', count: 2 },
    { value: 'review', label: 'Review', count: 1 },
    { value: 'done', label: 'Done', count: 12 },
  ];
  const [value, setValue] = useState('ready');
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 420 }}>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <SegmentedPreviewOptionView
              key={option.value}
              option={option}
              selected={selected}
              onPress={() => setValue(option.value)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

export function SegmentedControlGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Fixed — custom Hermex equal-width control</Text>
      <FixedSegmentedControlPreview />
      <Text style={preview.caption}>
        Used by Tasks, Usage window selection, and the Cost/Tokens selector. Each option preserves
        native Button semantics while Hermex owns the track, selected pill, typography, and motion.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Scrolling — larger mutually-exclusive sets</Text>
      <ScrollingSegmentedControlPreview />
      <Text style={preview.caption}>
        Used by Kanban when the status set no longer fits an equal-width control. The selected pill
        transitions between options, uses a compact 36pt visual height inside a 44pt touch target,
        and switches instantly when Reduce Motion is enabled.
      </Text>
    </View>
  );
}

// ─── Shimmer (catalog-only animated reference, distinct from production Skeleton) ────────────────
export function ShimmerFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Text lines</Text>
      <View style={{ gap: 6, width: 220 }}>
        <Shimmer variant="text" />
        <Shimmer variant="text" width="70%" />
      </View>
      <Text style={preview.label}>Circle / capsule / rectangle / rounded rectangle / card</Text>
      <View style={preview.row}>
        <Shimmer variant="circle" size={40} />
        <Shimmer variant="container" width={72} height={24} style={{ borderRadius: 999 }} />
        <Shimmer variant="container" width={72} height={24} style={{ borderRadius: 0 }} />
        <Shimmer variant="container" width={72} height={24} />
        <Shimmer variant="container" width={120} height={64} />
      </View>
      <Text style={preview.label}>Composed row (avatar + two text lines, one announcement)</Text>
      <SkeletonGroup style={{ flexDirection: 'row', gap: 10, alignItems: 'center', width: 240 }}>
        <Shimmer variant="circle" size={40} />
        <View style={{ flex: 1, gap: 6 }}>
          <Shimmer variant="text" />
          <Shimmer variant="text" width="60%" />
        </View>
      </SkeletonGroup>
      <Text style={preview.caption}>
        Production now composes the shared `SkeletonPlaceholder` primitive (Sessions row,
        Insights provider-limits card, chat transcript) — see the static gallery above for the
        production-faithful shapes. This animated Shimmer remains the catalog/reference-only
        counterpart, never a claimed production mapping.
      </Text>
    </View>
  );
}

// ─── List / ListItem ──────────────────────────────────────────────────────────
export function ListItemFamilyGallery() {
  return (
    <View style={preview.stack}>
      <List>
        <ListItem
          leading={<Avatar initials="JS" size={32} />}
          title="Login"
          titleAccessory={<Badge variant="warning" label="WIP" />}
          description="feature/auth"
          metadata="2 files"
          trailingText="2m"
          onPress={() => {}}
          trailing={<Button label="Archive" size="extraSmall" variant="tertiary" onPress={() => {}} />}
          accessibilityLabel="Login branch, feature/auth, work in progress"
        />
        <ListItem
          leading={<Avatar iconName="menu" size={32} />}
          title="Nightly"
          trailingText="Queued"
          trailingSubtext="ETA 4m"
        />
        <ListItem title="Archived" disabled trailing={<Text style={preview.caption}>›</Text>} />
        <ListItem leading={<Avatar initials="?" size={32} />} title="Loading…" loading />
      </List>
      <Text style={preview.caption}>
        Every documented slot rendered by this generic RN component, including the title-adjacent
        accessory, an accessibility-label override on the first row, and the loading row above (one
        "Loading" announcement via SkeletonGroup, not one per Shimmer block). The first row's trailing
        "Archive" Button stays independently focusable and tappable even though the row itself is also
        pressable — the trailing accessory sits outside the row's own selecting Pressable, so an
        accessible Pressable never swallows it.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Picker configuration (folds in the retired Picker Row family)</Text>
      <List>
        <ListItem
          title="GPT-5.1"
          selected
          onPress={() => {}}
          trailing={<Text style={[preview.caption, { color: '#3478F6', fontWeight: '700' }]}>✓</Text>}
        />
        <ListItem title="Claude Opus 5" onPress={() => {}} />
        <ListItem title="Applying selection…" commitPending />
        <ListItem title="Fetching models…" loading />
        <ListItem title="Unavailable model" disabled />
      </List>
      <Text style={preview.caption}>
        A picker is not a separate family — it is ListItem used with the real `selected`
        accessibility state and a trailing checkmark, a distinct `commitPending` state once a choice
        is submitted (real content stays visible, unlike the `loading` skeleton above it), and the
        existing loading/disabled states. Model, profile, task-configuration, and skill pickers all
        target this configuration rather than a standalone Picker Row component.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>SessionListItem composition</Text>
      <List>
        <ListItem
          leading={<Avatar initials="HM" size={32} backgroundColor="#3478F6" />}
          title="Ship the release notes"
          titleAccessory={<View style={preview.streamDot} accessibilityLabel="Streaming" />}
          description="Ran `npm test` — 2 tool calls"
          metadata={<Text style={preview.attentionText}>Needs your input</Text>}
          trailingText="2m"
        />
        <ListItem
          leading={<Avatar initials="AB" size={32} backgroundColor="#8E8E93" />}
          title="Investigate flaky build failure"
          titleAccessory={<Text style={{ fontSize: 11, fontWeight: '700', color: '#3478F6' }}>build</Text>}
          description="Archived · Read-only"
          trailingText="1d"
        />
      </List>
      <Text style={preview.caption}>
        This SessionListItem composition is a new, foundation-only demonstration with no production
        call site — it composes ListItem's leading/title/description/metadata/trailing slots with
        session-specific anatomy: a streaming indicator dot (titleAccessory), an attention-status
        metadata line, and responsive reflow at narrow widths. Production's live session row is
        SessionRowView, which keeps its title plain and shows the match as a separate highlighted
        excerpt line beneath the title (`SessionSearchExcerpt.highlighted`). This generic ListItem
        preview does not model that dedicated excerpt line; its titleAccessory badge demonstrates
        only the separate title-adjacent slot, not search highlighting. Native Button wrapping,
        swipe actions, context menus,
        selection background, transitions, and the single screen-level horizontal inset are
        caller-owned in production by SessionInteractiveRow, which wraps SessionRowView (not this
        SessionListItem) in SessionListComponents.swift.
      </Text>
    </View>
  );
}

// ─── Accordion List ──────────────────────────────────────────────────────────
interface AccordionSessionRow {
  id: string;
  title: string;
  description?: string;
}

interface AccordionProjectRow {
  id: string;
  title: string;
  sessions: AccordionSessionRow[];
}

const ACCORDION_PROJECTS: AccordionProjectRow[] = [
  {
    id: 'hermex',
    title: 'Hermex',
    sessions: [
      { id: 'ds', title: 'Design system foundation', description: 'Active · just now' },
      { id: 'sessions', title: 'Session list redesign', description: 'Yesterday' },
      { id: 'push', title: 'Push recovery audit', description: 'Sep 24' },
    ],
  },
  {
    id: 'website',
    title: 'Website',
    sessions: [
      { id: 'landing', title: 'Landing page review', description: 'Sep 23' },
    ],
  },
];

function AccordionListCardMultipleDemo() {
  const [expandedIds, setExpandedIds] = useState<string[]>(['hermex']);
  return (
    <AccordionList
      items={ACCORDION_PROJECTS}
      appearance="card"
      separatorStyle="betweenRows"
      mode="multiple"
      expandedIds={expandedIds}
      onExpandedIdsChange={setExpandedIds}
      getHeader={(project) => ({
        title: project.title,
        description: `${project.sessions.length} sessions`,
        leading: <Avatar iconName="briefcase" size="small" />,
      })}
      getBodyItems={(project) => project.sessions}
      renderBodyItem={(_project, session) => (
        <ListItem key={session.id} title={session.title} description={session.description} />
      )}
    />
  );
}

function AccordionListCardlessSingleDemo() {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  return (
    <AccordionList
      items={ACCORDION_PROJECTS}
      appearance="cardless"
      separatorStyle="betweenRows"
      mode="single"
      expandedIds={expandedIds}
      onExpandedIdsChange={setExpandedIds}
      getHeader={(project) => ({
        title: project.title,
        description: `${project.sessions.length} sessions`,
        leading: <Avatar iconName="briefcase" size="small" />,
      })}
      getBodyItems={(project) => project.sessions}
      renderBodyItem={(_project, session) => (
        <ListItem key={session.id} title={session.title} description={session.description} />
      )}
    />
  );
}

export function AccordionListFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Card · multiple (interactive — tap a header)</Text>
      <AccordionListCardMultipleDemo />
      <Text style={preview.caption}>
        Header titles use label typography (semibold); session/body titles stay on the regular body
        weight, so the project header reads visibly stronger than the sessions it discloses. The card
        composes the shared Card component (outlined surface) for its 16pt horizontal content
        padding; the chevron renders at the 20pt (medium) icon-size step; and body expansion/
        collapse visibly animates (respecting Reduce Motion) instead of snapping open or shut.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Cardless · single (interactive — opening one closes the other)</Text>
      <AccordionListCardlessSingleDemo />
      <Text style={preview.caption}>
        Collapsed cardless project headers share one divider between adjacent rows; expanding a
        second header collapses the first back to zero-or-one open, and tapping the open header
        again collapses it to none. Cardless adds no Accordion-level horizontal outer padding — only
        ListItem's own row insets apply. The divider directly under an open header spans the full
        available width; the divider between two session rows begins at their own text column
        (avatar width + header/body gap + ListItem's own horizontal inset), not the row's outer edge.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Separator styles: none · betweenRows · topAndBottom · all</Text>
      <View style={preview.row}>
        <View style={{ width: 220 }}>
          <Text style={preview.caption}>none</Text>
          <AccordionList
            items={ACCORDION_PROJECTS.slice(0, 1)}
            appearance="cardless"
            separatorStyle="none"
            mode="multiple"
            initialExpandedIds={['hermex']}
            getHeader={(project) => ({ title: project.title, leading: <Avatar iconName="briefcase" size="small" /> })}
            getBodyItems={(project) => project.sessions}
            renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} />}
          />
        </View>
        <View style={{ width: 220 }}>
          <Text style={preview.caption}>betweenRows</Text>
          <AccordionList
            items={ACCORDION_PROJECTS.slice(0, 1)}
            appearance="cardless"
            separatorStyle="betweenRows"
            mode="multiple"
            initialExpandedIds={['hermex']}
            getHeader={(project) => ({ title: project.title, leading: <Avatar iconName="briefcase" size="small" /> })}
            getBodyItems={(project) => project.sessions}
            renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} />}
          />
        </View>
        <View style={{ width: 220 }}>
          <Text style={preview.caption}>topAndBottom — the top line sits above the header, cardless collapsed rows keep sharing a single boundary between projects</Text>
          <AccordionList
            items={ACCORDION_PROJECTS.slice(0, 1)}
            appearance="cardless"
            separatorStyle="topAndBottom"
            mode="multiple"
            initialExpandedIds={['hermex']}
            getHeader={(project) => ({ title: project.title, leading: <Avatar iconName="briefcase" size="small" /> })}
            getBodyItems={(project) => project.sessions}
            renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} />}
          />
        </View>
        <View style={{ width: 220 }}>
          <Text style={preview.caption}>all</Text>
          <AccordionList
            items={ACCORDION_PROJECTS.slice(0, 1)}
            appearance="cardless"
            separatorStyle="all"
            mode="multiple"
            initialExpandedIds={['hermex']}
            getHeader={(project) => ({ title: project.title, leading: <Avatar iconName="briefcase" size="small" /> })}
            getBodyItems={(project) => project.sessions}
            renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} />}
          />
        </View>
      </View>

      <Text style={[preview.label, { marginTop: 8 }]}>Disabled header</Text>
      <AccordionList
        items={[{ id: 'archived', title: 'Archived project', sessions: [] as AccordionSessionRow[] }]}
        appearance="card"
        separatorStyle="betweenRows"
        mode="multiple"
        initialExpandedIds={[]}
        getHeader={(project) => ({
          title: project.title,
          description: 'Read-only',
          leading: <Avatar iconName="circle-slash" size="small" />,
          disabled: true,
        })}
        getBodyItems={(project) => project.sessions}
        renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} />}
      />
      <Text style={preview.caption}>A disabled header never toggles, regardless of tap or accessibility action.</Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Caller-composed loading, empty, and “Show all” body rows</Text>
      <AccordionList
        items={[
          { id: 'loading', title: 'Loading project', sessions: [{ id: 'loading-row', title: 'Loading sessions…' }] },
          { id: 'empty', title: 'Empty project', sessions: [{ id: 'empty-row', title: 'No sessions' }] },
          {
            id: 'show-all',
            title: 'Large project',
            sessions: [
              { id: 'recent-1', title: 'Investigate flaky build failure', description: '2h' },
              { id: 'show-all-row', title: 'Show all sessions' },
            ],
          },
        ]}
        appearance="card"
        separatorStyle="betweenRows"
        mode="multiple"
        initialExpandedIds={['loading', 'empty', 'show-all']}
        getHeader={(project) => ({ title: project.title, leading: <Avatar iconName="briefcase" size="small" /> })}
        getBodyItems={(project) => project.sessions}
        renderBodyItem={(_project, session) => <ListItem key={session.id} title={session.title} description={session.description} />}
      />
      <Text style={preview.caption}>
        The component renders every body row a caller supplies, including loading, empty, and
        “Show all” rows — it never caps row count or invents its own product messaging. Body rows
        also align to the header title column, matching the header's leading avatar width plus the
        shared row gap.
      </Text>
    </View>
  );
}

// ─── Checkbox ────────────────────────────────────────────────────────────────
/**
 * Reuses the real generic catalog Checkbox directly — no Hermex-specific duplicate. Covers checked,
 * unchecked, and disabled as static instances; a live interactive instance (tap to toggle, Tab to
 * focus); and the row-owned indicator configuration a multi-select list uses — `onChange` omitted so
 * the box renders as a non-interactive, accessibility-hidden visual and the owning ListItem's own
 * Pressable and `selected` state remain the only interactive/accessible control, never a checkbox
 * nested inside another control.
 */
function CheckboxInteractiveDemo() {
  const [checked, setChecked] = useState(false);
  return <Checkbox checked={checked} onChange={setChecked} label="Remember this trip" />;
}

function CheckboxRowOwnedDemo() {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({ report: true, notes: false });
  const files: { key: string; title: string }[] = [
    { key: 'report', title: 'quarterly-report.pdf' },
    { key: 'notes', title: 'notes.md' },
  ];
  return (
    <List>
      {files.map((file) => (
        <ListItem
          key={file.key}
          leading={<Checkbox checked={!!selectedIds[file.key]} />}
          title={file.title}
          selected={!!selectedIds[file.key]}
          onPress={() => setSelectedIds((prev) => ({ ...prev, [file.key]: !prev[file.key] }))}
        />
      ))}
    </List>
  );
}

export function CheckboxFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Unchecked · Checked</Text>
      <View style={preview.row}>
        <Checkbox checked={false} onChange={() => {}} label="Unchecked" />
        <Checkbox checked={true} onChange={() => {}} label="Checked" />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>Disabled</Text>
      <View style={preview.row}>
        <Checkbox checked={false} onChange={() => {}} disabled label="Disabled, unchecked" />
        <Checkbox checked={true} onChange={() => {}} disabled label="Disabled, checked" />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>Interactive (tap to toggle; Tab to focus)</Text>
      <CheckboxInteractiveDemo />
      <Text style={preview.caption}>
        Tab reaches the box and shows a focus ring around it; a tap or Space/Enter toggles it — the
        real, live generic catalog Checkbox this entry documents directly, not a static picture.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Adaptive selected fill (production HermesCheckbox)</Text>
      <AdaptiveSelectedFillSwatch shape="square" />
      <Text style={preview.caption}>
        Production HermesCheckbox fills and borders the checked box with the adaptive semantic
        Color.primary — black in light appearance, white in dark — not a fixed accent color; the
        checkmark stays the inverse system background so it remains legible against either. The
        generic catalog Checkbox above (blue accent) is the reusable template's own unrelated default
        and is not changed by this decision.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Row-owned indicator (multi-select list)</Text>
      <CheckboxRowOwnedDemo />
      <Text style={preview.caption}>
        Each row's own Pressable owns the tap and exposes `accessibilityState.selected`; the leading
        Checkbox omits `onChange`, so it renders the identical box/checkmark visual as a
        non-interactive, accessibility-hidden indicator rather than a second control nested inside the
        row — the same one-control-per-row rule ListItem's picker checkmark (see List / ListItem)
        already follows, applied here to a multi-select rather than a single-select choice.
      </Text>
    </View>
  );
}

// ─── Attachment ────────────────────────────────────────────────────────────────
export function AttachmentTileGallery() {
  const fileIconPanelSize = { width: HERMES_ATTACHMENT_SIZE.fileIconPanelWidth, height: HERMES_ATTACHMENT_SIZE.fileIconPanelHeight };
  const accessibilityFileIconPanelSize = {
    width: HERMES_ATTACHMENT_SIZE.fileIconPanelWidthAccessibility,
    height: HERMES_ATTACHMENT_SIZE.fileIconPanelHeightAccessibility,
  };
  const gridCellSize = { width: HERMES_ATTACHMENT_SIZE.messageGridCell, height: HERMES_ATTACHMENT_SIZE.messageGridCell };
  const messageFileNameWidth = { maxWidth: HERMES_ATTACHMENT_SIZE.messageGridCell - HERMES_ATTACHMENT_SIZE.messageFileTextInset };

  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Message attachment · Composer attachment (Compact Card composition)</Text>
      <View style={preview.row}>
        <Card density="compact" style={[preview.messageFileTile, gridCellSize]}>
          <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Red[500]} />
          <Text style={[preview.tileName, messageFileNameWidth]} numberOfLines={2}>quarterly-report.pdf</Text>
          <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Red[500] }]}>PDF</Text>
        </Card>
        <View>
          <Card
            density="compact"
            style={[preview.composerFileTile, { width: HERMES_ATTACHMENT_SIZE.composerFileTileWidth, minHeight: HERMES_ATTACHMENT_SIZE.composerFileTileMinHeight }]}
          >
            <View style={[preview.fileIconPanel, fileIconPanelSize, { backgroundColor: HERMES_COLOR_RAMPS.Blue[100] }]}>
              <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Blue[500]} />
              <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Blue[500] }]}>MD</Text>
            </View>
            <View style={[preview.composerTileText, { width: HERMES_ATTACHMENT_SIZE.composerFileTextWidth }]}>
              <Text style={preview.composerTileName} numberOfLines={2}>notes.md</Text>
              <Text style={preview.composerTileDetail}>4 KB</Text>
            </View>
          </Card>
          {/* "white" (opaque DS_SEMANTIC.surface.white/main/muted), not "secondary" (alpha-derived
              surface.recessed) — mirrors production's opaque Color(.systemBackground) fill so the ×
              stays legible over an arbitrary thumbnail beneath it, and never an alpha/opacity-derived
              close-control color. */}
          <Button
            variant="white"
            size="extraSmall"
            showIcon
            showLabel={false}
            iconName="clear"
            accessibilityLabel="Remove notes.md"
            onPress={() => {}}
            style={[
              preview.attachmentRemove,
              { width: HERMES_ATTACHMENT_SIZE.removeControl, height: HERMES_ATTACHMENT_SIZE.removeControl, top: -HERMES_ATTACHMENT_SIZE.removeOverlap, right: -HERMES_ATTACHMENT_SIZE.removeOverlap },
            ]}
          />
        </View>
      </View>
      <Text style={preview.caption}>
        Both normal (non-mini) tiles compose Compact Card for their outer surface. The 118×118pt
        message tile mirrors GridAttachmentCell's centered glyph, filename, and extension stack; its
        filename width is messageGridCell minus messageFileTextInset (18pt). The composer tile uses
        the fileIconPanelWidth × fileIconPanelHeight (58×68pt) icon panel and is fixed to
        composerFileTileWidth × composerFileTileMinHeight (222×92pt; 280×112pt under accessibility
        text sizes), with composerFileTextWidth (128pt; 160pt accessibility). It adds a real remove
        Button overlapping the corner by removeOverlap (6pt); the sent message tile does not.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Accessibility composer geometry</Text>
      <View style={preview.row}>
        <Card
          density="compact"
          style={[
            preview.composerFileTile,
            {
              width: HERMES_ATTACHMENT_SIZE.composerFileTileWidthAccessibility,
              minHeight: HERMES_ATTACHMENT_SIZE.composerFileTileMinHeightAccessibility,
            },
          ]}
        >
          <View style={[preview.fileIconPanel, accessibilityFileIconPanelSize, { backgroundColor: HERMES_COLOR_RAMPS.Red[100] }]}>
            <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Red[500]} />
            <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Red[500] }]}>PDF</Text>
          </View>
          <View style={[preview.composerTileText, { width: HERMES_ATTACHMENT_SIZE.composerFileTextWidthAccessibility }]}>
            <Text style={preview.composerTileName} numberOfLines={2}>quarterly-report.pdf</Text>
            <Text style={preview.composerTileDetail}>2.1 MB</Text>
          </View>
        </Card>
      </View>
      <Text style={preview.caption}>
        Accessibility text sizes expand the icon panel to
        fileIconPanelWidthAccessibility × fileIconPanelHeightAccessibility (76×84pt), preserving the
        full extension label instead of truncating it inside the fixed default panel.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Compact attachment preview (mini-thumbnail — outside Card)</Text>
      <View style={preview.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview diagram.png"
          onPress={() => {}}
          style={[
            preview.miniPreviewThumb,
            { width: HERMES_ATTACHMENT_SIZE.compactPreview, height: HERMES_ATTACHMENT_SIZE.compactPreview, backgroundColor: HERMES_COLOR_RAMPS.Blue[100] },
          ]}
        >
          <Icon name="paperclip" size={DS_ICON_SIZE.sm} color={HERMES_COLOR_RAMPS.Blue[500]} />
        </Pressable>
      </View>
      <Text style={preview.caption}>
        The mini-preview is sized directly from HermesAttachmentSize.compactPreview (30×30pt) and
        stays a plain, tappable thumbnail — deliberately not Card/Compact Card anatomy, since neither
        Card's default 16pt padding nor Compact Card's own padding fits that geometry.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>File fallback · Loading · Failure</Text>
      <View style={preview.row}>
        <View style={[preview.tileBox, gridCellSize]}>
          <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Neutral[500]} />
          <Text style={[preview.tileName, { color: HERMES_COLOR_RAMPS.Neutral[500] }]} numberOfLines={2}>README</Text>
          <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Neutral[500] }]}>FILE</Text>
        </View>
        <Shimmer variant="container" width={HERMES_ATTACHMENT_SIZE.messageGridCell} height={HERMES_ATTACHMENT_SIZE.messageGridCell} style={preview.tileBox} />
        <View>
          <View style={[preview.tileBox, gridCellSize]}>
            <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Orange[500]} />
            <Text style={[preview.tileName, { color: HERMES_COLOR_RAMPS.Orange[500] }]} numberOfLines={2}>backup.zip</Text>
            <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Orange[500] }]}>ZIP</Text>
          </View>
          <View style={preview.attachmentFailureBadge}>
            <Icon name="alert-circle" size={DS_ICON_SIZE.sm} color={HERMES_COLOR_RAMPS.Red[500]} />
          </View>
          <Button label="Retry" size="extraSmall" variant="tertiary" onPress={() => {}} style={preview.attachmentRetry} />
        </View>
      </View>
      <Text style={preview.caption}>
        File fallback (no extension match, Neutral 500), an in-flight loading state — a single
        full-box Shimmer placeholder sized to the same messageGridCell box it stands in for, not a
        hand-built tile — and an upload-failure state (archive, Orange 500) with a real Icon badge
        plus a Retry Button. The loading Shimmer stands in for indefinite loading only — not a
        measurable upload percentage, which the production tile shows separately. AttachmentFileType
        still owns the icon/tint/label mapping; each surface keeps its own tile layout, upload/retry,
        and remove/preview interaction.
      </Text>
      <Text style={preview.caption}>
        Each tile is one combined accessibility element naming the attachment and its type/detail/
        state (e.g. "diagram.png, PNG, upload failed").
      </Text>
    </View>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export function BannerFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Information · Warning · Error · Success</Text>
      <View style={{ gap: 8 }}>
        <Banner variant="info" title="Information" description="An in-flow status update." />
        <Banner variant="warning" title="Warning" description="Something needs attention soon." />
        <Banner variant="negative" title="Error" description="Something failed." />
        <Banner variant="positive" title="Success" description="The action completed." />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>Offline (consolidates the Session-list and Chat offline-cache notices)</Text>
      <Banner variant="neutral" icon="alert-circle" title="Offline — viewing cached version" />
      <Text style={preview.caption}>
        One shared Offline Banner replaces the two near-duplicate offline-cache notices (Sessions
        list and Chat transcript), which previously differed in copy (hyphen vs. em dash), padding,
        and whether their icon was hidden from VoiceOver.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Optional action · Inset vs. full-width</Text>
      <View style={{ gap: 8 }}>
        <Banner
          variant="warning"
          title="Update required"
          description="A new version fixes a known issue."
          action={{ label: 'Update', onPress: () => {} }}
        />
        <View style={{ paddingHorizontal: 16 }}>
          <Banner variant="info" title="Inset presentation" description="Padded inside its container, not edge-to-edge." />
        </View>
      </View>
      <Text style={preview.caption}>
        A decorative status icon is hidden from VoiceOver by default (the surrounding row/title
        already announces the same fact); pass a meaningful icon override only when the glyph itself
        carries information the title text doesn't.
      </Text>
    </View>
  );
}

// ─── TopNav ─────────────────────────────────────────────────────────────────────
function iconSlotButton(iconName: IconName, label: string) {
  return <Button variant="secondary" size="small" showIcon showLabel={false} iconName={iconName} accessibilityLabel={label} onPress={() => {}} style={preview.topNavActionButton} />;
}

export function TopNavFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Standard navigation — leadingPrimary + center + trailingPrimary</Text>
      <View style={preview.topNavShell}>
        <TopNav
          title="Sessions"
          leadingPrimary={iconSlotButton('chevron-left', 'Back')}
          trailingPrimary={iconSlotButton('search', 'Search')}
        />
      </View>

      <Text style={[preview.label, { marginTop: 8 }]}>Modal / editor — labeled leadingPrimary + trailingPrimary</Text>
      <View style={preview.topNavShell}>
        <TopNav
          title="New Task"
          leadingPrimary={<Button variant="secondary" size="small" label="Cancel" onPress={() => {}} style={preview.topNavActionButton} />}
          trailingPrimary={<Button variant="secondary" size="small" label="Save" onPress={() => {}} style={preview.topNavActionButton} />}
        />
      </View>

      <Text style={[preview.label, { marginTop: 8 }]}>Populated two-leading / two-trailing coverage</Text>
      <View style={preview.topNavShell}>
        <TopNav
          title="quarterly-report.pdf"
          leadingPrimary={iconSlotButton('chevron-left', 'Back')}
          leadingSecondary={iconSlotButton('pencil', 'Rename')}
          trailingSecondary={iconSlotButton('paperclip', 'Attachments')}
          trailingPrimary={iconSlotButton('menu', 'More options')}
        />
      </View>
      <Text style={preview.caption}>
        Reading order stays semantic on both sides — the primary action sits closest to the screen
        edge, the secondary action closest to the title — so slot order never has to be inferred from
        layout alone. Both sides always reserve the same two-slot minimum width, whether zero, one, or
        two of their slots are populated, so the centered title/`center` content never shifts.
      </Text>

      <Text style={[preview.label, { marginTop: 8 }]}>Long title truncates rather than overlapping actions</Text>
      <View style={preview.topNavShell}>
        <TopNav
          title="A very long conversation title that would otherwise collide with the actions on either side"
          leadingPrimary={iconSlotButton('chevron-left', 'Back')}
          trailingPrimary={iconSlotButton('search', 'Search')}
        />
      </View>
      <Text style={preview.caption}>
        Production renders this anatomy through native `ToolbarContent`; a simple screen with no
        custom leading/trailing actions may just set a native navigation title instead of composing
        TopNav at all. Bottom and keyboard toolbars are a separate concern, out of scope for TopNav.
        Every slot's action keeps its own accessibilityLabel and a ≥44×44pt hit target regardless of
        how many of the four optional slots are populated; the centered title/`center` content always
        truncates (`numberOfLines={1}`) rather than overlapping the reserved slot areas.
      </Text>
    </View>
  );
}

// ─── Disclosure / Log Row ──────────────────────────────────────────────────────
/**
 * The row itself IS the Button-like disclosure — a real Pressable exposing
 * accessibilityState.expanded and toggling on its own onPress, not a separate underlined text
 * control below a non-interactive row. Expand/collapse is an immediate show/hide in this browser
 * reference; production adds the Reduce-Motion-aware transition. A long press on the expanded body
 * reconstructs the real row's copy-to-clipboard behavior. The shared downward chevron rotates 180°
 * when expanded, while accessibilityState.expanded carries the same state semantically.
 */
function DisclosureChevron({ expanded }: { expanded: boolean }) {
  return (
    <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
      <Icon name="chevron-down" size={DS_ICON_SIZE.xxs} color="#8a8a8a" />
    </View>
  );
}

export function DisclosureLogRowPreview() {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <View style={preview.stack}>
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Ran npm test, 42 passed"
        style={preview.logRow}
      >
        <View style={preview.logIconSlot}>
          <Text>🛠️</Text>
        </View>
        <Text style={preview.logSummary} numberOfLines={1}>Ran `npm test` — 42 passed</Text>
        <Text style={preview.logStatus}>Passed</Text>
        <DisclosureChevron expanded={expanded} />
      </Pressable>
      {expanded && (
        <Pressable
          onLongPress={() => setCopied(true)}
          accessibilityLabel="Log detail. Long-press to copy."
          style={preview.logBody}
        >
          <Text style={preview.logBodyText} numberOfLines={3}>PASS src/App.test.tsx{'\n'}Tests: 42 passed, 42 total</Text>
        </Pressable>
      )}
      {copied && <Text style={preview.caption}>Copied to clipboard (long-press reconstruction).</Text>}
      <Text style={preview.caption}>
        Production's three call sites — a tool-call log, the "Thinking" reasoning block (Chat), and
        a bot activity/plan row (Bots) — compose the real, already-adopted TranscriptLogRowView, not
        this component. DisclosureRow (documented here) is a new, foundation-only reconstruction of
        that same icon-slot + summary + optional status + chevron anatomy, with no production call
        site of its own yet. The row itself toggles expand/collapse (accessibilityState.expanded); a
        long press on the expanded body copies its content. The shared downward chevron rotates
        upward when expanded.
      </Text>
    </View>
  );
}

// ─── Transcript Activity pattern (composite, not a single log row) ──────────────
/**
 * A real composite of the pattern's five documented pieces — Turn Summary Disclosure, the Activity
 * Disclosure Row, a grouped-tool-history control, assistant message content, and message metadata —
 * rather than reusing the standalone Disclosure Row preview verbatim. Turn Summary Disclosure and the
 * Activity Disclosure Row share the same interactive-row anatomy as the Disclosure Row entry (real
 * Pressables exposing accessibilityState.expanded), since that shared anatomy is exactly what the
 * approved specification documents; the grouped-tool-history control composes the real Button.
 */
export function TranscriptActivityPreview() {
  const [turnExpanded, setTurnExpanded] = useState(true);
  const [groupExpanded, setGroupExpanded] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);

  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Turn Summary Disclosure</Text>
      <Pressable
        onPress={() => setTurnExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: turnExpanded }}
        accessibilityLabel="Turn summary: ran tests and fixed the failing case"
        style={preview.logRow}
      >
        <View style={preview.logIconSlot}><Text>✦</Text></View>
        <Text style={preview.logSummary} numberOfLines={1}>Ran tests and fixed the failing case</Text>
        <DisclosureChevron expanded={turnExpanded} />
      </Pressable>

      {turnExpanded && (
        <View style={{ marginLeft: 26, gap: 10 }}>
          <Text style={preview.label}>Activity Disclosure Row — "Thinking" reasoning block</Text>
          <Pressable
            onPress={() => setLogExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded: logExpanded }}
            accessibilityLabel="Thinking"
            style={preview.logRow}
          >
            <View style={preview.logIconSlot}><Text>🛠️</Text></View>
            <Text style={preview.logSummary} numberOfLines={1}>Ran `npm test` — 42 passed</Text>
            <Text style={preview.logStatus}>Passed</Text>
            <DisclosureChevron expanded={logExpanded} />
          </Pressable>
          {logExpanded && (
            <View style={preview.logBody}>
              <Text style={preview.logBodyText} numberOfLines={3}>PASS src/App.test.tsx{'\n'}Tests: 42 passed, 42 total</Text>
            </View>
          )}

          <Text style={preview.label}>Grouped-tool-history control</Text>
          <Button
            label={groupExpanded ? 'Hide tool calls' : 'Show 3 more tool calls'}
            variant="tertiary"
            size="small"
            onPress={() => setGroupExpanded((value) => !value)}
          />
          {groupExpanded && (
            <View style={{ gap: 4 }}>
              <Text style={preview.caption}>Read App.tsx</Text>
              <Text style={preview.caption}>Edit App.test.tsx</Text>
              <Text style={preview.caption}>Run `npm test`</Text>
            </View>
          )}

          <Text style={preview.label}>Assistant message content · Message metadata</Text>
          <Text style={preview.composerInputText}>
            All tests are passing now — I fixed the off-by-one in the pagination helper.
          </Text>
          <Text style={preview.caption}>Claude Opus 5 · 12:04 PM</Text>
        </View>
      )}
      <Text style={preview.caption}>
        Domain ownership boundary preserved: turn-folding logic, assistant message content rendering,
        and message metadata stay owned by their existing production types — this composite only
        documents how Turn Summary Disclosure, the Activity Disclosure Row, the grouped-tool-history
        control, assistant message content, and message metadata relate to each other.
      </Text>
    </View>
  );
}

// ─── Composer pattern (recon mock, not the production composer) ─────────────────
/**
 * A recon mock of the composer surface that composes every family the approved specification
 * assigns it — the real Card (density="compact") for its Attachment tile, a native-style TextInput
 * reconstruction for text entry (production's own composer text entry is a UIKit UITextView, not the
 * generic template InputField), the real Button for the send action, a real link-semantics Inline
 * Reference Link example, and a Tag status — rather than standing several of them in for plain
 * View/Text.
 */
export function ComposerPatternPreview() {
  const [refFocused, setRefFocused] = useState(false);
  const [composerText, setComposerText] = useState('');
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Composer surface (Adaptive Glass treatment)</Text>
      <View style={preview.composerSurface}>
        <View style={preview.row}>
          <Card density="compact" style={preview.messageFileTile}>
            <View
              style={[
                preview.fileIconPanel,
                { width: HERMES_ATTACHMENT_SIZE.fileIconPanelWidth, height: HERMES_ATTACHMENT_SIZE.fileIconPanelHeight, backgroundColor: HERMES_COLOR_RAMPS.Blue[100] },
              ]}
            >
              <Icon name="paperclip" size={HERMES_ICON_SIZE.extraLarge} color={HERMES_COLOR_RAMPS.Blue[500]} />
              <Text style={[preview.tileExt, { color: HERMES_COLOR_RAMPS.Blue[500] }]}>MD</Text>
            </View>
            <View style={preview.composerTileText}>
              <Text style={preview.composerTileName} numberOfLines={1}>notes.md</Text>
            </View>
          </Card>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open App.swift in the source viewer"
          onFocus={() => setRefFocused(true)}
          onBlur={() => setRefFocused(false)}
          style={preview.linkRow}
        >
          <Text style={preview.linkGlyph}>◆</Text>
          <Text style={[preview.linkText, refFocused && preview.linkTextFocused]}>App.swift</Text>
        </Pressable>
        <View style={preview.composerTextInputRow}>
          <Icon name="menu" size={HERMES_ICON_SIZE.small} color="#6d6d72" />
          <TextInput
            value={composerText}
            onChangeText={setComposerText}
            placeholder="Message @release-bot about #run-tests…"
            accessibilityLabel="Message"
            style={preview.nativeSearchInput}
          />
        </View>
        <View style={preview.composerActionsRow}>
          <View style={preview.tagRow}>
            <TagSwatch label="Draft saved" tint="#8E8E93" hPad={6} vPad={2} />
          </View>
          <Button
            label="Send"
            showIcon
            showLabel={false}
            iconName="add"
            size="medium"
            variant="primary"
            onPress={() => {}}
          />
        </View>
        <Text style={preview.composerValidationText}>Message too long — trim before sending.</Text>
      </View>
      <Text style={preview.caption}>
        A recon mock of the composer surface — an Adaptive Glass background, a Compact-Card
        Attachment tile, an Inline Reference Link, a native-style text input reconstruction, the real
        Button, a Tag status, and validation feedback — not the production composer. Text editing,
        keyboard interaction, draft persistence, attachments, runtime selection, voice input, and
        send/stop lifecycle stay owned by the production Composer pattern.
      </Text>
    </View>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
// A real control toggling the generic Toast's own `visible` prop, so the top-edge slide + opacity
// transition is replayable in the running preview rather than only described in prose.
function ToastMotionDemo() {
  const [visible, setVisible] = useState(true);
  return (
    <View style={{ gap: 8, alignItems: 'flex-start' }}>
      <Button label={visible ? 'Hide' : 'Show'} size="small" variant="secondary" onPress={() => setVisible((v) => !v)} />
      <Toast message="Synced with server" variant="success" visible={visible} />
    </View>
  );
}

export function ToastFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Motion (tap to replay the slide-in/out)</Text>
      <ToastMotionDemo />
      <Text style={[preview.label, { marginTop: 8 }]}>Semantic variants (statically visible)</Text>
      <View style={{ gap: 8 }}>
        <Toast message="Synced with server" variant="success" />
        <Toast message="Cached offline data may be stale" variant="informational" />
        <Toast message="Reconnecting…" variant="warning" />
        <Toast message="Could not send message" variant="negative" />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>With a trailing action</Text>
      <Toast message="Session archived" variant="neutral" action={{ label: 'Undo', onPress: () => {} }} />
      <Text style={preview.caption}>
        The generic catalog Toast owns its own slide-in/out animation directly on `visible`.
        Production HermesToast is the message/icon/action card alone — animation and lifecycle live
        in the separate `hermesToast(isPresented:toast:)` presentation modifier that overlays it, left
        entirely caller-owned rather than baked into the toast view itself. That modifier's default
        motion enters by moving down from the top edge combined with opacity and exits back toward
        the top combined with opacity, reusing the shared overlayEnter/overlayExit motion bundles;
        Reduce Motion drops the move and falls back to an opacity-only state change.
      </Text>
    </View>
  );
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────
function TooltipInteractiveDemo() {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ alignItems: 'flex-start', paddingTop: 8 }}>
      <Tooltip visible={visible} label="Explanatory content, wrapped to fit">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More information"
          onPressIn={() => setVisible(true)}
          onPressOut={() => setVisible(false)}
        >
          <Icon name="info" size={HERMES_ICON_SIZE.small} color="#8a8a8a" />
        </Pressable>
      </Tooltip>
    </View>
  );
}

export function TooltipFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Press and hold the info glyph (no hover-only path)</Text>
      <TooltipInteractiveDemo />
      <Text style={preview.caption}>
        The generic catalog Tooltip is a fully-controlled bubble a caller drives from press
        in/out — mobile has no hover. Production HermesTooltip anchors the same explanatory content
        through the native `.popover` presentation path instead of a hand-drawn bubble/arrow, behind
        an explicit tap trigger; dismissal is the popover's own native recovery path (tap outside, or
        Escape on a hardware keyboard) rather than a release gesture.
      </Text>
    </View>
  );
}

// ─── Radio ─────────────────────────────────────────────────────────────────────
function RadioGroupDemo() {
  const [selected, setSelected] = useState('a');
  return (
    <View style={{ gap: 10 }}>
      <Radio selected={selected === 'a'} onPress={() => setSelected('a')} label="Option A" />
      <Radio selected={selected === 'b'} onPress={() => setSelected('b')} label="Option B" />
      <Radio selected={selected === 'c'} onPress={() => setSelected('c')} label="Option C" disabled />
    </View>
  );
}

export function RadioFamilyGallery() {
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Unselected · Selected · Disabled</Text>
      <View style={preview.row}>
        <Radio selected={false} onPress={() => {}} label="Unselected" />
        <Radio selected={true} onPress={() => {}} label="Selected" />
        <Radio selected={false} onPress={() => {}} label="Disabled" disabled />
      </View>
      <Text style={[preview.label, { marginTop: 8 }]}>One-of-many group (tap to change selection)</Text>
      <RadioGroupDemo />
      <Text style={preview.caption}>
        A group is just multiple Radio instances sharing one selected value in the caller — the same
        way a native radio group works — this component only knows its own selected state.
      </Text>
      <Text style={[preview.label, { marginTop: 8 }]}>Adaptive selected fill (production HermesRadio)</Text>
      <AdaptiveSelectedFillSwatch shape="circle" />
      <Text style={preview.caption}>
        Production HermesRadio fills the selected ring and inner dot with the adaptive semantic
        Color.primary — black in light appearance, white in dark — not a fixed accent color, mirroring
        HermesCheckbox's own adaptive treatment. The generic catalog Radio above (blue accent) is the
        reusable template's own unrelated default and is not changed by this decision.
      </Text>
    </View>
  );
}

// ─── Dropdown ──────────────────────────────────────────────────────────────────
export function DropdownFamilyGallery() {
  const options = [
    { value: 'default', label: 'Default' },
    { value: 'research', label: 'Research' },
    { value: 'coding', label: 'Coding' },
  ];
  return (
    <View style={preview.stack}>
      <Text style={preview.label}>Placeholder · Selected value · Disabled</Text>
      <View style={preview.row}>
        <View style={{ width: 180 }}>
          <Dropdown label="Profile" placeholder="Choose a profile" options={options} onChange={() => {}} />
        </View>
        <View style={{ width: 180 }}>
          <Dropdown label="Profile" value="research" options={options} onChange={() => {}} />
        </View>
        <View style={{ width: 180 }}>
          <Dropdown label="Profile" value="default" options={options} disabled onChange={() => {}} />
        </View>
      </View>
      <Text style={preview.caption}>
        The generic catalog Dropdown opens a BottomSheet picker on tap — a custom floating sheet.
        Production HermesDropdown deliberately does not recreate that: it is a native `.menu`-style
        `Picker`, the same convention SettingsView's own row pickers already use, so the checked
        selected option, label, and disclosure chrome are all platform-owned.
      </Text>
    </View>
  );
}
