/**
 * Hermex reference layer.
 *
 * This branch is foundation-only: it adds Design System tokens/components to the repository
 * candidate, but does not migrate any production screen onto them (see `HermesOverview`'s branch
 * status). Every `SectionDef` below documents a Hermex-sourced catalog entry: a concise
 * plain-English introduction and visual examples first, then "Product context" destinations —
 * relevant screens/paths a reader can use to picture where a component fits, not proof of current
 * production adoption unless the entry's own `implementationNotes.status` says so — with technical
 * provenance (source paths, foundation/adoption status, material-fidelity notes) visible in the
 * lower reference-details cards (see `def.hermesReference`, `native/catalog/types.ts`).
 * Hermex itself ships no React Native runtime — every live example on this page is a React Native
 * documentation reconstruction of SwiftUI source, not the production app.
 *
 * This file only supplies data; layout/columns/scroll-spy belong to the shared catalog framework
 * (`CatalogShell`/`SectionBlock`), the same as the retained template catalog in `../CatalogExample`.
 */
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Button, Card, SegmentedToggle } from '../../components';
import { DividedStack } from '../DividedStack';
import { VariantGroup } from '../VariantGroup';
import { Swatch } from '../Swatch';
import { TokenRow } from '../TokenRow';
import { TypeScaleGallery } from '../TypeScaleGallery';
import type { NavGroup, SectionDef } from '../types';
import { buildComponentManifest } from '../manifest';
import { HERMES_COLOR_RAMPS, HERMES_COLOR_RAMP_STEPS, HERMES_COLOR_GENERATED_STEP_CONSUMPTION_RESTRICTION } from './hermesColorCatalogData';
import { HermesSemanticColorReference } from './HermesSemanticColorReference';
import { HermesIconReference } from './HermesIconReference';
import { HermesMotionReference } from './HermesMotionReference';
import { HermesOverviewImplementationDetails } from './HermesReferenceDetails';
import { SpacingScaleGallery } from '../SpacingScaleGallery';
import { HERMES_SPACING_STEPS, HERMES_SPACING, HERMES_SPACING_USE } from './hermesTokenProposal';
import { HERMES_ATTACHMENT_SIZE } from './hermesAttachmentSize';
import { HERMES_ICON_SIZE } from './hermesIconSize';
import {
  AccordionListFamilyGallery,
  AttachmentTileGallery,
  AvatarSystemImageIdentityPreview,
  BannerFamilyGallery,
  BotMarkPreview,
  ButtonDecisionAndTactilePreview,
  CheckboxFamilyGallery,
  ComposerPatternPreview,
  DisclosureLogRowPreview,
  DropdownFamilyGallery,
  HermexDividerPreview,
  HermesSkeletonGallery,
  HermesTextInputFamilyGallery,
  InlineReferenceLinkPreview,
  ListItemFamilyGallery,
  RadioFamilyGallery,
  SearchFamilyGallery,
  SegmentedControlGallery,
  TagGallery,
  ToastFamilyGallery,
  TooltipFamilyGallery,
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
// displayName` in ../types.ts. Foundations/token entries also keep their existing namespaced
// 'Hermex …' ids for stable lookup while using plain visible names such as 'Colors' and 'Spacing'.
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
  | 'Search'
  | 'Text Input'
  | 'Segmented Control'
  | 'Buttons'
  | 'Hermes Checkbox'
  | 'Hermes Radio'
  | 'Hermes Dropdown'
  | 'Hermes Toast'
  | 'Hermes Tooltip'
  | 'Hermes TopNav'
  | 'Skeleton Loading'
  | 'List / ListItem'
  | 'Accordion List'
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
  cuvSpinnerGlyph: { fontSize: 26, color: '#8a8a8a' },
  cuvTitle: { fontSize: 15, fontWeight: '600', color: '#1c1c1e', textAlign: 'center' },
  cuvDesc: { fontSize: 13, color: '#6d6d72', textAlign: 'center' },
  // A bounded, phone-like frame (fixed width/height, rounded corners) for the .fullScreen Layout
  // specimen below — unlike cuvStack's own hug-content sizing, this needs a real finite container to
  // demonstrate "content starts ~1/3 down the available height" against.
  cuvFullScreenFrame: {
    width: 220, height: 420, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: '#ffffff', overflow: 'hidden', alignItems: 'center',
  },
  // Reserves the top third of cuvFullScreenFrame's own height — the same fraction
  // HermesContentUnavailable.swift's .fullScreen case computes via GeometryReader's `proxy.size.height / 3`.
  cuvFullScreenTopSpacer: { height: 420 / 3 },
  cuvFullScreenContent: { alignItems: 'center', gap: 8, paddingHorizontal: 16 },
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

// Compact, truthful branch-status summary — replaces the former screen-by-screen production-
// adoption matrix. This branch is foundation-only: it adds Design System tokens/components to the
// repository candidate, but does not migrate any production screen onto them. The one verified
// exception (AppTheme.swift's HeaderLogoColor sourcing its hex values from the new
// HermesProductPalette token) is named explicitly rather than folded into a broader claim.
interface FoundationStatusRow {
  area: string;
  note: string;
}
const FOUNDATION_BRANCH_STATUS: FoundationStatusRow[] = [
  { area: 'Tokens (Colors, Spacing, Motion, Radius & Geometry, Shadow, Iconography, Typography, Font)', note: 'Defined and available in this branch\'s foundation layer. No production screen reads from them yet, with one exception: AppTheme.swift\'s HeaderLogoColor sources its six header-accent hex values from the new HermesProductPalette token instead of literal hex strings.' },
  { area: 'Components (Card, Button, Checkbox, Radio, Dropdown, Toast, Tooltip, TopNav, Avatar, Divider, Banner, Tag, Attachment, Skeleton, List/ListItem, Disclosure Row, Segmented Control)', note: 'Implemented and available in this branch\'s foundation layer, with SwiftUI unit-test coverage. None has a production call site in this branch — every existing screen keeps its current, unmigrated implementation.' },
  { area: 'Patterns (Content Unavailable) and pre-existing patterns (Adaptive Glass, Pending Request, Composer, Transcript Activity)', note: 'Content Unavailable is the same story as the components above — a new, unadopted foundation candidate. Adaptive Glass and the Pending Request surfaces predate this branch and remain genuinely in production use; their entries describe that existing, unchanged production reality.' },
];

function HermesFoundationBranchStatusTable() {
  return (
    <VariantGroup name="Branch status — by area" align="left">
      <View style={recon.stack}>
        {FOUNDATION_BRANCH_STATUS.map((row, i) => (
          <TokenRow key={row.area} use={row.note} last={i === FOUNDATION_BRANCH_STATUS.length - 1}>
            <Text style={recon.motionName}>{row.area}</Text>
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
        <Text style={overview.b}>Implementation status:</Text> this catalog documents the foundation-only
        Design System candidate in the current working tree. Production-screen adoption is intentionally
        excluded from this slice and remains a separate workstream. The catalog is versioned under{' '}
        <Text style={overview.code}>design-system-catalog/</Text> in the same repository — not maintained
        outside it — and is validated with the application's Design System Contract CI job.
      </Text>
      <Text style={overview.p}>
        Foundation APIs/components/tokens are available in the current repository candidate.
        Production-screen migration/adoption is not included in this branch.
      </Text>
      <Text style={overview.p}>
        Hermex is SwiftUI. Every live example below is a React Native documentation reconstruction
        built from reading that SwiftUI source, not the production SwiftUI runtime.
      </Text>
      <HermesOverviewImplementationDetails
        meta={{
          implementationNotes: {
            status: 'Foundation-only: available in this branch\'s candidate; not a claim of upstream or App Store release.',
            sourcePaths: ['design-system-catalog/native/catalog/hermes/hermesSections.tsx'],
            notes: [
              'This table is a maintainer-facing coverage summary, not part of the primary design reference.',
            ],
          },
        }}
        implementationContent={<HermesTokenCoverageTable />}
      />
      <Text style={overview.p}>
        <Text style={overview.b}>Branch status:</Text> a compact, truthful summary of what this branch
        actually changes — new tokens/components are available in the repository candidate;
        production-screen migration is not part of this slice. It is not a per-screen adoption audit;
        production source remains the authority on what each screen actually renders.
      </Text>
      <HermesOverviewImplementationDetails
        meta={{
          implementationNotes: {
            status: 'Foundation-only: describes this branch\'s own candidate, not production-screen adoption.',
            notes: [
              'Verified against the current repository source at the time this table was written; re-check before relying on it after further changes.',
            ],
          },
        }}
        implementationContent={<HermesFoundationBranchStatusTable />}
      />
      <Text style={overview.p}>
        <Text style={overview.b}>Machine-readable manifest:</Text> every entry's decision contract
        (Use when / Avoid when / Alternatives / Adoption status) — plus every Foundations token
        gallery — is also available as plain JSON below, for a tool or agent instead of a human.
      </Text>
      <HermesManifest />
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
  'loading' | 'empty' | 'noResults' | 'error' | 'unavailable' | 'custom',
  { glyph: string; title: string; desc: string }
> = {
  loading: { glyph: '', title: '', desc: 'Loading…' },
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
  if (variant === 'loading') {
    // No icon slot and no title — HermesContentUnavailable.swift's .loading variant is a plain
    // ProgressView spinner, unlike every other variant's Avatar-composed icon + title label.
    return (
      <View style={recon.cuvStack}>
        <Text style={recon.cuvSpinnerGlyph}>⟳</Text>
        {withDescription && <Text style={recon.cuvDesc}>{copy.desc}</Text>}
        <Text style={recon.note}>spinner — real animating ProgressView not reproduced</Text>
      </View>
    );
  }
  return (
    <View style={recon.cuvStack}>
      <View style={recon.cuvIconSlot}>
        <Text style={recon.cuvIconGlyph}>{copy.glyph}</Text>
      </View>
      <Text style={recon.cuvTitle}>{copy.title}</Text>
      {withDescription && <Text style={recon.cuvDesc}>{copy.desc}</Text>}
      {(primaryAction || secondaryAction) && (
        <View style={{ flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {primaryAction && <Button label="Retry" variant="primary" size="small" onPress={() => {}} />}
          {secondaryAction && <Button label="Learn more" variant="tertiary" size="small" onPress={() => {}} />}
        </View>
      )}
      <Text style={recon.note}>icon slot — real SF Symbol not reproduced</Text>
    </View>
  );
}

/** The additive `.fullScreen` Layout, in a bounded phone-like frame: a reserved top spacer sized to
 *  a third of the frame's own height, so the content cluster begins ~1/3 down instead of the
 *  `.intrinsic` default's vertical centering — reconstructing HermesContentUnavailable.swift's own
 *  `GeometryReader`-based `proxy.size.height / 3` offset. */
function ContentUnavailableFullScreenPreview() {
  const copy = CONTENT_UNAVAILABLE_COPY.unavailable;
  return (
    <View style={recon.cuvFullScreenFrame}>
      <View style={recon.cuvFullScreenTopSpacer} />
      <View style={recon.cuvFullScreenContent}>
        <View style={recon.cuvIconSlot}>
          <Text style={recon.cuvIconGlyph}>{copy.glyph}</Text>
        </View>
        <Text style={recon.cuvTitle}>{copy.title}</Text>
        <Text style={recon.cuvDesc}>{copy.desc}</Text>
      </View>
      <Text style={recon.note}>.fullScreen — content begins ~1/3 down, not vertically centered</Text>
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
      <Text style={[recon.caption, { marginTop: 8 }]}>System-image identity (production HermesAvatar) — used inside Content Unavailable</Text>
      <AvatarSystemImageIdentityPreview />
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
      <VariantGroup name="Weight scale" desc="Each role owns one fixed weight; callers choose a named role and never override weight directly" align="left">
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
  { name: 'TranscriptLogRowMetrics.minimumHeight', value: '32pt', source: 'HermesMobile/Features/Chat/TranscriptLogRowView.swift', use: 'Log row height at the default text size (the real, adopted, unchanged production source; the new DisclosureRowMetrics in DisclosureRow.swift duplicates the same value, foundation-only).' },
  { name: 'TranscriptLogRowMetrics.bodyIndent', value: '26pt', source: 'HermesMobile/Features/Chat/TranscriptLogRowView.swift', use: 'Icon column width plus gap, so an expanded body indents under the row text.' },
  { name: 'TranscriptLogRowMetrics.bodyWindowHeight', value: '240pt', source: 'HermesMobile/Features/Chat/TranscriptLogRowView.swift', use: 'Fixed cap an expanded log body scrolls inside.' },
  { name: 'AdaptiveReadableContentWidth.secondaryDestination', value: '800pt', source: 'HermesMobile/Features/Shared/AdaptiveGlassModifier.swift', use: 'Max readable content width for a secondary-destination screen class.' },
  { name: 'AdaptiveReadableContentWidth.workspace', value: '1,000pt', source: 'HermesMobile/Features/Shared/AdaptiveGlassModifier.swift', use: 'Max readable content width for a workspace-class screen.' },
];

// A concise decision ladder for choosing among HermesSpacing's existing 12 steps by relationship
// and hierarchy — no new spacing values, just guidance for picking among the ones that already
// exist (HERMES_SPACING_USE above documents each individual step's own note).
interface SpacingLadderRung {
  relationship: string;
  steps: string;
  guidance: string;
}
const HERMES_SPACING_LADDER: SpacingLadderRung[] = [
  { relationship: 'Micro / inline spacing', steps: 'space.2 · space.4', guidance: 'Hairline-adjacent gaps and the tightest real gap between closely related elements, e.g. an icon and the label directly beside it.' },
  { relationship: 'Between related controls', steps: 'space.8', guidance: 'Gap between controls that read as one cluster, e.g. two buttons in the same toolbar or row.' },
  { relationship: 'Compact component padding', steps: 'space.12', guidance: 'Internal padding for a compact control, e.g. a chip, tag, or dense list row.' },
  { relationship: 'Default card / screen inset', steps: 'space.16', guidance: "A card's own padding and the standard screen horizontal inset (HermesSpacing.screenHorizontal)." },
  { relationship: 'Major content groups', steps: 'space.24', guidance: 'Gap between distinct content groups that still belong to the same screen or card.' },
  { relationship: 'Section separation', steps: 'space.32 – space.64', guidance: 'Section-to-section spacing, increasing with how distinct the sections are; values above 64 remain layout or component geometry, not the spacing scale.' },
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
      <VariantGroup name="Decision ladder" desc="Which existing step to reach for, by relationship and hierarchy — not new values." align="left">
        <View style={recon.stack}>
          {HERMES_SPACING_LADDER.map((rung, index) => (
            <TokenRow key={rung.relationship} use={rung.guidance} last={index === HERMES_SPACING_LADDER.length - 1}>
              <View style={recon.row}>
                <Text style={recon.motionName}>{rung.relationship}</Text>
                <Text style={recon.motionValue}>{rung.steps}</Text>
              </View>
            </TokenRow>
          ))}
        </View>
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
// Truthful default for a newly added foundation component/token family with zero production call
// sites in this branch — the common case. A section only keeps ADOPTED_STATUS (above) when a real,
// grep-verified production caller exists in the current working tree.
const FOUNDATION_ONLY_STATUS = 'Available in this branch\'s foundation layer; no production call site exists yet.';

// ─── Decision-contract adoptionStatus shorthands ─────────────────────────────
// The two common cases below cover most entries; a handful of umbrella/mixed entries (Hermes
// Avatar, Hermex Colors, Hermex Iconography, Transcript Activity) write their own 'partially-
// adopted' detail inline, since their real split can't be condensed into one shared constant
// without losing which piece is which.
const FOUNDATION_AVAILABLE_ADOPTION = { state: 'foundation-available' as const, detail: FOUNDATION_ONLY_STATUS };
const PRODUCTION_ADOPTED_ADOPTION = { state: 'production-adopted' as const, detail: ADOPTED_STATUS };

export const hermesSections: SectionDef<HermesSectionId>[] = [
  {
    id: 'Hermex Typography',
    displayName: 'Typography',
    description:
      'Named text roles keep hierarchy consistent and scale with Dynamic Type. Caption, footnote, and caption 2 intentionally share the same compact base size.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesTypographyGallery />,
    hermesReference: {
      useWhen: 'Pick a named role (caption, body, headline, title, …) for any text that needs consistent hierarchy and automatic Dynamic Type scaling.',
      avoidWhen: 'Avoid hardcoding a raw font size or weight in a new screen — that bypasses Dynamic Type and this scale entirely.',
      alternatives: [],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new named-role type system; no production screen calls .appFont(role:) yet in this branch.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Config/AppFont.swift'],
        notes: [
          'AppFont.Role and the .appFont(role:) SwiftUI modifier (plus the equivalent UIKit resolver) are defined and unit-tested in this branch; every existing screen keeps its own current AppFont.body/.headline/.title3-style calls, unmigrated.',
          'Named emphasis roles are headlineSemibold, subheadlineSemibold, and captionSemibold; mono14 is 14pt monospaced and mono12 is 12pt monospaced.',
        ],
      },
    },
  },
  {
    id: 'Hermex Font',
    displayName: 'Font',
    description:
      'Hermex uses San Francisco. Callers choose a named Hermex Typography role; the role alone decides weight and design, so a caller never passes weight or design directly.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesFontGallery />,
    hermesReference: {
      useWhen: 'This entry states one rule: pick a Typography role and never pass weight or design. It adds no separate choice.',
      avoidWhen: 'Never pass a custom weight or design directly to .appFont(role:) — the modifier accepts neither.',
      alternatives: [
        { name: 'Hermex Typography', useWhen: 'For choosing which named role — that entry owns the selection.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A foundation-only rule on the new .appFont(role:) modifier; no production screen calls it yet in this branch.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Config/AppFont.swift'],
        notes: [
          '.appFont(role:) takes only a named AppFont.Role (and, on the Text overload, a required dynamicTypeSize); it accepts no weight or design arguments, and scripts/hermex_design_system_adoption_audit.py fails closed on any customized call — the rule is enforced on the modifier itself, ahead of any screen migrating onto it.',
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
      useWhen: 'Use it for glass-like cards and controls instead of rebuilding platform and accessibility fallbacks on each screen.',
      avoidWhen: 'Avoid it when a surface must stay unconditionally opaque regardless of Liquid Glass availability — an approval/clarification surface that must always read clearly over live transcript text.',
      alternatives: [
        { name: 'Pending Request', useWhen: 'For an approval/clarification surface that must stay unconditionally opaque over live transcript text — its adopted pendingRequestCardSurface, not a glass fallback.' },
        { name: 'Hermes Card', useWhen: 'For the .outlined surface only — a flat system-background card with a separator border and no glass.' },
      ],
      adoptionStatus: PRODUCTION_ADOPTED_ADOPTION,
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
      'HermesCard.swift is a new, foundation-only Card primitive in this branch — canonical chrome (radius, padding, background, border, elevation) behind four named surfaces: Section, Outlined, Request, and Compact. It does not replace or share an implementation with the existing, already-adopted SectionCard.swift, which remains its own separate, unmodified production component in this slice.',
    whenToUse: 'Reach for the default Section Card (glass) for grouped content, Outlined Card for a quiet system-background surface with a separator border, and Compact Card only where a component composition documents the reduced density — never as a silent caller-side padding override. For an approval/clarification surface, use the Pending Request pattern.',
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
      useWhen: 'Reach for the default Section Card (glass) for grouped content, Outlined Card for a quiet system-background surface with a separator border, and Compact Card only where a component composition documents the reduced density. For an approval/clarification surface, use the Pending Request pattern.',
      avoidWhen: 'Avoid HermesCard.swift on a production screen today — no screen imports it yet; reach for the existing, already-adopted SectionCard/SettingsCard instead. Never use Compact Card as a silent caller-side padding override.',
      alternatives: [
        { name: 'SectionCard / SettingsCard (production)', useWhen: 'For any current production screen — these pre-existing components are what developers actually reach for today.' },
        { name: 'Pending Request', useWhen: 'For any approval/clarification surface over live transcript text — pendingRequestCardSurface is the adopted implementation; HermesCard\'s own requestCardSurface has no caller.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'HermesCard.swift itself has no production call site in this branch. SectionCard.swift — a separate, pre-existing, already-adopted component with its own implementation — is the one production developers actually reach for today; it is documented here as the closest production analog, not as a HermesCard.swift caller.',
      usedIn: [
        { screen: 'Tasks', path: 'Tasks → open a task', effect: 'Prompt, Run Output, Configuration, and run-history sections use the existing SectionCard, unrelated to HermesCard.swift.' },
        { screen: 'Usage', effect: 'Totals, model, session, chart, and provider-limit cards use the existing SectionCard, unrelated to HermesCard.swift.' },
        { screen: 'Sessions', effect: 'The “Enjoying Hermex?” prompt uses the existing SectionCard\'s outlined surface, unrelated to HermesCard.swift.' },
        { screen: 'Settings', effect: 'Identity, Appearance, Interaction, Chat, Servers, Account, and other settings groups use the existing SettingsCard, unrelated to HermesCard.swift.' },
      ],
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesCard.swift'],
        notes: [
          'HermesCard.swift\'s canonical chrome: HermesRadius.card, 16pt content padding on every edge, background, border, and elevation. HermesCardSurface.outlined is the canonical outlined Card treatment: semantic system background, 1pt semantic grey separator border, and no elevation. Request Card is the opaque approval/clarification surface; Compact Card is an explicit, named compact density for component compositions such as normal Attachment tiles.',
          'SectionCard.swift and SettingsCard (both pre-existing, unmodified, and genuinely used at the screens listed above) implement their own chrome independently — this branch does not change them to delegate to HermesCard.swift, and no production file imports HermesCard.swift.',
          'Pending-request fields, choices, command blocks, decision logic, and request lifecycle stay part of the Pending Request pattern, which also does not depend on HermesCard.swift — see that entry\'s own corrected sourcePaths.',
        ],
      },
    },
  },
  {
    id: 'Attachment',
    description:
      'A new, foundation-only component family — not a Pattern, not a Card variant — for message, composer, and compact-preview file attachments, plus a file-type fallback. AttachmentFileType owns the icon/tint/label mapping shared across every variant. Colors reference the Hermex color ramps and fixed component geometry references the HermesAttachmentSize scale (both documented below), but this whole family has no production call site yet — production\'s existing attachment tiles keep their own independent implementation.',
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
        desc: `HERMES_ICON_SIZE.extraLarge (${HERMES_ICON_SIZE.extraLarge}) — the file-type icon's fixed render size inside its icon panel. A separate adopted icon-size family, no new color family.`,
      },
    ],
    a11y: 'Each tile is one combined accessibility element (children: .ignore) with a label naming the attachment and its type/detail/state (e.g. upload failure). The full-box loading Skeleton stands in for indefinite loading only — never a measurable upload percentage, which the production tile shows separately via its own progress UI.',
    render: () => <AttachmentTileGallery />,
    hermesReference: {
      useWhen: 'Use it for any surface that shows a file attachment; use the compact preview specifically for a 30×30 inline thumbnail, not the full tile.',
      avoidWhen: 'Avoid composing it on a production screen today — the existing message/composer attachment tiles keep their own separate, unmigrated implementation.',
      alternatives: [
        { name: 'MessageBubbleView / ChatComposerAttachmentStripView (production)', useWhen: 'For any current production attachment surface — this family has no production call site yet.' },
        { name: 'Inline Reference Link', useWhen: 'For a tappable file name inside text that opens the source viewer, not a thumbnail or type tile.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component family; production\'s message and composer attachment tiles (MessageBubbleView.swift, ChatComposerAttachmentStripView.swift) keep their own existing, unmigrated implementation in this branch.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/AttachmentFileType.swift',
          'HermesMobile/Features/Shared/AttachmentTile.swift',
        ],
        notes: [
          'AttachmentFileType\'s extension→icon/color mapping and AttachmentTile\'s Compact Card composed surface are defined and unit-tested here; MessageBubbleView.swift and ChatComposerAttachmentStripView.swift do not import either file in this branch.',
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
      useWhen: 'Use an in-flow Banner rather than a toast when the condition remains relevant until it is resolved (e.g. offline, a pending update) rather than a one-off confirmation.',
      avoidWhen: 'Avoid it for a one-off confirmation — use Hermes Toast for a transient message instead.',
      alternatives: [
        { name: 'Hermes Toast', useWhen: 'For a transient, one-off confirmation the caller dismisses itself (HermesToast has no auto-dismiss timer) rather than a persistent in-flow condition.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component; Sessions and the transcript keep their own existing, independent offline-cache notices in this branch, not this Banner.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/Banner.swift'],
        notes: [
          'ChatView.swift and SessionListView.swift each still implement their own offline-cache notice independently in this branch — a future Banner.offlineCache() consolidation, described here as a foundation capability, has not been made against either call site.',
          `The inline icon renders at HermesIconSize.small (${HERMES_ICON_SIZE.small}) — a size choice this new component makes, not a fact about either existing production notice.`,
        ],
      },
    },
  },
  {
    id: 'Hermes Avatar',
    displayName: 'Avatar',
    description:
      'Colored initials identify the active server or account. In the Sessions header, the same control changes into a close button while search is open.',
    props: [
      { name: 'initials', type: 'String', required: true, desc: 'Displayed initials (production Swift).' },
      { name: 'colorHex / selectedHeaderLogoColor', type: 'String / Color', required: true, desc: 'Per-server or per-account Header Logo Color fill (production Swift).' },
      { name: 'size (ServerAvatarBadge, production Swift)', type: 'CGFloat', default: '32', desc: 'ServerAvatarBadge only — the inline header avatar uses a fixed search-chrome icon size instead.' },
      { name: 'HermesAvatarSize (production Swift)', type: '.small (32) | .medium (40) | .large (48)', default: '.medium', desc: 'Named diameter token for bot-mark and other Avatar compositions. The Tip Jar companion uses .large instead of a local raw size.' },
      { name: 'systemImage (HermesAvatar, production Swift)', type: 'String', required: true, desc: 'An SF Symbol name, sized to HermesIconSize.Avatar at the chosen HermesAvatarSize.' },
      { name: 'isDecorative (HermesAvatar, production Swift)', type: 'Bool', default: 'true', desc: 'Hides the badge from VoiceOver when the surrounding content already names the identity, matching Content Unavailable\'s own combined accessibility element.' },
      {
        name: 'size (generic catalog Avatar)',
        type: "'small' (32) | 'medium' (40, default) | 'large' (48) | number",
        default: "'medium'",
        desc: 'Named steps from the exported, immutable AVATAR_SIZE map cover the common cases; pass a raw number as an intentional custom-size escape hatch (e.g. a larger hero avatar) when no named step fits.',
      },
    ],
    a11y: 'ServerAvatarBadge is hidden from VoiceOver — the row around it supplies the accessible name instead. The inline Sessions header version shares the enclosing button\'s label. BotInteractiveFaceView is also hidden from VoiceOver — it is a decorative, non-content-bearing hero illustration. HermesAvatar defaults to decorative, matching Content Unavailable\'s combined title+icon element. The generic catalog Avatar exposes accessibilityRole="image" with a label (defaulting to its initials).',
    render: () => <AvatarFamilyGallery />,
    hermesReference: {
      useWhen: 'Use ServerAvatarBadge to show initials identity for the active server/account; use the generic catalog Avatar\'s image/icon/initials precedence when a screen needs a flexible identity badge in a new context; use the bot-face system only for the Bots hero/idle face.',
      avoidWhen: 'Avoid the new HermesAvatar.swift system-image badge as a production dependency today — no screen composes it yet. Avoid reaching for the bot-face system outside Bots — it is a separate drawing/motion system, not a general-purpose Avatar.',
      alternatives: [
        { name: 'Content Unavailable', useWhen: 'When an identity-style icon badge belongs inside an empty/error state rather than standing alone — Content Unavailable already composes an Avatar-style icon slot for that.' },
      ],
      adoptionStatus: {
        state: 'partially-adopted',
        detail: 'ServerAvatarBadge and the bot-face system are adopted, pre-existing production components, unchanged by this branch. HermesAvatar.swift and HermesAvatarSize are new in this branch\'s foundation layer, with no production call site yet.',
      },
      useSummary: 'Two separate stories under one umbrella section: ServerAvatarBadge and the bot-face system are pre-existing, unchanged production identity components; HermesAvatar.swift and HermesAvatarSize are new in this branch, with no production call site yet.',
      usedIn: [
        { screen: 'Sessions', effect: 'The pre-existing header avatar (ServerAvatarBadge) opens account and server controls; it becomes the search-close control when needed.' },
        { screen: 'Servers', path: 'Settings → Servers', effect: 'The pre-existing ServerAvatarBadge gives each configured server an initials badge.' },
        { screen: 'Identity', path: 'Settings → Identity', effect: 'The pre-existing editor previews the selected initials and header color via ServerAvatarBadge.' },
        { screen: 'Bots', effect: 'The pre-existing bot-face system blinks idly (BotAnimatedFaceView) and reacts to a drag/tap on its create/edit hero face (BotInteractiveFaceView) — a separately implemented system, unrelated to the new HermesAvatar.swift.' },
      ],
      implementationNotes: {
        status: 'ServerAvatarBadge and the bot-face system: adopted, pre-existing production components, unchanged by this branch. HermesAvatar.swift and HermesAvatarSize: new in this branch\'s foundation layer, with no production call site yet.',
        sourcePaths: [
          'HermesMobile/Features/Settings/SettingsView.swift',
          'HermesMobile/Features/Bots/BotAvatarStore.swift',
          'HermesMobile/Features/Bots/BotProfileAppearance.swift',
          'HermesMobile/Features/Bots/BotFaceMotion.swift',
          'HermesMobile/Features/Shared/HermesAvatar.swift',
          'HermesMobile/Config/HermesSpacing.swift',
        ],
        notes: [
          'HermesAvatarSize is defined in HermesMobile/Config/HermesSpacing.swift, not in the pre-existing bot-appearance files — those files implement their own, separately-scaled identity system and do not reference HermesAvatarSize.',
          'One umbrella documentation section for image/icon/initials identity and bot-face identity, but not one shared implementation: BotAvatarMarkView (still), BotAnimatedFaceView (idle blink + working, Reduce Motion falls back to still), and BotInteractiveFaceView (hero drag-to-gaze/tap-to-react face) stay their own pre-existing SwiftUI types — bot faces are a distinct drawing/motion system, never adopting the umbrella Avatar family described here.',
          'HermesAvatar.swift is the new foundation piece: a circular system-image badge at HermesAvatarSize, intended so a future Content Unavailable-style empty state could stop hand-rolling a raw Label icon treatment — it has not replaced ServerAvatarBadge or the bot-face system, and no production caller composes it yet.',
        ],
      },
    },
  },
  {
    id: 'Row Divider',
    description:
      'HermesDivider is the shared SwiftUI hairline separator: it derives color from primary at 0.12 opacity, resolves one physical pixel from displayScale, accepts a tokenized leading inset, and is hidden from accessibility. The generic catalog Divider is the React Native documentation counterpart with component-owned opacity.',
    whenToUse: 'Use it between rows or under a card footer — never inside a native List, HermesList, or Accordion List, which already own their separators; do not invent a second, differently-styled divider for a new screen.',
    props: [
      { name: 'HermesDivider', type: 'View', desc: 'Shared SwiftUI divider with background-agnostic foreground-derived color and one-physical-pixel geometry.' },
      { name: 'leadingInset', type: 'CGFloat', default: 'HermesSpacing.s0', desc: 'Tokenized leading inset for row-aligned separators.' },
      { name: 'opacity (generic catalog Divider)', type: 'number', default: '0.72', desc: 'The RN reference component\'s own component-owned opacity prop, translucent by default; pass 1 for full strength (Card\'s footer divider).' },
    ],
    a11y: 'Purely decorative — HermesDivider explicitly hides itself from accessibility.',
    render: () => <HermexDividerPreview />,
    hermesReference: {
      useWhen: 'Use it between rows or under a card footer.',
      avoidWhen: 'Avoid it inside a native List, HermesList, or Accordion List — those containers draw their own separators. Do not invent a second, differently-styled divider for a new screen.',
      alternatives: [
        { name: 'List / ListItem', useWhen: 'For rows inside a List container, which owns the separators.' },
        { name: 'Native Divider (production)', useWhen: 'For current Settings groups and the SectionCard footer, which keep the native hairline today.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component; Settings and SectionCard\'s footer keep their own existing native Divider/hairline styling in this branch, not HermesDivider.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesDivider.swift'],
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
      'Tag is always display-only: a small tinted-fill pill (semibold caption text on a matching low-opacity fill), modeled on the several independent tinted-fill status pills production already uses for session state, task/run status, Git change kind, and connection/selection state. A tappable element must use a control or link component, not Tag or tag-like styling — see Inline Reference Link for the interactive counterpart.',
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
      useWhen: 'Use it for a short, glanceable status word or two, always display-only.',
      avoidWhen: 'Never make a Tag (or anything styled like one) tappable, and never use it for a longer message — that belongs in body text.',
      alternatives: [
        { name: 'Inline Reference Link', useWhen: 'When the element must be tappable — an interactive file reference, not a display-only status label.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component; production\'s status pills (Sessions, Tasks, Workspace/Git, Settings, and the composer\'s chip rendering) each keep their own existing, separately-implemented capsule styling in this branch, not Tag.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/Tag.swift',
        ],
        notes: [
          'Production still has several independent, unmigrated capsule-style implementations across Sessions, Tasks, Workspace/Git, and Settings; a future consolidation onto this one shared Tag component has not been made against any of them in this branch.',
          'The composer\'s inline skill/bot/file chip rendering (ComposerChipRendering.swift, ComposerChipToken.swift) is its own separate, pre-existing drawing path with no isInteractiveReference/ComposerChipVisualStyle API and no dependency on this new Tag component — see Inline Reference Link for that pattern\'s own accurate description.',
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
      useWhen: 'Use it for an interactive file reference that opens the source viewer.',
      avoidWhen: 'Avoid it for a non-interactive status label — use Tag for that, even if the two look visually similar.',
      alternatives: [
        { name: 'Tag', useWhen: 'For a non-interactive status label rather than a tappable file reference.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only interaction pattern; production\'s composer today draws every skill, file, and bot reference as one uniform baked-image chip with no distinct file-vs-skill visual or interactive split.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Chat/ComposerChipRendering.swift',
          'HermesMobile/Features/Chat/ComposerChipToken.swift',
        ],
        notes: [
          'Production\'s ComposerChipRendering.swift and ComposerChipToken.swift render every reference kind through the same NSTextAttachment-backed chip image; there is no ComposerChipVisualStyle type, no isInteractiveReference property, and no accessibilityTraits = .link path in the current source for a file reference specifically.',
          'This entry documents a proposed distinct treatment for an interactive file reference, separate from Tag\'s display-only capsule — not yet built against the composer\'s existing chip-rendering pipeline.',
        ],
      },
    },
  },
  {
    id: 'Text Input',
    description:
      'Three thin Hermex-owned entry points over native SwiftUI text entry — `HermesTextField`, `HermesSecureField`, and `HermesNumberField` (HermesTextInput.swift) — each forwarding straight to its native counterpart (`TextField`, `SecureField`, and the typed `TextField(value:format:)` path) with no chrome, validation, or parsing of its own. TextEditor remains a native iOS control for multiline body text, not a newly owned Hermex component, and the Search family (`.hermesSearch` over `.searchable`) stays its own separate entry rather than a Text Input variant.',
    whenToUse: 'Reach for HermesTextField for an ordinary single-line value, HermesSecureField for a credential, and HermesNumberField for a locale-aware numeric value with a caller-supplied `ParseableFormatStyle`. Use native TextEditor directly for multiline body text and the Search family for search placement — neither is a Text Input variant. For a fixed-option single-selection field, use Hermes Dropdown instead of free text.',
    props: [
      { name: 'HermesTextField(_:text:prompt:)', type: 'Binding<String>, Text?', desc: 'Forwards straight to native `TextField` for ordinary single-line entry, including an optional native `Text` prompt; the caller keeps owning keyboard, autocorrection, capitalization, and content type exactly as with `TextField` directly.' },
      { name: 'HermesSecureField(_:text:prompt:)', type: 'Binding<String>, Text?', desc: 'Forwards straight to native `SecureField` for masked single-line entry, such as a password, including an optional native `Text` prompt.' },
      { name: 'HermesNumberField(_:value:format:prompt:)', type: 'Binding<Value>, F: ParseableFormatStyle, Text?', desc: 'Forwards straight to native `TextField(value:format:)` with a caller-supplied `ParseableFormatStyle` and optional native `Text` prompt — locale-aware native parsing/formatting, never a `Binding<String>` or a forced numeric keyboard.' },
    ],
    a11y: 'Each wrapper forwards straight to its native control, so production keeps native focus, keyboard, clear behavior, dictation, Dynamic Type, and VoiceOver — none of the three add a custom accessibility layer of their own.',
    render: () => <HermesTextInputFamilyGallery />,
    hermesReference: {
      useWhen: 'Reach for HermesTextField for an ordinary single-line value, HermesSecureField for a credential, and HermesNumberField for a locale-aware numeric value with a caller-supplied ParseableFormatStyle.',
      avoidWhen: 'Avoid HermesNumberField with a Binding<String>, manual parsing, or a forced numeric keyboard — supply a native ParseableFormatStyle instead. Avoid reaching for any of the three for multiline body text (use native TextEditor directly) or search placement (use the Search family) — neither is a Text Input variant.',
      alternatives: [
        { name: 'Hermes Dropdown', useWhen: 'For a labeled single-selection field driven by a fixed option list, instead of freeform text entry.' },
        { name: 'Search', useWhen: 'For a field attached to a navigation surface or searchable list, instead of a bare text field.' },
      ],
      adoptionStatus: {
        state: 'foundation-available',
        detail: 'The three wrappers exist (HermesTextInput.swift) and are foundation-available on this branch; zero production screens use them. Production\'s existing direct TextField and SecureField call sites remain unchanged — migrating them onto the wrappers is deferred to a separate adoption issue.',
      },
      useSummary: 'New foundation wrappers; no screen has adopted them yet in this slice. Production keeps its existing direct TextField/SecureField call sites unchanged.',
      implementationNotes: {
        status: 'Component exists (HermesTextInput.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesTextInput.swift'],
        notes: [
          'Deliberately thin: `HermesTextField` forwards to native `TextField`, `HermesSecureField` to native `SecureField`, and `HermesNumberField` to the typed `TextField(value:format:)` path — none of the three own chrome, validation, helper/error text, a clear button, or their own focus, keyboard, autocorrection, capitalization, or content-type policy; the caller keeps those exactly as it would calling the native control directly.',
          'Report only: production\'s existing direct TextField and SecureField call sites (see the Design System Contract\'s frozen TextField/SecureField baselines) are unchanged by this branch and continue to call TextField/SecureField directly; migrating them onto the three wrappers is scoped to a separate issue, not this slice.',
          'The chat composer\'s own text entry is a UIKit UITextView wrapped in UIViewRepresentable (ComposerTextView), not TextField/HermesTextField — its keyboard, draft, and attachment behavior stay documented under the Composer pattern, not here.',
          'TextEditor remains a native iOS control for multiline body text; this slice does not add a Hermex-owned multiline wrapper.',
          'This reconstruction uses plain React Native TextInput to approximate HermesTextField/HermesSecureField/HermesNumberField visually; it does not compose the generic template InputField, which owns a different floating-label/clear-button visual language production does not use. The retained template catalog keeps its own InputField entry separately.',
        ],
      },
    },
  },
  {
    id: 'Search',
    description:
      'A thin Hermex-owned wrapper — `.hermesSearch(text:placement:prompt:)` — over SwiftUI\'s native `.searchable`. It exists as a foundation API only: this branch adds the shared entry point but does not migrate any production screen onto it, so every current search field still calls `.searchable` directly. Native iOS keeps ownership of placement, focus, keyboard integration, clear behavior, dictation, and accessibility either way.',
    whenToUse: 'Reach for `.hermesSearch` on a searchable list or navigation surface once a screen migrates (tracked as a separate issue); until then, a direct `.searchable` call is still correct. Either way, write a concise prompt, preserve the system clear/focus behavior, and pair filtered emptiness with a specific no-results state rather than replacing the field with custom chrome.',
    props: [
      { name: 'text', type: 'Binding<String>', required: true, desc: 'The native field owns editing, focus, clear, and keyboard behavior while the screen owns filtering.' },
      { name: 'placement', type: 'SearchFieldPlacement', default: '.automatic (native default)', desc: 'Forwarded straight to `.searchable`; choose a native placement appropriate to the navigation surface, or omit it to keep the platform\'s own automatic choice.' },
      { name: 'prompt', type: 'Text? / LocalizedStringKey', desc: 'Short task-specific guidance such as "Search sessions" or "Search skills"; omit for no synthetic copy.' },
    ],
    a11y: 'Forwards straight to native `.searchable`, so it keeps platform focus, keyboard, clear-button, dictation, VoiceOver, and Dynamic Type behavior. A no-results view names the active query and remains distinct from the unfiltered empty state.',
    render: () => <SearchFamilyGallery />,
    hermesReference: {
      useWhen: 'Attach `.hermesSearch` (or, until a screen migrates, native `.searchable` directly) to a searchable list or navigation surface, pairing filtered emptiness with a specific no-results state.',
      avoidWhen: 'Avoid replacing the field with custom chrome or hand-positioning a substitute search field. The wrapper itself must stay thin — do not add scopes, suggestions, submit handling, or debounce to it; the screen keeps owning filtering and result presentation.',
      alternatives: [
        { name: 'Text Input', useWhen: 'For an inline filter or lookup field that is not attached to a navigation surface — a plain TextField.' },
      ],
      adoptionStatus: {
        state: 'foundation-available',
        detail: 'Component exists (HermesSearch.swift) with no production call site yet. Production\'s eight existing search fields (Sessions, Model picker, Skills, Default profile, Cron job profile/skill pickers, Git branch picker, Kanban) still call SwiftUI `.searchable` directly; migrating them onto `.hermesSearch` is deferred to a separate issue.',
      },
      useSummary: 'New foundation wrapper; no screen has adopted it yet in this slice. Production keeps its existing direct `.searchable` call sites unchanged.',
      implementationNotes: {
        status: 'Component exists (HermesSearch.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesSearch.swift'],
        notes: [
          'Deliberately thin: `.hermesSearch(text:placement:prompt:)` forwards straight to SwiftUI\'s native `.searchable(text:placement:prompt:)` — it owns no field chrome, focus, keyboard, clear, dictation, or accessibility behavior of its own, and the default placement stays `.automatic` so omitting it preserves native automatic placement.',
          'Report only: production\'s eight direct `.searchable` call sites (SessionListComponents.swift, ModelPickerSheet.swift, SkillsView.swift, DefaultProfilePickerView.swift, CronJobConfigurationPickers.swift, CronJobSkillsPicker.swift, GitBranchPickerView.swift, KanbanLabView.swift) are unchanged by this branch and continue to call `.searchable` directly; migrating them onto `.hermesSearch` is scoped to a separate issue, not this slice.',
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
      useWhen: 'Use fixed for short, stable sets such as task filters, usage windows, and Cost/Tokens. Use scrolling for a larger horizontal set such as Kanban statuses.',
      avoidWhen: 'Avoid it for independent multi-selection — use Checkbox — or for a purely display-only label — use Tag.',
      alternatives: [
        { name: 'Hermes Checkbox', useWhen: 'For independent multi-selection rather than mutually exclusive choice.' },
        { name: 'Tag', useWhen: 'For a display-only label rather than an interactive selection control.' },
        { name: 'Hermes Radio', useWhen: 'For a list-style one-of-many choice inside a form, not a top-level view switch.' },
        { name: 'Hermes Dropdown', useWhen: 'For a labeled field with more options than fit a fixed track.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component; the displayed name intentionally omits a Hermex prefix. Tasks, Usage, and Kanban each keep their own existing, direct native SwiftUI segmented control in this branch — see the Design System Contract\'s frozen baseline count for those three files.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/SegmentedControl.swift',
        ],
        notes: [
          'TasksView.swift, InsightsView.swift, UsageChartCard.swift, and KanbanLabView.swift each still construct their own native SwiftUI segmented control directly; none imports SegmentedControl.swift in this branch. scripts/hermex_design_system_adoption_audit.py freezes their current native-segmented-control count so a future migration is a deliberate, reviewed change, not silent drift.',
        ],
      },
    },
  },
  {
    id: 'Buttons',
    description:
      'Native SwiftUI Button stays the semantic control everywhere. Hermex layers two reusable ButtonStyle families on top for chrome and press feedback, spanning extra-small through large sizes, label/icon content layouts, five emphases, and resting/pressed/disabled/pending states, with an optional Adaptive Glass surface.',
    whenToUse: 'Reach for .hermes(_:emphasis:pressFeedback:isGlass:) for a button whose chrome (fill, size, emphasis) Hermex should supply; reach for .hermesPressOnly(_:shadow:) when a caller already owns its own shape/fill — an icon, a compact control, a capsule, a card, a thumbnail — and only needs Reduce-Motion-safe press feedback. A Yes/No/Approve/Deny choice uses .hermes(_:emphasis:) with .primary/.secondary/.destructive.',
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
      useWhen: 'Reach for .hermes(_:emphasis:pressFeedback:isGlass:) for a button whose chrome Hermex should supply; reach for .hermesPressOnly(_:shadow:) when a caller already owns its own shape/fill and only needs Reduce-Motion-safe press feedback.',
      avoidWhen: 'Avoid .hermes(_:emphasis:) on a control whose chrome another component already owns (a Segmented Control option, a ListItem row, a Tag-styled pill) — use .hermesPressOnly or that component. Avoid either style for a tappable file reference — that is Inline Reference Link.',
      alternatives: [
        { name: 'ChatTactileButtonStyle / ChatDecisionButtonStyle (production)', useWhen: 'For any current Sessions, Bots, or composer control — the adopted styles every production call site still uses.' },
        { name: 'Inline Reference Link', useWhen: 'For a tappable file reference rather than a button.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only pair of ButtonStyle modifiers; the Sessions/Bots decision controls and the 18+ composer/thumbnail/capsule/card controls named below all still call the pre-existing, unmigrated ChatTactileButtonStyle (.chatTactile(_:)) and ChatDecisionButtonStyle in this branch, not HermesButtonStyle/HermesButtonPressOnlyStyle.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/HermesButton.swift'],
        notes: [
          'The generic catalog\'s own Button component (primary/secondary/tertiary/white/ghost/destructive, extraSmall/small/medium/large) is the closest reusable emphasis and size model shown above — HermesButtonStyle/HermesButtonPressOnlyStyle are ButtonStyle modifiers applied to a native Button, not a separate label/variant component, so they are documented here rather than reproduced as a second custom tap view.',
          'ChatTactileButtonStyle.swift (HermesMobile/Features/Chat/ChatTactileButtonStyle.swift) is unchanged and still actively used by 18+ production files via .chatTactile(_:) in this branch — HermesButtonPressOnlyStyle does not replace or rename it, and no .hermesPressOnly(_:) call site exists in production yet. Likewise, the Sessions approval overlay and the Bot pending-request card keep calling .chatDecision(_:) directly, not .hermes(_:emphasis:).',
        ],
      },
    },
  },
  {
    id: 'Hermes Checkbox',
    displayName: 'Checkbox',
    description:
      'A reusable square multi-selection control: the box fills with the adaptive semantic Color.primary (black in light appearance, white in dark — not a fixed accent) and a checkmark pops in when checked, staying the inverse system background so it remains legible against either. Pass an action (the generic catalog Checkbox\'s `onChange`) when the checkbox owns interaction; when a containing row owns the tap instead — a multi-select list row, for example — omit it, and the identical box/checkmark visual renders as a non-interactive, accessibility-hidden indicator so controls are never nested.',
    whenToUse: 'Use it for an independent multi-select fact recorded for a future action (e.g. a form submit) — checking one has no effect on others. For a setting that takes effect immediately, use native Toggle; for one-of-many exclusive selection, use Radio; for a status or completion mark (Tag) or an ordinary picker row\'s selected checkmark (List / ListItem), use that component instead — Checkbox always means an editable multi-select choice.',
    props: [
      { name: 'checked', type: 'Bool', required: true, desc: 'Whether the box is filled and shows the checkmark.' },
      { name: 'onChange', type: '((Bool) -> Void)?', desc: 'Omit when a containing row owns the tap — the checkbox then renders as a non-interactive, accessibility-hidden indicator instead of a second, nested interactive control. Pass it to make the checkbox itself the tap target.' },
      { name: 'label', type: 'String?', desc: 'Optional inline label after the box. Not announced in the row-owned indicator configuration — the owning row supplies its own accessible name/state.' },
      { name: 'disabled', type: 'Bool', default: 'false', desc: 'Dims the control and disables interaction.' },
    ],
    a11y: 'With `onChange`, the box exposes accessibilityRole="checkbox" and accessibilityState.checked/disabled, is reachable by Tab, shows a visible focus ring, and toggles on tap or Space/Enter. Without `onChange`, the identical visual is hidden from assistive technology (accessibilityElementsHidden) so a containing row\'s own Pressable and accessibilityState.selected remain the only interactive/accessible control for that row — never a checkbox nested inside another control.',
    render: () => <CheckboxFamilyGallery />,
    hermesReference: {
      useWhen: 'Use it for an independent multi-select fact recorded for a future action — checking one has no effect on others.',
      avoidWhen: 'Avoid it for a setting that must take effect immediately (use native Toggle), one-of-many exclusive selection (use Radio), or a status/completion mark (use Tag or a List/ListItem checkmark).',
      alternatives: [
        { name: 'Hermes Radio', useWhen: 'For one-of-many exclusive selection.' },
        { name: 'Tag', useWhen: 'For a read-only status or completion mark.' },
        { name: 'Native Toggle', useWhen: 'For a setting that takes effect immediately.' },
        { name: 'List / ListItem', useWhen: 'For an ordinary picker row\'s selected checkmark.' },
        { name: 'Segmented Control', useWhen: 'For a prominent exclusive view switch.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only component; production\'s Bots multi-select question and Kanban\'s bulk card-selection rows each keep their own existing, independent selection-indicator implementation in this branch, not HermesCheckbox.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/HermesCheckbox.swift',
        ],
        notes: [
          'BotPendingRequestCard.swift and KanbanLabView.swift do not import HermesCheckbox.swift in this branch; each still draws its own selection indicator directly.',
          'The interactive configuration (passing action) renders a native Button with an .accessibilityRepresentation(Toggle(...)) so it is announced and operated as a real toggle, not a plain button; the row-owned configuration (action omitted) instead applies .accessibilityHidden(true) to the same visual.',
          'The checked fill and border use Color.primary (an adaptive semantic black/white, not Color.accentColor or a new neutral-ramp step) — the approved decision for the Checkbox/Radio selected treatment; the checkmark itself stays the inverse system background regardless of appearance.',
        ],
      },
    },
  },
  {
    id: 'Hermes Radio',
    displayName: 'Radio',
    description:
      'A reusable circular one-of-many selection control — the selected option shows a filled center dot, with the selected ring and dot both using the adaptive semantic Color.primary (black in light appearance, white in dark — not a fixed accent), mirroring HermesCheckbox\'s own selected treatment. A group is just multiple Radio instances sharing one selected value in the caller; the component itself only knows its own selected state.',
    whenToUse: 'Use it for exclusive, one-of-many selection. For an independent multi-select fact, use Checkbox instead.',
    props: [
      { name: 'isSelected', type: 'Bool', required: true, desc: 'Whether the center dot is filled.' },
      { name: 'action', type: '(() -> Void)?', desc: 'Omit when a containing row owns the tap — the radio then renders as a non-interactive, accessibility-hidden indicator, mirroring HermesCheckbox\'s own row-owned configuration.' },
      { name: 'label', type: 'String?', desc: 'Optional inline label after the circle.' },
      { name: 'isEnabled', type: 'Bool', default: 'true', desc: 'Dims the control and disables interaction when false.' },
    ],
    a11y: 'With `action`, the control exposes accessibilityAddTraits(.isSelected) when selected, and normal Button semantics otherwise. Without `action`, the identical visual is hidden from VoiceOver, the same row-owned convention Checkbox already follows.',
    render: () => <RadioFamilyGallery />,
    hermesReference: {
      useWhen: 'Use it for exclusive, one-of-many selection.',
      avoidWhen: 'Avoid it for an independent multi-select fact — use Checkbox instead.',
      alternatives: [
        { name: 'Hermes Checkbox', useWhen: 'For an independent multi-select fact rather than mutually exclusive choice.' },
        { name: 'Segmented Control', useWhen: 'For a prominent, always-visible view or filter switch among a few options rather than a list-style choice.' },
        { name: 'Hermes Dropdown', useWhen: 'For a labeled field whose options should collapse into a menu instead of occupying a row each.' },
      ],
      adoptionStatus: { state: 'foundation-available', detail: 'Component exists (HermesRadio.swift) with no production call site yet.' },
      useSummary: 'New production primitive; no screen has adopted it yet in this slice.',
      implementationNotes: {
        status: 'Component exists (HermesRadio.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesRadio.swift'],
        notes: [
          'Mirrors HermesCheckbox\'s architecture exactly (DS circle size matches the checkbox box size, same 44pt minimum hit target, same disabled opacity, same adaptive Color.primary selected treatment) with a circular selected/unselected treatment instead of a boolean toggle.',
          'Report only: a single-choice (not allowsMultipleChoices) Bot pending-request question already renders its own largecircle.fill/circle glyph per choice (see Hermes Checkbox) — a plausible future HermesRadio adoption site, not migrated in this slice.',
        ],
      },
    },
  },
  {
    id: 'Hermes Dropdown',
    displayName: 'Dropdown',
    description:
      'A caller-controlled selection field over the native `.menu`-style Picker — the same checked-option and disclosure chrome SettingsView\'s own row pickers already use, generalized for reuse. Never a custom floating sheet: native Picker/Menu semantics already satisfy label, value, placeholder, and the checked selected option.',
    whenToUse: 'Use it for a labeled single-selection field driven by a fixed option list. For freeform text entry, use native TextField (see Text Input).',
    props: [
      { name: 'title', type: 'String', required: true, desc: 'The field\'s accessibility label and, when shown, its visible Picker label.' },
      { name: 'selection', type: 'Binding<Value?>', required: true, desc: 'Caller-controlled selected value; nil shows the placeholder option.' },
      { name: 'options', type: '[HermesDropdownOption<Value>]', required: true, desc: 'Each option\'s value + display label.' },
      { name: 'isEnabled', type: 'Bool', default: 'true', desc: 'Disables the control when false.' },
      { name: 'placeholder', type: 'String', default: '"Select"', desc: 'Shown as the nil-selection option\'s label.' },
    ],
    a11y: 'A native `.menu` Picker: platform-owned focus, Dynamic Type, VoiceOver, and the checked selected option — no bespoke chrome to keep accessible.',
    render: () => <DropdownFamilyGallery />,
    hermesReference: {
      useWhen: 'Use it for a labeled single-selection field driven by a fixed option list.',
      avoidWhen: 'Avoid it for freeform text entry — use native TextField (see Text Input) instead.',
      alternatives: [
        { name: 'Text Input', useWhen: 'For freeform text entry rather than a fixed option list.' },
        { name: 'Hermes Radio', useWhen: 'When every option should stay visible as its own row.' },
        { name: 'Segmented Control', useWhen: 'For a primary view/filter switch rather than a form field.' },
      ],
      adoptionStatus: { state: 'foundation-available', detail: 'Component exists (HermesDropdown.swift) with no production call site yet.' },
      useSummary: 'New production primitive; no screen has adopted it yet in this slice.',
      implementationNotes: {
        status: 'Component exists (HermesDropdown.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesDropdown.swift'],
        notes: [
          'Deliberately thin: a generic wrapper around `Picker(title, selection:).pickerStyle(.menu)`, matching SettingsView.swift\'s existing row-picker convention exactly rather than inventing a second, competing dropdown interaction.',
        ],
      },
    },
  },
  {
    id: 'Hermes Toast',
    displayName: 'Toast',
    whenToUse: 'Use a transient Toast for a one-off confirmation or brief status whose visibility the caller owns — clear it yourself, since there is no auto-dismiss; use Banner instead when the condition remains relevant until resolved (e.g. offline).',
    description:
      'A transient status notice — a semantic tint/icon, a message, and an optional action — presented via the `hermesToast(isPresented:toast:)` view modifier. Lifecycle stays entirely caller-owned: no internal timer or auto-dismiss.',
    props: [
      { name: 'semantic', type: '.information | .success | .warning | .error', required: true, desc: 'Drives the tint and default icon.' },
      { name: 'message', type: 'Text', required: true, desc: 'The toast\'s message.' },
      { name: 'icon', type: 'String?', desc: 'Overrides the semantic\'s default SF Symbol.' },
      { name: 'isIconDecorative', type: 'Bool', default: 'true', desc: 'Hides the icon from VoiceOver when the message text already announces the same fact.' },
      { name: 'action', type: '{ title: String; handler: () -> Void }?', desc: 'Optional trailing action button.' },
    ],
    a11y: 'Icon, message, and action combine into one accessible element when there is no action; an action present keeps the group\'s children independently focusable (accessibilityElement(children: .contain)).',
    render: () => <ToastFamilyGallery />,
    hermesReference: {
      useWhen: 'Use a Toast for a one-off confirmation or brief status whose visibility the caller owns — bind isPresented and clear it yourself; there is no auto-dismiss.',
      avoidWhen: 'Avoid it when the condition remains relevant until resolved — use Banner instead.',
      alternatives: [
        { name: 'Hermes Banner', useWhen: 'When the condition remains relevant until resolved, rather than a one-off confirmation.' },
      ],
      adoptionStatus: { state: 'foundation-available', detail: 'Component exists (HermesToast.swift) with no production call site yet.' },
      useSummary: 'New production primitive; no screen has adopted it yet in this slice. Distinct from Workspace/Git\'s own GitActionToastOverlay, a separate progress/success state machine that predates this generic primitive.',
      implementationNotes: {
        status: 'Component exists (HermesToast.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesToast.swift'],
        notes: [
          'Presentation (`hermesToast(isPresented:toast:)`) mirrors GitActionToastOverlay\'s established top-anchored, Reduce-Motion-safe transition, so a new caller gets the same feel without hand-rolling it again: it enters by moving down from the top edge combined with opacity (HermesMotion.Bundle.overlayEnter) and exits back toward the top combined with opacity (HermesMotion.Bundle.overlayExit). Reduce Motion drops the directional move and falls back to an opacity-only state change. Visibility itself stays entirely caller-owned — no internal timer.',
        ],
      },
    },
  },
  {
    id: 'Hermes Tooltip',
    displayName: 'Tooltip',
    description:
      'Anchored explanatory content behind an explicit tap trigger, presented through the native `.popover` path — the same one ContextWindowIndicatorView and GitBranchPickerView already use. Never a hover-only affordance.',
    whenToUse: 'Use it for a short explanatory aside anchored to a specific control. For a persistent, always-visible detail, use Card or Disclosure Row instead.',
    props: [
      { name: 'trigger', type: '() -> some View', desc: 'The tappable trigger content; `.info(...)` supplies the common "info" glyph trigger.' },
      { name: 'content', type: '() -> some View', desc: 'The popover\'s explanatory content; Dynamic Type-safe (fixedSize(vertical:)), never truncated.' },
      { name: 'accessibilityLabel', type: 'String', default: '"More information"', desc: 'The trigger\'s accessibility label.' },
    ],
    a11y: 'Dismissal is the popover\'s own native recovery path: tap outside, or Escape on a hardware keyboard — never a release-driven gesture.',
    render: () => <TooltipFamilyGallery />,
    hermesReference: {
      useWhen: 'Use it for a short explanatory aside anchored to a specific control.',
      avoidWhen: 'Avoid it for a persistent, always-visible detail — use Card or Disclosure Row instead.',
      alternatives: [
        { name: 'Card', useWhen: 'For persistent, always-visible detail rather than a tap-triggered aside.' },
        { name: 'Disclosure Row', useWhen: 'For one collapsed line that expands into longer detail.' },
      ],
      adoptionStatus: { state: 'foundation-available', detail: 'Component exists (HermesTooltip.swift) with no production call site yet.' },
      useSummary: 'New production primitive; no screen has adopted it yet in this slice.',
      implementationNotes: {
        status: 'Component exists (HermesTooltip.swift) with no production call site yet.',
        sourcePaths: ['HermesMobile/Features/Shared/HermesTooltip.swift'],
        notes: [
          'Reuses the exact `.popover(isPresented:) { … }.presentationCompactAdaptation(.none)` pattern ContextWindowIndicatorView and GitBranchPickerView already established, rather than inventing a second anchored-presentation convention.',
        ],
      },
    },
  },
  {
    id: 'Hermes TopNav',
    displayName: 'TopNav',
    description:
      'A Hermex design-system pattern implemented through native iOS/SwiftUI navigation and toolbar primitives, providing up to two fixed-width action slots on each side (leadingPrimary/leadingSecondary, trailingPrimary/trailingSecondary) around a centered title or custom center content.',
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
      useWhen: 'Reach for TopNav when a screen needs custom leading/trailing actions beyond a plain native navigation title — a modal/editor\'s Cancel/Save, or more than one trailing action.',
      avoidWhen: 'Avoid composing it for a simple screen with no custom leading/trailing actions — keep a plain native navigation title instead.',
      alternatives: [
        { name: 'Native navigation title', useWhen: 'For a simple screen with no custom leading/trailing actions.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only design-system contract (`HermesMobile/Features/Shared/TopNav.swift`); production screens keep their own existing, independent `ToolbarItem`/`.navigationTitle` placements in this branch, not this shared `TopNav: ToolbarContent`. Bottom/keyboard toolbars are a separate, out-of-scope concern.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Features/Shared/TopNav.swift', 'native/components/TopNav/TopNav.tsx'],
        notes: [
          'No production file imports or composes the new TopNav.swift in this branch; every screen\'s leading/trailing/principal toolbar placement is still written directly at its own call site.',
          'A screen with no custom leading/trailing actions (most simple list/detail screens) can keep a plain native navigation title and would never need to compose this component at all.',
          'The retained Kanban `.bottomBar` item and any keyboard accessory toolbar remain separate production concerns with their own anatomy; TopNav documents only the top bar.',
        ],
      },
    },
  },
  {
    id: 'Skeleton Loading',
    description:
      'A new, foundation-only static, motion-free Skeleton family — explicit text-line, block, circle, and rounded-rectangle shapes, plus `.skeletonPlaceholder()` for when a final view already owns the correct geometry. Production\'s existing loading placeholders (Sessions, Insights, Chat) keep their own independent implementation in this branch, never continuous animated shimmer either way.',
    whenToUse: 'Reach for these static shapes when a loading state should preserve the layout of the content that will replace it (rows, cards, avatars); never introduce continuous animated shimmer into production. For an indeterminate fetch with no known content geometry, reach for Content Unavailable\'s `.loading` variant or a native ProgressView spinner instead.',
    a11y: 'Each shape carries a "Loading" accessibility label; a grouped composition wraps several shapes so they announce once, together, instead of once per shape.',
    render: () => <HermesSkeletonGallery />,
    hermesReference: {
      useWhen: 'Reach for these static shapes when a loading state should preserve the layout of the content that will replace it (rows, cards, avatars).',
      avoidWhen: 'Never introduce continuous animated shimmer into production — use these static shapes instead.',
      alternatives: [
        { name: 'Content Unavailable', useWhen: 'For an indeterminate fetch with no known content geometry — its `.loading` variant is a spinner (backed by native ProgressView), not shape placeholders.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only static Skeleton family; Sessions\', Insights\', and Chat\'s existing content-shaped loading placeholders keep their own independent implementation in this branch, not SkeletonPlaceholder.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/SkeletonPlaceholder.swift',
        ],
        notes: [
          'SessionListComponents.swift, ProviderLimitsCard.swift, and ChatTranscriptSupportingViews.swift each keep their own existing loading-placeholder view in this branch; none imports SkeletonPlaceholder.swift.',
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
      { name: 'hapticFeedbackStyle', type: 'HapticButtonFeedbackStyle?', default: 'nil', desc: 'Opt-in tap feedback for callers preserving an existing haptic contract; nil keeps the row on a plain native Button.' },
      { name: 'HermesList default vertical content margin', type: 'CGFloat', default: 'HermesSpacing.s12 (12)', desc: 'Applied once on the shared container via .contentMargins(.vertical, _, for: .scrollContent) — native List selection, refresh, row insets, separators, swipe/context menus, and keyboard/accessibility behavior are otherwise untouched.' },
    ],
    a11y: 'A pressable ListItem exposes one combined accessibilityLabel (title + description, overridable) and accessibilityRole="button"; a disabled or loading row is never pressable. A loading row announces "Loading" once via SkeletonGroup instead of once per Shimmer block. Layout adapts to Dynamic Type via ordinary text flow rather than fixed heights.',
    render: () => <ListItemFamilyGallery />,
    hermesReference: {
      useWhen: 'Reach for ListItem for any row anatomy, including a picker row — there is no separate Picker Row component to reach for instead.',
      avoidWhen: 'Avoid it for a standalone, self-contained unit sitting beside differently-shaped content — that is a Card; avoid it for a repeating expandable group — that is Accordion List.',
      alternatives: [
        { name: 'Hermes Card', useWhen: 'For one self-contained surface rather than a homogeneous set of peer rows.' },
        { name: 'Accordion List', useWhen: 'When rows repeat as expandable header/body groups.' },
        { name: 'Native List row (production)', useWhen: 'For any current screen — SessionInteractiveRow, BotInboxRow, and the picker sheets keep their own rows today.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'New, foundation-only components; the four picker sheets, SessionListItem/SessionInteractiveRow, BotInboxRow, and SessionListView\'s main-menu container each keep their own existing, independent row implementation in this branch, not ListItem or HermesList.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/ListItem.swift',
          'HermesMobile/Features/Shared/HermesList.swift',
          'HermesMobile/Features/SessionList/SessionListItem.swift',
        ],
        notes: [
          'ModelPickerSheet.swift, DefaultProfilePickerView.swift, CronJobSkillsPicker.swift, and CronJobConfigurationPickers.swift each still construct their own picker row directly; none imports ListItem.swift in this branch — a future consolidation onto ListItem\'s selected/pending/trailing-checkmark configuration is documented here as a foundation capability, not a completed migration.',
          'SessionListItem.swift is itself new in this branch, with no production caller: SessionListComponents.swift\'s SessionInteractiveRow and Bots\' BotInboxRow both keep their own pre-existing row anatomy, unchanged.',
          'SessionListView.swift\'s main-menu container does not compose HermesList in this branch; it keeps its own existing native SwiftUI List container.',
          'ListItem exposes an explicit, opt-in hapticFeedbackStyle so a future caller can preserve an existing tap-haptic contract instead of silently losing it to the plain Button ListItem otherwise wraps its action in — documented here as an available foundation capability, with no caller yet since ListItem itself has none.',
          'HermesList applies a default 12pt vertical scroll-content margin (.contentMargins(.vertical, HermesSpacing.s12, for: .scrollContent)) reusing the existing HermesSpacing.s12 value — a foundation capability, not yet applied to any production List.',
        ],
      },
    },
  },
  {
    id: 'Accordion List',
    description:
      'A collection-level expandable ListItem composition with explicit card or cardless appearance, single or multiple expansion, caller-controlled or local state, header-aligned body rows, and four explicit separator strategies.',
    whenToUse:
      'Use it when repeated ListItem groups need expandable bodies, such as a future project-to-sessions hierarchy. Use Disclosure Row for one compact status line that reveals long detail content, and List / ListItem for non-expandable rows.',
    props: [
      { name: 'appearance', type: 'card | cardless', required: true, desc: 'Required visual surface choice; there is no default. card composes the shared Card component (outlined surface) for exactly 16pt horizontal content padding; cardless adds no Accordion-level horizontal outer padding of its own.' },
      { name: 'separatorStyle', type: 'none | betweenRows | topAndBottom | all', required: true, desc: 'Required separator policy; topAndBottom surrounds the whole group and draws no internal lines. The divider directly under an open header always spans the full available Accordion content width; a divider between two body rows begins at those rows\' own text-content column instead.' },
      { name: 'expansion', type: 'single | multiple; controlled or local', required: true, desc: 'Single permits zero or one open item, collapsing the previously open item when a new one opens; multiple permits any number.' },
      { name: 'header', type: 'ListItem', required: true, desc: 'Whole-row expansion button using label typography and a decorative chevron rendered at the 20pt (medium) icon-size step, one step up from ListItem\'s own 16pt default indicator size.' },
      { name: 'bodyItems', type: 'ListItem[]', required: true, desc: 'Caller-owned body rows aligned to the header title column and rendered in the parent scroll container. Expand/collapse visibly animates (respecting Reduce Motion) instead of an instant mount/unmount.' },
    ],
    a11y:
      'Each header is one button exposing expanded/collapsed state. The chevron is decorative, collapsed body rows leave the focus order, body actions stay independent, and Reduce Motion removes spatial transitions.',
    render: () => <AccordionListFamilyGallery />,
    hermesReference: {
      useWhen: 'Use it when repeated ListItem groups need expandable bodies, such as a future project-to-sessions hierarchy.',
      avoidWhen: 'Avoid it for one compact status line that reveals long detail — use Disclosure Row; avoid it for simple non-expandable rows — use plain List/ListItem.',
      alternatives: [
        { name: 'Disclosure Row', useWhen: 'For one compact status line that reveals long detail content.' },
        { name: 'List / ListItem', useWhen: 'For non-expandable rows.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'Available as a reusable Design System component; no production Sessions surface has adopted it yet.',
      usedIn: [],
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/AccordionList.swift',
          'HermesMobile/Features/Shared/ListItem.swift',
          'HermesMobileTests/AccordionListTests.swift',
        ],
        notes: [
          'The component is intentionally data-agnostic and contains no ProjectSummary, SessionSummary, persistence, pagination, or Sessions-list behavior — available in this branch\'s foundation layer, with no production call site.',
          'A future Sessions redesign may compose this component in a separate issue and branch.',
          'Card appearance: exactly 16pt horizontal content padding, from the existing card/spacing token (HermesCardMetrics.contentPadding in Swift; Card\'s own DS_SPACING[800] default in the catalog). The Swift card still composes .hermesCardSurface(.outlined, cornerRadius: HermesRadius.card); the catalog card now composes the shared Card component (surface="outlined") directly, rather than a hand-reconstructed border/background, with Card\'s own default vertical padding zeroed since ListItem rows already own their vertical rhythm.',
          'Cardless appearance: no Accordion-level horizontal outer padding is added on either platform; ListItem\'s own internal row insets are unchanged.',
          'Chevron: the header indicator renders at the next icon-size step up — HermesIconSize.medium / DS_ICON_SIZE.md (20pt) — not ListItem\'s existing 16pt default. Swift ListItem gained a configurable rowIndicatorSize seam (default HermesIconSize.small, preserving every other existing caller) so only the accordion header opts into 20pt.',
          'Dividers: the divider directly under an open header always spans the full available Accordion content width on both platforms. A divider between two body rows instead begins at those rows\' own text-content column — the existing avatar width + header/body gap + ListItem\'s own horizontal inset — rather than the row\'s outer frame.',
          'Motion: expand/collapse reuses the existing HermesMotion.Bundle.contentReposition animation and Reduce Motion behavior in Swift. The catalog now visibly animates a section\'s body height/opacity with the existing DS_MOTION_DURATION.base/DS_MOTION_EASING.standard tokens (no new motion token), matching the header chevron\'s own Reduce Motion handling; a collapsed section\'s body stays hidden from the accessibility tree even though it stays mounted for the animation.',
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
      useWhen: 'Use it for one line of collapsed status that can expand into longer detail.',
      avoidWhen: 'Avoid it for a persistent, always-visible detail — use Card instead.',
      alternatives: [
        { name: 'Card', useWhen: 'For a persistent, always-visible detail rather than collapsed status that expands.' },
        { name: 'Accordion List', useWhen: 'When the expandable row repeats across a list rather than standing alone.' },
        { name: 'TranscriptLogRowView (production)', useWhen: 'For any current transcript or bot activity row — the adopted anatomy today.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'DisclosureRow.swift is new in this branch, with no production call site. The real shared row anatomy production uses today for a tool call\'s log line, the "Thinking" reasoning block, and a bot activity/plan row is the pre-existing TranscriptLogRowView, documented here as the closest production analog.',
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'A tool call\'s log line and the "Thinking" reasoning block both expand into a detail body, via the existing TranscriptLogRowView.' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'A bot\'s activity/plan row (BotPlanRowView) composes the same existing TranscriptLogRowView.' },
      ],
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Chat/DisclosureRow.swift',
          'HermesMobile/Features/Chat/TranscriptLogRowView.swift',
        ],
        notes: [
          'DisclosureRow.swift is a new reconstruction of TranscriptLogRowView\'s anatomy in this branch\'s foundation layer; ToolCallLogRowView.swift, ReasoningBlockView.swift, and BotActivityViews.swift all still compose the pre-existing TranscriptLogRowView directly and do not import DisclosureRow.swift.',
          'The geometry facts alone were already catalogued under Hermex Radius & Geometry, sourced from the real, adopted TranscriptLogRowMetrics in TranscriptLogRowView.swift; DisclosureRowMetrics in this branch\'s new DisclosureRow.swift duplicates the same three values.',
        ],
      },
    },
  },
  {
    id: 'Content Unavailable',
    description:
      "A new, foundation-only reusable pattern — Loading, Empty, No results, Error, Unavailable, and Custom variants — intended to eventually replace direct production ContentUnavailableView use. It composes Hermex icon treatment, typography, spacing, and Buttons, with an optional description plus primary and secondary actions. Icon-bearing variants compose Avatar for their identity glyph; the Loading variant renders a plain spinner with an optional description, no icon or title.",
    whenToUse: 'Use it when a screen is loading, has no content, has no search results, cannot load its content, or needs a custom empty/error state with an action.',
    props: [
      { name: 'variant', type: "'loading' | 'empty' | 'noResults' | 'error' | 'unavailable' | 'custom'", required: true, desc: 'Selects the icon/title pairing; loading renders a plain spinner instead of an icon/title.' },
      { name: 'description', type: 'String?', desc: 'Optional secondary line under the title.' },
      { name: 'primaryAction / secondaryAction', type: '{ label: String; onPress: () -> Void }?', desc: 'One action keeps its established secondary emphasis unchanged; both together stack vertically, primary first, with the primary action promoted to the primary hierarchy.' },
      { name: 'layout', type: "'.intrinsic' | '.fullScreen'", default: '.intrinsic', desc: 'Additive placement choice. .intrinsic (default, unchanged) lets ContentUnavailableView center its own content. .fullScreen instead positions the top of the content cluster at roughly one third of the available container height, wrapped in a ScrollView so long content/Dynamic Type can grow rather than clip.' },
    ],
    a11y: 'Icon, title, and description combine into one accessible element; a primary/secondary action is a normal focusable Button, not part of that combined element. The .fullScreen layout changes only placement, not this accessibility grouping.',
    variants: {
      items: [
        { key: 'loading', name: 'Loading', node: <ContentUnavailablePreview variant="loading" /> },
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
        { key: 'full-screen', name: 'Full-screen placement', node: <ContentUnavailableFullScreenPreview /> },
      ],
    },
    hermesReference: {
      useWhen: 'Use it when a screen is loading, has no content, has no search results, cannot load, or needs a custom empty/error state with an action — the .loading variant is a plain spinner with description.',
      avoidWhen: 'Avoid it for a partial or inline empty section inside otherwise populated content (use body text or a Banner), and for a transient failure while content remains visible (use Toast or Banner).',
      alternatives: [
        { name: 'Native ContentUnavailableView', useWhen: 'For any current production empty/error/no-results state — this is what every screen actually calls today.' },
      ],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only pattern; every production screen — including Settings\' pickers, Kanban\'s status/filter empty branch, and Usage\'s loading/error/empty states — keeps calling the native SwiftUI ContentUnavailableView directly in this branch, not HermesContentUnavailable.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Shared/HermesContentUnavailable.swift',
        ],
        notes: [
          'The platform ContentUnavailableView is used directly across 30 production files (68 source references) in the current working tree, including ModelPickerSheet.swift, DefaultProfilePickerView.swift, CronJobSkillsPicker.swift, CronJobConfigurationPickers.swift, KanbanLabView.swift, InsightsView.swift, TasksView.swift, SkillsView.swift, and MemoryView.swift — none imports HermesContentUnavailable.swift. scripts/hermex_design_system_adoption_audit.py freezes this file/reference-count baseline so a future migration is a deliberate, reviewed change, not silent drift.',
          'HermesAvatar (also new, unadopted) is composed by HermesContentUnavailable\'s own icon-bearing variants for their identity glyph — an internal foundation-layer composition, not a claim about any production picker sheet\'s current icon treatment.',
          'The additive layout prop (.intrinsic default / .fullScreen) is also new and unadopted in this branch — no production screen passes layout: .fullScreen yet. .fullScreen reads the container height via GeometryReader and positions the content cluster at roughly one third of it, wrapped in a ScrollView for Dynamic Type/long-content robustness, instead of ContentUnavailableView\'s own centering.',
        ],
      },
    },
  },
  {
    id: 'Pending Request',
    description:
      'Shared Request Card, block, field, and choice surfaces for questions and approvals that need a response from the user. The pattern composes Request Card, Disclosure/command blocks, fields, choices, and Buttons; approval, denial, clarification, pending, disabled, success, failure, cancellation, and recovery remain domain-owned states.',
    props: [
      { name: 'pendingRequestCardSurface(cornerRadius:)', type: '(CGFloat) -> some View', desc: 'Defined in PendingRequestSurfaces.swift, not HermesCard.swift — a separate, pre-existing function, unconditionally secondarySystemBackground + stroke, deliberately opaque so it always renders above live transcript text. cornerRadius is caller-supplied — 24pt (ChatComposerMetrics.cardCornerRadius) for the Sessions clarification card, a Bot-card-specific value for the Bot card.' },
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
      useWhen: 'Use these shared surfaces (Request Card, block, field, choice) for any new approval/clarification/response surface that needs to read clearly over live transcript text.',
      avoidWhen: 'Avoid these surfaces for content that needs no user response — an informational card is a Section/Settings card. ApprovalRequestOverlay keeps its own separate surface and is not covered here.',
      alternatives: [
        { name: 'Hermes Card', useWhen: 'For a general-purpose surface that does not need to stay unconditionally opaque over live transcript content.' },
      ],
      adoptionStatus: PRODUCTION_ADOPTED_ADOPTION,
      usedIn: [
        { screen: 'Sessions', path: 'Sessions → open a conversation', effect: 'Clarification requests appear above the composer, using pendingRequestCardSurface(cornerRadius:).' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'Pending requests appear inline with the transcript, and the bot room composer\'s pending card shares the same pendingRequestCardSurface(cornerRadius:).' },
      ],
      implementationNotes: {
        status: ADOPTED_STATUS,
        sourcePaths: [
          'HermesMobile/Features/Chat/PendingRequestSurfaces.swift',
          'HermesMobile/Features/Chat/ClarificationRequestCard.swift',
          'HermesMobile/Features/Bots/BotPendingRequestCard.swift',
          'HermesMobile/Features/Bots/BotRoomComposerView.swift',
        ],
        notes: [
          'Decision controls belong to production\'s pre-existing .chatDecision(_:) ButtonStyle, not the new, unadopted Buttons family documented in this catalog: PendingRequestSubmitButton uses .chatTactile(.icon), and the Yes/No/Approve/Deny choices use .chatDecision(.primary/.secondary/.destructive) — see Buttons for that new (foundation-only) family\'s own accurate status.',
          'ApprovalRequestOverlay.swift does not call pendingRequestCardSurface(cornerRadius:) — its own card surface is implemented separately and is not documented here.',
        ],
      },
    },
  },
  {
    id: 'Transcript Activity',
    description:
      'A product pattern for the transcript\'s collapsible activity anatomy — a Turn Summary Disclosure, the Activity Disclosure Row, a grouped-tool-history control, assistant message content, and message metadata — preserving each piece\'s own domain ownership.',
    whenToUse: 'Read it before changing how a transcript turn\'s collapsible pieces relate — a turn\'s summary, tool-call rows, reasoning block, and grouped history; implement any individual row with the pre-existing TranscriptLogRowView (see Disclosure Row for that component\'s own accurate status).',
    a11y: 'Each composed piece keeps its own accessibility behavior — see Disclosure Row for expand/collapse semantics and Buttons for the grouped-history control\'s press feedback.',
    render: () => <TranscriptActivityPreview />,
    hermesReference: {
      useWhen: 'Read it before changing how a turn\'s summary, tool-call rows, reasoning block, and grouped history nest; implement any individual row with TranscriptLogRowView.',
      avoidWhen: 'Avoid treating this pattern as its own component to adopt — the real owning component for the row anatomy today is the pre-existing TranscriptLogRowView (see Disclosure Row for that component\'s own accurate status).',
      alternatives: [
        { name: 'Disclosure Row', useWhen: 'When you need one collapsible row rather than the whole turn composition.' },
      ],
      adoptionStatus: {
        state: 'partially-adopted',
        detail: 'TranscriptLogRowView.swift (pre-existing) is the adopted Activity Disclosure Row; DisclosureRow.swift is a new, unadopted foundation reconstruction of its anatomy — see Disclosure Row.',
      },
      useSummary: 'TranscriptLogRowView (pre-existing) is the real, adopted Activity Disclosure Row; the new DisclosureRow.swift foundation candidate has no production call site yet. Turn Summary stays a separate component because its semantics, height, and expansion contract differ.',
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'A turn\'s summary disclosure, tool-call log lines, and the "Thinking" reasoning block compose this pattern, using the existing TranscriptLogRowView.' },
        { screen: 'Bots', path: 'Bots → open a bot conversation', effect: 'A bot\'s grouped tool-activity history composes the same existing TranscriptLogRowView anatomy.' },
      ],
      implementationNotes: {
        status: 'TranscriptLogRowView.swift (pre-existing) is the adopted Activity Disclosure Row; DisclosureRow.swift is a new, unadopted foundation reconstruction of its anatomy — see Disclosure Row.',
        sourcePaths: [
          'HermesMobile/Features/Chat/TranscriptLogRowView.swift',
          'HermesMobile/Features/Chat/DisclosureRow.swift',
          'HermesMobile/Features/Chat/TranscriptTurnFolding.swift',
          'HermesMobile/Features/Chat/ToolActivityGroupView.swift',
          'HermesMobile/Features/Chat/ReasoningBlockView.swift',
        ],
        notes: [
          'Domain ownership boundary preserved from the approved specification: this pattern documents composition only — turn-folding logic, message content rendering, and metadata stay owned by their existing production types, not absorbed into a generic view.',
          'The group-history control\'s composition through the new (unadopted) Buttons family is a foundation-only proposal, not a description of ToolActivityGroupView.swift\'s current implementation.',
        ],
      },
    },
  },
  {
    id: 'Composer',
    description:
      'A product pattern, not a Card variant, describing the target composition of the composer surface, an input field, Buttons, Tag, Inline Reference Link, Attachment, Adaptive Glass, and status/validation feedback — Buttons, Tag, Inline Reference Link, and Attachment are new, foundation-only families with no production call site yet (see each entry\'s own status); the composer\'s existing production implementation keeps its own independent pieces.',
    whenToUse: 'Use it to understand the target composition of the composer\'s pieces; text editing, keyboard interaction, draft persistence, attachments, runtime selection, voice input, and send/stop lifecycle stay owned by the Composer pattern, not by any one family it composes.',
    a11y: 'Each composed family keeps its own accessibility behavior; the composer surface itself adds no additional grouping beyond that.',
    render: () => <ComposerPatternPreview />,
    hermesReference: {
      useWhen: 'Use it to understand the target composition of the composer\'s pieces — text editing, keyboard interaction, draft persistence, attachments, and send/stop lifecycle stay owned by the Composer pattern, not by any one family it composes.',
      avoidWhen: 'Avoid this pattern for an ordinary field outside the chat composer — that belongs to Text Input, not a Composer-pattern concern.',
      alternatives: [
        { name: 'Text Input', useWhen: 'For an ordinary single- or multi-line field outside the chat composer — TextField/TextEditor, not this pattern.' },
      ],
      adoptionStatus: {
        state: 'reference-only',
        detail: 'Target architecture only — the composer\'s existing production pieces keep their own current, independent implementation; production migration onto the new foundation components is not part of this branch.',
      },
      useSummary: 'Target architecture only: the composer\'s existing production action button, selector buttons, status pills, and attachment strip each keep their own current, independent implementation in this branch — none has migrated onto Buttons, Tag, or Attachment.',
      usedIn: [
        { screen: 'Conversation', path: 'Sessions → open a conversation', effect: 'The composer surface hosts text input, attachments, inline references, and the send/stop action, using its own existing implementation.' },
      ],
      implementationNotes: {
        status: 'Target architecture: this pattern documents a proposed composition against the composer\'s pre-existing production files; production migration onto the new foundation components is not part of this branch.',
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
    displayName: 'Colors',
    description:
      'Semantic colors describe purpose rather than a fixed hex value, so surfaces, text, borders, actions, and status feedback adapt correctly. Product palettes provide the selectable header and project accents.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesColorsGallery />,
    hermesReference: {
      useWhen: 'For surfaces, text, borders, and status colors, use the Apple system Color each catalog role binds to (Color(.label), Color(.secondarySystemBackground), …). Use a HermesColorRamp 500 step for a brand or accent tint, and HermesProductPalette for a header-accent or project-color picker.',
      avoidWhen: 'Avoid consuming a non-500 ramp step in any UI pairing until that pairing has passed contrast validation in light, dark, and Increased Contrast (spec §4.1). Avoid inventing a Hermex semantic-color type — the roles are names for platform colors, not a Swift API.',
      alternatives: [],
      adoptionStatus: {
        state: 'partially-adopted',
        detail: 'AppTheme.swift\'s HeaderLogoColor: adopted, sourcing HermesProductPalette. The color ramp scale and ProjectCreationSheet\'s palette: foundation-only, no other production call site yet. The semantic color roles are documentation-only bindings to platform colors, not a foundation Swift API — there is no Hermex semantic-color type to adopt.',
      },
      useSummary: 'Narrow, real adoption: AppTheme.swift\'s HeaderLogoColor sources its six header-accent hex values from the new HermesProductPalette token instead of literal hex strings. The color ramp scale and ProjectCreationSheet\'s project palette remain foundation-only, with no other production call site yet. The semantic color roles are documentation-only bindings to platform colors, not a Swift API awaiting adoption.',
      usedIn: [
        { screen: 'Appearance', path: 'Settings → Appearance', effect: 'Choose the header accent and preview its foreground contrast — HeaderLogoColor\'s six presets now read from HermesProductPalette.' },
      ],
      implementationNotes: {
        status: 'AppTheme.swift\'s HeaderLogoColor: adopted, sourcing HermesProductPalette. The color ramp scale and ProjectCreationSheet\'s palette: foundation-only, no other production call site yet. The semantic color roles are documentation-only bindings to platform colors, not a foundation Swift API — there is no Hermex semantic-color type to adopt.',
        sourcePaths: ['HermesMobile/Config/AppTheme.swift', 'HermesMobile/Config/HermesColor.swift'],
        notes: [
          'HeaderLogoColor\'s 6 presets derive their hex values from HermesProductPalette, pinned by HermesColorTests/HermesProductPaletteTests — the one verified production caller of anything in HermesColor.swift.',
          'ProjectCreationSheet.swift\'s 8 project accent presets keep their own existing literal hex values in this branch; they do not import HermesColorRamp or HermesProductPalette.',
          'Status/state colors (e.g. offline banners, selection pills) use Apple\'s own SwiftUI semantic colors directly — Hermex defines no separate status color layer.',
        ],
      },
    },
  },
  {
    id: 'Hermex Motion',
    displayName: 'Motion',
    description:
      'Eight named motion patterns pair intent with duration and easing. Reduce Motion shortens or removes movement while preserving the state change.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesMotionReference />,
    hermesReference: {
      useWhen: 'Reach for a named motion pattern (duration + easing) when a new interaction needs a Reduce-Motion-safe, consistent feel.',
      avoidWhen: 'Avoid inlining a duration/easing literal or a one-off spring in a new interaction — pick a named Bundle (feedbackPress, stateChange, contentEnter, contentExit, overlayEnter, overlayExit, contentReposition, scrollFollow) so Reduce Motion behaves consistently.',
      alternatives: [],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only duration/easing scale; production\'s existing ChatMotion and bot-face motion timings keep their own independent literals in this branch, not HermesMotion.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesMotion.swift'],
        notes: [
          'ChatMotion.swift, SessionListComponents.swift, and BotFaceMotion.swift do not reference HermesMotion in this branch; each keeps its own duration/easing literals. A future normalization onto this six-step scale is documented here as a foundation capability, not a completed migration.',
        ],
      },
    },
  },
  {
    id: 'Hermex Radius & Geometry',
    displayName: 'Radius & Geometry',
    description:
      'A seven-step radius scale and semantic aliases shape controls, fields, cards, prominent surfaces, and app chrome. Feature-specific dimensions stay named when they are not reusable radius tokens.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesGeometryGallery />,
    hermesReference: {
      useWhen: 'Reach for the seven-step radius scale and its semantic aliases when a new control, field, card, or chrome surface needs a corner radius.',
      avoidWhen: 'Avoid it for a fully rounded edge — use Capsule() directly. Avoid mapping feature-scoped geometry (ChatComposerMetrics, TranscriptLogRowMetrics, AdaptiveReadableContentWidth) onto a step; those stay named.',
      alternatives: [],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only radius scale (HermesRadius.swift); production\'s composer cards, autocomplete panels, and picker rows keep their own existing corner-radius literals in this branch. The GEOMETRY_FACTS table below documents real, verified numeric facts from their actual (pre-existing or new) source files — a fact table, not an adoption claim for the radius scale itself.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: [
          'HermesMobile/Config/HermesRadius.swift',
        ],
        notes: [
          'ChatComposerPresentation.swift and AdaptiveGlassModifier.swift (both pre-existing) do not reference HermesRadius in this branch; ListItem.swift and DisclosureRow.swift (both new) do — but neither has a production call site yet (see their own entries).',
          'TranscriptLogRowMetrics (the real, adopted source) and AdaptiveReadableContentWidth remain named, feature-scoped exceptions, not migrated into the numeric scale.',
        ],
      },
    },
  },
  {
    id: 'Hermex Spacing',
    displayName: 'Spacing',
    description:
      'A 12-step spacing scale controls gaps and padding throughout Hermex, from compact icon spacing to large section separation.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesSpacingGallery />,
    hermesReference: {
      useWhen: 'Reach for the 12-step spacing scale for gaps and padding in any new layout, choosing the step by relationship and hierarchy: s2/s4 for micro/inline spacing (hairline-adjacent gaps, tightest gap between closely related elements); s8 for the gap between related controls in a row or cluster; s12 for compact component padding; s16 for the default card/screen inset; s24 for the gap between major content groups; s32–s64 for section-to-section separation, increasing with how distinct the sections are.',
      avoidWhen: 'Avoid it for component-owned fixed geometry (chart heights, tile widths, icon panels) — those belong to HermesUsageSize or HermesAttachmentSize, not the spacing scale; avoid silently rounding an off-scale value — add a named exception.',
      alternatives: [],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only spacing scale; no production screen reads from HermesSpacing yet in this branch — every existing screen keeps its own current spacing literals.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesSpacing.swift'],
      },
    },
  },
  {
    id: 'Hermex Shadow',
    displayName: 'Shadow',
    description:
      'Eight elevation roles distinguish resting and pressed controls, popovers, composer chrome, and overlays. Some roles adjust their opacity between light and dark appearance.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesShadowGallery />,
    hermesReference: {
      useWhen: 'Reach for a named elevation role for a new resting/pressed control, popover, composer chrome, or overlay surface.',
      avoidWhen: 'Avoid inlining a radius/opacity/offset literal; if none of the eight roles fits, add a named role. Avoid any shadow on an Outlined Card, which is documented as no-elevation.',
      alternatives: [],
      adoptionStatus: FOUNDATION_AVAILABLE_ADOPTION,
      useSummary: 'A new, foundation-only elevation-role scale; production\'s composer chrome, overlays, popovers, and App Icon previews keep their own existing shadow literals in this branch, not HermesShadow.',
      implementationNotes: {
        status: FOUNDATION_ONLY_STATUS,
        sourcePaths: ['HermesMobile/Config/HermesShadow.swift'],
        notes: [
          'controlElevatedResting/Pressed and chrome resolve their opacity per light/dark appearance; the other five roles fix one opacity literal for both — a fact about this new token\'s own design, not a claim about any production call site.',
        ],
      },
    },
  },
  {
    id: 'Hermex Iconography',
    displayName: 'Iconography',
    description:
      'Hermex uses SF Symbols for navigation, actions, status, and content cues. Browse the visual inventory by symbol name; implementation traces remain secondary.',
    tokenGallery: true,
    fullWidthLabel: 'Tokens',
    render: () => <HermesIconReference />,
    hermesReference: {
      useWhen: 'Reach for SF Symbols for any navigation/action/status/content glyph; reach for the named HermesIconSize scale and its Typography/Avatar pairing sets when sizing a new icon consistently.',
      avoidWhen: 'Avoid a literal point size on a new SF Symbol — pick a HermesIconSize step through its Typography or Avatar pairing set. Avoid a custom image asset where an SF Symbol exists.',
      alternatives: [],
      adoptionStatus: {
        state: 'partially-adopted',
        detail: 'SF Symbol usage itself: adopted, pre-existing, and unrelated to this branch. HermesIconSize (the named size scale): foundation-only, no production caller yet.',
      },
      useSummary: 'SF Symbols themselves (a native platform feature, not a Hermex addition) genuinely appear throughout every main section. HermesIconSize — the new named five-step size scale documented below — is foundation-only, with no production call site yet.',
      usedIn: [
        { screen: 'Sessions and Chat', effect: 'Navigation, message actions, composer controls, and transcript status use SF Symbols, each screen choosing its own point size.' },
        { screen: 'Bots and Tasks', effect: 'Bot artifacts, pending requests, task status, and configuration actions use SF Symbols, each screen choosing its own point size.' },
        { screen: 'Settings and Workspace', effect: 'Settings rows, server controls, files, and Git actions use SF Symbols, each screen choosing its own point size.' },
      ],
      implementationNotes: {
        status: 'SF Symbol usage itself: adopted, pre-existing, and unrelated to this branch. HermesIconSize (the named size scale): foundation-only, no production caller yet.',
        sourcePaths: ['HermesMobile/Config/HermesSpacing.swift'],
        notes: [
          'The inventory is deduplicated by final SF Symbol name.',
          'Literal counts, computed expressions, source sites, and trace methods remain available from hermesIconInventory.generated.json and hermesIconComputedSiteTrace.generated.json.',
          'The browser cannot render SF Symbols faithfully without adding assets or a dependency, so tiles are explicitly unavailable instead of using substitute glyphs.',
          'A five-step default icon-size scale (HermesIconSize, HermesMobile/Config/HermesSpacing.swift) is defined in this branch\'s foundation layer alongside two semantic pairing sets — Typography pairing (which AppFont.Role text an icon size sits beside inline) and Avatar pairing (which Avatar diameter an icon size sits inside, at the approved pairing: 32pt avatar → 20pt icon, 40pt avatar → 24pt icon, 48pt avatar → 32pt icon) — but no production call site reads HermesIconSize yet; each existing SF Symbol call site still picks its own literal point size.',
        ],
      },
    },
  },
];

export const hermesNav: NavGroup<HermesSectionId>[] = [
  {
    label: 'Foundations',
    ids: ['Hermex Colors', 'Hermex Spacing', 'Hermex Typography', 'Hermex Font', 'Hermex Motion', 'Hermex Radius & Geometry', 'Hermex Shadow', 'Hermex Iconography'],
  },
  {
    label: 'Materials',
    ids: ['Adaptive Glass'],
  },
  {
    label: 'Native iOS',
    ids: ['Hermes TopNav'],
  },
  {
    label: 'Components',
    // Alphabetized in the sidebar and main column by each entry's own visible display name (see
    // `alphabetizeByLabel` on `NavGroup`) — this declared order is the Hermes-owned family grouping
    // only (see the nav-order test in hermes-catalog.test.mjs), not the rendered order. Search
    // joined this group once its `.hermesSearch` foundation wrapper shipped over native
    // `.searchable` — it moved out of Native iOS even though production hasn't adopted the wrapper
    // yet (see Search's own adoptionStatus for the truthful, zero-adoption detail). Text Input
    // joined the same way once its three HermesTextField/HermesSecureField/HermesNumberField
    // foundation wrappers shipped over native TextField/SecureField/TextField(value:format:) — see
    // Text Input's own adoptionStatus for the same truthful, zero-adoption detail.
    alphabetizeByLabel: true,
    ids: [
      'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Hermes Toast', 'Row Divider', 'Tag',
      'Inline Reference Link', 'Search', 'Text Input', 'Hermes Dropdown', 'Hermes Tooltip', 'Segmented Control',
      'Buttons', 'Hermes Checkbox', 'Hermes Radio', 'Skeleton Loading', 'List / ListItem', 'Accordion List', 'Disclosure Row',
    ],
  },
  {
    label: 'Patterns',
    ids: ['Content Unavailable', 'Pending Request', 'Transcript Activity', 'Composer'],
  },
];

// ─── Machine-readable manifest (AI/tool discovery surface) ──────────────────
// Directly discoverable inside the catalog itself — rendered through HermesOverview's own
// "Machine-readable manifest" disclosure, so it never requires leaving the default route or the
// approved five-group sidebar taxonomy for a dedicated nav entry. Built live from hermesSections/
// hermesNav via buildComponentManifest(), so it can never drift out of sync with the human-readable
// catalog above it. Unlike the retained template's own component-only Manifest page, this one asks
// for includeTokenGalleries so every Foundations token group survives into the JSON too — a tool
// consuming only components/patterns would otherwise silently miss the whole token layer.
const hermesManifestStyles = StyleSheet.create({
  box: { maxHeight: 480, overflow: 'hidden' },
  text: { fontSize: 11, fontFamily: 'Menlo', color: '#1c1c1e', lineHeight: 15 },
});

function HermesManifestJSON() {
  const json = JSON.stringify(buildComponentManifest(hermesSections, hermesNav, { includeTokenGalleries: true }), null, 2);
  return (
    <View style={hermesManifestStyles.box}>
      <Text selectable style={hermesManifestStyles.text}>
        {json}
      </Text>
    </View>
  );
}

export function HermesManifest() {
  return (
    <HermesOverviewImplementationDetails
      meta={{
        implementationNotes: {
          status:
            'Machine-readable manifest, built live from this catalog\'s own SectionDef data — every Foundations token gallery plus every Materials/Native iOS/Components/Patterns entry, each with its own useWhen/avoidWhen/alternatives/adoptionStatus, for tool/agent consumption.',
          sourcePaths: ['design-system-catalog/native/catalog/manifest.ts', 'design-system-catalog/native/catalog/hermes/hermesSections.tsx'],
        },
      }}
      implementationContent={<HermesManifestJSON />}
    />
  );
}
