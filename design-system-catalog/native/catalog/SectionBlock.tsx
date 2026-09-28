import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, type TextStyle } from 'react-native';
import { CATALOG_TYPE, CATALOG_COLOR, CATALOG_SPACE, CATALOG_RADIUS, CATALOG_NARROW_BREAKPOINT } from './tokens';
import { PropsTable } from './PropsTable';
import { HermesReferenceDetails } from './hermes/HermesReferenceDetails';
import type { SectionDef, VariantSlot } from './types';

// Component documentation uses a 2:1 split: visual examples get the wide primary column while
// reference material stays in the narrower secondary column. The host page caps content at 1200px;
// these caps preserve that ratio while still allowing both columns to shrink when space is tighter.
const PRIMARY_COLUMN_WIDTH = 800;
const SECONDARY_COLUMN_WIDTH = 400;
// Shared by the horizontal gap between columns and the vertical gap between blocks inside either
// column — one constant so the hierarchy stays rhythmically consistent.
const COLUMN_GAP = CATALOG_SPACE['2xl'];

// A long, unbroken path segment (no spaces — e.g. "HermesMobile/Features/Chat/PendingRequestSurfaces.swift")
// has no CSS word-break/overflow-wrap equivalent in RN's own `TextStyle` type (native text already
// wraps at any character once its box runs out of room; only the web target needs telling
// explicitly) — a browser's default flex item still won't shrink an auto-width text box below its
// own unwrapped content width (`min-width: auto`) without this, which is what let a long combined
// path (e.g. after finding 3 below added more callers/paths to one chip) overflow past the narrow-
// viewport content column and get clipped by the chip's own `overflow: 'hidden'`. Cast once, locally,
// rather than widening `styles.path`'s own type with `as any`.
const pathWrapStyle = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as unknown as TextStyle;

/** One labeled block (a block label + a card) inside a column. */
interface BlockDef {
  label: string;
  content: React.ReactNode;
}

/** A `VariantSlot`'s items, stacked/centered (or left-aligned, or filled full-width) per its own
 *  `align`/`itemsFill`. Every item is captioned with its own `name` (e.g. "Primary", "Icon-only")
 *  so it's clear which variant/state each instance demonstrates — not just a bare, unlabeled row of
 *  look-alike components. An individual item's own `fill` stretches just that item's wrapper to the
 *  row's full width — independent of `itemsFill` — so a single wide-format instance (e.g. a
 *  `fullWidth` Button) can sit among otherwise-compact, centered siblings. */
/** `twoColumn` (the Variants specimen box only — never States/Configurations or a wide `itemsFill`
 *  slot) wraps items into two responsive columns when the viewport is wide enough for a real second
 *  column, falling back to the same single centered column everywhere else so nothing renders
 *  cramped. */
function SlotItems({ slot, twoColumn }: { slot: VariantSlot; twoColumn?: boolean }) {
  const { width } = useWindowDimensions();
  const isNarrow = width < CATALOG_NARROW_BREAKPOINT;
  const useGrid = twoColumn && !slot.itemsFill && !isNarrow && slot.items.length > 1;

  return (
    <View
      style={[
        useGrid ? styles.exampleGrid : slot.itemsFill ? styles.exampleStackFill : styles.exampleStack,
        slot.align === 'left' && styles.exampleStackLeft,
      ]}
    >
      {slot.items.map((item) => (
        <View
          key={item.key}
          style={[useGrid ? styles.exampleGridItem : styles.exampleItem, item.fill && styles.exampleItemFill]}
        >
          <Text style={styles.itemName}>{item.name}</Text>
          {item.node}
        </View>
      ))}
    </View>
  );
}

function EmptyText({ children }: { children: string }) {
  return <Text style={styles.emptyText}>{children}</Text>;
}

/** The "VS" disambiguation note against a component's closest look-alike(s) — extracted so both
 *  the retained template header and the Hermex reference supporting-content slot can render it in
 *  their own position without duplicating markup. */
function WhenToUse({ text }: { text: string }) {
  return (
    <View style={styles.whenToUse}>
      <Text style={styles.whenToUseTag}>VS</Text>
      <Text style={styles.whenToUseText}>{text}</Text>
    </View>
  );
}

// Matches a quoted-string-literal union type, e.g. "'primary' | 'secondary' | 'tertiary'" — anything
// else (string, boolean, IconName, () => void, …) has no fixed enum to sweep and is skipped.
const STRING_LITERAL_RE = /'([^']+)'/g;

/** Opt-in completeness check (rule 4 of the policy documented on `SectionDef.states`): once a
 *  section has at least one `VariantExample.props`-tagged item, warn about any enum value from
 *  `def.props` that no tagged item (across Variants + States) actually demonstrates. Sections that
 *  haven't started tagging are skipped entirely — annotating is gradual, not all-or-nothing. */
function checkCompleteness<TId extends string>(def: SectionDef<TId>): void {
  if (!def.props) return;
  const items = [...(def.variants?.items ?? []), ...(def.states?.items ?? [])];
  const tagged = items.filter((item) => item.props);
  if (tagged.length === 0) return;

  for (const prop of def.props) {
    const literals = prop.type.match(STRING_LITERAL_RE);
    if (!literals || literals.length < 2) continue; // not a multi-value enum
    const values = literals.map((s) => s.slice(1, -1));
    const covered = new Set(
      tagged
        .map((item) => item.props?.[prop.name])
        .filter((v): v is string => typeof v === 'string'),
    );
    const missing = values.filter((v) => !covered.has(v));
    if (missing.length > 0) {
      console.warn(
        `[Catalog] ${def.id}: prop "${prop.name}" has no tagged example for value(s) ${missing.map((v) => `"${v}"`).join(', ')} — ` +
          `add { props: { ${prop.name}: '${missing[0]}' } } to whichever VariantExample already demonstrates it, or add a new one.`,
      );
    }
  }
}

type ColumnKind = 'primary' | 'secondary';

/** Lays out one column's blocks, stacked with `COLUMN_GAP` between them. The LAST block gets
 *  `flex: 1` so its card grows to fill any extra height flexbox's default `alignItems: 'stretch'`
 *  already gave this column (to match whichever sibling column is tallest) — that's what makes
 *  every column's bottom edge land flush, with no JS height measurement. `fill` drops the normal
 *  primary/secondary sizing so a lone column or a narrow-viewport stack spans the full row. */
function Column({ blocks, fill, kind = 'primary' }: { blocks: BlockDef[]; fill?: boolean; kind?: ColumnKind }) {
  const columnStyle = fill
    ? styles.columnFull
    : kind === 'primary'
      ? styles.primaryColumn
      : styles.secondaryColumn;

  return (
    <View style={columnStyle}>
      {blocks.map((block, i) => {
        const isLast = i === blocks.length - 1;
        return (
          <View key={i} style={isLast && styles.blockFill}>
            <Text style={styles.blockLabel}>{block.label}</Text>
            <View style={[styles.card, isLast && styles.cardFill]}>{block.content}</View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * One documented component or token group: an optional group heading (pass `groupLabel` on every
 * section in a sidebar group — not just the first — so each component's category is visible on its
 * own, without having to scroll up to find the nearest heading above it), then title, description,
 * an optional "VS" disambiguation note (`def.whenToUse` — the deciding question against this
 * component's closest look-alike, e.g. InputField vs SearchField), file path, then either —
 *   • a token-gallery section (`def.tokenGallery`): a single "Tokens" column, since there's no
 *     component API (no states/props/accessibility) to document; or
 *   • a component section: a wide primary column stacking Variants above States / Configurations,
 *     beside a narrow secondary column stacking Props above Accessibility. A block with nothing to
 *     show still renders a plain sentence rather than silently reshaping the hierarchy. Pass
 *     `def.hide` to genuinely remove specific cards instead. If hiding leaves one column standing,
 *     it fills the whole row, the same way a `tokenGallery` section does.
 * Whichever column is tallest sets the row's height (flexbox's default `alignItems: 'stretch'`), and
 * every other column's last card grows to fill the rest, so the row's bottom edge lands flush.
 *
 * A Hermex reference entry (`def.hermesReference`) is the one exception to that secondary column:
 * Accessibility moves out of it entirely, down into `HermesReferenceDetails`'s own lower row of
 * three supporting cards (Decision & product context, Implementation notes, Accessibility) rendered
 * below the visual examples — see `isHermexReference` below. The upper secondary column keeps only
 * Props for that case.
 */
export function SectionBlock<TId extends string>({ def, groupLabel }: { def: SectionDef<TId>; groupLabel?: string }) {
  checkCompleteness(def);
  const hide = def.hide ?? {};
  // Below CATALOG_NARROW_BREAKPOINT, stack the two documentation columns and explicitly let each
  // fill the row so the desktop max-width caps never leave a narrow card floating in a wider tablet.
  const { width } = useWindowDimensions();
  const isNarrow = width < CATALOG_NARROW_BREAKPOINT;

  const variantsContent = def.variants ? (
    <SlotItems slot={def.variants} twoColumn />
  ) : def.render ? (
    def.render()
  ) : (
    <EmptyText>No variants documented.</EmptyText>
  );

  // A Hermex reference entry (`def.hermesReference`) moves usage guidance and disambiguation notes
  // out of the header and below the visual examples, via `HermesReferenceDetails` — the retained
  // template sections and the temporary `def.hermes` compatibility path keep the original header
  // order untouched.
  const isHermexReference = Boolean(def.hermesReference);

  // Computed ahead of the `def.tokenGallery` early return below (rather than alongside the other
  // component-branch content further down) so a token-gallery Hermex entry — e.g. Hermex Colors —
  // can still pass its own accessibility guidance into HermesReferenceDetails's lower Accessibility
  // card, the same fallback text a non-Hermex section's upper secondary column would otherwise show.
  const a11yContent = def.a11y ? (
    <Text style={styles.a11yText}>{def.a11y}</Text>
  ) : (
    <EmptyText>No accessibility notes documented.</EmptyText>
  );

  const primaryHeader = (
    <>
      {groupLabel && <Text style={styles.groupHeading}>{groupLabel}</Text>}
      <Text style={styles.title}>{def.displayName ?? def.id}</Text>
      <Text style={styles.desc}>{def.description}</Text>
      {!isHermexReference && def.whenToUse ? <WhenToUse text={def.whenToUse} /> : null}
      {!isHermexReference && def.path ? <Text style={[styles.path, pathWrapStyle]}>{def.path}</Text> : null}
    </>
  );

  // Once a Hermex entry declares the new useWhen/avoidWhen decision contract, HermesReferenceDetails
  // itself renders "Use when" — showing the legacy def.whenToUse "VS" note here too would render the
  // same fact twice. def.whenToUse still falls back to rendering here for the rare/future entry that
  // hasn't migrated yet, keeping this branch backward-compatible rather than a hard requirement.
  const hermexSupportingContent = isHermexReference ? (
    <View style={styles.supportingContent}>
      {def.whenToUse && !def.hermesReference?.useWhen ? <WhenToUse text={def.whenToUse} /> : null}
      <HermesReferenceDetails meta={def.hermesReference!} accessibilityContent={a11yContent} />
    </View>
  ) : null;

  if (def.tokenGallery) {
    return (
      <View style={styles.section}>
        {primaryHeader}
        <View style={[styles.columnsRow, isNarrow && styles.columnsRowNarrow]}>
          <Column blocks={[{ label: def.fullWidthLabel ?? 'Tokens', content: variantsContent }]} fill />
        </View>
        {hermexSupportingContent}
      </View>
    );
  }

  const statesContent = def.states ? (
    <SlotItems slot={def.states} />
  ) : (
    <EmptyText>No additional states or configurations documented.</EmptyText>
  );

  const propsContent =
    def.props && def.props.length > 0 ? (
      <PropsTable props={def.props} />
    ) : (
      <EmptyText>This component takes no props.</EmptyText>
    );

  const primaryBlocks: BlockDef[] = [
    ...(hide.variants ? [] : [{ label: 'Variants', content: variantsContent }]),
    ...(hide.states ? [] : [{ label: 'States / Configurations', content: statesContent }]),
  ];

  // A Hermex reference entry never shows Accessibility here — it moves down into
  // HermesReferenceDetails's own lower Accessibility card instead (see `hermexSupportingContent`
  // above), so the upper secondary column keeps only Props for that case.
  const secondaryBlocks: BlockDef[] = [
    ...(hide.props ? [] : [{ label: 'Props', content: propsContent }]),
    ...(hide.accessibility || isHermexReference ? [] : [{ label: 'Accessibility', content: a11yContent }]),
  ];

  const columns: { blocks: BlockDef[]; kind: ColumnKind }[] = [
    ...(primaryBlocks.length > 0 ? [{ blocks: primaryBlocks, kind: 'primary' as const }] : []),
    ...(secondaryBlocks.length > 0 ? [{ blocks: secondaryBlocks, kind: 'secondary' as const }] : []),
  ];

  return (
    <View style={styles.section}>
      {primaryHeader}
      {columns.length > 0 && (
        <View style={[styles.columnsRow, isNarrow && styles.columnsRowNarrow]}>
          {columns.map((col) => (
            <Column
              key={col.kind}
              blocks={col.blocks}
              kind={col.kind}
              fill={isNarrow || columns.length === 1}
            />
          ))}
        </View>
      )}
      {hermexSupportingContent}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingBottom: CATALOG_SPACE.sm },
  groupHeading: {
    fontSize: CATALOG_TYPE.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7,
    color: CATALOG_COLOR.textMuted, marginBottom: CATALOG_SPACE.xl,
  },
  title: { fontSize: CATALOG_TYPE['2xl'], fontWeight: '700', color: CATALOG_COLOR.text, marginBottom: CATALOG_SPACE.xs },
  desc: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, lineHeight: 18, marginBottom: CATALOG_SPACE.sm },
  path: {
    // Text is a flex child of `section` (a column, default `alignItems: 'stretch'`) — without this,
    // the chip's background would stretch to the section's full width instead of hugging its text.
    // Kept for short paths (the common case) — `maxWidth`/`flexShrink` below only take over once a
    // path is too long to fit as-is.
    alignSelf: 'flex-start',
    // Caps the chip at its column's own available width and allows it to shrink below its unwrapped
    // content width — a flex item's default `min-width: auto` otherwise refuses to shrink an
    // auto-sized text box past its own (unwrapped) content size, which is what let a long path
    // overflow the page rather than wrap (paired with `pathWrapStyle`'s word-break, applied
    // separately since it has no typed `TextStyle` equivalent).
    maxWidth: '100%',
    flexShrink: 1,
    fontSize: CATALOG_TYPE.sm, fontFamily: CATALOG_COLOR.code, color: CATALOG_COLOR.textMuted,
    backgroundColor: CATALOG_COLOR.chip, paddingHorizontal: CATALOG_SPACE.sm, paddingVertical: CATALOG_SPACE.xs,
    borderRadius: 6, overflow: 'hidden', marginBottom: COLUMN_GAP,
  },
  // "VS" disambiguation note — a small accent-coloured tag + sentence, distinct from the plain
  // description above it so it reads as "here's the one deciding fact", not more prose to skim past.
  whenToUse: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: CATALOG_SPACE.sm,
    marginBottom: CATALOG_SPACE.sm,
  },
  whenToUseTag: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '800', color: CATALOG_COLOR.accent,
    borderWidth: 1, borderColor: CATALOG_COLOR.accent, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1, marginTop: 1,
  },
  whenToUseText: {
    flex: 1, fontSize: CATALOG_TYPE.sm, lineHeight: 18, color: CATALOG_COLOR.text,
  },
  // Holds a Hermex reference entry's `WhenToUse` note plus `HermesReferenceDetails`, rendered below
  // the visual examples instead of in the header (see `isHermexReference` above).
  supportingContent: { marginTop: CATALOG_SPACE.xl, gap: CATALOG_SPACE.md, maxWidth: '100%' },
  columnsRow: { flexDirection: 'row', gap: COLUMN_GAP },
  // Narrow-viewport override — stacks the visual-example and reference-content columns vertically.
  columnsRowNarrow: { flexDirection: 'column' },
  primaryColumn: { flex: 2, maxWidth: PRIMARY_COLUMN_WIDTH, gap: COLUMN_GAP },
  secondaryColumn: { flex: 1, maxWidth: SECONDARY_COLUMN_WIDTH, gap: COLUMN_GAP },
  // No maxWidth — for a lone column (`tokenGallery`) with no siblings to share the row with, so its
  // card spans however much width `columnsRow` actually has (bounded only by the host page's own
  // container, e.g. CatalogShell's CATALOG_MAX_CONTENT_WIDTH).
  columnFull: { flex: 1, gap: COLUMN_GAP },
  // Only applied to a column's LAST block — grows to absorb whatever extra height `columnsRow`'s
  // stretch gave this column, so its card's bottom edge reaches the column's bottom.
  blockFill: { flex: 1 },
  cardFill: { flex: 1, justifyContent: 'center' },
  blockLabel: {
    fontSize: CATALOG_TYPE.xs, fontWeight: '700', color: CATALOG_COLOR.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: CATALOG_SPACE.sm,
  },
  card: {
    backgroundColor: CATALOG_COLOR.surfaceMuted,
    borderWidth: 1,
    borderColor: CATALOG_COLOR.border,
    borderRadius: CATALOG_RADIUS.md,
    // Every card in every section, in both catalogs — Variants/States/Props/Accessibility/Tokens —
    // shares this one padding value, since they all render through this single Column/card path.
    padding: CATALOG_SPACE.xl,
    // Guarantees breathing room between whatever a card holds (multiple examples, prop rows, …)
    // at the SectionBlock level, so a SectionDef's render() doesn't have to remember its own gap.
    gap: CATALOG_SPACE.md,
  },
  a11yText: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, lineHeight: 18 },
  emptyText: { fontSize: CATALOG_TYPE.sm, color: CATALOG_COLOR.textMuted, fontStyle: 'italic' },
  // Layout for a slot's items: vertical, centered, at least 24px apart — for small instances meant
  // to sit as compact items (Button, Badge, Pill).
  exampleStack: { alignItems: 'center', gap: CATALOG_SPACE.xl },
  // Same, but each item stretches to the card's full width (flexbox's default `alignItems: 'stretch'`
  // — no override needed) — for wide block-level components (Banner, Card, Toast, InputField).
  exampleStackFill: { gap: CATALOG_SPACE.xl },
  exampleStackLeft: { alignItems: 'flex-start' },
  // Two responsive columns for a Variants specimen box wide enough for a real second column —
  // `exampleGridItem`'s flexBasis leaves room for the row gap on each side without wrapping to a
  // third column; `flexGrow` lets an odd last item stretch rather than leaving a half-empty row.
  exampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CATALOG_SPACE.xl },
  exampleGridItem: { flexBasis: '45%', flexGrow: 1, alignItems: 'center' },
  // One item + its name caption, stacked tightly and centered under the item. 6px sits between
  // CATALOG_SPACE.xs (4) and .sm (8) — no scale step lands on it, so it's a literal value here.
  exampleItem: { alignItems: 'center', gap: 6 },
  // Per-item override (VariantExample.fill) — `alignSelf` always wins over the parent's `alignItems`
  // regardless of whether that parent is a centered `exampleStack` or an already-stretched
  // `exampleStackFill`, so this works the same in either slot.
  exampleItemFill: { alignSelf: 'stretch' },
  itemName: { fontSize: CATALOG_TYPE.xs, color: CATALOG_COLOR.textMuted },
});
