/**
 * Searchable visual inventory of every distinct SF Symbol name Hermex references — literal and
 * computed sites deduplicated by final symbol name. Each tile requests a PNG rendered ahead of
 * time by the real iOS SF Symbols runtime (icon-renderer/, via scripts/generate-icon-previews.mjs
 * on the Simulator — see native-preview's `generate:icons` script), so the glyph shown here is the
 * genuine symbol, not a substitute. That render is one standardized size/weight/color for a
 * catalog-wide overview; a component's own section documents the size, weight, palette, and
 * effects it actually uses at its production call sites. A tile falls back to an honest
 * "Glyph unavailable in browser" label only if its specific asset is missing or fails to load.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { CATALOG_TYPE, CATALOG_COLOR, CATALOG_SPACE, CATALOG_RADIUS, CATALOG_NARROW_BREAKPOINT } from '../tokens';
import hermesIconInventory from './hermesIconInventory.generated.json';
import hermesIconComputedSiteTrace from './hermesIconComputedSiteTrace.generated.json';

const UNAVAILABLE_LABEL = 'Glyph unavailable in browser';
const GENERATED_ICON_BASE_PATH = '/generated-icons';

export function buildHermesIconNames(): string[] {
  const literalNames = hermesIconInventory.literals.map((entry) => entry.name);
  const computedNames = hermesIconComputedSiteTrace.entries.flatMap((entry) => entry.resolvedNames);
  return [...new Set([...literalNames, ...computedNames])].sort((a, b) => a.localeCompare(b));
}

function iconAssetUri(name: string): string {
  return `${GENERATED_ICON_BASE_PATH}/${encodeURIComponent(name)}.png`;
}

function IconTile({ name }: { name: string }) {
  const [hasError, setHasError] = useState(false);
  return (
    <View style={styles.tile}>
      <View
        style={styles.glyphArea}
        accessibilityLabel={hasError ? `${name}. ${UNAVAILABLE_LABEL}.` : `${name} icon`}
      >
        {hasError ? (
          <Text
            style={styles.glyphText}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {UNAVAILABLE_LABEL}
          </Text>
        ) : (
          <Image
            source={{ uri: iconAssetUri(name) }}
            style={styles.glyphImage}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onError={() => setHasError(true)}
          />
        )}
      </View>
      <Text style={styles.name} selectable>
        {name}
      </Text>
    </View>
  );
}

export function HermesIconReference() {
  const { width } = useWindowDimensions();
  const isNarrow = width < CATALOG_NARROW_BREAKPOINT;
  const [query, setQuery] = useState('');
  const names = useMemo(buildHermesIconNames, []);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredNames = normalizedQuery
    ? names.filter((name) => name.toLocaleLowerCase().includes(normalizedQuery))
    : names;

  return (
    <View style={styles.stack}>
      <Text style={styles.fidelityNote}>
        Glyphs are rendered by the iOS SF Symbols runtime on a Simulator, at one standardized size,
        weight, and color for this catalog overview. Each component's own section documents the
        size, weight, palette, and effects it actually uses at its production call sites.
      </Text>
      <View style={styles.searchRow}>
        <Text style={styles.searchLabel}>Search SF Symbols</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search SF Symbols"
          accessibilityLabel="Search SF Symbols"
          style={styles.searchInput}
        />
        <Text style={styles.resultCount}>
          {filteredNames.length} of {names.length} symbols
        </Text>
      </View>
      <View style={[styles.grid, isNarrow && styles.gridNarrow]}>
        {filteredNames.map((name) => (
          <IconTile key={name} name={name} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: CATALOG_SPACE.lg },
  searchRow: { gap: CATALOG_SPACE.xs },
  searchLabel: { fontSize: CATALOG_TYPE.xs, fontWeight: '700', color: CATALOG_COLOR.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchInput: {
    borderWidth: 1, borderColor: CATALOG_COLOR.border, borderRadius: CATALOG_RADIUS.sm,
    paddingHorizontal: CATALOG_SPACE.md, paddingVertical: CATALOG_SPACE.sm, fontSize: CATALOG_TYPE.md,
    color: CATALOG_COLOR.text, backgroundColor: CATALOG_COLOR.surface, maxWidth: 360,
  },
  resultCount: { fontSize: CATALOG_TYPE.xs, color: CATALOG_COLOR.textMuted },
  fidelityNote: { fontSize: CATALOG_TYPE.xs, color: CATALOG_COLOR.textMuted, maxWidth: 640 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CATALOG_SPACE.sm },
  gridNarrow: { flexDirection: 'column' },
  tile: {
    width: 180, gap: CATALOG_SPACE.xs, padding: CATALOG_SPACE.sm,
    borderWidth: 1, borderColor: CATALOG_COLOR.border, borderRadius: CATALOG_RADIUS.sm,
    backgroundColor: CATALOG_COLOR.surfaceMuted,
  },
  glyphArea: {
    height: 56, borderRadius: CATALOG_RADIUS.sm, borderWidth: 1, borderColor: CATALOG_COLOR.border,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
    backgroundColor: CATALOG_COLOR.chip,
  },
  glyphImage: { width: 32, height: 32 },
  glyphText: { fontSize: 10, color: CATALOG_COLOR.textMuted, textAlign: 'center', fontStyle: 'italic' },
  name: { fontSize: CATALOG_TYPE.xs, fontFamily: CATALOG_COLOR.code, color: CATALOG_COLOR.text },
});
