/**
 * Catalog-owned component for a Hermex reference entry's supporting content, rendered as a lower
 * row of three restrained cards below the upper Variants/States/Props specimen row (see
 * `SectionBlock`): "Decision & product context" (the useWhen/avoidWhen/alternatives/adoptionStatus
 * decision fields, up to three destinations inline under "Product context" — a neutral heading, the
 * destinations describe relevant context, not proof of current production adoption — and a "Where
 * it appears" disclosure for the complete destination list), "Implementation notes" (technical
 * provenance — source paths, foundation/adoption status, material-fidelity notes — visible directly
 * in its own card, no longer collapsed behind a disclosure now that it has a card of its own to sit
 * in), and "Accessibility" (the entry's accessibility guidance, passed in as `accessibilityContent`
 * since `SectionBlock` already owns that fallback text). The three cards sit side by side above
 * `CATALOG_NARROW_BREAKPOINT` and stack into one column, in the same order, below it. Replaces
 * `HermesAuditPanel` for every entry that has migrated to `hermesReference`.
 */
import React, { useState, type ComponentProps, type ComponentType } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, type TextStyle } from 'react-native';
import { AnimatedChevron } from '../../components';
import { CATALOG_TYPE, CATALOG_COLOR, CATALOG_SPACE, CATALOG_RADIUS, CATALOG_NARROW_BREAKPOINT } from '../tokens';
import type { HermesAdoptionState, HermesAlternative, HermesReferenceDestination, HermesReferenceMeta } from '../types';

// Same web-only word-break/overflow-wrap escape hatch used throughout the catalog (SectionBlock's
// own `pathWrapStyle`) — a long, unbroken source-path token has no RN `TextStyle` equivalent to
// force a mid-word break.
const wrapStyle = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as unknown as TextStyle;

// `aria-expanded` has no equivalent in React Native's own (native-targeting) `Pressable` props, and
// unlike `accessibilityState.disabled`/`checked`/`busy`/`selected`, react-native-web's own
// accessibility-prop mapping has no case for `accessibilityState.expanded` at all — so it never
// reaches the DOM on its own. Same narrow, explicitly-typed escape hatch as CatalogSidebar's own
// `aria-current` cast.
const DisclosureTrigger = Pressable as unknown as ComponentType<ComponentProps<typeof Pressable> & { 'aria-expanded'?: boolean }>;

interface DisclosureProps {
  label: 'Where it appears' | 'Implementation notes';
  children: React.ReactNode;
}

function Disclosure({ label, children }: DisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.disclosure}>
      <DisclosureTrigger
        onPress={() => setExpanded((value) => !value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        style={({ pressed }) => [styles.trigger, focused && styles.triggerFocused, pressed && styles.triggerPressed]}
      >
        <Text style={styles.triggerLabel}>{label}</Text>
        <AnimatedChevron expanded={expanded} size={16} color={CATALOG_COLOR.textMuted} />
      </DisclosureTrigger>
      {expanded ? <View style={styles.disclosureBody}>{children}</View> : null}
    </View>
  );
}

function DestinationRow({ destination }: { destination: HermesReferenceDestination }) {
  const destinationLabel = destination.path ?? destination.screen;
  return (
    <View style={styles.destinationRow}>
      <Text style={[styles.destinationLabel, wrapStyle]}>{destinationLabel}</Text>
      <Text style={styles.destinationEffect}>{destination.effect}</Text>
    </View>
  );
}

// One "Use when" / "Avoid when" / "Alternatives" / "Adoption status" row — the exact human labels
// the catalog contract requires. Always rendered in the primary reading flow, never behind a
// Disclosure: this is the decision guidance a reader (human or AI) needs first, not provenance.
function DecisionField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.decisionField}>
      <Text style={styles.decisionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function AlternativeRow({ alternative }: { alternative: HermesAlternative }) {
  return (
    <View style={styles.alternativeRow}>
      <Text style={styles.alternativeName}>{alternative.name}</Text>
      <Text style={styles.alternativeUseWhen}>{alternative.useWhen}</Text>
    </View>
  );
}

const ADOPTION_STATE_LABEL: Record<HermesAdoptionState, string> = {
  'foundation-available': 'Foundation available',
  'production-adopted': 'Production adopted',
  'partially-adopted': 'Partially adopted',
  'native-platform': 'Native platform',
  'reference-only': 'Reference only',
};

// Fixed collapsed-viewport height every SupportingCard measures its own content against (DSR2-09).
const SUPPORTING_CARD_COLLAPSED_HEIGHT = 280;

/** One of the three lower supporting cards — a restrained card visually distinct from the upper
 *  specimen cards (`SectionBlock`'s own `card` style): white surface, hairline border,
 *  `CATALOG_RADIUS.sm`, `CATALOG_SPACE.lg` padding, all existing catalog tokens. Each instance owns
 *  its own expansion state and measures its own content/viewport via `onLayout` — never a shared,
 *  row-level expansion record — so the three cards below a section expand fully independently. The
 *  disclosure control only renders once measured content actually exceeds the fixed collapsed
 *  height, and stays mounted (never unmounted/remounted) across expand/collapse. */
function SupportingCard({ heading, children, isNarrow }: { heading: string; children: React.ReactNode; isNarrow: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const canExpand = viewportHeight > 0 && contentHeight > viewportHeight;

  return (
    <View style={[styles.supportingCard, isNarrow && styles.supportingCardNarrow, !expanded && { height: SUPPORTING_CARD_COLLAPSED_HEIGHT }]}>
      <Text style={styles.supportingCardHeading}>{heading}</Text>
      <View
        style={!expanded ? [styles.supportingCardViewport, { flex: 1, overflow: 'hidden' }] : styles.supportingCardViewport}
        onLayout={(event) => {
          if (!expanded) setViewportHeight(event.nativeEvent.layout.height);
        }}
      >
        <View onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>{children}</View>
      </View>
      {canExpand ? (
        <DisclosureTrigger
          onPress={() => setExpanded((value) => !value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          accessibilityLabel={`${expanded ? 'Show less' : 'Show more'} for ${heading}`}
          style={({ pressed }) => [
            styles.supportingCardDisclosureTrigger,
            focused && styles.triggerFocused,
            pressed && styles.triggerPressed,
          ]}
        >
          <Text style={styles.triggerLabel}>{expanded ? 'Show less' : 'Show more'}</Text>
        </DisclosureTrigger>
      ) : null}
    </View>
  );
}

function ImplementationNotesContent({
  meta,
  implementationContent,
}: {
  meta: HermesReferenceMeta;
  implementationContent?: React.ReactNode;
}) {
  const hasImplementationNotes = Boolean(
    meta.implementationNotes?.status ||
      meta.implementationNotes?.sourcePaths?.length ||
      meta.implementationNotes?.notes?.length ||
      implementationContent,
  );

  if (!hasImplementationNotes) {
    return <Text style={styles.emptyText}>No implementation notes documented.</Text>;
  }

  return (
    <View style={styles.implementationBlock}>
      {meta.implementationNotes?.status ? (
        <Text style={styles.implementationStatus}>{meta.implementationNotes.status}</Text>
      ) : null}
      {meta.implementationNotes?.sourcePaths?.length ? (
        <View style={styles.sourcePathList}>
          {meta.implementationNotes.sourcePaths.map((sourcePath) => (
            <Text key={sourcePath} style={[styles.sourcePath, wrapStyle]}>
              {sourcePath}
            </Text>
          ))}
        </View>
      ) : null}
      {meta.implementationNotes?.notes?.length ? (
        <View style={styles.notesList}>
          {meta.implementationNotes.notes.map((note, i) => (
            <Text key={i} style={[styles.implementationNote, wrapStyle]}>
              · {note}
            </Text>
          ))}
        </View>
      ) : null}
      {implementationContent}
    </View>
  );
}

/** Compact implementation-only disclosure for the catalog overview's maintainer evidence. The
 * overview is not a SectionDef reference entry, so it must not inherit empty Decision and
 * Accessibility cards from the three-column section contract. */
export function HermesOverviewImplementationDetails({
  meta,
  implementationContent,
}: {
  meta: HermesReferenceMeta;
  implementationContent?: React.ReactNode;
}) {
  return (
    <Disclosure label="Implementation notes">
      <ImplementationNotesContent meta={meta} implementationContent={implementationContent} />
    </Disclosure>
  );
}

interface HermesReferenceDetailsProps {
  meta: HermesReferenceMeta;
  implementationContent?: React.ReactNode;
  /** The entry's accessibility guidance, already resolved by `SectionBlock` (including its
   *  truthful "No accessibility notes documented." fallback when `def.a11y` is absent) — rendered
   *  here inside the Accessibility supporting card, the same content the upper secondary column
   *  would otherwise show for a non-Hermex section. Optional only for `HermesOverview`'s own
   *  maintainer-facing coverage-table usage of this component, which isn't a per-entry Accessibility
   *  card at all — falls back to the same truthful "not documented" text SectionBlock uses. */
  accessibilityContent?: React.ReactNode;
}

export function HermesReferenceDetails({
  meta,
  implementationContent,
  accessibilityContent = <Text style={styles.emptyText}>No accessibility notes documented.</Text>,
}: HermesReferenceDetailsProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < CATALOG_NARROW_BREAKPOINT;

  const alternatives = meta.alternatives ?? [];
  const hasWhereItAppears = Boolean(meta.useSummary && meta.usedIn?.length);
  const inlineDestinations = meta.useSummary ? [] : (meta.usedIn ?? []).slice(0, 3);
  const hasInlineUsage = Boolean(meta.useSummary || inlineDestinations.length > 0);
  return (
    <View style={[styles.supportingRow, isNarrow && styles.supportingRowNarrow]}>
      <SupportingCard heading="Decision & product context" isNarrow={isNarrow}>
        <View style={styles.decisionBlock}>
          {meta.useWhen ? (
            <DecisionField label="Use when">
              <Text style={styles.decisionText}>{meta.useWhen}</Text>
            </DecisionField>
          ) : null}
          {meta.avoidWhen ? (
            <DecisionField label="Avoid when">
              <Text style={styles.decisionText}>{meta.avoidWhen}</Text>
            </DecisionField>
          ) : null}
          <DecisionField label="Alternatives">
            {alternatives.length > 0 ? (
              <View style={styles.alternativesList}>
                {alternatives.map((alternative, i) => (
                  <AlternativeRow key={`${alternative.name}-${i}`} alternative={alternative} />
                ))}
              </View>
            ) : (
              <Text style={styles.decisionText}>No direct alternative.</Text>
            )}
          </DecisionField>
          {meta.adoptionStatus ? (
            <DecisionField label="Adoption status">
              <Text style={styles.decisionText}>
                <Text style={styles.adoptionStateTag}>{ADOPTION_STATE_LABEL[meta.adoptionStatus.state]}</Text>
                {' — '}
                {meta.adoptionStatus.detail}
              </Text>
            </DecisionField>
          ) : null}
        </View>
        {hasInlineUsage && (
          <View style={styles.usageBlock}>
            <Text style={styles.usageHeading}>Product context</Text>
            {meta.useSummary ? (
              <Text style={styles.useSummary}>{meta.useSummary}</Text>
            ) : (
              <View style={styles.destinationList}>
                {inlineDestinations.map((destination, i) => (
                  <DestinationRow key={`${destination.screen}-${i}`} destination={destination} />
                ))}
              </View>
            )}
          </View>
        )}
        {hasWhereItAppears && (
          <Disclosure label="Where it appears">
            <View style={styles.destinationList}>
              {(meta.usedIn ?? []).map((destination, i) => (
                <DestinationRow key={`${destination.screen}-${i}`} destination={destination} />
              ))}
            </View>
          </Disclosure>
        )}
      </SupportingCard>
      <SupportingCard heading="Implementation notes" isNarrow={isNarrow}>
        <ImplementationNotesContent meta={meta} implementationContent={implementationContent} />
      </SupportingCard>
      <SupportingCard heading="Accessibility" isNarrow={isNarrow}>{accessibilityContent}</SupportingCard>
    </View>
  );
}

const styles = StyleSheet.create({
  // Three cards side by side above CATALOG_NARROW_BREAKPOINT, stacked into one column (same
  // semantic order) below it — matches SectionBlock's own columnsRow/columnsRowNarrow pattern.
  supportingRow: { flexDirection: 'row', gap: CATALOG_SPACE.xl, maxWidth: '100%' },
  supportingRowNarrow: { flexDirection: 'column' },
  // Restrained, visually distinct from the upper specimen cards (SectionBlock's own `card` style,
  // which uses a muted surface, a larger radius step, and roomier padding) — white surface, hairline
  // border, CATALOG_RADIUS.sm, CATALOG_SPACE.lg padding, every value an existing catalog token.
  supportingCard: {
    flex: 1,
    gap: CATALOG_SPACE.md,
    maxWidth: '100%',
    backgroundColor: CATALOG_COLOR.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CATALOG_COLOR.borderHairline,
    borderRadius: CATALOG_RADIUS.sm,
    padding: CATALOG_SPACE.lg,
  },
  supportingCardNarrow: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  supportingCardHeading: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '700', color: CATALOG_COLOR.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  supportingCardViewport: { maxWidth: '100%' },
  supportingCardDisclosureTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: CATALOG_SPACE.xs, borderRadius: CATALOG_RADIUS.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  emptyText: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, fontStyle: 'italic' },
  decisionBlock: { gap: CATALOG_SPACE.sm, maxWidth: '100%' },
  decisionField: { gap: 2, maxWidth: '100%' },
  decisionLabel: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '700', color: CATALOG_COLOR.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  decisionText: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.text, lineHeight: 18, maxWidth: '100%' },
  alternativesList: { gap: CATALOG_SPACE.sm },
  alternativeRow: { gap: 2, maxWidth: '100%' },
  alternativeName: { fontSize: CATALOG_TYPE.sm, fontWeight: '700', color: CATALOG_COLOR.text },
  alternativeUseWhen: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, lineHeight: 17 },
  adoptionStateTag: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '800', color: CATALOG_COLOR.accent,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  usageBlock: { gap: CATALOG_SPACE.xs },
  usageHeading: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '700', color: CATALOG_COLOR.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  useSummary: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.text, lineHeight: 18 },
  destinationList: { gap: CATALOG_SPACE.sm },
  destinationRow: { gap: 2, maxWidth: '100%' },
  destinationLabel: { fontSize: CATALOG_TYPE.sm, fontWeight: '700', color: CATALOG_COLOR.text, maxWidth: '100%', flexShrink: 1 },
  destinationEffect: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, lineHeight: 17 },
  disclosure: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: CATALOG_COLOR.borderHairline, paddingTop: CATALOG_SPACE.sm },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: CATALOG_SPACE.xs, borderRadius: CATALOG_RADIUS.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  triggerFocused: { borderColor: CATALOG_COLOR.accent },
  triggerPressed: { opacity: 0.7 },
  triggerLabel: { fontSize: CATALOG_TYPE.sm, fontWeight: '700', color: CATALOG_COLOR.text },
  disclosureBody: { paddingTop: CATALOG_SPACE.sm, gap: CATALOG_SPACE.sm },
  implementationBlock: { gap: CATALOG_SPACE.sm },
  implementationStatus: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.text, lineHeight: 18 },
  sourcePathList: { gap: 2 },
  sourcePath: {
    fontSize: CATALOG_TYPE.sm, fontFamily: CATALOG_COLOR.code, color: CATALOG_COLOR.textMuted,
    maxWidth: '100%', flexShrink: 1,
  },
  notesList: { gap: 4 },
  implementationNote: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, lineHeight: 17, maxWidth: '100%', flexShrink: 1 },
});
