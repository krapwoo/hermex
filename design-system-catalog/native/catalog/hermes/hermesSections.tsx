/**
 * Hermex reference layer.
 *
 * Every `SectionDef` below documents a Hermex-sourced catalog entry: a concise plain-English
 * introduction and visual examples first, then real "Used in Hermex" destinations, with technical
 * provenance (source paths, local-adoption status, material-fidelity notes) collapsed behind
 * `HermesReferenceDetails`'s disclosures (see `def.hermesReference`, `native/catalog/types.ts`).
 * Hermex itself ships no React Native runtime — every live example on this page is a React Native
 * documentation reconstruction of SwiftUI source, not the production app.
 *
 * This file only supplies data; layout/columns/scroll-spy belong to the shared catalog framework
 * (`CatalogShell`/`SectionBlock`), the same as the retained template catalog in `../CatalogExample`.
 */
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Button, Card, InputField, SegmentedToggle } from '../../components';
import { DividedStack } from '../DividedStack';
import { VariantGroup } from '../VariantGroup';
import { Swatch } from '../Swatch';
import { TokenRow } from '../TokenRow';
import { TypeScaleGallery } from '../TypeScaleGallery';
import type { NavGroup, SectionDef } from '../types';
import { HERMES_COLOR_RAMPS, HERMES_COLOR_RAMP_STEPS, HERMES_COLOR_GENERATED_STEP_CONSUMPTION_RESTRICTION } from './hermesColorCatalogData';
import { HermesSemanticColorReference } from './HermesSemanticColorReference';
import { HermesIconReference } from './HermesIconReference';
import { HermesMotionReference } from './HermesMotionReference';
import { HermesReferenceDetails } from './HermesReferenceDetails';
import { SpacingScaleGallery } from '../SpacingScaleGallery';
import { HERMES_SPACING_STEPS, HERMES_SPACING, HERMES_SPACING_USE } from './hermesTokenProposal';
import { HERMES_ATTACHMENT_SIZE, HERMES_ICON_SIZE_EXTRA_LARGE } from './hermesAttachmentSize';
import {
  AttachmentTileGallery,
  BannerFamilyGallery,
  BotMarkPreview,
  ButtonDecisionAndTactilePreview,
  CheckboxFamilyGallery,
  ComposerPatternPreview,
  DisclosureLogRowPreview,
  HermexDividerPreview,
  HermesSkeletonGallery,
  InlineReferenceLinkPreview,
  ListItemFamilyGallery,
  NativeSearchPreview,
  SegmentedControlGallery,
  TagGallery,
  TopNavFamilyGallery,
  TranscriptActivityPreview,
} from './HermesComponentFamiliesPreviews';

// Ids below are internal keys only — never rendered directly. Sections combine into one flat array
// with the retained template catalog's own sections (see HermesDesignSystemCatalog.tsx), which
// already owns the bare 'Card' / 'Banner' / 'Checkbox' / 'Avatar' / 'TopNav' ids for its own
// unrelated entries — reusing those exact strings here would silently collide in that shared
// id-keyed lookup. Renamed Components-family entries instead keep a unique 'Hermes <Name>' id (the
// internal engineering namespace already used throughout, e.g. HermesCard.swift) and set their own
// `displayName` to the plain catalog name the sidebar/title actually show — see `SectionDef.
// displayName` in ../types.ts. Foundations/token entries ('Hermex Colors', etc.) keep their existing
// 'Hermex …' ids unchanged: they're token-family names, not component names, and out of this rename.
export type HermesSectionId =
  | 'Hermex Typography'
  | 'Hermex Font'
  | 'Adaptive Glass'
  | 'Hermes Card'
  | 'Attachment'
  | 'Hermes Banner'
  | 'Hermes Avatar'
  | 'Row Divider'
  | 'Tag'
  | 'Inline Reference Link'
  | 'Input Field'
  | 'Search'
  | 'Segmented Control'
  | 'Buttons'
  | 'Hermes Checkbox'
  | 'Hermes TopNav'
  | 'Skeleton Loading'
  | 'List / ListItem'
  | 'Disclosure Row'
  | 'Content Unavailable'
  | 'Pending Request'
  | 'Transcript Activity'
  | 'Composer'
  | 'Hermex Colors'
  | 'Hermex Motion'
  | 'Hermex Radius & Geometry'
  | 'Hermex Spacing'
  | 'Hermex Shadow'
  | 'Hermex Iconography';

// ─── Reconstruction chrome ───────────────────────────────────────────────────
// Approximates the exact numbers found in Hermex's SwiftUI source (corner radius, opacity, stroke
// weight/opacity, padding) — deliberately NOT this repo's own RN template tokens, which belong to
// an unrelated brand and would misrepresent Hermex's real values. Local to this file.
const recon = StyleSheet.create({
  stack: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  note: { fontSize: 11, color: '#8a8a8a', fontStyle: 'italic', marginTop: 4 },
  caption: { fontSize: 11, color: '#8a8a8a', lineHeight: 16 },
  motionName: { fontSize: 12, fontWeight: '700', color: '#1c1c1e', minWidth: 190 },
  motionValue: { fontSize: 11, color: '#3a3a3c', fontFamily: 'Menlo' },
  radiusCell: { alignItems: 'center', gap: 4, width: 84 },
  radiusBox: { width: 48, height: 48, backgroundColor: '#e3e3e6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  radiusList: { gap: 4 },
  glassBox: { width: 132, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  glassLiquid: { backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  glassMaterial: { backgroundColor: 'rgba(240,240,245,0.85)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)' },
  glassOpaque: { backgroundColor: '#efeff4', borderWidth: 1, borderColor: 'rgba(0,0,0,0.14)' },
  glassLabel: { fontSize: 12, fontWeight: '600', color: '#1c1c1e' },
  strokeBox: { width: 160, height: 48, borderRadius: 12, backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' },
  strokeThin: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.14)' },
  strokeThick: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.22)' },
  cuvStack: { alignItems: 'center', gap: 8, padding: 16, width: 220 },
  cuvIconSlot: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#efeff4',
    alignItems: 'center', justifyContent: 'center',
  },
  cuvIconGlyph: { fontSize: 18, color: '#8a8a8a' },
  cuvTitle: { fontSize: 15, fontWeight: '600', color: '#1c1c1e', textAlign: 'center' },
  cuvDesc: { fontSize: 13, color: '#6d6d72', textAlign: 'center' },
  prCard: { width: 220, padding: 14, borderRadius: 24, backgroundColor: '#f2f2f7', borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)' },
  prBlock: { width: 220, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
  prField: { width: 220, padding: 12, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.14)' },
  prChoiceGlass: { width: 220, padding: 12, borderRadius: 14, backgroundColor: 'rgba(240,240,245,0.85)' },
  prChoiceOpaque: { width: 220, padding: 12, borderRadius: 14, backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#c6c6c8' },
  prText: { fontSize: 13, color: '#3a3a3c' },
  cardBox: { width: 240, borderRadius: 18, backgroundColor: 'rgba(120,120,128,0.12)', borderWidth: 0.7, borderColor: 'rgba(0,0,0,0.06)' },
  cardBoxOpaque: { backgroundColor: '#f2f2f7', borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)' },
  cardTitle: { fontSize: 11, fontWeight: '600', color: '#6d6d72', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4, marginBottom: 8 },
  // Neutralizes the real Card's own background/shadow chrome so this recon's own tinted/opaque
  // surface (cardBox/cardBoxOpaque above) stays the visible surface — the real Card is composed here
  // purely for its actual density behavior (default 16pt vs. explicit compact padding), not its look.
  cardTransparentSurface: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, width: '100%' },
  cardOutlinedPreview: { width: 240 },
  cardBody: { fontSize: 13, color: '#3a3a3c' },
  cardFooterDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.14)' },
  cardFooter: { paddingHorizontal: 16, paddingVertical: 10 },
  cardFooterText: { fontSize: 12, color: '#3478F6', fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarRing: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  avatarLabel: { fontSize: 12, color: '#3a3a3c', flexShrink: 1 },
  avatarCell: { alignItems: 'center', gap: 4, width: 84 },
  avatarGallery: { width: '100%', minWidth: 0 },
  avatarPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', minWidth: 0 },
  avatarIdentityItem: { maxWidth: '100%', minWidth: 0, flexShrink: 1 },
  // Hermex Shadow preview — one card per HermesShadow case; the swatch's native shadow props
  // approximate the resolved appearance, mapped to an equivalent CSS box-shadow on web.
  shadowCard: { width: 136, gap: 6, alignItems: 'center' },
  shadowSwatch: {
    width: 96, height: 64, borderRadius: 10, backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)',
  },
  shadowSwatchDark: { backgroundColor: '#1c1c1e' },
  shadowName: { fontSize: 12, fontWeight: '700', color: '#1c1c1e', textAlign: 'center' },
  shadowValue: { fontSize: 10, color: '#6d6d72', fontFamily: 'Menlo', textAlign: 'center' },
});

// ─── Overview ───────────────────────────────────────────────────────────────
// Rendered by `HermesDesignSystemCatalog` through `CatalogShell`'s `intro` slot — above the first
// nav group, not as its own `SectionDef` — so it never claims a sidebar link or scroll-spy target
// of its own.

// Concise, non-repeated production-adoption audit — one screen-by-screen row each, not documented
// again per component. It mirrors the current local migration candidate; production source remains
// the authority for implementation state.
type AdoptionLevel = 'Strong' | 'Partial' | 'Light' | 'Yes';
interface AdoptionAuditRow {
  screen: string;
  level: AdoptionLevel;
  note: string;
}
const PRODUCTION_ADOPTION_AUDIT: AdoptionAuditRow[] = [
  { screen: 'Tasks', level: 'Strong', note: 'Shared native List container plus fixed Segmented Control; task-specific rows, swipe actions, and menus remain domain-owned.' },
  { screen: 'Kanban', level: 'Strong', note: 'Scrolling Segmented Control, Banner, Divider, Buttons, and Checkbox are shared; complex bulk progress/results stay purpose-built.' },
  { screen: 'Skills', level: 'Strong', note: 'Display-only Tag and Divider are shared while navigation and Toggle retain native semantics.' },
  { screen: 'Memory', level: 'Strong', note: 'Native List/Section remain intentional for long content; edit actions use shared press feedback.' },
  { screen: 'Usage', level: 'Strong', note: 'Shared SectionCard, Skeleton, typography, spacing, and fixed Segmented Control for window and Cost/Tokens choices; provider-limit cards use HermesDivider and Tag, page states use HermesContentUnavailable, chart/tint colors use semantic HermesColorRamp steps, and fixed geometry (chart height 180, legend indicator 7, balance bar height 8, minimum balance fill 8) is named by HermesUsageSize.' },
  { screen: '"Enjoying Hermex?" (TipJarCard.swift)', level: 'Strong', note: 'SectionCard, shared Button styles, bot-avatar primitive, and Gold ramp token replace hand-built surface/action/accent styling.' },
  { screen: 'Conversation loading', level: 'Yes', note: 'Uses neutral shared Skeleton text-line geometry without sender-implying outgoing bubble chrome.' },
];

function HermesProductionAdoptionAuditTable() {
  return (
    <VariantGroup name="Production-adoption audit — by screen" align="left">
      <View style={recon.stack}>
        {PRODUCTION_ADOPTION_AUDIT.map((row, i) => (
          <TokenRow key={row.screen} use={row.note} last={i === PRODUCTION_ADOPTION_AUDIT.length - 1}>
            <View style={recon.stack}>
              <Text style={recon.motionName}>{row.screen}</Text>
              <Text style={recon.motionValue}>{row.level} adoption</Text>
            </View>
          </TokenRow>
        ))}
      </View>
    </VariantGroup>
  );
}

export function HermesOverview() {
  return (
    <View style={recon.stack}>
      <Text style={overview.p}>
        <Text style={overview.b}>Local implementation:</Text> the design system referenced below is
        adopted in the current local working tree on branch{' '}
        <Text style={overview.code}>issue/607-shared-design-system</Text>. The contributor-fork branch
        contains the verified issue work and the current migration candidate. This catalog is versioned
        under <Text style={overview.code}>design-system-catalog/</Text> in that same Git worktree — not
        maintained outside it — and is validated with the application's Design System Contract CI job.
        Upstream issue #607 remains open. No pull request, TestFlight upload, release, or deployment
        was created as part of this work.
      </Text>
      <Text style={overview.p}>
        Hermex is SwiftUI. Every live example below is a React Native documentation reconstruction
        built from reading that SwiftUI source, not the production SwiftUI runtime.
      </Text>
      <HermesReferenceDetails
        meta={{
          implementationNotes: {
            status: 'Adopted in the verified local implementation; pending upstream acceptance.',
            sourcePaths: ['design-system-catalog/native/catalog/hermes/hermesSections.tsx'],
            notes: [
              'This table is a maintainer-facing migration summary, not part of the primary design reference.',
            ],
          },
        }}
        implementationContent={<HermesTokenCoverageTable />}
      />
      <Text style={overview.p}>
        <Text style={overview.b}>Production-adoption audit:</Text> a concise, implementation-backed,
        screen-by-screen snapshot of how much of the design system each screen uses in the current
        migration candidate. It is not repeated per component below; production source remains the
        authority.
      </Text>
      <HermesReferenceDetails
        meta={{
          implementationNotes: {
            status: 'Documentation mirrors the current local migration candidate; production source remains the authority.',
            notes: [
              'Verified against the current production source at the time this table was written; re-check before relying on it after further production changes.',
            ],
          },
        }}
        implementationContent={<HermesProductionAdoptionAuditTable />}
      />
    </View>
  );
}

const overview = StyleSheet.create({
  p: { fontSize: 13, color: '#3a3a3c', lineHeight: 19 },
  b: { fontWeight: '700', color: '#1c1c1e' },
  code: { fontFamily: 'Menlo', fontSize: 12 },
});

// ─── Components ───────────────────────────────────────────────────────────────

function GlassSwatch({ label, style }: { label: string; style: object }) {
  return (
    <View style={[recon.glassBox, style]}>
      <Text style={recon.glassLabel}>{label}</Text>
    </View>
  );
}

const CONTENT_UNAVAILABLE_COPY: Record<
  'empty' | 'noResults' | 'error' | 'unavailable' | 'custom',
  { glyph: string; title: string; desc: string }
> = {
  empty: { glyph: '×', title: 'Nothing Here Yet', desc: 'Content will appear here once available.' },
  noResults: { glyph: '?', title: 'No Results', desc: 'Check the spelling or try a new search.' },
  error: { glyph: '!', title: 'Something Went Wrong', desc: 'The request could not complete.' },
  unavailable: { glyph: '⌀', title: 'Unavailable', desc: 'This feature isn’t available right now.' },
  custom: { glyph: '★', title: 'Custom Title', desc: 'A caller-supplied icon, title, and description.' },
};

function ContentUnavailablePreview({
  variant = 'empty',
  withDescription = true,
  primaryAction = false,
  secondaryAction = false,
}: {
  variant?: keyof typeof CONTENT_UNAVAILABLE_COPY;
  withDescription?: boolean;
  primaryAction?: boolean;
  secondaryAction?: boolean;
}) {
  const copy = CONTENT_UNAVAILABLE_COPY[variant];
  return (
    <View style={recon.cuvStack}>
      <View style={recon.cuvIconSlot}>
        <Text style={recon.cuvIconGlyph}>{copy.glyph}</Text>
      </View>
      <Text style={recon.cuvTitle}>{copy.title}</Text>
      {withDescription && <Text style={recon.cuvDesc}>{copy.desc}</Text>}
      {(primaryAction || secondaryAction) && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {primaryAction && <Button label="Retry" variant="primary" size="small" onPress={() => {}} />}
          {secondaryAction && <Button label="Learn more" variant="tertiary" size="small" onPress={() => {}} />}
        </View>
      )}
      <Text style={recon.note}>icon slot — real SF Symbol not reproduced</Text>
    </View>
  );
}

function CardChromePreview({
  title, footer, body, kind = 'section',
}: { title?: string; footer?: boolean; body: string; kind?: 'section' | 'request' | 'compact' | 'outlined' }) {
  const isOutlined = kind === 'outlined';
  return (
    <View>
      {title && <Text style={recon.cardTitle}>{title}</Text>}
      <View style={!isOutlined && [recon.cardBox, kind === 'request' && recon.cardBoxOpaque]}>
        <Card
          density={kind === 'compact' ? 'compact' : 'default'}
          surface={isOutlined ? 'outlined' : 'elevated'}
          style={isOutlined ? recon.cardOutlinedPreview : recon.cardTransparentSurface}
        >
          <Text style={recon.cardBody}>{body}</Text>
        </Card>
        {footer && (
          <>
            <View style={recon.cardFooterDivider} />
            <View style={recon.cardFooter}>
              <Text style={recon.cardFooterText}>Action</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function IdentityAvatarPreview({ label, initials, bg, dark }: { label: string; initials: string; bg: string; dark?: boolean }) {
  return (
    <View style={[recon.avatarRow, recon.avatarIdentityItem]}>
      <View style={recon.avatarRing}>
        <Avatar initials={initials} backgroundColor={bg} size={32} accessibilityLabel={initials} />
      </View>
      <Text style={[recon.avatarLabel, dark && { color: '#ffffff', backgroundColor: '#1c1c1e', paddingHorizontal: 4, borderRadius: 4 }]}>
        {label}
      </Text>
    </View>
  );
}

// The generic catalog Avatar's own size/content API, plus the existing production identity and
// bot-face variants — kept together in one gallery (rather than a flat variants/states list) since
// the size demonstration needs its own small multi-column grid.
function AvatarFamilyGallery() {
  return (
    <View style={[recon.stack, recon.avatarGallery]}>
      <Text style={recon.caption}>Named sizes — small (32) · medium (40, default) · large (48) · one custom size</Text>
      <View style={recon.avatarPreviewRow}>
        <View style={recon.avatarCell}>
          <Avatar size="small" initials="SM" backgroundColor="#3478F6" />
          <Text style={recon.caption}>Small</Text>
        </View>
        <View style={recon.avatarCell}>
          <Avatar initials="MD" backgroundColor="#34C759" />
          <Text style={recon.caption}>Medium (default)</Text>
        </View>
        <View style={recon.avatarCell}>
          <Avatar size="large" initials="LG" backgroundColor="#8E8E93" />
          <Text style={recon.caption}>Large</Text>
        </View>
        <View style={recon.avatarCell}>
          <Avatar size={64} initials="XL" backgroundColor="#AF52DE" />
          <Text style={recon.caption}>Custom · 64</Text>
        </View>
      </View>
      <Text style={[recon.caption, { marginTop: 8 }]}>Content — Image · Icon · Initials (precedence order)</Text>
      <View style={recon.avatarPreviewRow}>
        <View style={recon.avatarCell}>
          <Avatar imageUrl="https://i.pravatar.cc/80" accessibilityLabel="Jane Appleseed" />
          <Text style={recon.caption}>Image</Text>
        </View>
        <View style={recon.avatarCell}>
          <Avatar iconName="menu" backgroundColor="#8E8E93" />
          <Text style={recon.caption}>Icon</Text>
        </View>
        <View style={recon.avatarCell}>
          <Avatar initials="JS" backgroundColor="#3478F6" />
          <Text style={recon.caption}>Initials</Text>
        </View>
      </View>
      <Text style={[recon.caption, { marginTop: 8 }]}>Production identity — ServerAvatarBadge · SessionListView inline avatar · bot face</Text>
      <View style={recon.avatarPreviewRow}>
        <IdentityAvatarPreview label="Standalone" initials="HM" bg="#3478F6" />
        <IdentityAvatarPreview label="Cross-fades to ×" initials="HM" bg="#34C759" />
        <BotMarkPreview />
      </View>
      <Text style={[recon.caption, { marginTop: 8 }]}>Fill/foreground pairing</Text>
      <View style={recon.avatarPreviewRow}>
        <IdentityAvatarPreview label="Light fill → dark foreground" initials="AB" bg="#FFD60A" />
        <IdentityAvatarPreview label="Dark fill → light foreground" initials="CD" bg="#1c1c1e" dark />
      </View>
    </View>
  );
}

// ─── Tokens · Typography (Hermex Typography / Hermex Font) ──────────────────
const HERMES_TYPOGRAPHY_STEPS = [
  'caption / footnote / caption2',
  'captionSemibold',
  'mono12',
  'subheadline',
  'subheadlineSemibold',
  'mono14',
  'body',
  'label',
  'headline',
  'headlineSemibold',
  'title2',
  'title3',
  'title',
] as const;
type HermesTypographyStep = (typeof HERMES_TYPOGRAPHY_STEPS)[number];
const HERMES_TYPOGRAPHY_SAMPLE_STYLE: Record<HermesTypographyStep, { fontSize: number; fontWeight?: '600' | '700'; fontFamily?: string }> = {
  'caption / footnote / caption2': { fontSize: 12 },
  captionSemibold: { fontSize: 12, fontWeight: '600' },
  mono12: { fontSize: 12, fontFamily: 'Menlo' },
  subheadline: { fontSize: 14 },
  subheadlineSemibold: { fontSize: 14, fontWeight: '600' },
  mono14: { fontSize: 14, fontFamily: 'Menlo' },
  body: { fontSize: 16 },
  label: { fontSize: 16, fontWeight: '600' },
  headline: { fontSize: 18 },
  headlineSemibold: { fontSize: 18, fontWeight: '600' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '700' },
};
const HERMES_TYPOGRAPHY_META: Record<HermesTypographyStep, string> = {
  'caption / footnote / caption2': '12pt regular',
  captionSemibold: '12pt semibold',
  mono12: '12pt monospaced',
  subheadline: '14pt regular',
  subheadlineSemibold: '14pt semibold',
  mono14: '14pt monospaced',
  body: '16pt regular',
  label: '16pt semibold',
  headline: '18pt regular',
  headlineSemibold: '18pt semibold',
  title2: '22pt bold',
  title3: '20pt bold',
  title: '28pt bold',
};
const HERMES_TYPOGRAPHY_USE: Record<HermesTypographyStep, string> = {
  'caption / footnote / caption2': 'Caption, footnote, and caption 2 all collapse to the same 12pt regular scale.',
  captionSemibold: 'Compact emphasized labels and statuses that need more weight than caption.',
  mono12: 'Compact counts and technical metadata where aligned digits improve scanning.',
  subheadline: 'Secondary text under a headline.',
  subheadlineSemibold: 'Selected controls and compact emphasized actions at the subheadline scale.',
  mono14: 'Code, identifiers, and technical values that need the larger compact mono size.',
  body: 'Default running/body text.',
  label: 'Compact section labels and emphasized interface labels at the same 16pt size as body.',
  headline: 'Emphasized section/row heading.',
  headlineSemibold: 'A named semibold headline for strong row and section emphasis without bold.',
  title2: 'Intentionally bold, matching title/title3\'s bold tier.',
  title3: 'Smaller page/section title.',
  title: 'Large page-level title.',
};

function HermesTypographyGallery() {
  return (
    <View style={recon.stack}>
      <Text style={recon.note}>
        Every role scales automatically with the user's Dynamic Type setting. Sizes below are React
        Native layout approximations at each role's default (non-scaled) base size, for comparison only.
      </Text>
      <TypeScaleGallery
        steps={HERMES_TYPOGRAPHY_STEPS}
        sampleStyle={(step) => HERMES_TYPOGRAPHY_SAMPLE_STYLE[step]}
        meta={(step) => HERMES_TYPOGRAPHY_META[step]}
        useNotes={HERMES_TYPOGRAPHY_USE}
      />
    </View>
  );
}

const HERMES_FONT_WEIGHT_STEPS = ['regular', 'semibold', 'bold'] as const;
type HermesFontWeightStep = (typeof HERMES_FONT_WEIGHT_STEPS)[number];
const HERMES_FONT_WEIGHT_SAMPLE_STYLE: Record<HermesFontWeightStep, { fontSize: number; fontWeight?: '600' | '700' }> = {
  regular: { fontSize: 16 },
  semibold: { fontSize: 16, fontWeight: '600' },
  bold: { fontSize: 16, fontWeight: '700' },
};
const HERMES_FONT_WEIGHT_USE: Record<HermesFontWeightStep, string> = {
  regular: 'Default weight for caption/footnote/caption2/subheadline/body/headline.',
  semibold: 'Named headline/subheadline/caption roles plus selected controls and compact emphasis.',
  bold: 'Default weight for title2/title3/title.',
};

function HermesFontGallery() {
  return (
    <DividedStack>
      <VariantGroup name="Typeface identity" desc="San Francisco (system default), plus a monospaced design for code/log content" align="left">
        <Text style={recon.note}>No custom typeface is used anywhere in this surface.</Text>
      </VariantGroup>
      <VariantGroup name="Weight scale" desc="Regular/bold defaults, with medium/semibold reserved as documented exceptions" align="left">
        <TypeScaleGallery
          steps={HERMES_FONT_WEIGHT_STEPS}
          sampleStyle={(step) => HERMES_FONT_WEIGHT_SAMPLE_STYLE[step]}
          meta={(step) => (step === 'bold' ? '700' : step === 'semibold' ? '600' : '400')}
          useNotes={HERMES_FONT_WEIGHT_USE}
        />
      </VariantGroup>
    </DividedStack>
  );
}

// ─── Tokens · Colors ──────────────────────────────────────────────────────────
function HermesColorRampGallery() {
  return (
    <DividedStack gap={16}>
      <Text style={recon.caption}>{HERMES_COLOR_GENERATED_STEP_CONSUMPTION_RESTRICTION}</Text>
      {Object.keys(HERMES_COLOR_RAMPS).map((name) => (
        <VariantGroup key={name} name={name} desc="11 steps, 50–950" align="left">
          <View style={recon.row}>
            {HERMES_COLOR_RAMP_STEPS.map((step) => (
              <Swatch
                key={step}
                name={String(step)}
                value={HERMES_COLOR_RAMPS[name][step]}
                valueLabel={HERMES_COLOR_RAMPS[name][step]}
                width={100}
              />
            ))}
          </View>
        </VariantGroup>
      ))}
    </DividedStack>
  );
}

function HermesProductPaletteGallery() {
  const headerAccents: { name: string; hex: string }[] = [
    { name: 'headerAccentYellow', hex: '#FFD700' },
    { name: 'headerAccentBlue', hex: '#5B7CFF' },
    { name: 'headerAccentPurple', hex: '#AF52DE' },
    { name: 'headerAccentRed', hex: '#FF3B30' },
    { name: 'headerAccentGreen', hex: '#34C759' },
    { name: 'headerAccentWhite', hex: '#FFFFFF' },
  ];
  const projectPalette: { name: string; hex: string }[] = [
    { name: 'projectSky', hex: '#7cb9ff' },
    { name: 'projectGold', hex: '#f5c542' },
    { name: 'projectRed', hex: '#e94560' },
    { name: 'projectGreen', hex: '#50c878' },
    { name: 'projectViolet', hex: '#c084fc' },
    { name: 'projectOrange', hex: '#fb923c' },
    { name: 'projectCyan', hex: '#67e8f9' },
    { name: 'projectPink', hex: '#f472b6' },
  ];
  return (
    <DividedStack>
      <VariantGroup name="Header accents" desc="Settings → Appearance" align="left">
        <View style={recon.row}>
          {headerAccents.map((p) => (
            <Swatch key={p.name} name={p.name} value={p.hex} valueLabel={p.hex} width={168} />
          ))}
        </View>
      </VariantGroup>
      <VariantGroup name="Project palette" desc="Sessions → Projects → New Project" align="left">
        <View style={recon.row}>
          {projectPalette.map((p) => (
            <Swatch key={p.name} name={p.name} value={p.hex} valueLabel={p.hex} width={168} />
          ))}
        </View>
      </VariantGroup>
    </DividedStack>
  );
}

function HermesColorsGallery() {
  return (
    <DividedStack>
      <VariantGroup name="Color ramps" align="left">
        <HermesColorRampGallery />
      </VariantGroup>
      <VariantGroup name="Semantic roles" align="left">
        <HermesSemanticColorReference />
      </VariantGroup>
      <VariantGroup name="Product palettes" align="left">
        <HermesProductPaletteGallery />
      </VariantGroup>
    </DividedStack>
  );
}

// ─── Tokens · Radius & Geometry ────────────────────────────────────────────────
interface GeometryFact {
  name: string;
  value: string;
  source: string;
  use: string;
}
const GEOMETRY_FACTS: GeometryFact[] = [
  { name: 'ChatComposerMetrics.cardCornerRadius', value: '24pt', source: 'HermesMobile/Features/Chat/ChatComposerPresentation.swift', use: "The composer's expanded-card corner radius." },
  { name: 'ChatComposerMetrics.actionSize', value: '44pt', source: 'HermesMobile/Features/Chat/ChatComposerPresentation.swift', use: "The round send/stop action button's diameter." },
  { name: 'ChatComposerMetrics.pillInset', value: '5pt', source: 'HermesMobile/Features/Chat/ChatComposerPresentation.swift', use: "Inset used in the collapsed pill's own corner-radius derivation." },
  { name: 'DisclosureRowMetrics.minimumHeight', value: '32pt', source: 'HermesMobile/Features/Chat/DisclosureRow.swift', use: 'Log row height at the default text size.' },
  { name: 'DisclosureRowMetrics.bodyIndent', value: '26pt', source: 'HermesMobile/Features/Chat/DisclosureRow.swift', use: 'Icon column width plus gap, so an expanded body indents under the row text.' },
  { name: 'DisclosureRowMetrics.bodyWindowHeight', value: '240pt', source: 'HermesMobile/Features/Chat/DisclosureRow.swift', use: 'Fixed cap an expanded log body scrolls inside.' },
  { name: 'AdaptiveReadableContentWidth.secondaryDestination', value: '800pt', source: 'HermesMobile/Features/Shared/AdaptiveGlassModifier.swift', use: 'Max readable content width for a secondary-destination screen class.' },
  { name: 'AdaptiveReadableContentWidth.workspace', value: '1,000pt', source: 'HermesMobile/Features/Shared/AdaptiveGlassModifier.swift', use: 'Max readable content width for a workspace-class screen.' },
];

const HERMES_USAGE_SIZE: GeometryFact[] = [
  { name: 'HermesUsageSize.chartHeight', value: '180pt', source: 'HermesMobile/Config/HermesSpacing.swift', use: 'Fixed plot height for active and empty Usage charts.' },
  { name: 'HermesUsageSize.legendIndicator', value: '7pt', source: 'HermesMobile/Config/HermesSpacing.swift', use: 'Diameter of each Usage chart legend color indicator.' },
  { name: 'HermesUsageSize.balanceBarHeight', value: '8pt', source: 'HermesMobile/Config/HermesSpacing.swift', use: 'Height of the provider remaining-balance bar.' },
  { name: 'HermesUsageSize.minimumBalanceFill', value: '8pt', source: 'HermesMobile/Config/HermesSpacing.swift', use: 'Minimum visible nonzero fill width in a provider balance bar.' },
];

function HermesSpacingGallery() {
  return (
    <DividedStack>
      <VariantGroup name="HermesSpacing" desc="space.0 / 2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64" align="left">
        <SpacingScaleGallery steps={HERMES_SPACING_STEPS} values={HERMES_SPACING} useNotes={HERMES_SPACING_USE} />
      </VariantGroup>
      <VariantGroup name="HermesUsageSize" desc="Component-scoped fixed geometry for the Usage family — not additions to the global spacing scale." align="left">
        <View style={recon.stack}>
          {HERMES_USAGE_SIZE.map((token, index) => (
            <TokenRow key={token.name} use={token.use} last={index === HERMES_USAGE_SIZE.length - 1}>
              <View style={recon.row}>
                <Text style={recon.motionName}>{token.name}</Text>
                <Text style={recon.motionValue}>{token.value}</Text>
              </View>
            </TokenRow>
          ))}
        </View>
      </VariantGroup>
      <VariantGroup name="Composed examples" align="left">
        <View style={recon.row}>
          <View style={spacingExample.card}>
            <Text style={spacingExample.label}>Related controls — 8 pt</Text>
            <View style={spacingExample.relatedRow}>
              <View style={spacingExample.chip} />
              <View style={spacingExample.chip} />
              <View style={spacingExample.chip} />
            </View>
          </View>
          <View style={spacingExample.card}>
            <Text style={spacingExample.label}>Separate content groups — 24 pt</Text>
            <View style={spacingExample.separateStack}>
              <View style={spacingExample.block} />
              <View style={spacingExample.block} />
            </View>
          </View>
        </View>
      </VariantGroup>
    </DividedStack>
  );
}

const spacingExample = StyleSheet.create({
  card: { width: 200, gap: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#1c1c1e' },
  relatedRow: { flexDirection: 'row', gap: 8 },
  chip: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#e3e3e6' },
  separateStack: { gap: 24 },
  block: { height: 28, borderRadius: 6, backgroundColor: '#e3e3e6' },
});

function HermesGeometryGallery() {
  return (
    <DividedStack>
      <VariantGroup name="Reusable radius roles" desc="r0 / r4 / r8 / r12 / r16 / r20 / r24 plus control/field/card/prominent/chrome" align="left">
        <View style={recon.row}>
          {[0, 4, 8, 12, 16, 20, 24].map((step) => (
            <View key={step} style={recon.radiusCell}>
              <View style={[recon.radiusBox, { borderRadius: step }]} />
              <Text style={recon.motionValue}>r{step}</Text>
            </View>
          ))}
        </View>
        <View style={recon.radiusList}>
          {[
            ['control', 'r8'], ['field', 'r12'], ['card', 'r16'], ['prominent', 'r20'], ['chrome', 'r24'],
          ].map(([name, value], i, arr) => (
            <TokenRow key={name} use={`${name} = ${value}`} last={i === arr.length - 1}>
              <View style={recon.row}>
                <Text style={recon.motionName}>{name}</Text>
                <Text style={recon.motionValue}>{value}</Text>
              </View>
            </TokenRow>
          ))}
        </View>
        <Text style={recon.caption}>
          No .full or .pill numeric case exists — a fully-rounded edge is SwiftUI's own Capsule(),
          used directly, a platform-owned shape rather than a HermesRadius value.
        </Text>
      </VariantGroup>
      <VariantGroup name="Feature-specific geometry" desc="Named, feature-scoped constants that aren't part of the reusable radius scale" align="left">
        <View style={recon.stack}>
          {GEOMETRY_FACTS.map((fact, i) => (
            <TokenRow key={fact.name} use={fact.use} last={i === GEOMETRY_FACTS.length - 1}>
              <View style={recon.row}>
                <Text style={recon.motionName}>{fact.name}</Text>
                <Text style={recon.motionValue}>{fact.value}</Text>
              </View>
            </TokenRow>
          ))}
        </View>
      </VariantGroup>
    </DividedStack>
  );
}

// ─── Tokens · Shadow ────────────────────────────────────────────────────────
interface ShadowFact {
  name: string;
  lightOpacity: number;
  darkOpacity: number;
  radius: number;
  x: number;
  y: number;
  adaptive: boolean;
}

function ShadowCard({ fact }: { fact: ShadowFact }) {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');
  const opacity = fact.adaptive && scheme === 'dark' ? fact.darkOpacity : fact.lightOpacity;
  const cssBoxShadow = `${fact.x}px ${fact.y}px ${fact.radius}px rgba(0, 0, 0, ${fact.lightOpacity})`;
  return (
    <View style={recon.shadowCard}>
      <Text style={recon.shadowName}>{fact.name}</Text>
      <View
        style={[
          recon.shadowSwatch,
          scheme === 'dark' && recon.shadowSwatchDark,
          {
            shadowColor: '#000000',
            shadowOffset: { width: fact.x, height: fact.y },
            shadowOpacity: opacity,
            shadowRadius: fact.radius,
          },
        ]}
      />
      <Text style={recon.shadowValue}>light {fact.lightOpacity} · dark {fact.darkOpacity}</Text>
      <Text style={recon.shadowValue}>r{fact.radius} · x{fact.x} · y{fact.y}</Text>
      <Text style={recon.shadowValue}>{cssBoxShadow}</Text>
      {fact.adaptive && (
        <SegmentedToggle
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={scheme}
          onChange={(value) => setScheme(value as 'light' | 'dark')}
        />
      )}
    </View>
  );
}

function HermesShadowGallery() {
  const cases: ShadowFact[] = [
    { name: 'none', lightOpacity: 0, darkOpacity: 0, radius: 0, x: 0, y: 0, adaptive: false },
    { name: 'controlSubtleResting', lightOpacity: 0.12, darkOpacity: 0.12, radius: 4, x: 0, y: 1, adaptive: false },
    { name: 'controlSubtlePressed', lightOpacity: 0.06, darkOpacity: 0.06, radius: 1, x: 0, y: 0, adaptive: false },
    { name: 'controlElevatedResting', lightOpacity: 0.18, darkOpacity: 0.32, radius: 16, x: 0, y: 8, adaptive: true },
    { name: 'controlElevatedPressed', lightOpacity: 0.1, darkOpacity: 0.18, radius: 8, x: 0, y: 3, adaptive: true },
    { name: 'popover', lightOpacity: 0.14, darkOpacity: 0.14, radius: 12, x: 0, y: 4, adaptive: false },
    { name: 'chrome', lightOpacity: 0.12, darkOpacity: 0.28, radius: 14, x: 0, y: 6, adaptive: true },
    { name: 'overlay', lightOpacity: 0.22, darkOpacity: 0.22, radius: 18, x: 0, y: 12, adaptive: false },
  ];
  return (
    <DividedStack>
      <VariantGroup name="HermesShadow" desc="8 roles; resting/pressed pairs sit adjacent" align="left">
        <View style={recon.row}>
          {cases.map((fact) => (
            <ShadowCard key={fact.name} fact={fact} />
          ))}
        </View>
        <Text style={recon.note}>Approximation — native SwiftUI rendering is the source of truth.</Text>
      </VariantGroup>
    </DividedStack>
  );
}

// ─── Token Coverage (overview-only) ──────────────────────────────────────────
interface CoverageRowTotals {
  total?: number;
  uniqueNames?: number;
  totalUses?: number;
}

interface CoverageRow {
  id: string;
  totals: CoverageRowTotals;
  dispositions: Record<string, number>;
  reconciliation: string;
  source: string;
}

function formatCoverageTotals(totals: CoverageRowTotals): string {
  if (typeof totals.total === 'number') return `total: ${totals.total.toLocaleString()}`;
  const parts: string[] = [];
  if (typeof totals.uniqueNames === 'number') parts.push(`${totals.uniqueNames.toLocaleString()} unique names`);
  if (typeof totals.totalUses === 'number') parts.push(`${totals.totalUses.toLocaleString()} total uses`);
  return parts.join(' · ');
}

function formatCoverageDispositions(dispositions: Record<string, number>): string {
  return Object.entries(dispositions)
    .map(([key, value]) => `${key}: ${value.toLocaleString()}`)
    .join(' · ');
}

function HermesTokenCoverageTable() {
  const coverageRows: CoverageRow[] = [
    { id: 'typography-raw', totals: { total: 455 }, dispositions: { migratedToAppFont: 397, iconSizingOutOfScope: 58, retainedException: 0 }, reconciliation: 'migratedToAppFont + iconSizingOutOfScope + retainedException === totals.total (455)', source: "TY-6/TY-9 worksheet" },
    { id: 'typography-appfont-deprecated', totals: { total: 156 }, dispositions: { migratedViaTY7: 136, migratedViaTY8: 10, iconSizingOutOfScope: 10, retainedException: 0 }, reconciliation: 'migratedViaTY7 + migratedViaTY8 (10) + iconSizingOutOfScope + retainedException === totals.total (156)', source: 'TY-7/TY-8/TY-9 worksheet' },
    { id: 'font-role-direct-argument', totals: { total: 8 }, dispositions: { migrated: 8 }, reconciliation: 'migrated === totals.total (8)', source: 'TY-8/TY-9 worksheet' },
    { id: 'font-role-stored-property', totals: { total: 10 }, dispositions: { migrated: 10 }, reconciliation: 'migrated === totals.total (10)', source: 'TY-8/TY-9 worksheet' },
    { id: 'font-role-applied', totals: { total: 5 }, dispositions: { migrated: 5 }, reconciliation: 'migrated === totals.total (5)', source: 'TY-8/TY-9 worksheet' },
    { id: 'color-ramp', totals: { total: 99 }, dispositions: { definedAndTested: 99 }, reconciliation: 'definedAndTested === totals.total (99)', source: "CO-1's exhaustive HermesColorRamp enum definition + HermesColorTests" },
    { id: 'color-product-palette', totals: { total: 14 }, dispositions: { definedAndTested: 14 }, reconciliation: 'definedAndTested === totals.total (14)', source: "CO-2's exhaustive HermesProductPalette enum definition + HermesProductPaletteTests/ExistingProductPaletteValueTests" },
    { id: 'spacing', totals: { total: 1042 }, dispositions: { migratedOnScale: 646, roundedAndMigrated: 368, retainedException: 28 }, reconciliation: 'migratedOnScale + roundedAndMigrated + retainedException === totals.total (1,042)', source: 'SR-2/SR-3 worksheet' },
    { id: 'radius', totals: { total: 135 }, dispositions: { migratedOnScale: 66, roundedAndMigrated: 67, retainedException: 2 }, reconciliation: 'migratedOnScale + roundedAndMigrated + retainedException === totals.total (135)', source: "SR-5/SR-6/SR-7 worksheet" },
    { id: 'motion', totals: { total: 35 }, dispositions: { onScaleMigrated: 12, offScaleNormalized: 21, namedException: 2 }, reconciliation: "onScaleMigrated + offScaleNormalized + namedException === totals.total (35)", source: 'MO-2 worksheet' },
    { id: 'shadow', totals: { total: 13 }, dispositions: { migrated: 12, retainedException: 1 }, reconciliation: 'migrated + retainedException === totals.total (13)', source: 'SH-2 completeness-gate transcript' },
    { id: 'icon-literals', totals: { uniqueNames: 158, totalUses: 442 }, dispositions: { cataloguedNames: 158 }, reconciliation: "the sum of each of the 158 names' own site-list length === totals.totalUses (442)", source: "ST-2's generated hermesIconInventory.generated.json" },
    { id: 'icon-computed', totals: { total: 139 }, dispositions: { traced: 139, unresolvedExternal: 0 }, reconciliation: 'traced + unresolvedExternal === totals.total (139)', source: "CC-2's hermesIconComputedSiteTrace.generated.json zero-untraced gate" },
  ];

  return (
    <DividedStack>
      <VariantGroup
        name="Migration-count reconciliation"
        desc="Every adopted Hermex token family's final call-site (or fixed-definition) population, reconciled to its own disposition breakdown"
        align="left"
      >
        <View style={recon.stack}>
          {coverageRows.map((row, i) => (
            <TokenRow key={row.id} use={`${row.reconciliation} — ${row.source}`} last={i === coverageRows.length - 1}>
              <View style={recon.stack}>
                <Text style={recon.motionName}>{row.id}</Text>
                <Text style={recon.motionValue}>{formatCoverageTotals(row.totals)}</Text>
                <Text style={recon.motionValue}>{formatCoverageDispositions(row.dispositions)}</Text>
              </View>
            </TokenRow>
          ))}
        </View>
      </VariantGroup>
      <VariantGroup name="What remains true even at full adoption" align="left">
        <View style={recon.stack}>
          <Text style={recon.caption}>Hermex draws its icons from Apple's own SF Symbols, not a Hermex-authored icon library.</Text>
          <Text style={recon.caption}>No semantic surface/text/border color layer in production — SwiftUI's own semantic Color values are used directly at each call site.</Text>
          <Text style={recon.caption}>Dynamic Type owns type sizes and line heights — AppFont/.appFont(role:) supply named styles, not fixed point sizes.</Text>
        </View>
      </VariantGroup>
    </DividedStack>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────────

const ADOPTED_STATUS = 'Adopted in the verified local implementation; pending upstream acceptance.';

export const hermesSections: SectionDef<HermesSectionId>[] = [
  {
    id: 'Hermex Typography',
    description:
      'Named text roles keep hierarchy consistent and scale with Dynamic Type. Caption, footnote, and caption 2 intentionally share the same compact base size.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesTypographyGallery />,
    hermesReference: {
      useSummary: 'Typography roles are used across every screen, including Sessions, Settings, Tasks, Bots, and Usage.',
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/AppFont.swift'],
        notes: [
          'Every role resolves through the adopted .appFont(role:) SwiftUI modifier (or the equivalent UIKit resolver), anchored on AppFont.Role\'s own base size and Font.TextStyle.',
          'Named emphasis roles are headlineSemibold, subheadlineSemibold, and captionSemibold; mono14 is 14pt monospaced and mono12 is 12pt monospaced.',
          'Sessions uses label for main-menu rows and section headers, body for session titles, and the named semibold roles for compact status emphasis.',
        ],
      },
    },
  },
  {
    id: 'Hermex Font',
    description:
      'Hermex uses San Francisco. Text roles choose regular or bold by default, with medium and semibold reserved for specific emphasis.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesFontGallery />,
    hermesReference: {
      useSummary: 'The font and weight rules apply across the app rather than to one destination.',
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/AppFont.swift'],
        notes: [
          '55 documented call sites across 21 files override a role\'s default weight with an explicit medium/semibold/bold, audited by scripts/hermex_typography_weight_exception_audit.py.',
        ],
      },
    },
  },
  {
    id: 'Adaptive Glass',
    description:
      'A shared surface treatment that uses Liquid Glass when available, Material as a fallback, and an opaque background when Reduce Transparency is enabled.',
    whenToUse: 'Use it for glass-like cards and controls instead of rebuilding platform and accessibility fallbacks on each screen.',
    props: [
      { name: 'style', type: 'AdaptiveGlassStyle', default: '.regular', desc: 'Glass style (currently only .regular exists).' },
      { name: 'isInteractive', type: 'Bool', default: 'false', desc: 'Enables Liquid Glass\'s interactive highlight response.' },
      { name: 'tint', type: 'Color?', default: 'nil', desc: 'Optional Liquid Glass tint color.' },
      { name: 'fallbackMaterial', type: 'Material', default: '.regularMaterial', desc: 'Background used on the Material path (pre-iOS 26, or Glass disabled).' },
      { name: 'inheritsClipping', type: 'Bool', default: 'false', desc: 'Forces the Material path even when Liquid Glass is available, for surfaces inside a masked/clipped ancestor.' },
      { name: 'shape', type: 'some Shape', required: true, desc: 'The shape the surface (and its stroke) is drawn into.' },
    ],
    a11y: 'The 1pt accessibility stroke is not shown by default; it appears once Reduce Transparency or Increased Contrast is on, and its opacity rises from 0.14 to 0.22 under Increased Contrast.',
    variants: {
      items: [
        { key: 'liquid', name: 'Liquid Glass (iOS 26+)', node: <GlassSwatch label="Liquid Glass" style={recon.glassLiquid} /> },
        { key: 'material', name: 'Material (fallback)', node: <GlassSwatch label="Material" style={recon.glassMaterial} /> },
        { key: 'opaque', name: 'Opaque (Reduce Transparency)', node: <GlassSwatch label="Opaque" style={recon.glassOpaque} /> },
      ],
    },
    states: {
      items: [
        { key: 'stroke-default', name: 'Contrast stroke — standard (shown when Reduce Transparency or Increased Contrast requires it)', node: <View style={[recon.strokeBox, recon.strokeThin]} /> },
        { key: 'stroke-increased', name: 'Contrast stroke — Increased Contrast', node: <View style={[recon.strokeBox, recon.strokeThick]} /> },
        { key: 'non-interactive', name: 'Non-interactive (default)', node: <GlassSwatch label="Static surface" style={recon.glassLiquid} /> },
        { key: 'interactive', name: 'Interactive (isInteractive: true)', node: <GlassSwatch label="Highlight on touch" style={recon.glassLiquid} /> },
        { key: 'clipped-ancestor', name: 'Clipped-ancestor fallback (inheritsClipping: true)', node: <GlassSwatch label="Forces Material" style={recon.glassMaterial} /> },
      ],
    },
    hermesReference: {
      usedIn: [
        { screen: 'Settings', effect: 'Grouped settings cards use the shared glass treatment.' },
        { screen: 'Tasks', path: 'Tasks → open a task', effect: 'Section cards use the shared surface treatment.' },
        { screen: 'Usage', effect: 'Totals, charts, and provider-limit cards use the same card foundation.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/AdaptiveGlassModifier.swift', 'HermesMobileTests/AdaptiveGlassTests.swift'],
        notes: [
          'Rendered evidence comes from a captured iPhone 17 Pro simulator run (iOS 26.5, light appearance); the Liquid Glass branch itself is not independently confirmed by that capture.',
        ],
      },
    },
  },
  {
    id: 'Hermes Card',
    displayName: 'Card',
    description:
      'HermesCard.swift owns the canonical Card chrome: HermesRadius.card, 16pt content padding on every edge, background, border, elevation, and surface variants. HermesCardSurface.outlined is the canonical outlined Card treatment: semantic system background, 1pt semantic grey separator border, and no elevation. SectionCard is a higher-level section-content composition that delegates its chrome to HermesCard rather than competing with or rebuilding the Card foundation. Request Card is the opaque approval/clarification surface; Compact Card is an explicit, named compact density for component compositions such as normal Attachment tiles.',
    whenToUse: 'Reach for the default Section Card for grouped glass content, Outlined Card for a quiet white surface separated by a grey border, Request Card for an approval/clarification surface that must stay legible over live transcript text, and Compact Card only when a component composition explicitly documents the reduced density — never as a silent caller-side padding override.',
    props: [
      { name: 'title', type: 'String?  (Section Card)  ·  String  (SettingsCard, required)', desc: 'Uppercase caption above the card.' },
      { name: 'content', type: '@ViewBuilder', required: true, desc: 'Card body — 16pt padding on every edge by default (Section Card, Request Card); Compact Card is the one explicitly-named exception.' },
      { name: 'footer', type: '@ViewBuilder  (Section Card only)', desc: 'Optional row under a Divider, outside the content padding.' },
      { name: 'surface', type: 'HermesCardSurface.glass | .outlined', desc: 'Defaults to adaptive glass. Outlined is the canonical outlined Card treatment: semantic system background, 1pt separator-grey border, and no elevation.' },
    ],
    a11y: 'No explicit accessibility grouping in either version — relies on the default per-child announcement order of a VStack.',
    variants: {
      itemsFill: true,
      align: 'left',
      items: [
        { key: 'section-with-title', name: 'Section Card — with title', node: <CardChromePreview title="USAGE" body="128 requests today" /> },
        { key: 'section-no-title', name: 'Section Card — no title', node: <CardChromePreview body="128 requests today" /> },
        { key: 'outlined-card', name: 'Outlined Card — white with grey border', node: <CardChromePreview body="Enjoying Hermex?" kind="outlined" /> },
        { key: 'request-card', name: 'Request Card — opaque approval surface', node: <CardChromePreview title="CLARIFICATION" body="Which branch should this target?" kind="request" /> },
        { key: 'compact-card', name: 'Compact Card — explicit compact density', node: <CardChromePreview title="COMPACT" body="Reduced (not 16pt) padding" kind="compact" /> },
        { key: 'settings-required-title', name: 'SettingsCard — required title (private)', node: <CardChromePreview title="APPEARANCE" body="Header logo color" /> },
      ],
    },
    states: {
      itemsFill: true,
      align: 'left',
      items: [
        { key: 'with-footer', name: 'Section Card — with footer', node: <CardChromePreview title="TASK" body="Run tests before merge" footer /> },
        { key: 'no-footer', name: 'Section Card — no footer', node: <CardChromePreview title="TASK" body="Run tests before merge" /> },
      ],
    },
    hermesReference: {
      usedIn: [
        { screen: 'Tasks', path: 'Tasks → open a task', effect: 'Prompt, Run Output, Configuration, and run-history sections use Section Card.' },
        { screen: 'Usage', effect: 'Totals, model, session, chart, and provider-limit cards use Section Card.' },
        { screen: 'Sessions', effect: 'The “Enjoying Hermex?” prompt uses the outlined Section Card surface.' },
        { screen: 'Settings', effect: 'Identity, Appearance, Interaction, Chat, Servers, Account, and other settings groups use Settings cards.' },
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'Clarification/approval surfaces use Request Card (see the Pending Request pattern); normal Attachment tiles compose Compact Card (see Attachment).' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesCard.swift', 'HermesMobile/Features/Shared/SectionCard.swift', 'HermesMobile/Features/Settings/SettingsView.swift', 'HermesMobile/Features/Tasks/TaskDetailView.swift'],
        notes: [
          'Both cards share the same fixed 8pt title-bottom padding. SettingsCard additionally spaces its own content VStack\'s children by a scaled 12pt — a different concern from the title-bottom gap — while SectionCard\'s content is a single opaque slot the caller owns.',
          'Pending-request fields, choices, command blocks, decision logic, and request lifecycle stay part of the Pending Request pattern, never generic Card props.',
        ],
      },
    },
  },
  {
    id: 'Attachment',
    description:
      'A component family — not a Pattern, not a Card variant — for message, composer, and compact-preview file attachments, plus a file-type fallback. AttachmentFileType still owns the icon/tint/label mapping shared across every variant. Colors come from the existing adopted Hermex color ramps (no new color family); fixed component geometry comes from the adopted HermesAttachmentSize scale (no new global spacing/radius scale) — both documented below.',
    whenToUse: 'Use it for any surface that shows a file attachment; use the compact preview specifically for a 30×30 inline thumbnail, not the full tile.',
    props: [
      { name: 'iconName', type: 'String', desc: 'SF Symbol for the file\'s extension — tablecells, doc.text, doc.richtext, archivebox, or a doc fallback; rendered at the adopted HermesIconSize.extraLarge.' },
      { name: 'tintColor', type: 'Color', desc: 'File-color mapping onto the adopted Hermex color ramps: spreadsheet → Green 500, text-like → Blue 500, PDF → Red 500, archive → Orange 500, unknown/default → Neutral 500.' },
      { name: 'extensionLabel', type: 'String', desc: 'Uppercased extension, truncated to 5 characters, or "FILE" when there is none.' },
      {
        name: 'HermesAttachmentSize',
        type: 'enum (CGFloat)',
        desc: `Fixed component geometry — not a spacing/radius token: HERMES_ATTACHMENT_SIZE.compactPreview (${HERMES_ATTACHMENT_SIZE.compactPreview}), HERMES_ATTACHMENT_SIZE.messageGridCell (${HERMES_ATTACHMENT_SIZE.messageGridCell}), HERMES_ATTACHMENT_SIZE.composerImage (${HERMES_ATTACHMENT_SIZE.composerImage}; HERMES_ATTACHMENT_SIZE.composerImageAccessibility ${HERMES_ATTACHMENT_SIZE.composerImageAccessibility}), HERMES_ATTACHMENT_SIZE.fileIconPanelWidth × HERMES_ATTACHMENT_SIZE.fileIconPanelHeight (${HERMES_ATTACHMENT_SIZE.fileIconPanelWidth}×${HERMES_ATTACHMENT_SIZE.fileIconPanelHeight}; HERMES_ATTACHMENT_SIZE.fileIconPanelWidthAccessibility × HERMES_ATTACHMENT_SIZE.fileIconPanelHeightAccessibility ${HERMES_ATTACHMENT_SIZE.fileIconPanelWidthAccessibility}×${HERMES_ATTACHMENT_SIZE.fileIconPanelHeightAccessibility}), HERMES_ATTACHMENT_SIZE.composerFileTextWidth (${HERMES_ATTACHMENT_SIZE.composerFileTextWidth}; HERMES_ATTACHMENT_SIZE.composerFileTextWidthAccessibility ${HERMES_ATTACHMENT_SIZE.composerFileTextWidthAccessibility}), HERMES_ATTACHMENT_SIZE.composerFileTileWidth (${HERMES_ATTACHMENT_SIZE.composerFileTileWidth}; HERMES_ATTACHMENT_SIZE.composerFileTileWidthAccessibility ${HERMES_ATTACHMENT_SIZE.composerFileTileWidthAccessibility}) × HERMES_ATTACHMENT_SIZE.composerFileTileMinHeight (${HERMES_ATTACHMENT_SIZE.composerFileTileMinHeight}; HERMES_ATTACHMENT_SIZE.composerFileTileMinHeightAccessibility ${HERMES_ATTACHMENT_SIZE.composerFileTileMinHeightAccessibility}), HERMES_ATTACHMENT_SIZE.composerStripHeight (${HERMES_ATTACHMENT_SIZE.composerStripHeight}; HERMES_ATTACHMENT_SIZE.composerStripHeightAccessibility ${HERMES_ATTACHMENT_SIZE.composerStripHeightAccessibility}), HERMES_ATTACHMENT_SIZE.messageFileTextInset (${HERMES_ATTACHMENT_SIZE.messageFileTextInset}), HERMES_ATTACHMENT_SIZE.removeControl (${HERMES_ATTACHMENT_SIZE.removeControl}), HERMES_ATTACHMENT_SIZE.removeOverlap (${HERMES_ATTACHMENT_SIZE.removeOverlap}), HERMES_ATTACHMENT_SIZE.accessibilityVerticalPadding (${HERMES_ATTACHMENT_SIZE.accessibilityVerticalPadding}). This is a fixed, Attachment-only set of named component dimensions, no new global spacing or radius scale.`,
      },
      {
        name: 'HermesIconSize.extraLarge',
        type: 'CGFloat',
        desc: `HERMES_ICON_SIZE_EXTRA_LARGE (${HERMES_ICON_SIZE_EXTRA_LARGE}) — the file-type icon's fixed render size inside its icon panel. A separate adopted icon-size family, no new color family.`,
      },
    ],
    a11y: 'Each tile is one combined accessibility element (children: .ignore) with a label naming the attachment and its type/detail/state (e.g. upload failure). The full-box loading Skeleton stands in for indefinite loading only — never a measurable upload percentage, which the production tile shows separately via its own progress UI.',
    render: () => <AttachmentTileGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'A sent message\'s file attachment shows the mapped icon, tint, and extension label inside a Compact Card tile.' },
        { screen: 'Conversation', path: 'Sessions → open a conversation (composer)', effect: 'A pending file attachment in the composer strip shows the same mapping in a wider, removable Compact Card tile.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/AttachmentFileType.swift',
          'HermesMobile/Features/Shared/HermesCard.swift',
          'HermesMobile/Features/Chat/MessageBubbleView.swift',
          'HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift',
        ],
        notes: [
          'Both call sites independently implemented the exact same extension→icon/color switch before this extraction; only that mapping was shared — each tile keeps its own distinct size, layout, and (composer-only) remove control.',
          'Adopted: both call sites\' normal (non-mini) tiles compose Compact Card for their outer surface via compactCardSurface(cornerRadius:), defined in HermesCard.swift alongside Card\'s other shared defaults; the 30×30 mini-preview thumbnail stays outside Card/Compact Card entirely, since neither anatomy fits that geometry.',
          'Underneath these Hermex compositions, native SwiftUI primitives (Image, Text, ProgressView) remain the actual rendering primitives — Card, Button, Icon, and Skeleton compose them, they do not replace them.',
        ],
      },
    },
  },
  {
    id: 'Hermes Banner',
    displayName: 'Banner',
    description:
      'A separate component family for persistent in-flow status communication — Information, Warning, Error, Success, and Offline variants, each with an optional icon, a message, an optional action, inset or full-width presentation, and consistent decorative-icon accessibility.',
    whenToUse: 'Use an in-flow Banner rather than a toast when the condition remains relevant until it is resolved (e.g. offline, a pending update) rather than a one-off confirmation.',
    props: [
      { name: 'variant', type: "'info' | 'warning' | 'negative' | 'positive' | 'neutral'", default: "'warning'", desc: 'Information / Warning / Error / Success map onto info/warning/negative/positive; Offline uses neutral with an icon override.' },
      { name: 'icon', type: 'IconName', desc: 'Optional leading icon override — decorative by default (hidden from VoiceOver) unless it carries information the title text does not.' },
      { name: 'action', type: '{ label: string; onPress: () => void }', desc: 'Optional trailing action button.' },
      { name: 'style (inset padding)', type: 'ViewStyle', desc: 'Caller-supplied horizontal padding for an inset presentation; omit it for full-width/edge-to-edge.' },
    ],
    a11y: 'A decorative status icon is hidden from VoiceOver by default, since the surrounding title text already announces the same fact.',
    render: () => <BannerFamilyGallery />,
    hermesReference: {
      useSummary: 'Consolidates the Session-list and Chat offline-cache notices into one shared Offline Banner.',
      usedIn: [
        { screen: 'Sessions', effect: 'The Offline Banner appears above the session list while cached sessions are shown offline.' },
        { screen: 'Sessions', path: 'Sessions → open a conversation', effect: 'The Offline Banner appears while the transcript is showing cached messages offline.' },
      ],
      implementationNotes: {
        status: 'Adopted: two near-duplicate offline-cache notices consolidate into one shared Banner.offlineCache().',
        sourcePaths: ['HermesMobile/Features/Shared/Banner.swift', 'HermesMobile/Features/Chat/ChatView.swift', 'HermesMobile/Features/SessionList/SessionListView.swift'],
        notes: [
          'Before consolidation, the two notices differed: the list version used a hyphen ("Offline - viewing…"), 24pt padding, and hid its icon from VoiceOver; the chat version used an em dash ("Offline — viewing…"), 16pt padding, and exposed its icon — an unintentional accessibility drift Banner.offlineCache()\'s one shared copy, icon, and decorative-icon rule removes. SessionListView.swift keeps its own 24pt horizontal padding via the horizontalPadding parameter; ChatView.swift uses the 16pt default.',
        ],
      },
    },
  },
  {
    id: 'Hermes Avatar',
    displayName: 'Avatar',
    description:
      'Colored initials identify the active server or account. In the Sessions header, the same control changes into a close button while search is open. A closely related — but separately implemented — bot-face system covers static, animated, and interactive bot identity. Production HermesAvatarSize and the generic catalog AVATAR_SIZE share the named small 32 / medium 40 / large 48 scale across the umbrella Avatar family.',
    props: [
      { name: 'initials', type: 'String', required: true, desc: 'Displayed initials (production Swift).' },
      { name: 'colorHex / selectedHeaderLogoColor', type: 'String / Color', required: true, desc: 'Per-server or per-account Header Logo Color fill (production Swift).' },
      { name: 'size (ServerAvatarBadge, production Swift)', type: 'CGFloat', default: '32', desc: 'ServerAvatarBadge only — the inline header avatar uses a fixed search-chrome icon size instead.' },
      { name: 'HermesAvatarSize (production Swift)', type: '.small (32) | .medium (40) | .large (48)', default: '.medium', desc: 'Named diameter token for bot-mark and other Avatar compositions. The Tip Jar companion uses .large instead of a local raw size.' },
      {
        name: 'size (generic catalog Avatar)',
        type: "'small' (32) | 'medium' (40, default) | 'large' (48) | number",
        default: "'medium'",
        desc: 'Named steps from the exported, immutable AVATAR_SIZE map cover the common cases; pass a raw number as an intentional custom-size escape hatch (e.g. a larger hero avatar) when no named step fits.',
      },
    ],
    a11y: 'ServerAvatarBadge is hidden from VoiceOver — the row around it supplies the accessible name instead. The inline Sessions header version shares the enclosing button\'s label. BotInteractiveFaceView is also hidden from VoiceOver — it is a decorative, non-content-bearing hero illustration. The generic catalog Avatar exposes accessibilityRole="image" with a label (defaulting to its initials).',
    render: () => <AvatarFamilyGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Sessions', effect: 'The header avatar opens account and server controls; it becomes the search-close control when needed.' },
        { screen: 'Sessions', path: 'Sessions → Enjoying Hermex?', effect: 'The decorative Hermex bot mark uses HermesAvatarSize.large.' },
        { screen: 'Servers', path: 'Settings → Servers', effect: 'Each configured server has an initials badge.' },
        { screen: 'Identity', path: 'Settings → Identity', effect: 'The editor previews the selected initials and header color.' },
        { screen: 'Bots', effect: 'A bot avatar blinks idly (BotAnimatedFaceView) and reacts to a drag/tap on its create/edit hero face (BotInteractiveFaceView).' },
      ],
      implementationNotes: {
        sourcePaths: [
          'HermesMobile/Features/Settings/SettingsView.swift',
          'HermesMobile/Features/SessionList/SessionListView.swift',
          'HermesMobile/Features/Bots/BotAvatarStore.swift',
          'HermesMobile/Features/Bots/BotProfileAppearance.swift',
          'HermesMobile/Features/Bots/BotFaceMotion.swift',
        ],
        notes: [
          'One umbrella for image/icon/initials identity and bot-face identity, but not one shared implementation: BotAvatarMarkView (still), BotAnimatedFaceView (idle blink + working, Reduce Motion falls back to still), and BotInteractiveFaceView (hero drag-to-gaze/tap-to-react face) stay their own SwiftUI types — bot faces are a distinct drawing/motion system, not a skin of the initials/icon/image avatar.',
        ],
      },
    },
  },
  {
    id: 'Row Divider',
    description:
      'HermesDivider is the shared SwiftUI hairline separator: it derives color from primary at 0.12 opacity, resolves one physical pixel from displayScale, accepts a tokenized leading inset, and is hidden from accessibility. The generic catalog Divider is the React Native documentation counterpart with component-owned opacity.',
    whenToUse: 'Use it between rows or under a card footer; do not invent a second, differently-styled divider for a new screen.',
    props: [
      { name: 'HermesDivider', type: 'View', desc: 'Shared SwiftUI divider with background-agnostic foreground-derived color and one-physical-pixel geometry.' },
      { name: 'leadingInset', type: 'CGFloat', default: 'HermesSpacing.s0', desc: 'Tokenized leading inset for row-aligned separators.' },
      { name: 'opacity (generic catalog Divider)', type: 'number', default: '0.72', desc: 'The RN reference component\'s own component-owned opacity prop, translucent by default; pass 1 for full strength (Card\'s footer divider).' },
    ],
    a11y: 'Purely decorative — HermesDivider explicitly hides itself from accessibility.',
    render: () => <HermexDividerPreview />,
    hermesReference: {
      usedIn: [
        { screen: 'Settings', effect: 'Every settings row separator uses the inset, 0.72-opacity divider.' },
        { screen: 'Tasks and Usage', effect: 'A section card\'s footer sits under a full-strength divider, with no opacity override.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesDivider.swift', 'HermesMobile/Features/Settings/SettingsView.swift', 'HermesMobile/Features/Shared/SectionCard.swift'],
        notes: [
          'HermesDivider owns its SwiftUI opacity and pixel geometry; callers choose only the tokenized leading inset. No global free-floating opacity token is exposed.',
          'The generic catalog Divider owns opacity as an explicit component prop for its React Native reconstruction; callers do not apply external opacity styles.',
        ],
      },
    },
  },
  {
    id: 'Tag',
    description:
      'Tag is always display-only — production calls it Status Capsule: a small tinted-fill pill (semibold caption text on a matching low-opacity fill) used for session state, task/run status, Git change kind, Kanban priority, and connection/selection state across six features. A tappable element must use a control or link component, not Tag or tag-like styling — see Inline Reference Link for the interactive counterpart.',
    whenToUse: 'Use it for a short, glanceable status word or two; a longer message belongs in body text, not a Tag. Never make a Tag (or anything styled like one) tappable.',
    props: [
      { name: 'label', type: 'String', required: true, desc: 'The status text.' },
      { name: 'tint / foreground+fill', type: 'Color', required: true, desc: 'Drives both the text color and the fill (tint.opacity(_:)) in the common case; foreground/fill can also be set independently (Settings\' inverted profile pill).' },
      { name: 'icon', type: 'Optional glyph', desc: 'Optional leading icon shown alongside the label (e.g. a running-status dot).' },
      { name: 'size', type: '.compact | .regular | .prominent', default: '.regular', desc: 'Every horizontal/vertical padding pair a real call site uses today.' },
      { name: 'isDecorative', type: 'Bool', default: 'false', desc: 'Hides the Tag from VoiceOver when the row around it already announces the same fact (Sessions); otherwise announced normally as meaningful content.' },
    ],
    a11y: 'Sessions\' tags are decorative (isDecorative: true) since the row supplies the accessible name; Tasks/Git/Settings tags are announced normally. No Tag prop, example, or styling anywhere in this section is interactive.',
    render: () => <TagGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Sessions', effect: 'Cached, Read-only, and source-platform tags on a session row (decorative).' },
        { screen: 'Tasks', effect: 'A task\'s run status.' },
        { screen: 'Workspace', path: 'Workspace → Git', effect: 'A changed file\'s Modified/Added/Deleted/Renamed/Untracked/Conflict/Staged kind.' },
        { screen: 'Settings', effect: 'A profile\'s Selected/Server Default badge and a server\'s connection-state pill.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/StatusCapsule.swift',
          'HermesMobile/Features/SessionList/SessionListItem.swift',
          'HermesMobile/Features/Tasks/TasksView.swift',
          'HermesMobile/Features/Workspace/GitWorkspaceView.swift',
          'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
          'HermesMobile/Features/Settings/SettingsView.swift',
          'HermesMobile/Features/Chat/ComposerChipRendering.swift',
          'HermesMobile/Features/Chat/ComposerChipToken.swift',
        ],
        notes: [
          'Six previously-independent capsule implementations (SessionSourceBadge, SessionRowStateBadge, StatusBadge, GitStatusChip, ProfileStatusBadge, SettingsStatusPill) now compose one shared StatusCapsule, renamed Tag in the catalog, each supplying its own existing label/tint/size/opacity so every migrated site renders unchanged. SessionSourceBadge and SessionRowStateBadge now live in SessionListItem.swift, the final row-content type (see List / ListItem).',
          'Kanban\'s priority pill, Skills\' disabled/tag chips, and the one-off ApprovalBypassStatusPill were not migrated in this pass — reported, not disqualified, pending inspection of their exact anatomy.',
          'Adopted: inert skill and bot references in composer/message text render as inline Tags through ComposerChipToken.isInteractiveReference (false) and ComposerChipVisualStyle.tag, sharing ComposerChipRendering\'s one baked-image drawing path; interactive file references render with ComposerChipVisualStyle.inlineReferenceLink instead — see Inline Reference Link.',
        ],
      },
    },
  },
  {
    id: 'Inline Reference Link',
    description:
      'A visually distinct, tappable file reference — file icon plus filename, link/control semantics, and platform focus/pressed affordance through accent/link treatment. No capsule fill or tag-like outline at any state, so it can never be mistaken for a display-only Tag.',
    whenToUse: 'Use it for an interactive file reference that opens the source viewer; use Tag for any non-interactive status label, even a visually similar one.',
    props: [
      { name: 'fileName', type: 'String', required: true, desc: 'Displayed alongside a file icon.' },
      { name: 'onPress', type: '() -> Void', required: true, desc: 'Opens the source viewer.' },
      { name: 'accessibilityRole', type: '"link"', default: '"link"', desc: 'Link/control semantics — never Tag\'s plain text/image semantics.' },
    ],
    a11y: 'Keyboard-focusable (Tab reaches it, Enter/Space activates it); focus shows an underline, press deepens the accent color — genuinely observable states in the running preview, not a static picture.',
    render: () => <InlineReferenceLinkPreview />,
    hermesReference: {
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation (composer)', effect: 'A referenced file opens the source viewer from composer or message text.' },
      ],
      implementationNotes: {
        status: 'Adopted: interactive file references render through ComposerChipVisualStyle.inlineReferenceLink, distinct from Tag\'s ComposerChipVisualStyle.tag.',
        sourcePaths: ['HermesMobile/Features/Chat/ComposerChipRendering.swift', 'HermesMobile/Features/Chat/ComposerChipToken.swift'],
        notes: [
          'Supports inline UIKit text rendering and equivalent SwiftUI transcript rendering, sharing ComposerChipRendering\'s existing drawing path — one drawing path deliberately kept pixel-identical across the collapsed composer pill, the expanded UITextView editor, and the sent user bubble; the interactive affordance and semantics are what change, not the pixel layout.',
          'This is a rendering/accessibility split inside that one shared drawing path, not a second, separately-tappable Tag: ComposerChipToken.isInteractiveReference is true only for a file reference, ComposerChipVisualStyle.resolve(for:) reads it to pick .inlineReferenceLink over .tag, and only the .inlineReferenceLink draw skips Tag\'s capsule fill/outline for an accent-tinted icon and label — the UIKit attachment additionally sets accessibilityTraits = .link only for that same file case.',
        ],
      },
    },
  },
  {
    id: 'Input Field',
    description:
      'A floating-label field — a muted resting label; an active state that floats the label, reveals a border, and (once a value exists) an optional clear button; and a filled state once a value is present. This entry reuses the existing generic catalog InputField component and tokens directly, rather than adding a second, competing input component.',
    whenToUse: 'Reach for the generic InputField for any labeled text or picker field; do not build a bespoke field for a new surface.',
    props: [
      { name: 'label', type: "'To' | 'From' | 'Walk time' | 'Arrive by' | 'Name' | 'icon'", default: "'To'", desc: 'Resting label text, or a leading-icon label variant.' },
      { name: 'editable', type: 'boolean', default: 'false', desc: 'Editable text field vs. a picker field driven by onPress.' },
      { name: 'value / placeholder', type: 'string', desc: 'Entered value, or the hint shown before one exists.' },
      { name: 'disabled', type: 'boolean', default: 'false', desc: 'Dims label/value text and disables interaction.' },
    ],
    a11y: 'An editable field exposes the underlying TextInput\'s own accessibility; a picker field (driven by onPress) announces as a button naming its label and current value.',
    render: () => (
      <View style={recon.row}>
        <View style={{ width: 200 }}>
          <InputField label="Name" placeholder="Jane Appleseed" />
        </View>
        <View style={{ width: 200 }}>
          <InputField label="Name" value="Jane Appleseed" editable onChangeText={() => {}} />
        </View>
        <View style={{ width: 200 }}>
          <InputField label="Name" value="Jane Appleseed" disabled />
        </View>
      </View>
    ),
    hermesReference: {
      useSummary: 'Reuses the existing generic catalog InputField component and tokens directly — no separate Hermex-specific input component exists or is proposed.',
      implementationNotes: {
        status: 'Reference-only: this entry documents the reusable generic catalog InputField implementation, not a Hermex-owned production Swift input field.',
        sourcePaths: ['native/components/InputField/InputField.tsx'],
        notes: [
          'A concise state sample only — resting, active/editable, and disabled — since the generic InputField already owns its full floating-label and clear-button behavior; a second, Hermex-specific input component would compete with it rather than reuse it.',
        ],
      },
    },
  },
  {
    id: 'Search',
    description:
      'A native iOS search pattern, not a Hermex-owned field component. Production keeps SwiftUI `.searchable` so placement, focus, clear behavior, keyboard integration, and platform accessibility remain system-owned.',
    whenToUse: 'Attach native `.searchable` to a searchable list or navigation surface. Write a concise prompt, preserve the system clear/focus behavior, and pair filtered emptiness with a specific no-results state rather than replacing the field with custom chrome.',
    props: [
      { name: 'placement', type: 'SearchFieldPlacement', default: 'platform default', desc: 'Choose a native placement appropriate to the navigation surface; do not hand-position a replacement field.' },
      { name: 'prompt', type: 'Text?', desc: 'Short task-specific guidance such as “Search sessions” or “Search skills”.' },
      { name: 'query', type: 'Binding<String>', required: true, desc: 'The native field owns editing, focus, clear, and keyboard behavior while the screen owns filtering.' },
    ],
    a11y: 'Native Search keeps platform focus, keyboard, clear-button, dictation, VoiceOver, and Dynamic Type behavior. A no-results view names the active query and remains distinct from the unfiltered empty state.',
    render: () => <NativeSearchPreview />,
    hermesReference: {
      useSummary: 'Documented as a native pattern only; no custom Search component is introduced.',
      usedIn: [
        { screen: 'Sessions, Bots, Skills, Memory, Tasks, and pickers', effect: 'Search stays attached through SwiftUI `.searchable`; each screen owns filtering and its no-results content.' },
      ],
      implementationNotes: {
        status: 'Native iOS pattern retained intentionally; no Hermex-owned Search field exists or is proposed.',
        sourcePaths: [
          'HermesMobile/Features/SessionList/SessionListView.swift',
          'HermesMobile/Features/Bots/BotSearchView.swift',
          'HermesMobile/Features/Skills/SkillsView.swift',
        ],
      },
    },
  },
  {
    id: 'Segmented Control',
    description:
      'One custom Hermex mutually-exclusive selection family with two presentations: fixed divides the available width equally for compact option sets; scrolling preserves each option\'s intrinsic width for larger sets. Both share Button semantics, typography, selected-pill treatment, and a Reduce-Motion-safe selection transition.',
    whenToUse: 'Use fixed for short, stable sets such as task filters, usage windows, and Cost/Tokens. Use scrolling for a larger horizontal set such as Kanban statuses. Use Checkbox for independent multi-selection and Tag only for display-only labels.',
    props: [
      { name: 'selection', type: 'Binding<Value>', required: true, desc: 'The single selected value.' },
      { name: 'options', type: '[SegmentedControlOption<Value>]', required: true, desc: 'Title plus optional count and tint for each mutually-exclusive option.' },
      { name: 'style', type: '.fixed | .scrolling', default: '.fixed', desc: 'Equal-width track or horizontally scrolling intrinsic-width presentation.' },
    ],
    a11y: 'Both variants expose one native Button per option, an explicit selected trait, a 44pt minimum touch target around the compact 36pt visible pill, and an instant state change when Reduce Motion is enabled.',
    render: () => <SegmentedControlGallery />,
    hermesReference: {
      useSummary: 'Adopted by Tasks, Usage, Cost/Tokens, and Kanban; the displayed component name intentionally omits a Hermex prefix.',
      usedIn: [
        { screen: 'Tasks', effect: 'All/Enabled/Disabled filtering uses the fixed custom Hermex control.' },
        { screen: 'Usage', effect: 'Time-window and Cost/Tokens choices use the fixed custom Hermex control.' },
        { screen: 'Kanban', effect: 'Board-status focus uses the scrolling presentation with counts, status tint, and an animated selected-pill transition.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/SegmentedControl.swift',
          'HermesMobile/Features/Tasks/TasksView.swift',
          'HermesMobile/Features/Insights/InsightsView.swift',
          'HermesMobile/Features/Insights/UsageChartCard.swift',
          'HermesMobile/Features/Kanban/KanbanLabView.swift',
        ],
      },
    },
  },
  {
    id: 'Buttons',
    description:
      'Native SwiftUI Button stays the semantic control everywhere. Hermex layers two reusable ButtonStyle families on top, both applying press feedback through one shared helper (applyingHermesButtonPressFeedback): HermesButtonStyle, full chrome — size, emphasis, and Standard Press Feedback by default — and HermesButtonPressOnlyStyle, press-only feedback for a caller-owned shape (icon/compactControl/capsule/card/thumbnail chrome). The unified Buttons family spans extra-small through large sizes, label/icon-only/icon-leading/icon-trailing content, brandPrimary/neutral/primary/secondary/destructive emphasis, resting/pressed/disabled/pending states, and an optional Adaptive Glass surface. Brand Primary is the Hermex Gold 500 CTA with Gold 600 pressed and a black label.',
    whenToUse: 'Reach for .hermes(_:emphasis:pressFeedback:isGlass:) for a button whose chrome (fill, size, emphasis) Hermex should supply; reach for .hermesPressOnly(_:shadow:) when a caller already owns its own shape/fill — an icon, a compact control, a capsule, a card, a thumbnail — and only needs Reduce-Motion-safe press feedback, including for a Yes/No/Approve/Deny-style choice, which uses .hermes(_:emphasis:) directly.',
    props: [
      { name: 'HermesButtonPressOnlyStyle.Chrome', type: '.icon | .compactControl | .capsule | .card | .thumbnail', required: true, desc: 'Each has its own pressed scale/opacity/duration/anchor and an optional resting/pressed HermesShadow pair — a ButtonStyle for caller-owned chrome, not a label API.' },
      { name: 'HermesButtonEmphasis', type: '.brandPrimary | .neutral | .primary | .secondary | .destructive', required: true, desc: 'Fill/border/foreground per emphasis on HermesButtonStyle. brandPrimary uses Gold 500, Gold 600 pressed, and a black label; the other decision roles retain their established mappings.' },
      { name: 'HermesButtonPressFeedback', type: '.standard | .emphasized | .none', default: '.standard', desc: 'Standard is the default — Reduce-Motion-safe scale + opacity; Emphasized is a stronger response for a button that wants extra weight; None opts a button out entirely.' },
      { name: 'size', type: 'extraSmall | small | medium | large', default: 'large', desc: 'Generic catalog Button\'s own size scale — the closest reusable model for the extra-small-through-large requirement.' },
      { name: 'glass surface option', type: 'Bool', desc: 'Composes Adaptive Glass rather than duplicating its availability/accessibility fallback logic (see the Adaptive Glass Material entry).' },
      { name: 'haptic', type: '(() -> Void)?', desc: 'Optional, semantic haptic fired alongside the action on HermesButton — never implied by Press Feedback.' },
    ],
    a11y: 'Both styles honor Reduce Motion (scale/spring effects drop out) via the shared applyingHermesButtonPressFeedback helper, and Environment(\\.isEnabled) for a dimmed, non-interactive disabled state — native SwiftUI Button semantics (role, label, accessibilityLabel) are untouched by either style.',
    render: () => <ButtonDecisionAndTactilePreview />,
    hermesReference: {
      usedIn: [
        { screen: 'Sessions', path: 'Sessions → Enjoying Hermex?', effect: 'The Buy Uzi a coffee CTA uses .brandPrimary; Not now uses .neutral.' },
        { screen: 'Sessions', path: 'Sessions → open a conversation', effect: 'The clarification card\'s Yes/No/free-text-submit controls use .hermes(_:emphasis:) and the .hermesPressOnly(.icon) press style.' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'The pending-request card\'s Approve/Deny controls use .hermes(_:emphasis:).' },
        { screen: 'Chat, Bots, and Workspace', effect: '30+ composer, thumbnail, capsule, and card controls share the five .hermesPressOnly(_:) chrome cases.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesButton.swift'],
        notes: [
          'The generic catalog\'s own Button component (primary/secondary/tertiary/white/ghost/destructive, extraSmall/small/medium/large) is the closest reusable emphasis and size model shown above — production\'s HermesButtonStyle/HermesButtonPressOnlyStyle are ButtonStyle modifiers applied to a native Button, not a separate label/variant component, so they are documented here rather than reproduced as a second custom tap view.',
          'Historical: HermesButtonPressOnlyStyle succeeds the retired ChatTactileButtonStyle with the same five chrome cases and every .chatTactile(_:) call site renamed to .hermesPressOnly(_:); the retired ChatDecisionButtonStyle had no successor type — its two callers (the Sessions approval overlay and the Bot pending-request card) call .hermes(_:emphasis:) directly, so every .chatDecision(_:) call site is gone.',
        ],
      },
    },
  },
  {
    id: 'Hermes Checkbox',
    displayName: 'Checkbox',
    description:
      'A reusable square multi-selection control: the box fills with the accent color and a checkmark pops in when checked. Pass an action (the generic catalog Checkbox\'s `onChange`) when the checkbox owns interaction; when a containing row owns the tap instead — a multi-select list row, for example — omit it, and the identical box/checkmark visual renders as a non-interactive, accessibility-hidden indicator so controls are never nested.',
    whenToUse: 'Use it for an independent multi-select fact recorded for a future action (e.g. a form submit) — checking one has no effect on others. For a setting that takes effect immediately, use Switch; for one-of-many exclusive selection, use Radio; for a status or completion mark (Tag) or an ordinary picker row\'s selected checkmark (List / ListItem), use that component instead — Checkbox always means an editable multi-select choice.',
    props: [
      { name: 'checked', type: 'Bool', required: true, desc: 'Whether the box is filled and shows the checkmark.' },
      { name: 'onChange', type: '((Bool) -> Void)?', desc: 'Omit when a containing row owns the tap — the checkbox then renders as a non-interactive, accessibility-hidden indicator instead of a second, nested interactive control. Pass it to make the checkbox itself the tap target.' },
      { name: 'label', type: 'String?', desc: 'Optional inline label after the box. Not announced in the row-owned indicator configuration — the owning row supplies its own accessible name/state.' },
      { name: 'disabled', type: 'Bool', default: 'false', desc: 'Dims the control and disables interaction.' },
    ],
    a11y: 'With `onChange`, the box exposes accessibilityRole="checkbox" and accessibilityState.checked/disabled, is reachable by Tab, shows a visible focus ring, and toggles on tap or Space/Enter. Without `onChange`, the identical visual is hidden from assistive technology (accessibilityElementsHidden) so a containing row\'s own Pressable and accessibilityState.selected remain the only interactive/accessible control for that row — never a checkbox nested inside another control.',
    render: () => <CheckboxFamilyGallery />,
    hermesReference: {
      useSummary: 'Both current production call sites use the row-owned (no action) configuration — a containing row\'s own Button owns the tap, selection label, and .isSelected trait; the interactive standalone configuration exists in the component\'s API but has no call site yet.',
      usedIn: [
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'A multi-select question\'s choice rows each show a decorative HermesCheckbox; the choice\'s own Button owns the tap.' },
        { screen: 'Kanban', effect: 'Bulk card-selection rows each show a decorative HermesCheckbox; the row\'s own Button owns the tap, selection label, and .isSelected trait.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/HermesCheckbox.swift',
          'HermesMobile/Features/Bots/BotPendingRequestCard.swift',
          'HermesMobile/Features/Kanban/KanbanLabView.swift',
        ],
        notes: [
          'A single-choice question (not allowsMultipleChoices) renders a largecircle.fill.circle/circle glyph instead of HermesCheckbox — a distinct single-select marker, not a second Checkbox configuration.',
          'The interactive configuration (passing action) renders a native Button with an .accessibilityRepresentation(Toggle(...)) so it is announced and operated as a real toggle, not a plain button; the row-owned configuration (action omitted) instead applies .accessibilityHidden(true) to the same visual.',
        ],
      },
    },
  },
  {
    id: 'Hermes TopNav',
    displayName: 'TopNav',
    description:
      'A Hermex design-system pattern implemented through native iOS/SwiftUI navigation and toolbar primitives. It provides up to two fixed-width action slots on each side (leadingPrimary/leadingSecondary, trailingPrimary/trailingSecondary) around a centered title or custom center content. Its placement in Native iOS — Hermex describes the implementation substrate, not ownership outside the Hermex design system.',
    whenToUse: 'Reach for TopNav when a screen needs custom leading/trailing actions beyond a plain native navigation title — a modal/editor\'s Cancel/Save, or a screen with more than one trailing action. A simple screen with no custom actions can keep a native navigation title instead of composing TopNav at all. Bottom and keyboard toolbars are a separate concern, out of scope here.',
    props: [
      { name: 'title', type: 'string', desc: 'Centered title text. Ignored when `center` is set.' },
      { name: 'center', type: 'ReactNode', desc: 'Custom content overriding the centered title — e.g. a search field or segmented toggle.' },
      { name: 'leadingPrimary', type: 'ReactNode', desc: 'The leading side\'s main action (e.g. Back), closest to the screen edge.' },
      { name: 'leadingSecondary', type: 'ReactNode', desc: 'A second, less prominent leading action, closer to the title.' },
      { name: 'trailingPrimary', type: 'ReactNode', desc: 'The trailing side\'s main action (e.g. Save/Done), closest to the screen edge.' },
      { name: 'trailingSecondary', type: 'ReactNode', desc: 'A second, less prominent trailing action, closer to the title.' },
    ],
    a11y: 'Each slot\'s action keeps its own accessibilityLabel and a ≥44×44pt hit target, however many of the four optional slots are populated. The title renders with accessibilityRole="header" and always truncates (numberOfLines={1}) rather than overlapping the reserved slot areas. Slot order stays semantic: the primary action sits closest to the screen edge on its side, the secondary action closest to the title, on both the leading and trailing side.',
    render: () => <TopNavFamilyGallery />,
    hermesReference: {
      useSummary: 'TopNav is a Hermex design-system contract whose production implementation is the shared native `TopNav: ToolbarContent`; a simple screen with no custom actions may keep a native navigation title instead. Bottom/keyboard toolbars are a separate, out-of-scope concern.',
      usedIn: [
        { screen: 'Sessions, Bots, Workspace', effect: 'Standard screens compose shared `TopNav` with a leading back/close action and 0-2 trailing actions around the native navigation title.' },
        { screen: 'Task editor, New Project, Settings editors', path: 'Tasks → create or edit a task; Sessions → Projects → New Project', effect: 'Modal/editor sheets compose shared `TopNav` with a leading Cancel and a trailing Save/Done action.' },
      ],
      implementationNotes: {
        status: 'Production adoption: fully adopted. The shared SwiftUI TopNav: ToolbarContent now owns all 57 top-navigation toolbar blocks across 39 production files; the catalog component mirrors its five-slot contract.',
        sourcePaths: ['HermesMobile/Features/Shared/TopNav.swift', 'native/components/TopNav/TopNav.tsx'],
        notes: [
          'Every raw production top-navigation placement — leading, trailing, principal, cancellation, confirmation, and primary actions — now composes through `TopNav`; native toolbar placement semantics remain caller-selected.',
          'A screen with no custom leading/trailing actions (most simple list/detail screens) can keep a plain native navigation title and never needs to compose this component at all.',
          'The retained Kanban `.bottomBar` item and any keyboard accessory toolbar remain separate production concerns with their own anatomy; TopNav documents only the top bar.',
        ],
      },
    },
  },
  {
    id: 'Skeleton Loading',
    description:
      'Production\'s static, motion-free Skeleton family is authoritative. It provides explicit text-line, block, circle, and rounded-rectangle shapes, plus `.skeletonPlaceholder()` when a final view already owns the correct geometry. The catalog reflects those variants and grouped accessibility behavior rather than introducing continuous shimmer.',
    whenToUse: 'Reach for these static shapes when documenting or building a new loading placeholder; never introduce continuous animated shimmer into production.',
    a11y: 'Each shape carries a "Loading" accessibility label; a grouped composition wraps several shapes so they announce once, together, instead of once per shape.',
    render: () => <HermesSkeletonGallery />,
    hermesReference: {
      useSummary: 'Production composes shared text-line, block, circle, and rounded-rectangle Skeleton shapes; no Hermex-owned animated shimmer exists.',
      usedIn: [
        { screen: 'Sessions, Insights, and Chat', effect: 'Each has a content-shaped loading placeholder; every one now composes the shared static SkeletonPlaceholder primitive, which still applies SwiftUI\'s own `.redacted(reason: .placeholder)` under the hood, not an animated shimmer.' },
      ],
      implementationNotes: {
        status: 'Hermex-owned static skeleton primitive (SkeletonPlaceholder); no Hermex-owned animated shimmer exists.',
        sourcePaths: [
          'HermesMobile/Features/Shared/SkeletonPlaceholder.swift',
          'HermesMobile/Features/SessionList/SessionListComponents.swift',
          'HermesMobile/Features/Insights/ProviderLimitsCard.swift',
          'HermesMobile/Features/Chat/ChatTranscriptSupportingViews.swift',
        ],
        notes: [
          'SessionRowSkeletonView and ProviderLimitsPlaceholderCard keep `.skeletonPlaceholder()` when their final content already supplies the right geometry. ChatTranscriptLoadingSkeletonView uses neutral `Skeleton(shape: .textLine(...))` lines without sender-implying outgoing-bubble chrome. Composite placeholders use `.skeletonAnnouncement(label:value:)` for one VoiceOver announcement.',
          'The catalog\'s own animated Shimmer component remains available as a distinct catalog/reference-only counterpart (see its own gallery below the static shapes) — it is never a claimed production mapping, and production never adopted it.',
        ],
      },
    },
  },
  {
    id: 'List / ListItem',
    description:
      'A container plus a configurable row: independently optional leading avatar/icon/status content, rich/multiline title and description, a title-adjacent Tag or accessory, two-zone metadata/footer content, trailing data (+ optional trailing subdata), a custom/independently-interactive trailing accessory, selected/disabled/loading/commit-pending states, an accessibility-label override, and Dynamic Type layout adaptation. Picker Row is removed as a standalone family — a picker is ListItem used with selected, pending, and trailing-checkmark configuration, plus an optional secondary action.',
    whenToUse: 'Reach for ListItem for any row anatomy, including a picker row — there is no separate Picker Row component to reach for instead. SessionListItem is the named composition for session rows.',
    props: [
      { name: 'leading', type: 'ReactNode', desc: 'Leading slot — typically an Avatar, Icon, or status indicator.' },
      { name: 'title', type: 'string', required: true, desc: 'The row\'s primary label.' },
      { name: 'titleAccessory', type: 'ReactNode', desc: 'Icon/Tag/custom node placed immediately after the title, on the same line.' },
      { name: 'description / subtitle', type: 'string', desc: 'Secondary line below the title; `subtitle` is the pre-existing alias for the same slot.' },
      { name: 'metadata / footer', type: 'ReactNode | string', desc: 'A third, lower-priority block; `footer` is the pre-existing alias for the same slot.' },
      { name: 'trailingText', type: 'string', desc: 'Compact right-aligned value before the trailing slot.' },
      { name: 'trailingSubtext', type: 'string', desc: 'A second, muted right-aligned line under trailingText.' },
      { name: 'trailing', type: 'ReactNode', desc: 'Trailing accessory, disclosure chevron, checkmark, or other independently interactive custom node.' },
      { name: 'disabled', type: 'boolean', default: 'false', desc: 'Dims the row\'s text and, when pressable, disables the press.' },
      { name: 'loading', type: 'boolean', default: 'false', desc: 'Renders the row\'s slots as Shimmer placeholders inside one SkeletonGroup (one "Loading" announcement, not one per slot); never pressable — the same anatomy a commit-pending row uses.' },
    ],
    a11y: 'A pressable ListItem exposes one combined accessibilityLabel (title + description, overridable) and accessibilityRole="button"; a disabled or loading row is never pressable. A loading row announces "Loading" once via SkeletonGroup instead of once per Shimmer block. Layout adapts to Dynamic Type via ordinary text flow rather than fixed heights.',
    render: () => <ListItemFamilyGallery />,
    hermesReference: {
      useSummary: 'Adopted: ListItem\'s selected/pending/trailing-checkmark configuration replaces the four picker implementations, SessionListItem composes ListItem for session rows, and the Session main menu\'s container composes the shared HermesList.',
      usedIn: [
        { screen: 'Default Model, Default Profile, and Task editor', path: 'Settings → Active Server → Default Model/Profile; Tasks → create or edit a task', effect: 'Model, profile, configuration, and skill selection target the ListItem picker configuration rather than a standalone Picker Row component.' },
        { screen: 'Sessions and Bots', effect: 'SessionListComponents.swift\'s SessionInteractiveRow composes SessionListItem; BotInboxRow keeps its own unread-dot anatomy, retained separately rather than migrated in this pass.' },
        { screen: 'Session main menu', path: 'Sessions (root)', effect: 'SessionListView.swift\'s content seam composes the shared HermesList container. SidebarNavButton and SidebarDisclosureButton keep their own row anatomy — their navigation/disclosure semantics do not match the picker-oriented ListItem configuration, so they stay feature-local rather than a superficial ListItem migration.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/ListItem.swift',
          'HermesMobile/Features/Shared/ModelPickerSheet.swift',
          'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
          'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
          'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
          'HermesMobile/Features/SessionList/SessionListItem.swift',
          'HermesMobile/Features/SessionList/SessionListComponents.swift',
          'HermesMobile/Features/Bots/BotsInboxView.swift',
          'HermesMobile/Features/Shared/HermesList.swift',
          'HermesMobile/Features/SessionList/SessionListView.swift',
        ],
        notes: [
          'Each picker caller\'s row content contract (a model row\'s favorite star, a profile row\'s subtitle, a skill row\'s icon) differs enough that the shared target is a configuration of ListItem, not a rename of the old standalone Picker Row scaffolding — ListItem now supplies its own row geometry (ListItemMetrics.minHeight/cornerRadius) and selection chrome (listItemSelectionPill(isSelected:)).',
          'SessionListItem shows attention text, a streaming indicator, and a richer avatar treatment where BotInboxRow shows only an unread dot — different enough that BotInboxRow stays a separate implementation rather than also composing SessionListItem. Native Button wrapping, selection background, swipe actions, context menus, and transitions stay owned by SessionInteractiveRow in SessionListComponents.swift, not SessionListItem itself.',
          'HermesList is the shared container seam only: it deliberately keeps native SwiftUI List semantics (selection, refresh, row insets, separators, swipe/context-menu behavior, keyboard support, platform accessibility) rather than replacing them, so the main menu\'s adoption is at the container level, not a row-level ListItem migration.',
        ],
      },
    },
  },
  {
    id: 'Disclosure Row',
    description:
      'An icon slot, a one-line summary, and a chevron that expands into a scrollable detail body — the shared anatomy behind a tool-call log line, the "Thinking" reasoning block, and a bot activity/plan row. Uses Hermex typography, spacing, radius, motion, Buttons, and Divider.',
    whenToUse: 'Use it for one line of collapsed status that can expand into longer detail; for a persistent always-visible detail, use Card instead.',
    props: [
      { name: 'DisclosureRowMetrics.minimumHeight', type: 'CGFloat', default: '32', desc: 'Row height at the default text size.' },
      { name: 'DisclosureRowMetrics.bodyIndent', type: 'CGFloat', default: '26', desc: 'Icon column width + gap, so the expanded body indents under the row text.' },
      { name: 'DisclosureRowMetrics.bodyWindowHeight', type: 'CGFloat', default: '240', desc: 'Fixed cap the expanded body scrolls inside.' },
    ],
    a11y: 'Tap toggles expand/collapse; a long press on the expanded body copies its content — each caller supplies its own icon and detail text/accessibility label.',
    render: () => <DisclosureLogRowPreview />,
    hermesReference: {
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'A tool call\'s log line and the "Thinking" reasoning block both expand into a detail body.' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'A bot\'s activity/plan row uses the same row anatomy.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Chat/DisclosureRow.swift',
          'HermesMobile/Features/Chat/ToolCallLogRowView.swift',
          'HermesMobile/Features/Chat/ReasoningBlockView.swift',
          'HermesMobile/Features/Bots/BotActivityViews.swift',
        ],
        notes: [
          'Already one shared, parameterized production component with three call sites — this entry documents its visual/interaction anatomy; the geometry facts alone were already catalogued under Hermex Radius & Geometry.',
        ],
      },
    },
  },
  {
    id: 'Content Unavailable',
    description:
      "A Hermex-owned reusable pattern — Empty, No results, Error, Unavailable, and Custom variants — that replaces direct production ContentUnavailableView use. It composes Hermex icon treatment, typography, spacing, and Buttons, with an optional description plus primary and secondary actions.",
    whenToUse: 'Use it when a screen has no content, no search results, cannot load its content, or needs a custom empty/error state with an action.',
    props: [
      { name: 'variant', type: "'empty' | 'noResults' | 'error' | 'unavailable' | 'custom'", required: true, desc: 'Selects the icon/title pairing.' },
      { name: 'description', type: 'String?', desc: 'Optional secondary line under the title.' },
      { name: 'primaryAction / secondaryAction', type: '{ label: String; onPress: () -> Void }?', desc: 'Optional Buttons composed below the description.' },
    ],
    a11y: 'Icon, title, and description combine into one accessible element; a primary/secondary action is a normal focusable Button, not part of that combined element.',
    variants: {
      items: [
        { key: 'empty', name: 'Empty', node: <ContentUnavailablePreview variant="empty" /> },
        { key: 'no-results', name: 'No results', node: <ContentUnavailablePreview variant="noResults" /> },
        { key: 'error', name: 'Error', node: <ContentUnavailablePreview variant="error" primaryAction /> },
        { key: 'unavailable', name: 'Unavailable', node: <ContentUnavailablePreview variant="unavailable" /> },
        { key: 'custom', name: 'Custom', node: <ContentUnavailablePreview variant="custom" primaryAction secondaryAction /> },
      ],
    },
    states: {
      items: [
        { key: 'no-description', name: 'Without description', node: <ContentUnavailablePreview withDescription={false} /> },
        { key: 'with-actions', name: 'With primary + secondary actions', node: <ContentUnavailablePreview primaryAction secondaryAction /> },
      ],
    },
    hermesReference: {
      useSummary: 'Partially adopted: HermesContentUnavailable.swift composes ContentUnavailableView for the loading/error/empty states of Settings\' Default Model/Profile pickers, the Task editor\'s configuration/skill pickers, Kanban\'s status/filter empty branch (including the new noResults variant), and Usage\'s page-level loading/error/empty states; most other screens, and even those same picker sheets\' own no-results state, still call ContentUnavailableView directly.',
      usedIn: [
        { screen: 'Default Model, Default Profile, and Task editor', path: 'Settings → Active Server → Default Model/Profile; Tasks → create or edit a task', effect: 'Loading, error, and empty states use HermesContentUnavailable; each picker\'s own search no-results state keeps the direct ContentUnavailableView.search(text:) call.' },
        { screen: 'Kanban', path: 'Kanban → a status/filter combination with no Cards', effect: 'The status board\'s empty branch uses HermesContentUnavailable with the noResults variant while filters are active, and the empty variant otherwise; the Clear Filters action is unchanged.' },
        { screen: 'Usage', path: 'Sessions → Usage', effect: 'The page-level loading, error, and empty states use HermesContentUnavailable\'s loading/error/empty variants; the loading description and the error state\'s Try Again retry are unchanged.' },
        { screen: 'Tasks, Skills, and Memory', effect: 'Open the section when it has no available content or cannot load — not yet migrated, still a direct ContentUnavailableView call.' },
        { screen: 'Bots', effect: 'Open Bots without a connection or search for a bot with no results — not yet migrated, still a direct ContentUnavailableView call.' },
        { screen: 'Workspace and Files', effect: 'Open a workspace or file browser with no available result — not yet migrated, still a direct ContentUnavailableView call.' },
      ],
      implementationNotes: {
        status: 'Partially adopted: HermesContentUnavailable.swift exists and is composed by four picker sheets\' loading/error/empty states plus Kanban\'s empty branch and Usage\'s page states; migration of the remaining direct production ContentUnavailableView call sites is not yet complete.',
        sourcePaths: [
          'HermesMobile/Features/Shared/HermesContentUnavailable.swift',
          'HermesMobile/Features/Shared/ModelPickerSheet.swift',
          'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
          'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
          'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
          'HermesMobile/Features/Kanban/KanbanLabView.swift',
          'HermesMobile/Features/Insights/InsightsView.swift',
        ],
        notes: [
          'Each of those four picker sheets still calls ContentUnavailableView.search(text:) directly for its own search-no-results state — HermesContentUnavailable\'s own doc comment calls that platform treatment already the exact reusable pattern and keeps it a direct call at every site, migrated or not, rather than wrapping it a second time.',
          'The noResults variant was added for Kanban\'s status/filter empty branch: it renders identically to empty (an icon plus title) but names the distinct "filtered down to nothing" case, matching the copy and icon Kanban already used.',
          'Outside those four pickers, Kanban, and Usage, the platform ContentUnavailableView is still used directly across 28 production files (66 source references), including TasksView.swift, SkillsView.swift, and MemoryView.swift — not yet migrated to this pattern.',
        ],
      },
    },
  },
  {
    id: 'Pending Request',
    description:
      'Shared Request Card, block, field, and choice surfaces for questions and approvals that need a response from the user. The pattern composes Request Card, Disclosure/command blocks, fields, choices, and Buttons; approval, denial, clarification, pending, disabled, success, failure, cancellation, and recovery remain domain-owned states.',
    props: [
      { name: 'requestCardSurface(cornerRadius:material:)', type: '(CGFloat, RequestCardMaterial) -> some View', desc: 'Promoted into the Card family (HermesCard.swift). Request Card is secondarySystemBackground + stroke by default (RequestCardMaterial.opaque), deliberately opaque so it always renders above live transcript text; RequestCardMaterial.translucentOverScrim is the one documented exception, for the approval overlay\'s card, which instead sits over its own dimmed scrim. cornerRadius is caller-supplied — 24pt for the Sessions clarification card, 16pt for the approval overlay, 14pt for the Bot card.' },
      { name: 'pendingRequestBlockSurface()', type: '() -> some View', desc: 'The recessed block a question or command sits in, inside a card. Fixed 12pt corner radius.' },
      { name: 'pendingRequestFieldSurface()', type: '() -> some View', desc: 'The free-text response field\'s surface, including its padding. Fixed 14pt corner radius.' },
      { name: 'pendingRequestChoiceSurface(reduceTransparency:)', type: '(Bool) -> some View', desc: 'Opaque when Reduce Transparency is on; regular Adaptive Glass otherwise. Fixed 14pt corner radius on every branch.' },
    ],
    a11y: 'pendingRequestChoiceSurface branches explicitly on Reduce Transparency; the Request Card surface is deliberately opaque so an approval/clarification request never blends into the transcript underneath it.',
    variants: {
      itemsFill: true,
      align: 'left',
      items: [
        { key: 'card', name: 'Request Card surface', node: <View style={recon.prCard}><Text style={recon.prText}>Approve this action?</Text></View> },
        { key: 'block', name: 'Block surface', node: <View style={recon.prBlock}><Text style={recon.prText}>rm -rf build/</Text></View> },
        { key: 'field', name: 'Field surface', node: <View style={recon.prField}><Text style={recon.prText}>Type a response…</Text></View> },
      ],
    },
    states: {
      itemsFill: true,
      align: 'left',
      items: [
        { key: 'choice-glass', name: 'Choice surface — glass', node: <View style={recon.prChoiceGlass}><Text style={recon.prText}>Yes · No</Text></View> },
        { key: 'choice-opaque', name: 'Choice surface — Reduce Transparency', node: <View style={recon.prChoiceOpaque}><Text style={recon.prText}>Yes · No</Text></View> },
      ],
    },
    hermesReference: {
      usedIn: [
        { screen: 'Sessions', path: 'Sessions → open a conversation', effect: 'Clarification requests appear above the composer, and the approval overlay\'s card floats over its own dimmed scrim (RequestCardMaterial.translucentOverScrim).' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'Pending requests appear inline with the transcript, and the bot room composer\'s pending card shares the same surface.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/HermesCard.swift',
          'HermesMobile/Features/Chat/PendingRequestSurfaces.swift',
          'HermesMobile/Features/Chat/ClarificationRequestCard.swift',
          'HermesMobile/Features/Chat/ApprovalRequestOverlay.swift',
          'HermesMobile/Features/Bots/BotPendingRequestCard.swift',
          'HermesMobile/Features/Bots/BotRoomComposerView.swift',
        ],
        notes: [
          'Decision controls belong to the Button family, not this entry: PendingRequestSubmitButton uses the .hermesPressOnly(.icon) press style, and the Yes/No/Approve/Deny choices use .hermes(.medium, emphasis: .primary/.secondary/.destructive) — see Buttons.',
        ],
      },
    },
  },
  {
    id: 'Transcript Activity',
    description:
      'A product pattern for the transcript\'s collapsible activity anatomy — a Turn Summary Disclosure, the Activity Disclosure Row, a grouped-tool-history control, assistant message content, and message metadata — preserving each piece\'s own domain ownership.',
    whenToUse: 'Use it to understand how a transcript turn\'s collapsible pieces relate; build each piece from its own owning component (Disclosure Row, Buttons) rather than a new bespoke view.',
    a11y: 'Each composed piece keeps its own accessibility behavior — see Disclosure Row for expand/collapse semantics and Buttons for the grouped-history control\'s press feedback.',
    render: () => <TranscriptActivityPreview />,
    hermesReference: {
      useSummary: 'DisclosureRow is the reusable Activity Disclosure Row; Turn Summary stays a separate component because its semantics, height, and expansion contract differ.',
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'A turn\'s summary disclosure, tool-call log lines, and the "Thinking" reasoning block compose this pattern.' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'A bot\'s grouped tool-activity history composes the same disclosure anatomy plus a Buttons-driven group control.' },
      ],
      implementationNotes: {
        status: 'DisclosureRow already serves as the reusable Activity Disclosure Row; the group-history control\'s composition through Buttons and shared disclosure icon behavior is documented here for the first time.',
        sourcePaths: [
          'HermesMobile/Features/Chat/DisclosureRow.swift',
          'HermesMobile/Features/Chat/TranscriptTurnFolding.swift',
          'HermesMobile/Features/Chat/ToolActivityGroupView.swift',
          'HermesMobile/Features/Chat/ReasoningBlockView.swift',
        ],
        notes: [
          'Domain ownership boundary preserved from the approved specification: this pattern documents composition only — turn-folding logic, message content rendering, and metadata stay owned by their existing production types, not absorbed into a generic view.',
        ],
      },
    },
  },
  {
    id: 'Composer',
    description:
      'A product pattern, not a Card variant, composing the composer surface, an input field, Buttons, Tag, Inline Reference Link, Attachment, Adaptive Glass, and status/validation feedback.',
    whenToUse: 'Use it to understand how the composer\'s pieces relate; text editing, keyboard interaction, draft persistence, attachments, runtime selection, voice input, and send/stop lifecycle stay owned by the Composer pattern, not by any one family it composes.',
    a11y: 'Each composed family keeps its own accessibility behavior (Buttons\' focus/press states, Attachment\'s combined tile label, Inline Reference Link\'s link semantics); the composer surface itself adds no additional grouping beyond that.',
    render: () => <ComposerPatternPreview />,
    hermesReference: {
      useSummary: 'Reusable production pieces include the Composer Action Button, selector Buttons, composer status using Tag, the Attachment strip, shared surface treatment, and voice/send/stop sizing and state behavior.',
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'The composer surface hosts text input, attachments, inline references, and the send/stop action.' },
      ],
      implementationNotes: {
        status: 'Target architecture: this pattern documents the accepted composition; production migration is owned by a dedicated composer workstream.',
        sourcePaths: [
          'HermesMobile/Features/Chat/ChatComposerPresentation.swift',
          'HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift',
          'HermesMobile/Features/Chat/ChatComposerTextInputView.swift',
          'HermesMobile/Features/Chat/ComposerChipRendering.swift',
        ],
        notes: [
          'Preserves domain ownership from the approved specification: text editing, keyboard interaction, draft persistence, attachments, runtime selection, voice input, and send/stop lifecycle stay owned by the Composer pattern, not moved into generic Card/Button props.',
        ],
      },
    },
  },
  {
    id: 'Hermex Colors',
    description:
      'Semantic colors describe purpose rather than a fixed hex value, so surfaces, text, borders, actions, and status feedback adapt correctly. Product palettes provide the selectable header and project accents.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesColorsGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Appearance', path: 'Settings → Appearance', effect: 'Choose the header accent and preview its foreground contrast.' },
        { screen: 'New Project', path: 'Sessions → Projects → New Project', effect: 'Choose one of the approved project colors.' },
        { screen: 'Sessions and conversations', effect: 'Semantic roles style surfaces, text, separators, actions, statuses, and disabled content.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/AppTheme.swift', 'HermesMobile/Features/SessionList/ProjectCreationSheet.swift', 'HermesMobile/Config/HermesColor.swift'],
        notes: [
          'HeaderLogoColor (per-account accent, 6 presets) and ProjectCreationPalette (8 approved per-project accents) now derive their values from HermesColorRamp/HermesProductPalette, pinned by HermesColorTests/HermesProductPaletteTests.',
          'Status/state colors (e.g. offline banners, selection pills) use Apple\'s own SwiftUI semantic colors directly — Hermex defines no separate status color layer.',
        ],
      },
    },
  },
  {
    id: 'Hermex Motion',
    description:
      'Eight named motion patterns pair intent with duration and easing. Reduce Motion shortens or removes movement while preserving the state change.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesMotionReference />,
    hermesReference: {
      usedIn: [
        { screen: 'Sessions', effect: 'Search, disclosure, row updates, and list transitions use named motion patterns.' },
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'Composer changes, transcript insertions, disclosures, overlays, and scroll following use the motion system.' },
        { screen: 'Bot conversation', path: 'Bots → open a bot conversation', effect: 'Composer and transcript behaviors reuse the chat motion system.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesMotion.swift', 'HermesMobile/Features/Chat/ChatMotion.swift', 'HermesMobile/Features/SessionList/SessionListComponents.swift', 'HermesMobile/Features/Bots/BotFaceMotion.swift'],
        notes: [
          'ChatMotion and SessionListMotion read their durations/easings from HermesMotion; every off-scale value has been normalized onto the six-step duration scale.',
          'BotFaceMotion\'s 0.35s idle breathing and SessionListItem\'s 0.4s streaming-indicator loop remain deliberately outside the scale, as named exceptions.',
        ],
      },
    },
  },
  {
    id: 'Hermex Radius & Geometry',
    description:
      'A seven-step radius scale and semantic aliases shape controls, fields, cards, prominent surfaces, and app chrome. Feature-specific dimensions stay named when they are not reusable radius tokens.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesGeometryGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'Composer cards, autocomplete panels, and transcript log rows use the radius and geometry rules.' },
        { screen: 'Settings and Tasks pickers', effect: 'Shared row height and selection-pill radius keep pickers consistent.' },
        { screen: 'Wide destinations', path: 'Settings, Archived Sessions, Git, and other wide destinations', effect: 'Readable-width limits keep content from stretching too far.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Config/HermesRadius.swift',
          'HermesMobile/Features/Chat/ChatComposerPresentation.swift',
          'HermesMobile/Features/Shared/ListItem.swift',
          'HermesMobile/Features/Chat/DisclosureRow.swift',
          'HermesMobile/Features/Shared/AdaptiveGlassModifier.swift',
        ],
        notes: [
          'DisclosureRowMetrics and AdaptiveReadableContentWidth remain named, feature-scoped exceptions, not migrated into the numeric scale.',
        ],
      },
    },
  },
  {
    id: 'Hermex Spacing',
    description:
      'A 12-step spacing scale controls gaps and padding throughout Hermex, from compact icon spacing to large section separation.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesSpacingGallery />,
    hermesReference: {
      useSummary: 'The scale is used across the app; representative examples come from Sessions, Settings, Tasks, and Bots.',
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesSpacing.swift'],
      },
    },
  },
  {
    id: 'Hermex Shadow',
    description:
      'Eight elevation roles distinguish resting and pressed controls, popovers, composer chrome, and overlays. Some roles adjust their opacity between light and dark appearance.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesShadowGallery />,
    hermesReference: {
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'Composer chrome, action controls, approval overlays, and autocomplete popovers use elevation roles.' },
        { screen: 'Bot conversation', path: 'Bots → open a bot conversation', effect: 'Mention and command autocomplete use popover elevation.' },
        { screen: 'App Icon', path: 'Settings → Appearance → App Icon', effect: 'Pressed icon previews use an elevated control shadow.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesShadow.swift'],
        notes: [
          'controlElevatedResting/Pressed and chrome resolve their opacity per light/dark appearance; the other five roles fix one opacity literal for both.',
        ],
      },
    },
  },
  {
    id: 'Hermex Iconography',
    description:
      'Hermex uses SF Symbols for navigation, actions, status, and content cues. Browse the visual inventory by symbol name; implementation traces remain secondary.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesIconReference />,
    hermesReference: {
      useSummary: 'Icons appear throughout every main section.',
      usedIn: [
        { screen: 'Sessions and Chat', effect: 'Navigation, message actions, composer controls, and transcript status use SF Symbols.' },
        { screen: 'Bots and Tasks', effect: 'Bot artifacts, pending requests, task status, and configuration actions use SF Symbols.' },
        { screen: 'Settings and Workspace', effect: 'Settings rows, server controls, files, and Git actions use SF Symbols.' },
        { screen: 'System surfaces', effect: 'Share, notifications, App Intents, and Live Activity surfaces also use SF Symbols.' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: ['HermesMobile/**/*.swift'],
        notes: [
          'The inventory is deduplicated by final SF Symbol name.',
          'Literal counts, computed expressions, source sites, and trace methods remain available from hermesIconInventory.generated.json and hermesIconComputedSiteTrace.generated.json.',
          'The browser cannot render SF Symbols faithfully without adding assets or a dependency, so tiles are explicitly unavailable instead of using substitute glyphs.',
        ],
      },
    },
  },
];

export const hermesNav: NavGroup<HermesSectionId>[] = [
  {
    label: 'Foundations — Hermex',
    ids: ['Hermex Colors', 'Hermex Spacing', 'Hermex Typography', 'Hermex Font', 'Hermex Motion', 'Hermex Radius & Geometry', 'Hermex Shadow', 'Hermex Iconography'],
  },
  {
    label: 'Materials — Hermex',
    ids: ['Adaptive Glass'],
  },
  {
    label: 'Native iOS — Hermex',
    ids: ['Search', 'Hermes TopNav'],
  },
  {
    label: 'Components — Hermex',
    ids: [
      'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Row Divider', 'Tag',
      'Inline Reference Link', 'Input Field', 'Segmented Control', 'Buttons', 'Hermes Checkbox',
      'Skeleton Loading', 'List / ListItem', 'Disclosure Row',
    ],
  },
  {
    label: 'Patterns — Hermex',
    ids: ['Content Unavailable', 'Pending Request', 'Transcript Activity', 'Composer'],
  },
];
