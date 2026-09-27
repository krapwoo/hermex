/**
 * Searchable visual inventory of every distinct SF Symbol name Hermex references — literal and
 * computed sites deduplicated by final symbol name. The catalog has no SF Symbols renderer and may
 * not add a dependency, so each tile shows an honest "Glyph unavailable in browser" state rather
 * than a substitute glyph that could be mistaken for the real symbol.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { CATALOG_TYPE, CATALOG_COLOR, CATALOG_SPACE, CATALOG_RADIUS, CATALOG_NARROW_BREAKPOINT } from '../tokens';
import hermesIconInventory from './hermesIconInventory.generated.json';
import hermesIconComputedSiteTrace from './hermesIconComputedSiteTrace.generated.json';

const UNAVAILABLE_LABEL = 'Glyph unavailable in browser';

export function buildHermesIconNames(): string[] {
  const literalNames = hermesIconInventory.literals.map((entry) => entry.name);
  const computedNames = hermesIconComputedSiteTrace.entries.flatMap((entry) => entry.resolvedNames);
  return [...new Set([...literalNames, ...computedNames])].sort((a, b) => a.localeCompare(b));
}

function IconTile({ name }: { name: string }) {
  return (
    <View style={styles.tile} accessibilityLabel={`${name}. ${UNAVAILABLE_LABEL}.`}>
      <View style={styles.glyphArea}>
        <Text
          style={styles.glyphText}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {UNAVAILABLE_LABEL}
        </Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CATALOG_SPACE.sm },
  gridNarrow: { flexDirection: 'column' },
  tile: {
    width: 180, gap: CATALOG_SPACE.xs, padding: CATALOG_SPACE.sm,
    borderWidth: 1, borderColor: CATALOG_COLOR.border, borderRadius: CATALOG_RADIUS.sm,
    backgroundColor: CATALOG_COLOR.surfaceMuted,
  },
  glyphArea: {
    height: 56, borderRadius: CATALOG_RADIUS.sm, borderWidth: 1, borderColor: CATALOG_COLOR.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
    backgroundColor: CATALOG_COLOR.chip,
  },
  glyphText: { fontSize: 10, color: CATALOG_COLOR.textMuted, textAlign: 'center', fontStyle: 'italic' },
  name: { fontSize: CATALOG_TYPE.xs, fontFamily: CATALOG_COLOR.code, color: CATALOG_COLOR.text },
});
