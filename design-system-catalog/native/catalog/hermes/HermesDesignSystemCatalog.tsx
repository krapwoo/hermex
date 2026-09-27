/**
 * HermesDesignSystemCatalog — "Hermex Design System": the default catalog route.
 *
 * Combines the Hermex reference layer (`hermesSections`/`hermesNav` — real findings traced to
 * Hermex's SwiftUI production source, organized into the approved five-group taxonomy: Foundations,
 * Materials, Native iOS, Components, Patterns) with the retained, unmodified template catalog (`sections`/`nav`
 * exported from `../CatalogExample`, the same data `?catalog=template` renders on its own).
 * `hermesNav`'s own five groups ("Foundations — Hermex", "Materials — Hermex", "Native iOS —
 * Hermex", "Components — Hermex", "Patterns — Hermex") come first, in that order, then every template nav group re-labeled
 * under whichever of the template's own two prefixes ("Components —" / "Tokens —") it belongs to,
 * each carrying "Template library (not adopted)" — the sections themselves are untouched — so the
 * sidebar can never present a generic, un-adopted template component as an audited Hermex one, and
 * there is no third, disposition-named taxonomy. The audit overview renders once, above the first
 * group, via `CatalogShell`'s `intro` slot rather than as its own nav entry. `CatalogShell` owns
 * layout, scrolling, filtering, and scroll-spy for the combined set exactly as it does for either
 * catalog alone.
 */
import { CatalogShell } from '../CatalogShell';
import { sections as templateSections, nav as templateNav, type SectionId as TemplateSectionId } from '../CatalogExample';
import { hermesSections, hermesNav, HermesOverview, type HermesSectionId } from './hermesSections';
import type { NavGroup, SectionDef } from '../types';

export type HermesCatalogSectionId = HermesSectionId | TemplateSectionId;

// The template's own nav has exactly one token-ish group (literally labeled "Tokens" — Colors,
// Spacing, Typography, …); every other original group (Actions, Surfaces, …, and "Reference", which
// holds only the Manifest page) documents components, so it belongs under "Components —" too.
const TEMPLATE_TOKENS_LABEL = 'Tokens';

const templateComponentGroups: NavGroup<HermesCatalogSectionId>[] = templateNav
  .filter((group) => group.label !== TEMPLATE_TOKENS_LABEL)
  .map((group) => ({ label: `Components — Template library (not adopted) · ${group.label}`, ids: group.ids }));

const templateTokenGroups: NavGroup<HermesCatalogSectionId>[] = templateNav
  .filter((group) => group.label === TEMPLATE_TOKENS_LABEL)
  .map((group) => ({ label: 'Tokens — Template library (not adopted)', ids: group.ids }));

const nav: NavGroup<HermesCatalogSectionId>[] = [
  ...hermesNav.filter((group) => group.label.startsWith('Foundations')),
  ...hermesNav.filter((group) => group.label.startsWith('Materials')),
  ...hermesNav.filter((group) => group.label.startsWith('Native iOS')),
  ...hermesNav.filter((group) => group.label.startsWith('Components')),
  ...hermesNav.filter((group) => group.label.startsWith('Patterns')),
  ...templateComponentGroups,
  ...templateTokenGroups,
];

const sections: SectionDef<HermesCatalogSectionId>[] = [...hermesSections, ...templateSections];

export function HermesDesignSystemCatalog() {
  return (
    <CatalogShell
      appName="Hermex"
      title="Hermex Design System"
      groups={nav}
      sections={sections}
      intro={() => <HermesOverview />}
      // The plain computed "${sections.length} components & tokens" count would merge 21 Hermex
      // reference entries with 47 retained template references into one misleading number — state
      // both counts explicitly instead. Token Coverage moved from its own entry into the overview's
      // Implementation notes, so it is counted separately from the 21 visual references (Materials +
      // Native iOS + Components + Patterns, excluding the Foundations token galleries).
      subtitle="Hermex · 21 visual references · token coverage in overview · 47 template references"
    />
  );
}
