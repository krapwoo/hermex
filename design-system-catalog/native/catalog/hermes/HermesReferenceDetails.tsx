/**
 * Catalog-owned progressive-disclosure component for a Hermex reference entry's supporting
 * content: up to three destinations inline under "Product context" (a neutral heading — the
 * destinations describe relevant context, not proof of current production adoption), a "Where it
 * appears" disclosure for the complete destination list, and an "Implementation notes" disclosure
 * for technical provenance (source paths, foundation/adoption status, material-fidelity notes).
 * Replaces `HermesAuditPanel` for every entry that has migrated to `hermesReference`.
 */
import React, { useState, type ComponentProps, type ComponentType } from 'react';
import { View, Text, StyleSheet, Pressable, type TextStyle } from 'react-native';
import { AnimatedChevron } from '../../components';
import { CATALOG_TYPE, CATALOG_COLOR, CATALOG_SPACE, CATALOG_RADIUS } from '../tokens';
import type { HermesReferenceDestination, HermesReferenceMeta } from '../types';

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

interface HermesReferenceDetailsProps {
  meta: HermesReferenceMeta;
  implementationContent?: React.ReactNode;
}

export function HermesReferenceDetails({ meta, implementationContent }: HermesReferenceDetailsProps) {
  const hasWhereItAppears = Boolean(meta.useSummary && meta.usedIn?.length);
  const inlineDestinations = meta.useSummary ? [] : (meta.usedIn ?? []).slice(0, 3);
  const hasInlineUsage = Boolean(meta.useSummary || inlineDestinations.length > 0);
  const hasImplementationNotes = Boolean(
    meta.implementationNotes?.status ||
      meta.implementationNotes?.sourcePaths?.length ||
      meta.implementationNotes?.notes?.length ||
      implementationContent,
  );

  if (!hasInlineUsage && !hasImplementationNotes) return null;

  return (
    <View style={styles.root}>
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
      {hasImplementationNotes && (
        <Disclosure label="Implementation notes">
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
        </Disclosure>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: CATALOG_SPACE.md, maxWidth: '100%' },
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
