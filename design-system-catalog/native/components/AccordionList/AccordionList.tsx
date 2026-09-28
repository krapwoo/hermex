import React, { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { DS_ICON_SIZE, DS_MOTION_DURATION, DS_RADIUS, DS_SEMANTIC, DS_SPACING } from '../../../tokens';
import { AVATAR_SIZE } from '../Avatar';
import { AnimatedChevron } from '../AnimatedChevron';
import { Divider } from '../Divider';
import { ListItem, type ListItemProps } from '../ListItem';

/** Mandatory visual surface — every caller picks explicitly; there is no default. */
export type AccordionListAppearance = 'card' | 'cardless';
/** Mandatory separator policy — every caller picks explicitly; there is no default.
 *  `topAndBottom` surrounds the whole accordion group with no internal dividers. */
export type AccordionListSeparatorStyle = 'none' | 'betweenRows' | 'topAndBottom' | 'all';
/** `single` permits zero or one open item (tapping the open header collapses it); `multiple`
 *  permits any number of open items. */
export type AccordionListExpansionMode = 'single' | 'multiple';

export interface AccordionListHeader {
  title: string;
  description?: string;
  leading: ReactNode;
  titleAccessory?: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface AccordionListProps<Section extends { id: string }, Row extends { id: string }> {
  items: readonly Section[];
  /** Mandatory visual surface — there is no default. */
  appearance: 'card' | 'cardless';
  /** Mandatory separator policy — there is no default. `topAndBottom` surrounds the whole
   *  accordion group with no internal dividers. */
  separatorStyle: 'none' | 'betweenRows' | 'topAndBottom' | 'all';
  mode: AccordionListExpansionMode;
  /** Controlled expansion — when provided, `AccordionList` never owns its own expansion state. */
  expandedIds?: readonly string[];
  /** Seeds local (uncontrolled) expansion state. Ignored once `expandedIds` is provided. */
  initialExpandedIds?: readonly string[];
  onExpandedIdsChange?: (ids: string[]) => void;
  getHeader: (section: Section) => AccordionListHeader;
  getBodyItems: (section: Section) => readonly Row[];
  renderBodyItem: (section: Section, row: Row) => ReactElement<ListItemProps, typeof ListItem>;
}

/** A collection-level, data-agnostic composition of expandable `ListItem` groups: one explicit
 *  appearance, one explicit separator policy, single-or-multiple expansion in controlled or
 *  uncontrolled form, and header/body rows rooted in `ListItem`. The whole header toggles
 *  expansion; the chevron is a decorative indicator inside that same press target, never an
 *  independent control. Grows naturally inside whatever container the caller already scrolls
 *  with, never introducing a scrolling container of its own, and understands nothing about the
 *  data its rows represent. */
export function AccordionList<Section extends { id: string }, Row extends { id: string }>({
  items,
  appearance,
  separatorStyle,
  mode,
  expandedIds,
  initialExpandedIds,
  onExpandedIdsChange,
  getHeader,
  getBodyItems,
  renderBodyItem,
}: AccordionListProps<Section, Row>) {
  const validIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const normalize = useCallback(
    (ids: readonly string[]) => {
      const valid = [...new Set(ids)].filter((id) => validIds.has(id));
      return mode === 'single' ? valid.slice(0, 1) : valid;
    },
    [mode, validIds],
  );
  const isControlled = expandedIds !== undefined;
  const [localExpandedIds, setLocalExpandedIds] = useState<string[]>(() =>
    normalize(initialExpandedIds ?? []),
  );
  const resolvedExpandedIds = normalize(expandedIds ?? localExpandedIds);

  useEffect(() => {
    if (!isControlled) {
      setLocalExpandedIds((current) => normalize(current));
    }
  }, [isControlled, normalize]);

  const commitExpandedIds = (next: readonly string[]) => {
    const normalized = normalize(next);
    if (!isControlled) setLocalExpandedIds(normalized);
    onExpandedIdsChange?.(normalized);
  };

  const toggle = (section: Section) => {
    if (getHeader(section).disabled) return;
    const current = new Set(resolvedExpandedIds);
    if (current.has(section.id)) {
      current.delete(section.id);
    } else if (mode === 'single') {
      current.clear();
      current.add(section.id);
    } else {
      current.add(section.id);
    }
    commitExpandedIds([...current]);
  };

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const showInternal = separatorStyle === 'betweenRows' || separatorStyle === 'all';
  const showOuter = separatorStyle === 'topAndBottom' || separatorStyle === 'all';

  const renderGroupRows = (section: Section) => {
    const header = getHeader(section);
    const expanded = resolvedExpandedIds.includes(section.id);
    const rows = getBodyItems(section);

    return (
      <>
        <ListItem
          title={header.title}
          description={header.description}
          leading={<View style={styles.headerLeading}>{header.leading}</View>}
          titleAccessory={header.titleAccessory}
          titleRole="label"
          rowIndicator={
            <AnimatedChevron
              expanded={expanded}
              size={DS_ICON_SIZE.sm}
              color={DS_SEMANTIC.text.muted}
              duration={reduceMotion ? 0 : DS_MOTION_DURATION.base}
            />
          }
          onPress={() => toggle(section)}
          disabled={header.disabled}
          expanded={expanded}
          accessibilityLabel={header.accessibilityLabel}
          style={appearance === 'cardless' ? styles.transparentRow : undefined}
        />

        {expanded && rows.map((row, index) => {
          const renderedRow = renderBodyItem(section, row);
          return (
            <React.Fragment key={row.id}>
              {showInternal && index === 0 && <Divider />}
              {React.cloneElement(renderedRow, {
                style: [
                  styles.bodyRow,
                  appearance === 'cardless' && styles.transparentRow,
                  renderedRow.props.style,
                ],
              })}
              {showInternal && index < rows.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <View style={appearance === 'card' ? styles.cardStack : styles.cardlessStack}>
      {items.map((section, index) => {
        if (appearance === 'card') {
          return (
            <View key={section.id} style={styles.cardGroup}>
              {showOuter && <Divider />}
              {renderGroupRows(section)}
              {showOuter && <Divider />}
            </View>
          );
        }

        return (
          <React.Fragment key={section.id}>
            {showOuter && index === 0 && <Divider />}
            {renderGroupRows(section)}
            {(showOuter || (separatorStyle === 'betweenRows' && index < items.length - 1)) && (
              <Divider />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cardStack: { gap: DS_SPACING[400] },
  cardlessStack: { gap: 0 },
  cardGroup: {
    overflow: 'hidden',
    borderRadius: DS_RADIUS.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DS_SEMANTIC.element.divider,
    backgroundColor: DS_SEMANTIC.surface.white,
  },
  transparentRow: { backgroundColor: 'transparent' },
  headerLeading: {
    width: AVATAR_SIZE.small,
    height: AVATAR_SIZE.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyRow: {
    paddingLeft: AVATAR_SIZE.small + DS_SPACING[600],
  },
});
