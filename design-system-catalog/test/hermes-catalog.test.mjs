// Minimal Node built-in test (node:test + node:assert) — no new test dependency.
// Asserts against source text rather than executing the RN/Expo app, since this repo has no test
// runner/renderer set up for .tsx; that's enough to pin down the required catalog/title/routes/
// evidence structure without pulling in a new toolchain.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const HERMES_CATALOG_PATH = 'native/catalog/hermes/HermesDesignSystemCatalog.tsx';
const HERMES_SECTIONS_PATH = 'native/catalog/hermes/hermesSections.tsx';
const APP_PATH = 'native-preview/App.tsx';
const TOKENS_PATH = 'native/catalog/tokens.ts';
const CATALOG_SHELL_PATH = 'native/catalog/CatalogShell.tsx';
const CATALOG_SIDEBAR_PATH = 'native/catalog/CatalogSidebar.tsx';
const SECTION_BLOCK_PATH = 'native/catalog/SectionBlock.tsx';
const PROPS_TABLE_PATH = 'native/catalog/PropsTable.tsx';
const CATALOG_EXAMPLE_PATH = 'native/catalog/CatalogExample.tsx';
const DIST_INDEX_HTML_PATH = 'native-preview/dist/index.html';
const TYPES_PATH = 'native/catalog/types.ts';
const HERMES_REFERENCE_DETAILS_PATH = 'native/catalog/hermes/HermesReferenceDetails.tsx';
const VARIANT_GROUP_PATH = 'native/catalog/VariantGroup.tsx';
const HERMES_TOKEN_PROPOSAL_PATH = 'native/catalog/hermes/hermesTokenProposal.ts';
const HERMES_TOKEN_GALLERIES_PATH = 'native/catalog/hermes/HermesTokenProposalGalleries.tsx';
const HERMES_COLOR_DATA_PATH = 'native/catalog/hermes/hermesColorCatalogData.ts';
const HERMES_SEMANTIC_COLOR_REFERENCE_PATH = 'native/catalog/hermes/HermesSemanticColorReference.tsx';
const HERMES_ICON_REFERENCE_PATH = 'native/catalog/hermes/HermesIconReference.tsx';
const HERMES_ICON_SIZE_PATH = 'native/catalog/hermes/hermesIconSize.ts';
const HERMES_MOTION_REFERENCE_PATH = 'native/catalog/hermes/HermesMotionReference.tsx';
const HERMES_ICON_INVENTORY_PATH = 'native/catalog/hermes/hermesIconInventory.generated.json';
const HERMES_ICON_TRACE_PATH = 'native/catalog/hermes/hermesIconComputedSiteTrace.generated.json';
const ICON_GENERATOR_SCRIPT_PATH = 'scripts/generate-icon-previews.mjs';
const ICON_RENDERER_PACKAGE_PATH = 'icon-renderer/Package.swift';
const ICON_RENDERER_TEST_PATH = 'icon-renderer/Tests/IconRenderTests/IconRenderTests.swift';
const ICON_RENDERER_GITIGNORE_PATH = 'icon-renderer/.gitignore';
const NATIVE_PREVIEW_PACKAGE_JSON_PATH = 'native-preview/package.json';
const SIMULATOR_UDID_PATTERN = /\b[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}\b/i;
const NATIVE_PREVIEW_GITIGNORE_PATH = 'native-preview/.gitignore';

// Extracts one top-level `SectionDef` block (from its `id: '<id>',` line up to the next section's
// opening `\n  {`) out of hermesSections.tsx source text — shared by every test below that needs to
// scope an assertion to exactly one section instead of the whole file.
const extractHermesSection = (src, id) => {
  const idx = src.indexOf(`id: '${id}',`);
  assert.notEqual(idx, -1, `expected a SectionDef with id '${id}'`);
  const nextIdx = src.indexOf('\n  {', idx);
  return src.slice(idx, nextIdx === -1 ? src.length : nextIdx);
};

// Extracts a named top-level function's own body text by tracking brace depth from its first
// opening '{' to the matching '}'. Unlike extractHermesSection (which scopes to a SectionDef
// object literal's own properties — id, disposition, hermes metadata, the render reference), this
// scopes to a separately-declared gallery function's actual JSX body, since a SectionDef's `render`
// typically just references a gallery function by name and does not itself contain that function's
// content.
function extractFunctionBody(src, functionName) {
  const headerPattern = new RegExp(`function ${functionName}\\s*\\([^)]*\\)[^{]*\\{`);
  const match = src.match(headerPattern);
  assert.ok(match, `expected a function named ${functionName}`);
  const start = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start + 1, i);
    }
  }
  throw new Error(`unterminated function body for ${functionName}`);
}

// The catalog route (HermesDesignSystemCatalog.tsx) passes hermesNav/hermesSections straight
// through to CatalogShell; the actual Phase 0 audit data (ids, groups, per-entry metadata, evidence
// status) lives in hermesSections.tsx, which it imports — together they're "the Hermex catalog"
// these assertions check against.
const hermesCatalogSource = () => read(HERMES_SECTIONS_PATH) + '\n' + read(HERMES_CATALOG_PATH);

test('Hermex catalog file exists and exports the combined catalog component', () => {
  assert.ok(existsSync(path.join(ROOT, HERMES_CATALOG_PATH)), `${HERMES_CATALOG_PATH} should exist`);
  assert.ok(existsSync(path.join(ROOT, HERMES_SECTIONS_PATH)), `${HERMES_SECTIONS_PATH} should exist`);
  const src = read(HERMES_CATALOG_PATH);
  assert.match(src, /export function HermesDesignSystemCatalog/);
  assert.match(src, /title="Hermex Design System"/);
});

test('every Hermes-owned nav group begins with an approved taxonomy prefix, including a separate Native iOS group', () => {
  const hermesSrc = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = hermesSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array in hermesSections.tsx');
  const navBlock = navBlockMatch[0];
  const labels = [...navBlock.matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.equal(labels.length, 5, 'expected Foundations, Materials, Native iOS, Components, and Patterns nav groups');
  for (const label of labels) {
    assert.ok(
      label.startsWith('Foundations') || label.startsWith('Materials') || label.startsWith('Native iOS') || label.startsWith('Components') || label.startsWith('Patterns'),
      `hermesNav label "${label}" must start with an approved taxonomy prefix`,
    );
  }
});

test("the default route's sidebar order places Native iOS before Hermex Components and Patterns, using hermesNav's own group order directly with no template re-assembly", () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array in hermesSections.tsx');
  const labels = [...navBlockMatch[0].matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  const prefixOrder = ['Foundations', 'Materials', 'Native iOS', 'Components', 'Patterns'];
  assert.deepEqual(
    labels.map((label) => prefixOrder.find((prefix) => label.startsWith(prefix))),
    prefixOrder,
    "expected hermesNav's five groups ordered Foundations, Materials, Native iOS, Components, Patterns",
  );

  const catalogSrc = read(HERMES_CATALOG_PATH);
  assert.match(catalogSrc, /groups=\{hermesNav\}/, 'expected the default route to pass hermesNav directly as groups, with no filtering/re-assembly');
  assert.match(catalogSrc, /sections=\{hermesSections\}/, 'expected the default route to pass hermesSections directly as sections, with no filtering/re-assembly');
  for (const stale of ['templateComponentGroups', 'templateTokenGroups', 'const nav:', 'const sections:']) {
    assert.ok(!catalogSrc.includes(stale), `did not expect "${stale}" to remain in the default route`);
  }
});

test('no disposition-named ("Verified foundations" / "Migration candidates" / "Conditional / retained") group labels remain, and there is no separate "Overview" sidebar group', () => {
  const src = hermesCatalogSource();
  for (const stale of ['Hermex — Verified foundations', 'Hermex — Migration candidates', 'Hermex — Conditional / retained', "label: 'Overview'"]) {
    assert.ok(!src.includes(stale), `did not expect the retired group label/pattern "${stale}" to still appear`);
  }
});

test('side-panel group titles omit the redundant Hermex suffix while native and custom controls stay separated', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlock = src.match(/export const hermesNav:[^;]*;/s)?.[0] ?? '';

  assert.deepEqual(
    [...navBlock.matchAll(/label:\s*'([^']+)'/g)].map((match) => match[1]),
    ['Foundations', 'Materials', 'Native iOS', 'Components', 'Patterns'],
  );
  assert.match(navBlock, /label: 'Native iOS',\s*\n\s*ids: \['Hermes TopNav'\]/);
  assert.match(navBlock, /label: 'Components'[\s\S]*'Segmented Control'/);
  assert.doesNotMatch(src, /Hermex Segmented Control|Hermes Segmented Control/);

  const search = extractHermesSection(src, 'Search');
  assert.match(search, /\.searchable/);
  assert.match(search, /native/i);
  assert.match(search, /`\.hermexSearch/, 'expected the Search entry to document the Hermex-owned .hermexSearch wrapper');

  const segmented = extractHermesSection(src, 'Segmented Control');
  assert.match(segmented, /fixed/);
  assert.match(segmented, /scrolling/);
  assert.match(segmented, /custom Hermex/i);
  assert.match(segmented, /selection transition/i);
  assert.match(segmented, /44pt/);
  assert.doesNotMatch(segmented, /native iOS segmented Picker|\.pickerStyle\(\.segmented\)/);

  const previews = read('native/catalog/hermes/HermesComponentFamiliesPreviews.tsx');
  assert.match(previews, /export function SegmentedControlGallery/);
  assert.doesNotMatch(previews, /NativeSegmentedControlGallery|native iOS segmented Picker/);
});

test("the default route never imports or assembles CatalogExample's template nav/sections, while CatalogExample.tsx itself (used by the separate ?catalog=template route) is fully preserved", () => {
  const catalogSrc = read(HERMES_CATALOG_PATH);
  // Scoped to the actual code constructs a merge would require (an import statement, the identifiers
  // a re-assembly would declare, the literal re-label string, a rendered reference count) rather than
  // a bare "does the word template ever appear" scan, which would also flag this file's own doc
  // comment explaining that the separate ?catalog=template route exists.
  assert.doesNotMatch(catalogSrc, /from\s+'\.\.\/CatalogExample'/, 'expected no import from CatalogExample in the default route');
  assert.doesNotMatch(catalogSrc, /\btemplateNav\b|\btemplateSections\b|\bTemplateSectionId\b/, 'expected no template nav/sections identifiers in the default route');
  assert.doesNotMatch(catalogSrc, /Template library \(not adopted\)/, 'expected no "Template library" label assembled into the default route');
  assert.doesNotMatch(catalogSrc, /\d+ template references?/i, 'expected no template-reference count in the default route\'s subtitle');

  // CatalogExample.tsx itself, and its own nav, remain fully intact for the separate ?catalog=template route.
  const templateSrc = read(CATALOG_EXAMPLE_PATH);
  const templateNavBlockMatch = templateSrc.match(/export const nav:[^;]*;/s);
  assert.ok(templateNavBlockMatch, 'expected an exported nav array in CatalogExample.tsx, unchanged');
  const originalLabels = [...templateNavBlockMatch[0].matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(originalLabels.length >= 10, `expected the template's own full set of nav groups preserved, found ${originalLabels.length}`);
  assert.ok(originalLabels.includes('Reference'), 'expected the template\'s own "Reference" nav group (Manifest page) preserved');
});

test('CatalogShell exposes an intro slot rendered above the first nav group, and the Hermex audit overview is rendered through it — not as its own nav entry', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  assert.match(shellSrc, /intro\?:\s*\(\)\s*=>\s*React\.ReactNode/, 'expected CatalogShell to accept an optional `intro` render prop');
  assert.match(shellSrc, /\{intro\s*&&\s*<View[^>]*>\{intro\(\)\}<\/View>\}/, 'expected CatalogShell to render `intro()` above the groups');

  const hermesSectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(hermesSectionsSrc, /export function HermesOverview/, 'expected hermesSections.tsx to export a standalone HermesOverview component');
  assert.ok(!hermesSectionsSrc.includes("id: 'Hermex Overview'"), 'the overview must not also be registered as its own SectionDef/nav entry');

  const catalogSrc = read(HERMES_CATALOG_PATH);
  assert.match(catalogSrc, /intro=\{\(\)\s*=>\s*<HermesOverview\s*\/>\}/, 'expected HermesDesignSystemCatalog to pass HermesOverview into CatalogShell\'s intro slot');
});

test('Hermex reference metadata and accessible disclosure path exist, and the temporary Task 1 audit-panel compatibility path is fully removed', () => {
  const typesSrc = read(TYPES_PATH);
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  const sectionBlockSrc = read(SECTION_BLOCK_PATH);

  assert.match(typesSrc, /export interface HermesReferenceDestination/);
  assert.match(typesSrc, /screen:\s*string/);
  assert.match(typesSrc, /path\?:\s*string/);
  assert.match(typesSrc, /effect:\s*string/);
  assert.match(typesSrc, /export interface HermesReferenceMeta/);
  assert.match(typesSrc, /useSummary\?:\s*string/);
  assert.match(typesSrc, /usedIn\?:\s*HermesReferenceDestination\[\]/);
  assert.match(typesSrc, /implementationNotes\?:\s*HermesImplementationNotes/);
  assert.match(typesSrc, /hermesReference\?:\s*HermesReferenceMeta/);
  assert.match(typesSrc, /path\?:\s*string/);
  assert.doesNotMatch(typesSrc, /HermesAudit|HermesDisposition|HermesEvidenceLevel/);

  assert.match(detailsSrc, /accessibilityRole="button"/);
  assert.match(detailsSrc, /accessibilityState=\{\{\s*expanded\s*\}\}/);
  assert.match(detailsSrc, /<AnimatedChevron/);
  assert.match(detailsSrc, /Where it appears/);
  assert.match(detailsSrc, /Implementation notes/);
  assert.match(sectionBlockSrc, /def\.hermesReference/);
  assert.match(sectionBlockSrc, /<HermesReferenceDetails/);
  assert.doesNotMatch(sectionBlockSrc, /HermesAuditPanel/);

  assert.ok(!existsSync(path.join(ROOT, 'native/catalog/hermes/HermesAuditPanel.tsx')), 'Task 2 removes the temporary audit panel once every entry migrates to hermesReference');
});

// Controller-found ambiguity (2026-09-21 follow-up): "adopted production namespace"/"adopted
// production scale"/"adopted production Swift" reads as a release-status claim ("production" as in
// "shipped to production"), not the intended "non-test Swift source" meaning — even though the
// per-family evidence text elsewhere already correctly scopes adoption to the local implementation
// branch. UI-facing labels/descriptions for the five locally-adopted token families (HermesColorRamp,
// HermesMotion, HermesSpacing, HermesRadius, HermesShadow) must say "adopted local implementation
// namespace/scale" or "adopted in the verified local implementation branch" instead. "production
// Swift source" remains fine where it unambiguously means non-test app code, never adoption/release
// status — this test only bans the specific ambiguous "adopted production ..." constructions.
test('UI-facing catalog text never describes a locally adopted token family as "adopted production namespace", "adopted production scale", or "adopted production Swift"', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(
    src,
    /adopted production\s+(?:[\w/]+\s+)?(?:namespace|scale)/i,
    'must not describe HermesColorRamp/HermesMotion/HermesSpacing/HermesRadius/HermesShadow as an "adopted production namespace/scale" — that reads as release status, not "adopted in the verified local implementation branch"',
  );
  assert.doesNotMatch(
    src,
    /adopted production Swift\b/i,
    'must not describe adopted ramp/token values as "adopted production Swift" — that reads as release status',
  );
});

test('catalog implementation status describes the in-repository foundation-only candidate without mutable branch or publication claims', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.match(src, /foundation-only\s+Design System candidate/i);
  assert.match(src, /Production-screen adoption is intentionally\s+excluded from this slice/i);
  assert.match(src, /design-system-catalog\//);
  assert.doesNotMatch(src, /issue\/607-shared-design-system|issue\/607-foundation-base/);
  assert.doesNotMatch(src, /contributor-fork branch|current migration candidate|no pull request|TestFlight upload|release, or deployment/i);
  assert.doesNotMatch(
    src,
    /maintained outside the Git worktree/i,
    'the catalog moved in-repository (design-system-catalog/) and must no longer claim to be maintained outside the Git worktree',
  );
  assert.match(
    src,
    /versioned\s+under[\s\S]{0,60}design-system-catalog\/[\s\S]{0,150}Design System Contract/i,
    'expected the overview to name design-system-catalog/ as the versioned in-repository path, validated by the Design System Contract CI job',
  );
});

test('App.tsx titles the default route exactly "Hermex Design System" and preserves ?catalog=framework/template routes', () => {
  const src = read(APP_PATH);
  assert.match(src, /'Hermex Design System'/);
  assert.match(src, /catalog=framework/);
  assert.match(src, /catalog=template/);
  assert.match(src, /HermesDesignSystemCatalog/);
  assert.match(src, /CatalogFrameworkExample/);
  assert.match(src, /CatalogExample/);
});

// Regression guard for the narrow-viewport defect (390x844: fixed 240px sidebar beside main left
// ~150px, wrapping the page title character-by-character, columns staying horizontal). Text-based,
// like the rest of this file — there's no RN test renderer set up — but pinned to the actual
// mechanism (a shared breakpoint token, each framework file switching layout below it) so the
// responsive seam can't be quietly deleted from just one of the three files, or the breakpoint
// silently dropped from tokens.ts, without failing this test. Applies to all three routes (default
// Hermex, ?catalog=template, ?catalog=framework) because all three render through this one shared
// CatalogShell/CatalogSidebar/SectionBlock framework, not a per-catalog layout.
test('the shared catalog framework defines and applies a narrow-viewport breakpoint on all three routes\' layout (sidebar, main padding, section columns)', () => {
  const tokensSrc = read(TOKENS_PATH);
  assert.match(
    tokensSrc,
    /export const CATALOG_NARROW_BREAKPOINT\s*=\s*\d+/,
    'expected a shared CATALOG_NARROW_BREAKPOINT export in tokens.ts',
  );

  const shellSrc = read(CATALOG_SHELL_PATH);
  assert.match(shellSrc, /useWindowDimensions/, 'CatalogShell should read the viewport width');
  assert.match(shellSrc, /CATALOG_NARROW_BREAKPOINT/, 'CatalogShell should compare against the shared breakpoint');
  assert.match(
    shellSrc,
    /rootNarrow:\s*\{\s*flexDirection:\s*'column'/,
    "CatalogShell should stack sidebar-above-main (flexDirection: 'column') below the breakpoint",
  );
  // "approximately 16-24px horizontal padding" (acceptance criteria) — pinned to the actual numeric
  // range, not just "some smaller value", so a future edit can't silently pad it back out to the
  // desktop's 48px (which is what caused the original defect) while still passing a looser check.
  const mainPaddingMatch = shellSrc.match(/mainContentNarrow:\s*\{[^}]*paddingHorizontal:\s*(\d+)/);
  assert.ok(mainPaddingMatch, 'CatalogShell should define a narrow-viewport main content padding override');
  const mainPadding = Number(mainPaddingMatch[1]);
  assert.ok(
    mainPadding >= 16 && mainPadding <= 24,
    `expected narrow-viewport main content horizontal padding within 16-24px, got ${mainPadding}`,
  );

  const sidebarSrc = read(CATALOG_SIDEBAR_PATH);
  assert.match(sidebarSrc, /useWindowDimensions/, 'CatalogSidebar should read the viewport width');
  assert.match(sidebarSrc, /CATALOG_NARROW_BREAKPOINT/, 'CatalogSidebar should compare against the shared breakpoint');
  assert.match(
    sidebarSrc,
    /sidebarNarrow:\s*\{[^}]*width:\s*'100%'/,
    'CatalogSidebar should become full-width (not the fixed 240px desktop sidebar) below the breakpoint',
  );
  assert.match(
    sidebarSrc,
    /sidebarNarrow:\s*\{[^}]*maxHeight:\s*\d+/,
    'CatalogSidebar should bound its own height (not the desktop 100vh sticky sidebar) below the breakpoint, so it reads as a top region, not the whole screen',
  );

  const sectionBlockSrc = read(SECTION_BLOCK_PATH);
  assert.match(sectionBlockSrc, /useWindowDimensions/, 'SectionBlock should read the viewport width');
  assert.match(sectionBlockSrc, /CATALOG_NARROW_BREAKPOINT/, 'SectionBlock should compare against the shared breakpoint');
  assert.match(
    sectionBlockSrc,
    /columnsRowNarrow:\s*\{\s*flexDirection:\s*'column'/,
    "SectionBlock should stack its visual-example and reference-content columns (flexDirection: 'column') below the breakpoint",
  );
});

test('SectionBlock uses the approved two-column documentation hierarchy: wide Variants/States primary column, narrow Props secondary column (plus Accessibility for a non-Hermex/template section only — a Hermex reference entry moves Accessibility to its own lower supporting card instead)', () => {
  const src = read(SECTION_BLOCK_PATH);

  assert.match(
    src,
    /const primaryBlocks: BlockDef\[\] = \[[\s\S]*label: 'Variants'[\s\S]*label: 'States \/ Configurations'/,
    'expected Variants and States / Configurations to stack in the primary column',
  );
  assert.match(
    src,
    /const secondaryBlocks: BlockDef\[\] = \[[\s\S]*label: 'Props'/,
    'expected Props to render in the secondary column',
  );
  assert.match(
    src,
    /const secondaryBlocks: BlockDef\[\] = \[[\s\S]*hide\.accessibility\s*\|\|\s*isHermexReference[\s\S]*label: 'Accessibility'/,
    'expected the secondary-column Accessibility block to be skipped for a Hermex reference entry (isHermexReference), not just when explicitly hidden — it moves to the lower supporting row instead',
  );
  assert.match(
    src,
    /primaryColumn:\s*\{[^}]*flex:\s*2[^}]*\}/,
    'expected the visual-example primary column to receive the wider two-thirds share',
  );
  assert.match(
    src,
    /secondaryColumn:\s*\{[^}]*flex:\s*1[^}]*\}/,
    'expected the reference-content secondary column to receive the narrower one-third share',
  );
  assert.doesNotMatch(src, /columnWide/, 'the superseded three-column Props-width special case should be removed');
});

test('SectionBlock computes a11yContent (with its truthful "No accessibility notes documented." fallback) before the tokenGallery early return, so a token-gallery Hermex entry (e.g. Hermex Colors) can still pass it into its lower Accessibility card', () => {
  const src = read(SECTION_BLOCK_PATH);
  const a11yContentIdx = src.indexOf('const a11yContent');
  const tokenGalleryReturnIdx = src.indexOf('if (def.tokenGallery)');
  assert.ok(a11yContentIdx > -1, 'expected a11yContent to be computed in SectionBlock');
  assert.ok(tokenGalleryReturnIdx > -1, 'expected the def.tokenGallery early return in SectionBlock');
  assert.ok(
    a11yContentIdx < tokenGalleryReturnIdx,
    'expected a11yContent to be computed before the def.tokenGallery early return, not after it',
  );
});

test('SectionBlock passes a11yContent into HermesReferenceDetails as accessibilityContent, for both the tokenGallery and the general component branch', () => {
  const src = read(SECTION_BLOCK_PATH);
  const passages = [...src.matchAll(/<HermesReferenceDetails\s+meta=\{def\.hermesReference!\}\s+accessibilityContent=\{a11yContent\}\s*\/>/g)];
  assert.ok(passages.length >= 1, 'expected <HermesReferenceDetails meta={def.hermesReference!} accessibilityContent={a11yContent} /> to appear (shared by both the tokenGallery and general-section return paths)');
});

test('native-preview/dist/index.html restores the react-native-web root height/overflow reset', () => {
  const html = read(DIST_INDEX_HTML_PATH);
  assert.match(html, /html,\s*\n?\s*body\s*\{\s*\n?\s*height:\s*100%;/, 'expected html/body to be reset to full height');
  assert.match(html, /body\s*\{\s*\n?\s*overflow:\s*hidden;/, 'expected body overflow to be reset to hidden');
  assert.match(html, /#root\s*\{[^}]*height:\s*100%;[^}]*flex:\s*1;/s, 'expected #root to be reset to a flexed, full-height element');
});

test('CatalogShell resolves the real web scrolling element (nested overflow scroller when it genuinely overflows, otherwise document.scrollingElement), gives sections stable DOM anchors, and binds scroll-spy to the resolved element', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  // Stable per-section web anchor.
  assert.match(shellSrc, /nativeID=\{sectionAnchorId\(def\.id\)\}/, 'expected each section wrapper to carry a stable nativeID anchor');
  assert.match(shellSrc, /function sectionAnchorId/);

  // Scroller-fallback resolution: trust the nested node only when it actually overflows, else fall
  // back to document.scrollingElement.
  assert.match(shellSrc, /function resolveWebScrollElement/);
  assert.match(shellSrc, /scrollHeight\s*>\s*.*clientHeight/, 'expected a real-overflow check before trusting the nested ScrollView node');
  assert.match(shellSrc, /document\.scrollingElement/, 'expected a document.scrollingElement fallback');

  // scrollTo computes the target from the anchor DOM node, then scrolls the *resolved* element.
  assert.match(shellSrc, /getAnchorOffset\(sectionAnchorId\(id\), scrollElement\)/);
  assert.match(shellSrc, /scrollElement\.scrollTop\s*=/, 'expected scrollTo to move the resolved scroll element, not always the nested ScrollView node');

  // Scroll-spy is bound to the same resolved element via a real DOM listener, not just RN's
  // `onScroll` prop (which is wired to the nested node and never fires when the document scrolls).
  assert.match(shellSrc, /resolveWebScrollElement\(scrollRef\)/g);
  assert.match(shellSrc, /addEventListener\('scroll',\s*handleWebScroll/);

  // Native's own offset/scrollTo path is untouched.
  assert.match(shellSrc, /scrollRef\.current\?\.scrollTo\(\{\s*y:/, 'expected the native ScrollView.scrollTo offset path to still exist');
  assert.match(shellSrc, /if \(Platform\.OS === 'web'\) return;/, 'expected the native onScroll handler to explicitly sit out on web, deferring to the DOM scroll-spy listener');
});

// Regression contract for the frozen-scroll-spy defect: a fresh load highlighted AppFont at
// 1440x900, then a script set the real nested ScrollView's scrollTop to Hermex Colors — after 1s
// AppFont was still shown active. Root cause: the scroll-spy effect resolved
// `resolveWebScrollElement(scrollRef)` exactly once at mount and captured that single element into
// its `handleWebScroll` closure — if the nested node wasn't yet measurably overflowing on that
// first effect run (its content may not have finished laying out), the effect permanently listens
// on `document` instead, and a nested `overflow: auto` scroll never bubbles a `scroll` event up to
// `document`, so scroll-spy silently stops updating forever once layout settles. Click-to-scroll
// was unaffected because `scrollTo` already re-resolves the scroll element fresh on every call.
test('web scroll-spy re-resolves the active scroll element on every scroll event (not once at mount) and binds listeners to both the nested node and document, independent of which one overflows at mount', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  const effectMatch = shellSrc.match(/useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[\]\);/);
  assert.ok(effectMatch, 'expected a mount-effect wiring up the web scroll-spy listener(s) in CatalogShell.tsx');
  const effectBlock = effectMatch[0];

  // The handler itself must resolve the active scroll element fresh on every invocation — not close
  // over a single element resolved once, outside the handler, when the effect first ran. This is
  // the actual defect: extracting just `handleWebScroll`'s own function body and asserting the
  // resolve call happens *inside* it (not merely somewhere earlier in the same effect) is what
  // fails against the frozen-at-mount implementation.
  const handlerMatch = effectBlock.match(/const handleWebScroll = \(\) => \{[\s\S]*?\n {4}\};/);
  assert.ok(handlerMatch, 'expected a `handleWebScroll` handler defined inside the scroll-spy effect');
  assert.match(
    handlerMatch[0],
    /resolveWebScrollElement\(scrollRef\)/,
    'handleWebScroll must re-resolve the active scroll element on every event, not read a value captured once when the effect first ran (the frozen-scroll-spy defect)',
  );

  // A listener must be attached directly to the nested ScrollView node itself (not only reachable
  // through resolveWebScrollElement's own internal overflow heuristic) — otherwise, if that node
  // isn't yet the "resolved" element at mount, nothing is ever listening to it once it does become
  // the real scroller, since its own `overflow: auto` scroll never bubbles to `document`.
  assert.match(
    effectBlock,
    /getNestedScrollNode\(scrollRef\)/,
    'expected the effect to bind directly to the nested ScrollView node via getNestedScrollNode, independent of the mount-time overflow check',
  );
  assert.match(
    effectBlock,
    /addEventListener\('scroll',\s*handleWebScroll/,
  );
  assert.match(
    effectBlock,
    /document\.addEventListener\('scroll',\s*handleWebScroll/,
    'expected a listener on document as well, since the nested node may not be the real scroller yet at mount',
  );

  // Deferred rebind after a layout tick (requestAnimationFrame), not a poll — covers the case where
  // the nested node's ref wasn't attached/measurable at all on the very first effect run.
  assert.match(effectBlock, /requestAnimationFrame\(/, 'expected a one-shot requestAnimationFrame-deferred rebind, not a polling interval');
  assert.doesNotMatch(effectBlock, /setInterval\(/, 'scroll-spy rebinding must not poll on an interval');

  // Cleanup must tear down everything this effect bound: both listeners and the deferred rAF.
  assert.match(effectBlock, /cancelAnimationFrame\(/, 'expected the deferred requestAnimationFrame callback to be cancelled on cleanup');
  assert.match(effectBlock, /removeEventListener\('scroll',\s*handleWebScroll\)/, 'expected listener cleanup on unmount');
  assert.match(
    effectBlock,
    /document\.removeEventListener\('scroll',\s*handleWebScroll(?:,[^)]*)?\)/,
    'expected the document listener to be cleaned up on unmount too (options argument shape is pinned down more precisely by the capture-mode test below)',
  );
});

// Correction 1 (2026-09-18): controller-observed runtime failure — a real nested overflow scroller
// (scrollHeight 67628, clientHeight 900, overflow-y:auto) dispatched a `scroll` event that neither
// the effect's own nested-node reference nor `document` ever received, so scroll-spy stayed frozen
// on AppFont after a controller-driven scroll to Hermex Spacing. The source-text contract above
// already required *a* nested-node listener and a document listener; it did not require binding
// directly to whatever `resolveWebScrollElement` itself currently resolves to (which self-corrects
// between the nested node and `document.scrollingElement` as layout settles, unlike a raw
// `getNestedScrollNode` reference captured once per bind attempt) — this test closes that gap.
test('web scroll-spy binds directly to whatever resolveWebScrollElement(scrollRef) currently resolves to (not only getNestedScrollNode and document), dedupes bound elements via a Set, and cleans up every one without polling', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  const effectMatch = shellSrc.match(/useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[\]\);/);
  assert.ok(effectMatch, 'expected a mount-effect wiring up the web scroll-spy listener(s) in CatalogShell.tsx');
  const effectBlock = effectMatch[0];

  // The bind logic itself (outside handleWebScroll, which already re-resolves for its own position
  // math) must call resolveWebScrollElement(scrollRef) again to decide what to *attach* a listener
  // to — extracted as its own named function so this is unambiguous from a bare "appears somewhere
  // in the effect" scan (handleWebScroll's own body already contains one legitimate call).
  const bindFnMatch = effectBlock.match(/const bind\w+ = \(\) => \{[\s\S]*?\n {4}\};/);
  assert.ok(bindFnMatch, 'expected a named bind function (attaching listeners) inside the scroll-spy effect, separate from handleWebScroll');
  assert.match(bindFnMatch[0], /getNestedScrollNode\(scrollRef\)/, 'expected the bind function to still attach to the raw nested ScrollView node');
  assert.match(
    bindFnMatch[0],
    /resolveWebScrollElement\(scrollRef\)/,
    'expected the bind function to ALSO attach directly to whatever resolveWebScrollElement(scrollRef) currently resolves to, not only the raw nested node',
  );

  // Deduplicated tracking/cleanup: a Set of every HTMLElement actually bound, so the same physical
  // element (the common case: the nested node IS what resolveWebScrollElement resolves to) is never
  // double-bound, and cleanup can remove precisely what was attached.
  assert.match(effectBlock, /new Set(?:<[^>]*>)?\(\)/, 'expected a Set tracking every bound HTMLElement');
  assert.match(effectBlock, /\.has\(/, 'expected the bind function to check the Set before attaching (dedup)');
  assert.match(effectBlock, /\.add\(/, 'expected the bind function to record each newly-bound element in the Set');

  // Cleanup must remove the listener from every element the Set tracked — not just one hardcoded
  // reference — plus the always-present document listener and the deferred rAF.
  assert.match(
    effectBlock,
    /\.forEach\(|for\s*\(const\s+\w+\s+of\s+\w+\)/,
    'expected cleanup to iterate every bound element (Set#forEach or a for..of loop), not a single hardcoded reference',
  );
  assert.match(effectBlock, /cancelAnimationFrame\(/);
  assert.match(
    effectBlock,
    /document\.removeEventListener\('scroll',\s*handleWebScroll(?:,[^)]*)?\)/,
    'expected a document listener removal (options argument shape is pinned down more precisely by the capture-mode test below)',
  );

  // Still no polling.
  assert.doesNotMatch(effectBlock, /setInterval\(/, 'scroll-spy rebinding must not poll on an interval');
});

// Correction 2 (2026-09-18): CDP-confirmed runtime diagnosis — the real late-overflowing nested
// scroller only ever picks up React Native Web's own listener (Correction 1's direct-element
// binding attempt runs before that scroller exists/overflows), and a plain bubbling-phase document
// listener can never observe its `scroll` events anyway, since `scroll` does not bubble. A capture-
// phase document listener DOES observe it (confirmed: `captureSeen: 1` for an explicit non-bubbling
// scroll dispatched on that exact late scroller), because capture listeners on an ancestor run
// during the event's capture phase, before target dispatch — independent of bubbling. This test
// requires the document listener to use capture mode, with matching add/remove options (capture
// mode must match exactly for `removeEventListener` to actually detach the same listener).
test('the document scroll-spy fallback listener is registered and removed in capture mode (not bubbling), so it can observe a late-overflowing nested scroller\'s non-bubbling scroll events', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  const effectMatch = shellSrc.match(/useEffect\(\(\) => \{[\s\S]*?\n {2}\}, \[\]\);/);
  assert.ok(effectMatch, 'expected a mount-effect wiring up the web scroll-spy listener(s) in CatalogShell.tsx');
  const effectBlock = effectMatch[0];

  const addMatch = effectBlock.match(/document\.addEventListener\('scroll',\s*handleWebScroll,\s*([^)]*)\)/);
  assert.ok(addMatch, 'expected document.addEventListener(\'scroll\', handleWebScroll, <options>) with an explicit options argument');
  assert.match(addMatch[1], /capture:\s*true|^\s*true\s*$/, 'expected the document scroll listener to be registered with capture: true (or a bare `true` third argument)');

  const removeMatch = effectBlock.match(/document\.removeEventListener\('scroll',\s*handleWebScroll,\s*([^)]*)\)/);
  assert.ok(removeMatch, 'expected document.removeEventListener(\'scroll\', handleWebScroll, <options>) with a matching options argument — capture mode must match exactly for the listener to actually be removed');
  assert.match(removeMatch[1], /capture:\s*true|^\s*true\s*$/, 'expected the document scroll listener removal to also specify capture: true (or bare `true`), matching the add call');

  // Preserved from Correction 1: direct-element binding/dedup, programmatic-scroll guard, fresh
  // per-event resolution, no polling.
  assert.match(effectBlock, /new Set(?:<[^>]*>)?\(\)/, 'expected Correction 1\'s bound-element Set to still be present');
  assert.match(effectBlock, /getNestedScrollNode\(scrollRef\)/);
  assert.match(effectBlock, /resolveWebScrollElement\(scrollRef\)/);
  assert.match(effectBlock, /isProgrammaticScroll\.current/, 'expected the programmatic-scroll guard to still be present');
  assert.doesNotMatch(effectBlock, /setInterval\(/, 'scroll-spy rebinding must not poll on an interval');
});

test('Hermex source-evidence Tokens are built from the original template building blocks (TypeScaleGallery, Swatch, TokenRow, VariantGroup, DividedStack) and use the existing tokenGallery/fullWidthLabel seams', () => {
  const src = read(HERMES_SECTIONS_PATH);
  for (const building of ['TypeScaleGallery', 'Swatch', 'TokenRow', 'VariantGroup', 'DividedStack']) {
    assert.match(src, new RegExp(`import \\{ ${building} \\} from '\\.\\./${building}'`), `expected hermesSections.tsx to import the original ${building} building block`);
  }
  assert.match(src, /tokenGallery:\s*true/);
  assert.match(src, /fullWidthLabel:/);
});

test('Hermex proposal uses the retained template token galleries (including SpacingScaleGallery) and never claims production adoption', () => {
  const sections = read(HERMES_SECTIONS_PATH);
  const galleries = read(HERMES_TOKEN_GALLERIES_PATH);
  assert.ok(existsSync(path.join(ROOT, HERMES_TOKEN_PROPOSAL_PATH)), `${HERMES_TOKEN_PROPOSAL_PATH} should exist`);
  assert.ok(existsSync(path.join(ROOT, HERMES_TOKEN_GALLERIES_PATH)), `${HERMES_TOKEN_GALLERIES_PATH} should exist`);
  for (const building of ['TypeScaleGallery', 'TokenRow', 'VariantGroup', 'DividedStack', 'SpacingScaleGallery']) {
    assert.match(galleries, new RegExp(`import \\{ ${building} \\} from '\\.\\./${building}'`), `expected HermesTokenProposalGalleries.tsx to import the original ${building} building block`);
  }
  assert.match(sections + galleries, /Proposed — not yet adopted/);
  assert.doesNotMatch(sections + galleries, /adopted production token system/i);
});

// ─── Approved normalized token proposal contracts (2026-09-18 implementation plan) ──────────────
// hermesTokenProposal.ts is the sole data source for these; HermesTokenProposalGalleries.tsx must
// render every fact it asserts here. Values are copied verbatim from the approved design spec.

// ─── Color adoption contracts (family plan 02's CO-3) ────────────────────────────────────────────

test('hermesColorCatalogData.ts defines the exact 9 color ramps, 11 steps each (99 values), with the exact 500 source anchors, the still-live spec §4.1 consumption restriction rendered by HermesColorRampGallery, and no dependency on the proposal module', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /import\s*\{[^}]*HERMES_COLOR_RAMPS[^}]*\}\s*from\s*'\.\/hermesColorCatalogData'/, 'must import the adopted ramp data from hermesColorCatalogData.ts, never hermesTokenProposal.ts');
  assert.doesNotMatch(
    sectionsSrc,
    /import\s*\{[^}]*(?:HERMES_COLOR_RAMPS|HERMES_COLOR_RAMP_STEPS|HERMES_SEMANTIC_COLORS)[^}]*\}\s*from\s*'\.\/hermesTokenProposal'/,
    'Color ramp/semantic data must never be imported from the proposal module',
  );
  const gallery = extractFunctionBody(sectionsSrc, 'HermesColorRampGallery');
  assert.match(gallery, /Object\.keys\(HERMES_COLOR_RAMPS\)\.map/, 'must iterate every ramp key, not a hardcoded list of ramp names');
  assert.match(gallery, /HERMES_COLOR_RAMP_STEPS\.map/, 'must iterate every step, not a hardcoded list of steps');
  assert.doesNotMatch(gallery, /ProposalStatus|Proposed — not yet adopted|proposed generated value/i, 'the adopted ramp gallery must carry no retired proposal-status language');
  assert.match(gallery, /HERMES_COLOR_GENERATED_STEP_CONSUMPTION_RESTRICTION/, 'the ramp gallery must render the consumption restriction, not merely a pinning claim');

  const adoptedDataSrc = read('native/catalog/hermes/hermesColorCatalogData.ts');
  assert.match(adoptedDataSrc, /export const HERMES_COLOR_RAMP_STEPS = \[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950\] as const;/, 'exactly 11 steps in the adopted data this gallery iterates over');
  for (const name of ['Neutral', 'Gold', 'Blue', 'Purple', 'Red', 'Green', 'Orange', 'Cyan', 'Pink']) {
    assert.match(adoptedDataSrc, new RegExp(`\\b${name}:\\s*\\{ 50:`), `HERMES_COLOR_RAMPS must define the ${name} ramp (9 total, verified by name)`);
  }
  for (const anchor of ['#8E8E93', '#FFD700', '#5B7CFF', '#AF52DE', '#FF3B30', '#34C759', '#FB923C', '#67E8F9', '#F472B6']) {
    assert.ok(adoptedDataSrc.includes(anchor), `expected the 500 anchor ${anchor} preserved byte-for-byte`);
  }
  assert.match(
    adoptedDataSrc,
    /No production UI pairing may consume a generated \(non-500\) step until that specific pairing has passed contrast validation/,
    'expected the truthful adopted-state form of spec §4.1\'s restriction, naming consumption (not adoption) as the gate',
  );
  assert.doesNotMatch(adoptedDataSrc, /from\s*'\.\/hermesTokenProposal'/, 'hermesColorCatalogData.ts must not import anything from the proposal module');
});

test('Hermex Colors section includes the product-palette sub-block with all 14 named HermesProductPalette constants', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const gallery = extractFunctionBody(src, 'HermesProductPaletteGallery');
  assert.match(gallery, /headerAccentYellow/);
  assert.match(gallery, /headerAccentWhite/);
  assert.match(gallery, /projectViolet/);
  assert.match(gallery, /projectPink/);
});

test('the superseded Color-only proposal gallery implementation is deleted from HermesTokenProposalGalleries.tsx, not merely left as dead code, while every other family\'s still-unadopted proposal gallery and shared plumbing survive', () => {
  const proposalGalleriesSrc = read(HERMES_TOKEN_GALLERIES_PATH);
  assert.doesNotMatch(proposalGalleriesSrc, /function ColorRampGroup/, 'ColorRampGroup was Color-only and must be deleted, not left as dead code');
  assert.doesNotMatch(proposalGalleriesSrc, /export function HermesColorsProposalGallery/, 'HermesColorsProposalGallery was Color-only and must be deleted, not left as dead code');
  assert.doesNotMatch(proposalGalleriesSrc, /HERMES_COLOR_RAMPS|HERMES_COLOR_RAMP_STEPS|HERMES_COLOR_GENERATED_STEP_WARNING|HERMES_SEMANTIC_COLORS/, 'the four Color-only data imports must be removed once their only consumers are deleted');
  assert.match(proposalGalleriesSrc, /function ProposalStatus/, 'shared plumbing used by the other five proposal galleries must survive');
  assert.match(proposalGalleriesSrc, /export function AppFontProposalGallery/);
  assert.match(proposalGalleriesSrc, /export function HermesMotionProposalGallery/);
  assert.match(proposalGalleriesSrc, /export function HermesSpacingProposalGallery/);
  // HermesGeometryProposalGallery is deleted by family plan 04's SR-8 (R11 correction) — its own
  // absence is now asserted by this file's separate dead-gallery-regression test (item 5 above),
  // not by this test, which continues to guard the four proposal galleries that remain unadopted.
  assert.match(proposalGalleriesSrc, /export function HermesTokenCoverageGallery/);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /HermesColorsProposalGallery/, 'no reference to the retired HermesColorsProposalGallery may remain anywhere in hermesSections.tsx, including the import list');
});

test('the Color ramp/semantic data and its retired proposal-only companions are removed from hermesTokenProposal.ts entirely, moved (not duplicated, and with no dependency on the proposal module) into hermesColorCatalogData.ts, and the module header no longer claims Color is still a proposal', () => {
  const proposalDataSrc = read(HERMES_TOKEN_PROPOSAL_PATH);
  assert.doesNotMatch(proposalDataSrc, /HERMES_COLOR_RAMPS/, 'HERMES_COLOR_RAMPS must be moved out of hermesTokenProposal.ts, not duplicated');
  assert.doesNotMatch(proposalDataSrc, /HERMES_COLOR_RAMP_STEPS/, 'HERMES_COLOR_RAMP_STEPS must be moved out of hermesTokenProposal.ts, not duplicated');
  assert.doesNotMatch(proposalDataSrc, /HERMES_COLOR_GENERATED_STEP_WARNING/, 'this exact symbol is deleted here because its requirement has a renamed adopted-state successor (HERMES_COLOR_GENERATED_STEP_CONSUMPTION_RESTRICTION in hermesColorCatalogData.ts), not because the requirement itself has no successor');
  assert.doesNotMatch(proposalDataSrc, /HERMES_SEMANTIC_COLORS/, 'this exact symbol/name is deleted here because its 13 genuinely-true facts move to a new, differently-named export in hermesColorCatalogData.ts while 3 proposal-only roles are explicitly retired — not because semantic-color facts have no successor at all');
  assert.doesNotMatch(proposalDataSrc, /SemanticColorFact/, 'its supporting type must be deleted alongside it');
  assert.doesNotMatch(proposalDataSrc, /does not currently have/i, 'the module header must no longer claim every value here (including Color, now adopted) lacks production Swift');
  assert.doesNotMatch(proposalDataSrc, /still awaiting adoption/i, 'Finding N10: the header must not make an absolute snapshot claim that goes false the moment a later family (e.g. Typography, already adopted via TY-5) leaves its own data block physically present here');

  const adoptedDataSrc = read('native/catalog/hermes/hermesColorCatalogData.ts');
  assert.match(adoptedDataSrc, /export const HERMES_COLOR_RAMPS: Record<string, HermesColorRamp> = \{/, 'the ramp data must exist, byte-for-byte, in its new adopted-state home');
  assert.match(adoptedDataSrc, /Gold: \{ 50: '#FFFDF2', 100: '#FFFAE0', 200: '#FFF4B8', 300: '#FFEC85', 400: '#FFE247', 500: '#FFD700', 600: '#E6C200', 700: '#C4A600', 800: '#9E8500', 900: '#786500', 950: '#524500' \}/);
  assert.match(adoptedDataSrc, /Pink: \{ 50: '#FEF8FB', 100: '#FEEEF6', 200: '#FCD8EB', 300: '#FABBDC', 400: '#F799CA', 500: '#F472B6', 600: '#DC67A4', 700: '#BC588C', 800: '#974771', 900: '#733656', 950: '#4E243A' \}/);
  assert.match(adoptedDataSrc, /export type HermesColorCatalogClassification/, 'expected a new, local, Color-only classification type');
  assert.doesNotMatch(adoptedDataSrc, /ProposalClassification/, 'must not import or reference the proposal module\'s classification type');
  assert.doesNotMatch(adoptedDataSrc, /from\s*'\.\/hermesTokenProposal'/, 'hermesColorCatalogData.ts must have zero imports from the proposal module');
});

test('the proposal galleries render the required classification labels, including for source/proposed/migration/retained/platform-owned facts', () => {
  const galleries = read(HERMES_TOKEN_GALLERIES_PATH);
  for (const label of [
    'Current production evidence',
    'Proposed — not yet adopted',
    'Migration candidate',
    'Retained component exception',
    'Platform-owned adaptive token',
  ]) {
    assert.ok(galleries.includes(label), `expected the classification label "${label}" to be rendered`);
  }
});

test('hermesTokenProposal.ts defines the exact core type primitives (12/14/16/18, line heights 16/20/22/24, regular+bold), semantic aliases, retained title hierarchy, and the equal-number preview disclaimer', () => {
  const proposal = read(HERMES_TOKEN_PROPOSAL_PATH);
  const primitivePairs = [['12', 16], ['14', 20], ['16', 22], ['18', 24]];
  for (const [size, lineHeight] of primitivePairs) {
    assert.ok(proposal.includes(`'font.${size}'`), `expected primitive font.${size}`);
    assert.ok(proposal.includes(`sizePt: ${size}`), `expected sizePt ${size}`);
    assert.ok(proposal.includes(`lineHeightPt: ${lineHeight}`), `expected lineHeightPt ${lineHeight}`);
  }
  assert.match(proposal, /weights:\s*\[?'regular',\s*'bold'\]?/);
  for (const alias of ['type.caption', 'type.footnote', 'type.subtext', 'type.body', 'type.headline', 'type.title.4']) {
    assert.ok(proposal.includes(`'${alias}'`), `expected semantic alias '${alias}'`);
  }
  const titlePairs = [['type.title.3', 20, 25], ['type.title.2', 22, 28], ['type.title.1', 28, 34]];
  for (const [alias, size, lineHeight] of titlePairs) {
    assert.ok(proposal.includes(`'${alias}'`), `expected title alias '${alias}'`);
    assert.ok(proposal.includes(`sizePt: ${size}`), `expected title sizePt ${size}`);
    assert.ok(proposal.includes(`lineHeightPt: ${lineHeight}`), `expected title lineHeightPt ${lineHeight}`);
  }
  assert.match(proposal, /not a physical point-to-pixel conversion/i);
  for (const migration of [
    'Caption 12',
    'Subheadline 15 migrates to Subtext 14',
    'Body 17 and Callout 16 consolidate to Body 16',
    'Headline 17 semibold migrates to Headline 18',
    'medium/semibold remain documented exceptions',
    'SF Symbols remain outside typography',
  ]) {
    assert.ok(proposal.includes(migration), `expected typography migration statement including "${migration}"`);
  }
});

test('hermesTokenProposal.ts defines the exact motion durations, easing roles, property/spring primitives, all 8 semantic bundles, the current-duration mapping, Reduce Motion behaviors, and deferred families', () => {
  const proposal = read(HERMES_TOKEN_PROPOSAL_PATH);
  for (const duration of [0, 100, 150, 200, 250, 300]) {
    assert.ok(proposal.includes(`'${duration}': ${duration}`), `expected duration primitive ${duration}`);
  }
  for (const easing of ['easeOut', 'easeIn', 'easeInOut', 'smooth(extraBounce: 0)', 'snappy']) {
    assert.ok(proposal.includes(easing), `expected easing role value "${easing}"`);
  }
  assert.match(proposal, /'motion\.opacity\.hidden':\s*0/);
  assert.match(proposal, /'motion\.opacity\.visible':\s*1/);
  assert.match(proposal, /'motion\.scale\.press':\s*0\.975/);
  assert.match(proposal, /'motion\.scale\.enter':\s*0\.95/);
  assert.match(proposal, /'motion\.distance\.short':\s*'8 pt'/);
  assert.match(proposal, /'motion\.direction\.edge':\s*\[?'top',\s*'bottom',\s*'leading',\s*'trailing'\]?/);
  assert.match(proposal, /response:\s*0\.30,\s*damping:\s*0\.70/);
  assert.match(proposal, /response:\s*0\.35,\s*damping:\s*0\.80/);
  for (const bundle of [
    'motion.feedback.press', 'motion.state.change', 'motion.content.enter', 'motion.content.exit',
    'motion.overlay.enter', 'motion.overlay.exit', 'motion.content.reposition', 'motion.scroll.follow',
  ]) {
    assert.ok(proposal.includes(`'${bundle}'`), `expected semantic motion bundle '${bundle}'`);
  }
  for (const mapping of ['100/120', '150/160', '180/200/220', "current: '240'", "current: '280'"]) {
    assert.ok(proposal.includes(mapping), `expected current-duration mapping entry "${mapping}"`);
  }
  for (const reduceMotionFact of [
    'immediate 0 ms', 'remove scale and spring', 'fade or none', 'nil/identity semantics', 'BotFaceMotion',
  ]) {
    assert.ok(proposal.includes(reduceMotionFact), `expected Reduce Motion fact "${reduceMotionFact}"`);
  }
  assert.match(proposal, /50 ms hover/);
  assert.match(proposal, /400–700 ms interface durations/);
  assert.match(proposal, /stagger\/delay/);
  assert.match(proposal, /haptic/);
});

test('hermesTokenProposal.ts defines the exact spacing/radius/geometry scales, semantic aliases, 44pt hit target, and migration mappings', () => {
  const proposal = read(HERMES_TOKEN_PROPOSAL_PATH);
  assert.match(proposal, /HERMES_SPACING_STEPS\s*=\s*\[0,\s*2,\s*4,\s*8,\s*12,\s*16,\s*20,\s*24,\s*32,\s*40,\s*48,\s*64\]/);
  assert.match(proposal, /HERMES_RADIUS_STEPS\s*=\s*\[0,\s*4,\s*8,\s*12,\s*16,\s*20,\s*24,\s*'full'\]/);
  for (const [alias, value] of [
    ['radius.control', 8], ['radius.field', 12], ['radius.card', 16],
    ['radius.prominent', 20], ['radius.chrome', 24],
  ]) {
    assert.ok(proposal.includes(`'${alias}': ${value}`), `expected radius alias '${alias}': ${value}`);
  }
  assert.ok(proposal.includes("'radius.pill': 'Capsule'"));
  assert.match(proposal, /HERMES_ICON_SIZES\s*=\s*\[12,\s*16,\s*20,\s*24,\s*32\]/);
  assert.match(proposal, /HERMES_CONTROL_SIZES\s*=\s*\[32,\s*40,\s*44,\s*48\]/);
  assert.match(proposal, /44 pt minimum hit target/);
  assert.ok(proposal.includes("'stroke.1'"));
  assert.ok(proposal.includes("'stroke.2'"));
  assert.ok(proposal.includes("'layout.readable.800'"));
  assert.ok(proposal.includes("'layout.readable.1000'"));
  assert.match(proposal, /bodyWindowHeight/);
  assert.match(proposal, /240pt/);
  assert.match(proposal, /Retained component exception/);
  assert.match(proposal, /5→space\.4/);
  assert.match(proposal, /26→space\.24/);
  assert.match(proposal, /Composer 26 normalizes to chrome 24/);
});

// Family plan 06, CC-1 (corrected after CC-2's Iconography insertion): HermesShadow
// (HermesMobile/Config/HermesShadow.swift) ships as an adopted production namespace — Hermex
// Shadow gets its own dedicated Tokens — Hermex page. CC-2 inserted Hermex Iconography immediately
// after Hermex Shadow (and before Hermex Token Coverage), so Shadow's own relative-position check
// now targets Iconography, its actual immediate successor in the final nine-entry order, rather
// than Token Coverage. Scoped to Shadow's own relative position (not a second full-array duplicate
// of the assertion above) plus its gallery function's own case-name fidelity.
test('Hermex Shadow is inserted immediately before Hermex Iconography in the Foundations — Hermex order, with all 8 exact case names in its own gallery function', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);

  const shadowSection = extractHermesSection(sectionsSrc, 'Hermex Shadow');
  assert.match(shadowSection, /tokenGallery:\s*true/, 'expected Hermex Shadow to be a tokenGallery SectionDef');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const tokensGroupMatch = navBlockMatch[0].match(/label:\s*'Foundations',\s*\n\s*ids:\s*\[([^\]]*)\]/);
  assert.ok(tokensGroupMatch, 'expected the Foundations — Hermex nav group');
  const tokenIds = [...tokensGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const shadowIndex = tokenIds.indexOf('Hermex Shadow');
  const iconographyIndex = tokenIds.indexOf('Hermex Iconography');
  assert.notEqual(shadowIndex, -1, 'expected Hermex Shadow in the Foundations — Hermex nav order');
  assert.notEqual(iconographyIndex, -1, 'expected Hermex Iconography in the Foundations — Hermex nav order');
  assert.equal(
    shadowIndex,
    iconographyIndex - 1,
    'expected Hermex Shadow immediately before Hermex Iconography in the Foundations — Hermex order',
  );

  const gallery = extractFunctionBody(sectionsSrc, 'HermesShadowGallery');
  for (const caseName of [
    'none',
    'controlSubtleResting',
    'controlSubtlePressed',
    'controlElevatedResting',
    'controlElevatedPressed',
    'popover',
    'chrome',
    'overlay',
  ]) {
    assert.match(gallery, new RegExp(`'${caseName}'`), `expected the exact case name '${caseName}' in HermesShadowGallery`);
  }
  assert.doesNotMatch(
    gallery,
    /controlResting/,
    'must never abbreviate a control case name (dropping Subtle/Elevated) to "controlResting"',
  );

  // CC-1 correction: HermesMobile/Config/HermesShadow.swift resolves exactly three cases
  // differently by appearance — controlElevatedResting, controlElevatedPressed, and chrome.
  // Both controlSubtleResting/Pressed are constant across schemes despite the two subtle
  // opacity numbers happening to coincide light vs. dark.
  const chromeCase = gallery.match(/\{ name: 'chrome'[^}]*\}/);
  assert.ok(chromeCase, "expected a 'chrome' shadow case object");
  assert.match(chromeCase[0], /lightOpacity:\s*0\.12\b/, 'expected chrome lightOpacity 0.12');
  assert.match(chromeCase[0], /darkOpacity:\s*0\.28\b/, 'expected chrome darkOpacity 0.28');
  assert.match(chromeCase[0], /adaptive:\s*true/, 'expected chrome to be adaptive, matching HermesShadow.swift');

  for (const subtleName of ['controlSubtleResting', 'controlSubtlePressed']) {
    const subtleCase = gallery.match(new RegExp(`\\{ name: '${subtleName}'[^}]*\\}`));
    assert.ok(subtleCase, `expected a '${subtleName}' shadow case object`);
    assert.match(
      subtleCase[0],
      /adaptive:\s*false/,
      `expected ${subtleName} to be constant across light/dark (adaptive: false), matching HermesShadow.swift`,
    );
  }
});

// Family plan 06, CC-2: the Iconography section imports two same-directory generated .json
// artifacts directly (see test above) — TypeScript needs resolveJsonModule for those imports to
// typecheck at all.
test('resolveJsonModule is enabled so the catalog JSON imports typecheck', () => {
  const tsconfig = JSON.parse(read('native-preview/tsconfig.json'));
  assert.equal(
    tsconfig.compilerOptions && tsconfig.compilerOptions.resolveJsonModule,
    true,
    'expected compilerOptions.resolveJsonModule === true in native-preview/tsconfig.json',
  );
});

// Family plan 06, CC-2a: every computed (non-literal) systemName/systemImage site in the generated
// inventory must carry exactly one hand-traced entry recording every concrete SF Symbol name that
// site's expression can produce, resolved against the pinned protected Swift source.
test('computed icon site trace JSON accounts for every site in the generated inventory with a valid status', () => {
  const inventoryPath = path.join(ROOT, 'native/catalog/hermes/hermesIconInventory.generated.json');
  const tracePath = path.join(ROOT, 'native/catalog/hermes/hermesIconComputedSiteTrace.generated.json');
  assert.ok(existsSync(tracePath), `expected the generated computed-site trace JSON at ${tracePath}`);

  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  const trace = JSON.parse(readFileSync(tracePath, 'utf8'));
  assert.ok(Array.isArray(trace.entries), 'expected trace JSON to have an entries array');

  const inventorySites = inventory.computedSites.map((c) => c.site);
  const traceSites = trace.entries.map((e) => e.site);

  assert.deepEqual(
    [...traceSites].sort(),
    [...inventorySites].sort(),
    'expected exactly one trace entry per inventory computed-site, no missing or extra site',
  );

  const seen = new Set();
  for (const site of traceSites) {
    assert.ok(!seen.has(site), `duplicate trace entry for site ${site}`);
    seen.add(site);
  }

  for (const entry of trace.entries) {
    assert.match(
      entry.status,
      /^(traced|unresolved-external)$/,
      `expected a valid status for ${entry.site}, got ${entry.status}`,
    );
    assert.ok(Array.isArray(entry.resolvedNames), `expected resolvedNames to be an array for ${entry.site}`);
    for (const name of entry.resolvedNames) {
      assert.equal(typeof name, 'string', `expected every resolvedNames entry to be a string for ${entry.site}`);
    }
    assert.equal(
      new Set(entry.resolvedNames).size,
      entry.resolvedNames.length,
      `expected resolvedNames to be unique for ${entry.site}`,
    );
    assert.ok(
      entry.traceMethod === 'direct' || entry.traceMethod.startsWith('call-graph via '),
      `expected traceMethod to be "direct" or start with "call-graph via " for ${entry.site}, got ${entry.traceMethod}`,
    );
    if (entry.status === 'traced') {
      assert.ok(entry.resolvedNames.length > 0, `expected at least one resolvedName for traced site ${entry.site}`);
    }
  }

  const sortedSites = [...traceSites].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(traceSites, sortedSites, 'expected trace entries sorted by site');
});

test('Hermex Token Coverage no longer claims no global spacing/radius scale or no shadow/elevation family exists, while still stating the honesty facts that remain true (no owned icon set, no semantic color layer, Dynamic Type owns type sizes)', () => {
  const src = read(HERMES_SECTIONS_PATH) + '\n' + read(HERMES_TOKEN_GALLERIES_PATH);
  assert.doesNotMatch(src, /No global Hermex spacing scale/, 'false once HermesSpacing ships');
  assert.doesNotMatch(src, /No global Hermex radius scale/, 'false once HermesRadius ships');
  assert.doesNotMatch(src, /no shadow\/elevation family/i, 'false once HermesShadow ships — case-insensitive so it also guards the lowercase knownVariants form');
  assert.match(src, /SF Symbols/);
  assert.match(src, /No semantic surface\/text\/border color layer/);
  assert.match(src, /Dynamic Type owns type sizes/);
});

// Evidence-accuracy correction, verified against Hermex HEAD d29dda8. Each of these three catalog
// claims outran what was actually verified in source/rendered evidence; this guards them from
// silently regressing back to the overclaim. Also guards that this evidence survived verbatim when
// AppFont/Adaptive Glass moved from the old "Verified foundations" group into "Tokens — Hermex".
test('Hermex Typography describes the adopted .appFont(role:) mechanism, not the retired AppFont call-site census', () => {
  const src = hermesCatalogSource();
  const section = extractHermesSection(src, 'Hermex Typography');
  assert.doesNotMatch(
    section,
    /151 references? across 33 production( Swift)? files/i,
    'Hermex Typography must not retain the pre-migration AppFont call-site count — that surface is being migrated, not documented as a static fact',
  );
  assert.match(section, /appFont\(role:\)|\.appFont\(/, 'expected Hermex Typography to describe the adopted .appFont(role:) modifier');
});

test('Hermex Typography catalogs named semibold roles and the 14pt/12pt mono roles', () => {
  const src = hermesCatalogSource();
  const section = extractHermesSection(src, 'Hermex Typography');

  for (const role of ['headlineSemibold', 'subheadlineSemibold', 'captionSemibold', 'mono14', 'mono12']) {
    assert.match(section, new RegExp(role), `expected ${role} in the Hermex Typography catalog`);
  }
  assert.match(section, /14pt monospaced/);
  assert.match(section, /12pt monospaced/);
});

test('ContentUnavailableView cites the verified production files + source references baseline, not literal "call sites", and Content Unavailable is documented as foundation-only', () => {
  const src = hermesCatalogSource();
  assert.doesNotMatch(
    src,
    /28 call sites/i,
    'ContentUnavailableView must not claim "28 call sites"',
  );
  assert.match(src, /30 production files/i, 'ContentUnavailableView should cite the verified 30 production files');
  assert.match(src, /68 source references/i, 'ContentUnavailableView should cite the verified 68 source references');
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(section, /none imports HermexContentUnavailable\.swift/i);
});

// ─── Fable review correction packet (lineage c47cd161-f191-47d2-8851-2604a321c558) ────────────────
// Directly-validated findings from an independent review of the finished build. Each test below is
// scoped to exactly one finding; see the packet's own numbering in the session instructions.

// Finding 1: mobile source-path chip clipped mid-word at 390px (SectionBlock.tsx's `path` style was
// flex-start + overflow:hidden with no width cap or wrap behavior).
test("SectionBlock's source-path chip wraps long unbreakable paths within the content column instead of clipping, while still hugging short paths", () => {
  const src = read(SECTION_BLOCK_PATH);
  const pathBlockMatch = src.match(/path:\s*\{[\s\S]*?\n {2}\},/);
  assert.ok(pathBlockMatch, 'expected a `path:` style block in SectionBlock.tsx');
  const pathBlock = pathBlockMatch[0];
  assert.match(pathBlock, /alignSelf:\s*'flex-start'/, 'short paths should still hug their own compact content width');
  assert.match(pathBlock, /maxWidth:\s*'100%'/, 'the chip must not be allowed to grow past its column\'s own width');
  assert.match(pathBlock, /flexShrink:\s*1/, 'the chip must be allowed to shrink below its unwrapped content width');
  assert.match(src, /overflowWrap|wordBreak/, 'expected a web word-break/overflow-wrap style so an unspaced long path (e.g. a full file path) actually wraps instead of overflowing');
});

// Finding 3: Pending-Request Surface's real callers are ClarificationRequestCard, BotPendingRequestCard,
// and BotRoomComposerView (verified via grep for the four `.pendingRequest*Surface` calls across the
// read-only Hermex repo); HermesMobileTests/BotPendingRequestTests.swift tests pending-request *model*
// parsing only (BotPendingRequestParsingTests) and contains zero references to the surface extensions,
// so it does not evidence them.
test('Pending-Request Surface callers/source paths correctly include ClarificationRequestCard, BotPendingRequestCard, BotRoomComposerView, and exclude the non-evidencing test file', () => {
  const src = hermesCatalogSource();
  assert.match(src, /ClarificationRequestCard/);
  assert.match(src, /BotPendingRequestCard/);
  assert.match(src, /BotRoomComposerView/);
  assert.match(src, /HermesMobile\/Features\/Chat\/ClarificationRequestCard\.swift/);
  assert.match(src, /HermesMobile\/Features\/Bots\/BotPendingRequestCard\.swift/);
  assert.match(src, /HermesMobile\/Features\/Bots\/BotRoomComposerView\.swift/);
  assert.doesNotMatch(
    src,
    /HermesMobileTests\/BotPendingRequestTests\.swift/,
    'that test file exercises pendingRequest *model* parsing (BotPendingRequestParsingTests), not the visual surfaces — it must not be cited as evidence for them',
  );
});

// Correction (design-system-foundation truthfulness pass): the prior "promoted requestCardSurface(
// cornerRadius:material:) in HermexCard.swift" claim did not match production source —
// PendingRequestSurfaces.swift's real, unchanged function is pendingRequestCardSurface(cornerRadius:)
// (a single CGFloat parameter, unconditionally opaque); no RequestCardMaterial type exists in
// production, and ApprovalRequestOverlay.swift does not call this function at all.
test('Pending Request documents the real, unchanged pendingRequestCardSurface(cornerRadius:) — never a fabricated requestCardSurface(cornerRadius:material:)/RequestCardMaterial promotion into HermexCard.swift, and never ApprovalRequestOverlay as a caller', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Pending Request');
  assert.match(section, /pendingRequestCardSurface\(cornerRadius:\)/);
  assert.doesNotMatch(section, /requestCardSurface\(cornerRadius:material:\)/, 'requestCardSurface(cornerRadius:material:) does not exist in production — this claim must not appear');
  assert.doesNotMatch(section, /RequestCardMaterial/, 'RequestCardMaterial is not defined in PendingRequestSurfaces.swift or any pending-request production file');
  assert.doesNotMatch(section, /translucentOverScrim/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Shared\/HermexCard\.swift/, 'Pending Request does not depend on HermexCard.swift');
  assert.doesNotMatch(section, /ApprovalRequestOverlay['"),.]*\s+(?:is a|as a) (?:fourth )?(?:real )?caller/i, 'ApprovalRequestOverlay.swift does not call pendingRequestCardSurface(cornerRadius:) and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Chat\/ApprovalRequestOverlay\.swift/, 'ApprovalRequestOverlay.swift must not appear in sourcePaths as a caller');
});

// Finding 7: source-explicit pending-surface corner radii are block=12, field=14
// (PendingRequestSurfaces.swift's PendingRequestBlockSurface/PendingRequestFieldSurface) — the
// reconstruction previously used a placeholder 10 for both. The card surface's radius is a caller-
// supplied parameter (24pt via ChatComposerMetrics.cardCornerRadius for Sessions, 14pt via
// BotPendingRequestCard.cornerRadius for Bots), so it should be captioned as such rather than
// presented as a fixed constant the way block/field are.
test('Pending-Request Surface reconstruction matches the real block/field corner radii (12/14) and captions the card radius as caller-supplied', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Pending Request');
  assert.match(src, /prBlock:\s*\{[^}]*borderRadius:\s*12,/, 'block surface corner radius should be 12 (PendingRequestBlockSurface)');
  assert.match(src, /prField:\s*\{[^}]*borderRadius:\s*14,/, 'field surface corner radius should be 14 (PendingRequestFieldSurface)');
  assert.match(section, /caller-supplied|caller-provided/i, 'expected the card surface\'s radius to be captioned as a caller-supplied parameter, not a fixed constant');
  assert.match(section, /24pt/, 'expected the Sessions caller value (ChatComposerMetrics.cardCornerRadius)');
  assert.doesNotMatch(section, /26pt/, 'the retired pre-HermesRadius Sessions value must not remain in the Pending-Request reconstruction');
});

test('Hermex Token Coverage preserves the three still-true honesty facts (SF Symbols in place of an owned icon set, no semantic color layer, Dynamic Type owns type sizes) inside the final coverage table', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const table = extractFunctionBody(src, 'HermesTokenCoverageTable');
  assert.match(table, /SF Symbols/);
  assert.match(table, /No semantic surface\/text\/border color layer/);
  assert.match(table, /Dynamic Type owns type sizes/);
});

test('the now-dead HermesTokenCoverageGallery proposal import and its own embed are removed, not left as unrendered dead code (Finding N5)', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(src, /HermesTokenCoverageGallery/, 'the retired HermesTokenCoverageGallery (aliased as HermesTokenCoverageProposalGallery) must be removed from the import list, and its embed replaced by <HermesTokenCoverageTable />, once this task lands');
  assert.doesNotMatch(src, /HermesTokenCoverageProposalGallery/, 'no reference to the old proposal-gallery alias may remain anywhere in hermesSections.tsx');
});

// Finding 8: hard line-wraps landing right after a hyphen collapse (via JSX's own whitespace
// collapsing) into a visible "word- word" artifact — e.g. "design-\n        system" renders as
// "design- system". Scans for the general pattern, not just the two reported instances, so a future
// edit reintroducing the same class of artifact elsewhere in the file also fails this test.
test('no hard-wrapped mid-word copy artifacts (a hyphen immediately followed by a line break) remain in the Hermex catalog copy', () => {
  const src = hermesCatalogSource();
  const match = src.match(/[a-z]-\n\s+[a-z]/);
  assert.ok(!match, `found a hyphen immediately followed by a line break (renders as a "word- word" artifact once JSX collapses the whitespace): ${match ? JSON.stringify(match[0]) : ''}`);
});

// Finding 5: the default computed subtitle ("Hermex · 59 components & tokens") merged 12 actually-
// audited Hermex entries with 47 un-audited retained template references into one misleading number.
// CatalogShell gains an optional override; only the Hermex route uses it — generic routes (the
// template's own two catalogs) keep the plain computed default. The default route no longer merges
// template sections at all, so its subtitle states Hermex-only information.
test('CatalogShell accepts an optional subtitle override; the Hermex route states its corrected component/token count after the AppFont split and Adaptive Glass move, contains only Hermex information, and generic routes keep the computed default', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  assert.match(shellSrc, /subtitle\?:\s*string/, 'expected CatalogShell to accept an optional subtitle override prop');

  const catalogSrc = read(HERMES_CATALOG_PATH);
  const subtitleMatch = catalogSrc.match(/subtitle="([^"]*)"/);
  assert.ok(subtitleMatch, 'expected a literal subtitle prop on the default route');
  assert.equal(subtitleMatch[1], 'Hermex · 26 visual references · token coverage in overview');
  assert.doesNotMatch(subtitleMatch[1], /template/i, 'expected the Hermex subtitle to contain only Hermex information, with no template reference count');

  const templateSrc = read(CATALOG_EXAMPLE_PATH);
  const frameworkSrc = read('native/catalog/CatalogFrameworkExample.tsx');
  for (const src of [templateSrc, frameworkSrc]) {
    assert.doesNotMatch(src, /<CatalogShell[\s\S]{0,400}subtitle=/, 'the retained generic catalogs must keep the computed default subtitle, not a hardcoded override');
  }
});

// Finding 9: the active sidebar link relied on color alone (`labelActive: { color: CATALOG_COLOR.accent }`)
// and set an ARIA-invalid `accessibilityState={{ selected: active }}` on a `role="link"` element
// (`aria-selected` is only valid on option/tab/row-type roles). The long sidebar list also hid its
// own scrollbar, hurting discoverability.
test('sidebar active nav links use non-color-only cues and valid web link semantics; the sidebar list keeps its own scrollbar visible', () => {
  const src = read(CATALOG_SIDEBAR_PATH);
  assert.match(src, /accessibilityRole="link"/);
  assert.doesNotMatch(
    src,
    /accessibilityState=\{\{\s*selected:\s*active\s*\}\}/,
    'aria-selected is invalid for role="link" (valid only for option/tab/row-type roles) — must be removed',
  );
  assert.match(src, /'aria-current'/, "expected an aria-current marker for the active link — react-native-web forwards it to the DOM; there is no native RN prop equivalent");
  assert.match(src, /location/, 'expected aria-current to use the "location" token for a currently-active nav link');
  // Non-color cue: bold weight and/or a background/border indicator on the active item.
  assert.match(src, /itemActive/);
  assert.match(
    src,
    /fontWeight:\s*'700'|fontWeight:\s*'800'|itemActive:\s*\{[^}]*(backgroundColor|borderLeftWidth|borderLeftColor)/,
  );
  // Keyboard focus must remain visible (regression guard — unrelated to this finding, but this
  // finding's own fix must not accidentally remove it).
  assert.match(src, /focused/);
  // The sidebar's own long nav list keeps a visible scrollbar for discoverability.
  assert.doesNotMatch(src, /showsVerticalScrollIndicator=\{false\}/, 'the sidebar nav list should show its own scrollbar');
});

// Finding 10 (partial — the rest is covered by the strengthened Motion/Radius pairing assertions
// above): the merged Hermex + template section union must have no duplicate ids, since CatalogShell
// keys its combined `sections` array by id and a collision would silently drop one section's content.
test('the merged Hermex + template section union has no duplicate ids', () => {
  const hermesBlockMatch = read(HERMES_SECTIONS_PATH).match(/export const hermesSections: SectionDef<HermesSectionId>\[\] = \[[\s\S]*?\n\];/);
  assert.ok(hermesBlockMatch, 'expected an exported hermesSections array');
  const templateBlockMatch = read(CATALOG_EXAMPLE_PATH).match(/export const sections: SectionDef<SectionId>\[\] = \[[\s\S]*?\n\];/);
  assert.ok(templateBlockMatch, 'expected an exported sections array in CatalogExample.tsx');

  // Anchored to "  {\n    id: '...'" — a top-level SectionDef's own `id` field, immediately after its
  // object literal opens — not a bare `/id:\s*'.../ ` scan, which also matches unrelated inline data
  // (e.g. a demo's own `PillRowItem` literals like `{ id: 'home', ... }` inside a section's `node:`).
  const idsFrom = (block) => [...block.matchAll(/\n {2}\{\s*\n {4}id: '([^']+)'/g)].map((m) => m[1]);
  const hermesIds = idsFrom(hermesBlockMatch[0]);
  const templateIds = idsFrom(templateBlockMatch[0]);
  assert.ok(hermesIds.length >= 13, `expected at least 13 Hermex-specific section ids, found ${hermesIds.length}`);
  assert.ok(templateIds.length >= 47, `expected at least 47 template section ids, found ${templateIds.length}`);

  const allIds = [...hermesIds, ...templateIds];
  const seen = new Set();
  const duplicates = allIds.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  assert.equal(duplicates.length, 0, `expected no duplicate ids across the merged Hermex+template section union; duplicates: ${duplicates.join(', ')}`);
});

test("VariantGroup's left-aligned description occupies the available width and wraps long unbroken tokens (e.g. a source path) instead of overflowing its card", () => {
  const src = read(VARIANT_GROUP_PATH);

  const descMatch = src.match(/\n {2}desc:\s*\{[^}]*\}/);
  assert.ok(descMatch, 'expected a `desc` style block');
  assert.match(descMatch[0], /maxWidth:\s*'100%'/, "desc must be capped at its group's own available width");
  assert.match(descMatch[0], /flexShrink:\s*1/, 'desc must be allowed to shrink below its unwrapped content width');

  assert.match(src, /overflowWrap|wordBreak/, 'expected a web word-break/overflow-wrap style for a long unbroken source-path token inside a description');
  assert.match(
    src,
    /style=\{\[styles\.desc,[^\]]*\w+WrapStyle[^\]]*\]\}/,
    'expected the wrap style to actually be applied to the rendered description Text, not just declared unused',
  );
});

// ─── Fable review fix (2026-09-18) ────────────────────────────────────────────────────────────────
// A fresh read-only Claude Fable review of the finished token-system build returned FAIL with two
// Important findings, both independently confirmed by the controller. See
// `.superpowers/sdd/2026-09-18-hermex-token-system-implementation-plan/fable-review-fix-brief.md`.

// Finding 1: evidence/token-system-final/mobile-typography.png at 390px shows proposed typography
// identifiers (e.g. "type.caption.reg…") truncated by TypeScaleGallery's one-line sample clamp, and
// neither typeMeta() nor the old generic TYPE_USE_NOTES copy repeated the full identifier anywhere
// else in that row — so the full proposed token name was not recoverable at 390px. Fixed by making
// every proposal use note lead with its own full `step` identifier, verbatim, before the existing
// proposal/disclaimer copy (TypeScaleGallery itself — the shared template seam — must stay untouched).
test('every Hermex typography proposal use note is built from its own full step identifier (not generic copy), so the full proposed token name is recoverable even when the clamped sample truncates', () => {
  const galleriesSrc = read(HERMES_TOKEN_GALLERIES_PATH);
  const useNotesMatch = galleriesSrc.match(/const TYPE_USE_NOTES[\s\S]*?\n\) as Record<ProposedTypeStep, string>;/);
  assert.ok(useNotesMatch, 'expected a TYPE_USE_NOTES construction in HermesTokenProposalGalleries.tsx');
  assert.match(
    useNotesMatch[0],
    /`\$\{step\}[^`]*Proposed/,
    'expected each use note\'s own template literal to start with `${step}` (the full identifier) before the proposal/disclaimer copy — a generic note with no step interpolation regresses this finding',
  );

  // TypeScaleGallery itself — the shared template seam — must remain untouched by this fix.
  const typeScaleGallerySrc = read('native/catalog/TypeScaleGallery.tsx');
  assert.doesNotMatch(typeScaleGallerySrc, /numberOfLines=\{2\}|numberOfLines=\{undefined\}/, 'TypeScaleGallery.tsx must not be modified to work around this — the fix belongs in the Hermex proposal gallery\'s own use notes');
});

test('the out-of-scope HermesGeometryProposalGallery (icon size / control size / stroke width) is deleted from HermesTokenProposalGalleries.tsx as dead code, while its underlying out-of-scope reference data and contract test remain fully intact in hermesTokenProposal.ts, per spec §13', () => {
  const proposalGalleriesSrc = read(HERMES_TOKEN_GALLERIES_PATH);
  assert.doesNotMatch(proposalGalleriesSrc, /export function HermesGeometryProposalGallery/, 'HermesGeometryProposalGallery has no future adoption path (icon-size/control-size/stroke-width are permanent spec §13 non-goals) and must be deleted, not left as dead code');
  assert.doesNotMatch(
    proposalGalleriesSrc,
    /HERMES_ICON_SIZES|HERMES_CONTROL_SIZES|HERMES_CONTROL_MIN_HIT_TARGET_NOTE|HERMES_STROKES|HERMES_LAYOUT|HERMES_RETAINED_BODY_WINDOW_HEIGHT|HERMES_GEOMETRY_MIGRATION|HERMES_RADIUS_STEPS|HERMES_RADIUS_ALIASES|HERMES_RADIUS_MIGRATION/,
    'the gallery-only imports feeding the now-deleted gallery must be removed from this file\'s own import list',
  );
  assert.doesNotMatch(proposalGalleriesSrc, /const radiusPreview/, 'the module-private radiusPreview style object, used only by the deleted gallery, must be removed');
  // Shared plumbing and every other still-unadopted proposal gallery in this file must survive:
  assert.match(proposalGalleriesSrc, /function ProposalStatus/);
  assert.match(proposalGalleriesSrc, /export function AppFontProposalGallery/);
  assert.match(proposalGalleriesSrc, /export function HermesMotionProposalGallery/);
  assert.match(proposalGalleriesSrc, /export function HermesSpacingProposalGallery/);
  assert.match(proposalGalleriesSrc, /export function HermesTokenCoverageGallery/);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /HermesGeometryProposalGallery/, 'no reference to the retired HermesGeometryProposalGallery may remain in hermesSections.tsx, including the import list');

  // This is a gallery/import deletion only, never a data deletion — the underlying out-of-scope
  // reference data and its own pre-existing contract test remain fully intact and untouched.
  const proposalDataSrc = read(HERMES_TOKEN_PROPOSAL_PATH);
  assert.match(proposalDataSrc, /HERMES_ICON_SIZES\s*=\s*\[12,\s*16,\s*20,\s*24,\s*32\]/);
  assert.match(proposalDataSrc, /HERMES_CONTROL_SIZES\s*=\s*\[32,\s*40,\s*44,\s*48\]/);
  assert.ok(proposalDataSrc.includes("'stroke.1'"));
  assert.ok(proposalDataSrc.includes("'stroke.2'"));
});

test('hermesIconInventory.generated.json is valid JSON with sorted literal/computed arrays and no timestamp field (R2: generated by the widened, label-scoped scanner, not a call-head allowlist)', () => {
  const jsonPath = 'native/catalog/hermes/hermesIconInventory.generated.json';
  assert.ok(existsSync(path.join(ROOT, jsonPath)), `${jsonPath} should exist`);
  const data = JSON.parse(read(jsonPath));
  assert.ok(Array.isArray(data.literals) && data.literals.length > 0);
  assert.ok(Array.isArray(data.computedSites));
  assert.ok(!('generatedAt' in data), 'generated output must not embed a non-reproducible timestamp');
  const names = data.literals.map((l) => l.name);
  assert.deepEqual(names, [...names].sort(), 'literals must be sorted by name for deterministic diffs');
});

// ─── Task 2: visual-first Hermex entries, Token Coverage moved to overview ──────────────────────

test('every primary Hermex entry declares hermesReference (never the removed hermes audit field), and Hermex Token Coverage is no longer a primary/nav entry', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const catalogSrc = read(HERMES_CATALOG_PATH);
  const typesSrc = read(TYPES_PATH);
  const sectionBlockSrc = read(SECTION_BLOCK_PATH);

  const primaryHermexIds = [
    'Adaptive Glass',
    'Content Unavailable',
    'Pending Request',
    'Hermes Card',
    'Attachment',
    'Hermes Banner',
    'Hermes Avatar',
    'Row Divider',
    'Tag',
    'Inline Reference Link',
    'Search',
    'Segmented Control',
    'Buttons',
    'Hermes TopNav',
    'Skeleton Loading',
    'List / ListItem',
    'Disclosure Row',
    'Transcript Activity',
    'Composer',
    'Hermex Typography',
    'Hermex Font',
    'Hermex Colors',
    'Hermex Motion',
    'Hermex Radius & Geometry',
    'Hermex Spacing',
    'Hermex Shadow',
    'Hermex Iconography',
  ];

  for (const id of primaryHermexIds) {
    const section = extractHermesSection(sectionsSrc, id);
    assert.match(section, /hermesReference:\s*\{/, `expected "${id}" to declare hermesReference:`);
    assert.doesNotMatch(section, /\n\s*hermes:\s*\{/, `expected "${id}" to no longer declare the removed hermes: field`);
  }

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const navBlock = navBlockMatch[0];

  assert.doesNotMatch(sectionsSrc, /id:\s*'Hermex Token Coverage'/);
  assert.doesNotMatch(navBlock, /Hermex Token Coverage/);
  assert.match(sectionsSrc, /function HermesTokenCoverageTable/);
  assert.match(sectionsSrc + read(HERMES_REFERENCE_DETAILS_PATH), /Implementation notes/);
  assert.match(sectionsSrc, /Adopted in the verified local implementation; pending upstream acceptance\./);

  assert.doesNotMatch(sectionsSrc, /knownVariants|evidenceLevel|evidenceNote|disposition:/);
  assert.doesNotMatch(typesSrc, /HermesAudit|HermesDisposition|HermesEvidenceLevel/);
  assert.doesNotMatch(sectionBlockSrc, /HermesAuditPanel/);

  assert.match(catalogSrc, /subtitle="Hermex · 26 visual references · token coverage in overview"/);
});

// Pinned to specification revision 1. The 2026-09-26 revised specification explicitly supersedes
// ContentUnavailableView (renamed/expanded into the Content Unavailable pattern), Card Chrome
// (renamed/expanded into Card with Section/Request/Compact variants), Offline Cache Notice (folded
// into the new Banner family's Offline variant), and Picker Row (removed as a standalone family) —
// those four descriptions/whenToUse strings are intentionally dropped from this list rather than
// kept as stale literal-string pins; every other entry below is unchanged and still pinned verbatim.
test('Hermex entries carry the exact approved introductions from specification revision 1', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const exactDescriptions = [
    'A shared surface treatment that uses Liquid Glass when available, Material as a fallback, and an opaque background when Reduce Transparency is enabled.',
    'Colored initials identify the active server or account. In the Sessions header, the same control changes into a close button while search is open.',
    'Named text roles keep hierarchy consistent and scale with Dynamic Type. Caption, footnote, and caption 2 intentionally share the same compact base size.',
    'Hermex uses San Francisco. Callers choose a named Hermex Typography role; the role alone decides weight and design, so a caller never passes weight or design directly.',
    'Semantic colors describe purpose rather than a fixed hex value, so surfaces, text, borders, actions, and status feedback adapt correctly. Product palettes provide the selectable header and project accents.',
    'Eight named motion patterns pair intent with duration and easing. Reduce Motion shortens or removes movement while preserving the state change.',
    'A seven-step radius scale and semantic aliases shape controls, fields, cards, prominent surfaces, and app chrome. Feature-specific dimensions stay named when they are not reusable radius tokens.',
    'A 12-step spacing scale controls gaps and padding throughout Hermex, from compact icon spacing to large section separation.',
    'Eight elevation roles distinguish resting and pressed controls, popovers, composer chrome, and overlays. Some roles adjust their opacity between light and dark appearance.',
    'Hermex uses SF Symbols for navigation, actions, status, and content cues. Browse the visual inventory by symbol name; implementation traces remain secondary.',
  ];
  for (const description of exactDescriptions) {
    assert.ok(src.includes(description), `expected the exact approved introduction: "${description}"`);
  }
  const exactWhenToUse = [
    'Use it for glass-like cards and controls instead of rebuilding platform and accessibility fallbacks on each screen.',
  ];
  for (const whenToUse of exactWhenToUse) {
    assert.ok(src.includes(whenToUse), `expected the exact approved whenToUse: "${whenToUse}"`);
  }
});

// ─── Task 3: complete semantic color reference, simplified token galleries ──────────────────────

test('HERMES_SEMANTIC_COLORS declares exactly the 13 roles, each with purpose/use/previewLight/previewDark/sample, and HermesSemanticColorReference renders light/dark groups', () => {
  const dataSrc = read(HERMES_COLOR_DATA_PATH);
  const referenceSrc = read(HERMES_SEMANTIC_COLOR_REFERENCE_PATH);
  const sectionsSrc = read(HERMES_SECTIONS_PATH);

  const semanticRoles = [
    'color.background.canvas',
    'color.background.surface',
    'color.background.elevated',
    'color.text.primary',
    'color.text.secondary',
    'color.text.tertiary',
    'color.border.default',
    'color.action.accent',
    'color.status.success',
    'color.status.warning',
    'color.status.danger',
    'color.status.info',
    'color.content.disabled',
  ];
  const declaredRoles = [...dataSrc.matchAll(/\n {2}'(color\.[a-zA-Z.]+)':\s*\{/g)].map((m) => m[1]);
  assert.deepEqual(declaredRoles, semanticRoles, 'HERMES_SEMANTIC_COLORS must declare exactly these 13 roles, in this order');

  for (const role of semanticRoles) {
    const roleBlockMatch = dataSrc.match(new RegExp(`'${role.replace(/\./g, '\\.')}':\\s*\\{([\\s\\S]*?)\\n {2}\\},`));
    assert.ok(roleBlockMatch, `expected a declaration block for '${role}'`);
    const block = roleBlockMatch[1];
    for (const field of ['purpose:', 'use:', 'previewLight:', 'previewDark:', 'sample:']) {
      assert.ok(block.includes(field), `expected '${role}' to declare ${field}`);
    }
  }

  assert.match(referenceSrc, /export function HermesSemanticColorReference/);
  assert.match(referenceSrc, /scheme="Light"/);
  assert.match(referenceSrc, /scheme="Dark"/);
  for (const heading of ['Surfaces', 'Text', 'Borders', 'Actions', 'Statuses', 'Disabled content']) {
    assert.ok(referenceSrc.includes(heading), `expected group heading "${heading}"`);
  }

  // Scoped to the visible primary galleries only — not the whole file, whose Token Coverage table
  // (rendered only inside the overview's collapsed Implementation notes disclosure) still legitimately
  // uses this historical terminology.
  const primaryGalleryFnNames = [
    'HermesColorsGallery', 'HermesColorRampGallery', 'HermesProductPaletteGallery',
    'HermesGeometryGallery', 'HermesSpacingGallery', 'HermesShadowGallery',
    'HermesTypographyGallery', 'HermesFontGallery',
  ];
  const gallerySrc = primaryGalleryFnNames.map((fn) => extractFunctionBody(sectionsSrc, fn)).join('\n') + referenceSrc;
  for (const stale of [
    'Migration-count reconciliation',
    'Current production evidence',
    'adopted local implementation namespace',
    'Proposed — not yet adopted',
  ]) {
    assert.doesNotMatch(gallerySrc, new RegExp(stale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `expected the primary gallery source to no longer include "${stale}"`);
  }
});

test('Hermex Colors renders Color ramps / Semantic roles / Product palettes through HermesSemanticColorReference, and the primary radius/spacing/shadow galleries use concise renamed groups', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const gallery = extractFunctionBody(sectionsSrc, 'HermesColorsGallery');
  assert.match(gallery, /<HermesSemanticColorReference\s*\/>/);
  assert.match(gallery, /name="Color ramps"/);
  assert.match(gallery, /name="Semantic roles"/);
  assert.match(gallery, /name="Product palettes"/);

  assert.match(sectionsSrc, /import\s*\{\s*HermesSemanticColorReference\s*\}\s*from\s*'\.\/HermesSemanticColorReference'/);

  const geometryGallery = extractFunctionBody(sectionsSrc, 'HermesGeometryGallery');
  assert.match(geometryGallery, /name="Reusable radius roles"/);
  assert.match(geometryGallery, /name="Feature-specific geometry"/);

  const spacingGallery = extractFunctionBody(sectionsSrc, 'HermesSpacingGallery');
  assert.match(spacingGallery, /Related controls — 8 pt/);
  assert.match(spacingGallery, /Separate content groups — 24 pt/);
});

// ─── Task 4: searchable 202-name visual icon inventory ──────────────────────────────────────────

test('buildHermesIconNames deduplicates the generated literal/computed inventories into the authoritative 202-name union, and HermesIconReference renders a searchable grid of simulator-generated glyph previews with a per-tile fallback', () => {
  const iconInventory = JSON.parse(read(HERMES_ICON_INVENTORY_PATH));
  const iconTrace = JSON.parse(read(HERMES_ICON_TRACE_PATH));
  const literalNames = new Set(iconInventory.literals.map((entry) => entry.name));
  const computedNames = new Set(iconTrace.entries.flatMap((entry) => entry.resolvedNames));
  const union = [...new Set([...literalNames, ...computedNames])].sort((a, b) => a.localeCompare(b));

  assert.equal(literalNames.size, 158);
  assert.equal(computedNames.size, 154);
  assert.equal(union.length, 202);
  assert.equal(union.filter((name) => !literalNames.has(name)).length, 44);

  const referenceSrc = read(HERMES_ICON_REFERENCE_PATH);
  assert.match(referenceSrc, /import\s+hermesIconInventory\s+from\s+'\.\/hermesIconInventory\.generated\.json'/);
  assert.match(referenceSrc, /import\s+hermesIconComputedSiteTrace\s+from\s+'\.\/hermesIconComputedSiteTrace\.generated\.json'/);
  assert.match(referenceSrc, /export function buildHermesIconNames/);
  assert.match(referenceSrc, /new Set/);
  assert.match(referenceSrc, /\.flatMap\(/);
  assert.match(referenceSrc, /<TextInput/);
  assert.match(referenceSrc, /toLocaleLowerCase\(\)/);
  assert.doesNotMatch(referenceSrc, /Literal symbols/);
  assert.doesNotMatch(referenceSrc, /Computed sites/);

  // Each tile now requests a real simulator-rendered PNG and only falls back to text when that
  // specific asset is missing or fails to load — the fallback is no longer the unconditional
  // per-tile render every name got before this change.
  assert.match(referenceSrc, /from\s+'react-native'/);
  assert.match(referenceSrc, /<Image\b/);
  assert.match(referenceSrc, /onError=\{/);
  assert.match(referenceSrc, /useState/);
  assert.match(referenceSrc, /hasError/);
  assert.match(referenceSrc, /generated-icons/);
  assert.match(referenceSrc, /Glyph unavailable in browser/);
  assert.match(referenceSrc, /rendered by the iOS SF Symbols runtime/i);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /function HermesIconographyGallery|function IconComputedSiteCard|ICON_SITE_LIMITATION_NOTE/);
  const iconographySection = extractHermesSection(sectionsSrc, 'Hermex Iconography');
  assert.match(iconographySection, /render:\s*\(\)\s*=>\s*<HermesIconReference\s*\/>/);
});

// ─── Adopted default icon-size sets (option 1): unchanged base scale + Typography/Avatar pairing ──

test('hermesIconSize.ts mirrors the adopted HermesIconSize base scale, unchanged, as the canonical icon-size source of truth', () => {
  assert.ok(existsSync(path.join(ROOT, HERMES_ICON_SIZE_PATH)), `${HERMES_ICON_SIZE_PATH} should exist as the canonical icon-size token source of truth`);
  const src = read(HERMES_ICON_SIZE_PATH);
  assert.match(src, /export const HERMES_ICON_SIZE = \{/);
  for (const [key, value] of [['xs', 12], ['small', 16], ['medium', 20], ['large', 24], ['extraLarge', 32]]) {
    assert.match(src, new RegExp(`${key}:\\s*${value}\\b`), `expected HERMES_ICON_SIZE.${key} === ${value}`);
  }
});

test('hermesIconSize.ts declares HERMES_ICON_TYPOGRAPHY_PAIRING with the exact compact/standard/prominent/title/feature aliases and their covered AppFont roles', () => {
  const src = read(HERMES_ICON_SIZE_PATH);
  assert.match(src, /export const HERMES_ICON_TYPOGRAPHY_PAIRING = \{/);
  const pairings = [
    ['compact', 'xs', ['caption', 'footnote', 'caption2', 'mono12']],
    ['standard', 'small', ['subheadline', 'subheadlineSemibold', 'mono14', 'body', 'label']],
    ['prominent', 'medium', ['headline', 'headlineSemibold', 'title3']],
    ['title', 'large', ['title2', 'title']],
    ['feature', 'extraLarge', []],
  ];
  for (const [alias, baseKey, roles] of pairings) {
    const blockMatch = src.match(new RegExp(`${alias}:\\s*\\{([\\s\\S]*?)\\n {2}\\},`));
    assert.ok(blockMatch, `expected a HERMES_ICON_TYPOGRAPHY_PAIRING.${alias} entry`);
    const block = blockMatch[1];
    assert.match(block, new RegExp(`HERMES_ICON_SIZE\\.${baseKey}\\b`), `expected ${alias} to alias HERMES_ICON_SIZE.${baseKey}`);
    for (const role of roles) {
      assert.match(block, new RegExp(`'${role}'`), `expected ${alias} to cover AppFont role '${role}'`);
    }
  }
});

test('hermesIconSize.ts declares HERMES_ICON_AVATAR_PAIRING with small/medium/large records at the approved avatar/icon pairing', () => {
  const src = read(HERMES_ICON_SIZE_PATH);
  assert.match(src, /export const HERMES_ICON_AVATAR_PAIRING = \{/);
  for (const [name, avatar, iconKey] of [['small', 32, 'medium'], ['medium', 40, 'large'], ['large', 48, 'extraLarge']]) {
    const blockMatch = src.match(new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\},`));
    assert.ok(blockMatch, `expected a HERMES_ICON_AVATAR_PAIRING.${name} entry`);
    const block = blockMatch[1];
    assert.match(block, new RegExp(`avatar:\\s*${avatar}\\b`), `expected ${name} avatar diameter ${avatar}`);
    assert.match(block, new RegExp(`icon:\\s*HERMES_ICON_SIZE\\.${iconKey}\\b`), `expected ${name} icon to alias HERMES_ICON_SIZE.${iconKey}`);
  }
});

test('hermesAttachmentSize.ts no longer owns HERMES_ICON_SIZE_EXTRA_LARGE — that alias lives solely in the canonical ./hermesIconSize module', () => {
  const src = read(HERMES_ATTACHMENT_SIZE_PATH);
  assert.doesNotMatch(src, /HERMES_ICON_SIZE_EXTRA_LARGE/, 'the duplicate icon-size export must be removed from hermesAttachmentSize.ts');
});

test('HermesComponentFamiliesPreviews.tsx and hermesSections.tsx read HERMES_ICON_SIZE.extraLarge from the canonical ./hermesIconSize module, not a duplicate export', () => {
  for (const sourcePath of [COMPONENT_FAMILIES_PREVIEWS_PATH, HERMES_SECTIONS_PATH]) {
    const src = read(sourcePath);
    assert.match(
      src,
      /import\s*\{\s*HERMES_ICON_SIZE\s*\}\s*from\s*'\.\/hermesIconSize'/,
      `expected ${sourcePath} to import HERMES_ICON_SIZE from ./hermesIconSize`,
    );
    assert.doesNotMatch(src, /HERMES_ICON_SIZE_EXTRA_LARGE/, `expected ${sourcePath} to no longer reference the retired HERMES_ICON_SIZE_EXTRA_LARGE`);
    assert.match(src, /HERMES_ICON_SIZE\.extraLarge\b/, `expected ${sourcePath} to reference HERMES_ICON_SIZE.extraLarge`);
  }
});

test('HermesIconReference renders a five-step default icon-size scale using a real generated SF Symbol asset, before the searchable inventory', () => {
  const referenceSrc = read(HERMES_ICON_REFERENCE_PATH);
  assert.match(
    referenceSrc,
    /import\s*\{\s*HERMES_ICON_SIZE,\s*HERMES_ICON_TYPOGRAPHY_PAIRING,\s*HERMES_ICON_AVATAR_PAIRING\s*\}\s*from\s*'\.\/hermesIconSize'/,
    'expected HermesIconReference.tsx to import the canonical icon-size tokens',
  );
  // The five steps are declared once, data-driven from HERMES_ICON_SIZE, at module scope — mirroring
  // the existing HermesUsageSize gallery precedent (hermesSections.tsx's HermesSpacingGallery) rather
  // than repeating each key inside the mapped render function.
  for (const key of ['xs', 'small', 'medium', 'large', 'extraLarge']) {
    assert.match(referenceSrc, new RegExp(`HERMES_ICON_SIZE\\.${key}\\b`), `expected the size-scale data to reference HERMES_ICON_SIZE.${key}`);
  }
  const scaleGalleryBody = extractFunctionBody(referenceSrc, 'IconSizeScaleGallery');
  assert.match(scaleGalleryBody, /\.map\(/, 'expected the size-scale gallery to render every step from its data source, not hand-duplicated tiles');
  assert.match(scaleGalleryBody, /iconAssetUri\(/, 'expected the size-scale gallery to reuse the real generated SF Symbol asset helper, not a substitute glyph');

  const referenceBody = extractFunctionBody(referenceSrc, 'HermesIconReference');
  const scaleIdx = referenceBody.indexOf('<IconSizeScaleGallery');
  const searchIdx = referenceBody.indexOf('styles.searchRow');
  assert.notEqual(scaleIdx, -1, 'expected HermesIconReference to render <IconSizeScaleGallery />');
  assert.notEqual(searchIdx, -1, 'expected HermesIconReference to still render the searchable inventory');
  assert.ok(scaleIdx < searchIdx, 'expected the default icon-size scale to render before the searchable inventory');
});

test('HermesIconReference documents Typography pairing (semantic name, icon size, covered AppFont roles) and Avatar pairing (20/24/32pt glyphs in 32/40/48pt containers), plus the 44pt hit-target distinction', () => {
  const referenceSrc = read(HERMES_ICON_REFERENCE_PATH);

  // The pairing name, icon size, and covered AppFont roles all come from iterating
  // HERMES_ICON_TYPOGRAPHY_PAIRING's own entries (already asserted verbatim against
  // hermesIconSize.ts above) — the guide renders each entry's key and its size/roles fields rather
  // than re-declaring the alias names or numbers locally.
  const typographyBody = extractFunctionBody(referenceSrc, 'IconTypographyPairingGuide');
  assert.match(typographyBody, /Object\.entries\(HERMES_ICON_TYPOGRAPHY_PAIRING\)/, 'expected the guide to render every pairing entry, not a hand-duplicated list');
  assert.match(typographyBody, /\.map\(/);
  assert.match(typographyBody, /pairing\.size/, 'expected the guide to display each pairing\'s icon size');
  assert.match(typographyBody, /pairing\.roles/, 'expected the guide to display each pairing\'s covered AppFont roles');

  // Same data-driven precedent for the Avatar pairing specimens: diameters/icon sizes come from
  // HERMES_ICON_AVATAR_PAIRING's own entries (already asserted verbatim against hermesIconSize.ts
  // above), not re-declared as local literals.
  const avatarBody = extractFunctionBody(referenceSrc, 'IconAvatarPairingGallery');
  assert.match(avatarBody, /Object\.entries\(HERMES_ICON_AVATAR_PAIRING\)/, 'expected the gallery to render every pairing entry, not a hand-duplicated list');
  assert.match(avatarBody, /pairing\.avatar/, 'expected each specimen\'s circular container to size from pairing.avatar');
  assert.match(avatarBody, /pairing\.icon/, 'expected each specimen\'s glyph to size from pairing.icon');

  assert.match(referenceSrc, /44[×x]44 ?pt|44 ?pt minimum interaction target|44 ?pt minimum hit target/i, 'expected explicit guidance that glyph size is separate from the 44pt minimum interaction target');
});

test('the Hermex Iconography section metadata cites HermesIconSize\'s real Swift source and documents the adopted default icon-size scale and pairing sets', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Hermex Iconography');
  assert.match(section, /HermesMobile\/Config\/HermesSpacing\.swift/, 'expected the Iconography section to cite the real Swift source for HermesIconSize');
  assert.match(section, /default icon[- ]size scale/i, 'expected the section to document the adopted default icon-size scale');
  assert.match(section, /Typography pairing/i, 'expected the section to document the Typography pairing aliases');
  assert.match(section, /Avatar pairing/i, 'expected the section to document the Avatar pairing aliases');
});

test('generate-icon-previews.mjs orchestrates a real iOS-runtime render on a portable Simulator destination and fails closed on any missing symbol', () => {
  assert.ok(existsSync(path.join(ROOT, ICON_GENERATOR_SCRIPT_PATH)), `${ICON_GENERATOR_SCRIPT_PATH} should exist`);
  const src = read(ICON_GENERATOR_SCRIPT_PATH);

  // Same dedup/sort algorithm as buildHermesIconNames, over the same two checked-in JSON files —
  // the generator must not invent its own separate symbol list.
  assert.match(src, /hermesIconInventory\.generated\.json/);
  assert.match(src, /hermesIconComputedSiteTrace\.generated\.json/);
  assert.match(src, /new Set/);
  assert.match(src, /\.flatMap\(/);

  // Portability correction (2026-09-28): no committed source may hardcode a Simulator UDID. The
  // destination must resolve at runtime: an explicit env override first, otherwise
  // discovery of an available iPhone Simulator via `simctl`, preferring the named Design System
  // device and falling back to another available iPhone — never macOS/AppKit.
  assert.doesNotMatch(src, SIMULATOR_UDID_PATTERN, 'no machine-local Simulator UDID may be hardcoded');
  assert.match(src, /process\.env\.HERMEX_ICON_SIMULATOR_UDID/, 'expected an explicit env override for the destination UDID, checked before simctl discovery');
  assert.match(src, /'simctl',\s*'list',\s*'devices',\s*'available'/, 'expected simctl device discovery scoped to available devices');
  assert.match(src, /Hermex Design System iPhone 17 Pro/, 'expected the named Design System simulator to still be preferred when present');
  assert.match(src, /iPhone/, 'expected the fallback to another available iPhone');
  assert.match(src, /-destination',\s*`id=\$\{/, 'expected a concrete resolved id=<udid> destination passed to xcodebuild, not a name-based -destination');

  assert.match(src, /xcodebuild/);
  assert.match(src, /\btest\b/);
  assert.match(src, /xcresulttool/);
  assert.match(src, /export/);
  assert.match(src, /attachments/);
  assert.match(src, /202/, 'expected the generator to assert the authoritative 202-name count');
  assert.match(src, /public[\\/]generated-icons/);

  // Fail-closed: a short symbol count, or any renderer failure, must stop the script rather than
  // silently writing a partial manifest.
  assert.match(src, /process\.exit\(1\)|throw new Error/);
});

// Portability and fallback correction (2026-09-28): controller-reproduced defects — `npm run web`
// depended on strict `generate:icons`, so it never started on a machine without Xcode/iOS Simulator,
// hiding the existing per-tile "Glyph unavailable in browser" fallback; and the generator/test
// hardcoded one machine-local Simulator UDID. Each test below is scoped to exactly one requirement.

test('Correction (2026-09-28): generate-icon-previews.mjs distinguishes optional prerequisite unavailability (missing Xcode/Simulator) from every real render or data failure via a dedicated error type', () => {
  const src = read(ICON_GENERATOR_SCRIPT_PATH);

  assert.match(src, /class PrerequisiteUnavailableError extends Error/, 'expected a dedicated error type marking "generation unavailable" distinctly from any other failure');
  assert.match(src, /--optional/, 'expected an --optional CLI flag for the best-effort browser-startup mode');

  // The optional-mode short-circuit must be wired specifically to prerequisite resolution — not to
  // runSimulatorRender, exportAttachments, or either count check — so a real compile/render/export
  // failure or a wrong/partial count always propagates to the top-level catch (process.exit(1)) in
  // both modes.
  assert.match(
    src,
    /=\s*checkPrerequisites\(\);\s*\}\s*catch\s*\(error\)\s*\{\s*if\s*\(optional\s*&&\s*error instanceof PrerequisiteUnavailableError\)\s*\{/,
    'expected the optional-mode downgrade to wrap exactly the checkPrerequisites() call',
  );

  const mainBody = extractFunctionBody(src, 'main');
  assert.match(mainBody, /names, found/, 'expected the 202-name union count check to remain unconditional inside main()');
  assert.match(mainBody, /rendered PNG attachments, found/, 'expected the exact-202-attachments check to remain unconditional inside main()');
  assert.doesNotMatch(
    mainBody,
    /runSimulatorRender\([^)]*\)[\s\S]{0,40}catch[\s\S]{0,120}if\s*\(optional/,
    'a real runSimulatorRender failure must never be caught and downgraded by the optional-mode branch',
  );
});

test('Correction (2026-09-28): npm run web starts the dev server via the generator\'s best-effort mode even without Xcode/Simulator, while npm run generate:icons stays strict', () => {
  const packageJson = JSON.parse(read(NATIVE_PREVIEW_PACKAGE_JSON_PATH));
  assert.ok(packageJson.scripts['generate:icons'], 'expected a documented explicit "generate:icons" script');
  assert.match(packageJson.scripts['generate:icons'], /generate-icon-previews\.mjs/);
  assert.doesNotMatch(packageJson.scripts['generate:icons'], /--optional/, 'the explicit generate:icons command must stay strict, never best-effort');

  assert.match(packageJson.scripts.web, /generate-icon-previews\.mjs/, 'expected `npm run web` to wire in generation rather than requiring a separate undocumented step');
  assert.match(packageJson.scripts.web, /--optional\b/, "expected `npm run web` to invoke the generator's best-effort mode so a machine without Xcode can still start the dev server");
  assert.doesNotMatch(packageJson.scripts.web, /&&\s*npm run generate:icons(?!\S)/, 'npm run web must not depend on the strict generate:icons script');

  const gitignore = read(NATIVE_PREVIEW_GITIGNORE_PATH);
  assert.match(gitignore, /public\/generated-icons|generated-icons/, 'expected generated PNGs/manifest to be gitignored, never committed');
});

test('Correction (2026-09-28): README documents strict explicit generation vs. best-effort browser startup, the destination override env var, and the honest per-tile fallback, without a machine-local UDID', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, SIMULATOR_UDID_PATTERN, 'no machine-local Simulator UDID may be documented');
  assert.match(readme, /HERMEX_ICON_SIMULATOR_UDID/, 'expected the README to document the destination override env var');
  assert.match(readme, /--optional/, 'expected the README to name the best-effort flag npm run web uses');
  assert.match(readme, /npm run generate:icons/, 'expected the README to still document the strict explicit generation command');
  assert.match(readme, /Glyph unavailable in browser/, 'expected the README to name the existing per-tile fallback that best-effort mode preserves');
});

test('Correction (2026-09-28): machine-local Simulator UDID literals are absent from the generator and its documentation', () => {
  for (const relPath of [ICON_GENERATOR_SCRIPT_PATH, 'README.md']) {
    assert.doesNotMatch(read(relPath), SIMULATOR_UDID_PATTERN, `${relPath} must not hardcode a machine-local Simulator UDID`);
  }
});

test('the icon-renderer SwiftPM package renders through the real iOS UIKit/SwiftUI runtime (UIImage/Image systemName), never AppKit or a substitute icon library', () => {
  assert.ok(existsSync(path.join(ROOT, ICON_RENDERER_PACKAGE_PATH)), `${ICON_RENDERER_PACKAGE_PATH} should exist`);
  const packageSrc = read(ICON_RENDERER_PACKAGE_PATH);
  assert.match(packageSrc, /\.iOS\(/, 'expected the package to declare an iOS platform, not build for macOS/AppKit');
  assert.doesNotMatch(packageSrc, /\.macOS\(/);

  assert.ok(existsSync(path.join(ROOT, ICON_RENDERER_TEST_PATH)), `${ICON_RENDERER_TEST_PATH} should exist`);
  const testSrc = read(ICON_RENDERER_TEST_PATH);
  assert.match(testSrc, /import UIKit/);
  assert.doesNotMatch(testSrc, /import AppKit/);
  assert.doesNotMatch(testSrc, /NSImage/);
  assert.match(testSrc, /UIImage\(systemName:/);
  assert.match(testSrc, /XCTAttachment/);
  assert.match(testSrc, /\.keepAlways/);
  // Fail-closed: a nil UIImage(systemName:) must fail the run, not render a placeholder.
  assert.match(testSrc, /XCTAssertTrue\(missing\.isEmpty|XCTFail/);

  assert.ok(existsSync(path.join(ROOT, ICON_RENDERER_GITIGNORE_PATH)), `${ICON_RENDERER_GITIGNORE_PATH} should exist so the generated names file and build products are never committed`);
  const rendererGitignore = read(ICON_RENDERER_GITIGNORE_PATH);
  assert.match(rendererGitignore, /GeneratedNames\.swift|GeneratedResources/);
  assert.match(rendererGitignore, /\.build/);
});

test('npm run web makes the generated glyph previews available without an undocumented manual step, and a documented explicit generation command also exists', () => {
  const packageJson = JSON.parse(read(NATIVE_PREVIEW_PACKAGE_JSON_PATH));
  assert.ok(packageJson.scripts['generate:icons'], 'expected a documented explicit "generate:icons" script');
  assert.match(packageJson.scripts['generate:icons'], /generate-icon-previews\.mjs/);
  assert.match(packageJson.scripts.web, /generate:icons|generate-icon-previews\.mjs/, 'expected `npm run web` to wire in generation rather than requiring a separate undocumented step');

  const gitignore = read(NATIVE_PREVIEW_GITIGNORE_PATH);
  assert.match(gitignore, /public\/generated-icons|generated-icons/, 'expected generated PNGs/manifest to be gitignored, never committed');
});

// ─── Task 5: eight replayable motion demonstrations with Reduce Motion ──────────────────────────

test('HermesMotionReference declares all eight motion demo ids, one Replay per demo, a shared Reduce Motion control, and never autoplays or loops', () => {
  const referenceSrc = read(HERMES_MOTION_REFERENCE_PATH);
  const motionDemoIds = [
    'feedbackPress',
    'stateChange',
    'contentEnter',
    'contentExit',
    'overlayEnter',
    'overlayExit',
    'contentReposition',
    'scrollFollow',
  ];
  for (const id of motionDemoIds) {
    assert.ok(referenceSrc.includes(`'${id}'`), `expected the exact motion demo id '${id}'`);
  }
  assert.match(referenceSrc, />Replay</);
  assert.match(referenceSrc, /accessibilityLabel=\{`\$\{title\}: Replay`\}/);
  assert.match(referenceSrc, /Reduce Motion/);
  assert.match(referenceSrc, /AccessibilityInfo\.isReduceMotionEnabled/);
  assert.match(referenceSrc, /Browser demonstration; timing and compositing approximate the SwiftUI implementation\./);
  assert.doesNotMatch(referenceSrc, /Animated\.loop/);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /function HermesMotionGallery|CHAT_MOTION:|SESSION_LIST_MOTION:|function MotionFactRow/);
  const motionSection = extractHermesSection(sectionsSrc, 'Hermex Motion');
  assert.match(motionSection, /render:\s*\(\)\s*=>\s*<HermesMotionReference\s*\/>/);
});

// ─── Rendered-verification correction (2026-09-26) ───────────────────────────────────────────────
// Controller-owned browser verification of the completed Hermex catalog reproduced three issues:
// the Implementation notes disclosure never exposed a browser-observable expanded/collapsed state,
// the Content/Overlay exit motion demos jumped to their exited placeholder immediately on Replay
// instead of animating out over the configured duration, and Replay on web logged a
// useNativeDriver-is-missing console warning. Each test below is scoped to exactly one finding.

test('Correction (2026-09-26): the Implementation notes/Where it appears disclosure exposes an explicit aria-expanded state, since react-native-web does not translate accessibilityState.expanded into aria-expanded on its own', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  // Preserved from the original contract.
  assert.match(detailsSrc, /accessibilityRole="button"/);
  assert.match(detailsSrc, /accessibilityState=\{\{\s*expanded\s*\}\}/);
  assert.match(detailsSrc, /<AnimatedChevron/);
  // The actual fix: react-native-web's own accessibility-prop mapping has no case for
  // `accessibilityState.expanded` (unlike disabled/checked/busy/selected), so it never reaches the
  // DOM as `aria-expanded` on its own — an explicit `aria-expanded` prop is required, same escape
  // hatch convention as CatalogSidebar's own `aria-current` cast.
  assert.match(
    detailsSrc,
    /aria-expanded=\{expanded\}/,
    'expected an explicit aria-expanded prop wired to the disclosure\'s own expanded state',
  );
});

test('Correction (2026-09-26): Content exit and Overlay exit demos animate out over their full configured duration before showing the exited placeholder, instead of switching instantly on Replay', () => {
  const referenceSrc = read(HERMES_MOTION_REFERENCE_PATH);

  // Root cause: `exited`/`closed` was derived from `playKey > 0`, and `playKey` increments
  // synchronously inside `replay()`, before the exit animation has played at all — so the
  // placeholder swapped in immediately instead of after the configured duration.
  assert.doesNotMatch(
    referenceSrc,
    /playKey > 0/,
    'the exited/closed placeholder must no longer be derived from playKey',
  );

  const contentExit = extractFunctionBody(referenceSrc, 'ContentExitDemo');
  assert.match(contentExit, /const \[exited, setExited\] = useState\(false\)/, 'expected ContentExitDemo to own its own exited state, independent of playKey');
  assert.match(contentExit, /setExited\(false\)/, 'expected Replay to first reset back to the visible resting state');
  assert.match(
    contentExit,
    /replay\(durationMs,\s*false,\s*\(\)\s*=>\s*setExited\(true\)\)/,
    'expected the exited placeholder to appear only via the animation\'s own completion callback, not synchronously when Replay is pressed',
  );

  const overlayExit = extractFunctionBody(referenceSrc, 'OverlayExitDemo');
  assert.match(overlayExit, /const \[closed, setClosed\] = useState\(false\)/, 'expected OverlayExitDemo to own its own closed state, independent of playKey');
  assert.match(overlayExit, /setClosed\(false\)/, 'expected Replay to first reset back to the visible resting state');
  assert.match(
    overlayExit,
    /replay\(durationMs,\s*false,\s*\(\)\s*=>\s*setClosed\(true\)\)/,
    'expected the closed placeholder to appear only via the animation\'s own completion callback, not synchronously when Replay is pressed',
  );

  // The shared replay hook must actually support a completion callback, invoked only once the
  // animation genuinely finishes (not when interrupted by a fresh Replay mid-animation).
  assert.match(
    referenceSrc,
    /const replay = \(durationMs: number, opacityOnly = false, onComplete\?:\s*\(\)\s*=>\s*void\)\s*=>\s*\{/,
    'expected useReplayAnimation\'s replay() to accept an optional onComplete callback',
  );
  assert.match(
    referenceSrc,
    /\.start\(\(\{\s*finished\s*\}\)\s*=>\s*\{\s*if\s*\(finished\)\s*onComplete\?\.\(\);\s*\}\)/,
    'expected the completion callback to fire only when the animation actually finished',
  );
});

test('Correction (2026-09-26): Replay never requests the native driver on web, avoiding the "useNativeDriver is not supported" console warning, while still allowed on native', () => {
  const referenceSrc = read(HERMES_MOTION_REFERENCE_PATH);
  assert.match(referenceSrc, /import\s*\{[^}]*\bPlatform\b[^}]*\}\s*from\s*'react-native'/, 'expected Platform to be imported from react-native');
  assert.doesNotMatch(
    referenceSrc,
    /useNativeDriver:\s*true/,
    'must not unconditionally request the native driver, since react-native-web has no native animated module and falls back to JS with a console warning',
  );
  assert.match(
    referenceSrc,
    /useNativeDriver:\s*Platform\.OS\s*!==\s*'web'/,
    'expected the native driver to be requested on native only, never on web',
  );
});

// ─── Reusable component families (2026-09-26 implementation plan) ──────────────────────────────
// Bounded production adoption of Avatar/Shimmer/Button/List/ListItem/Card/Divider/Badge families
// plus the strongest secondary patterns (Disclosure Row, Attachment Tile). New
// section ids deliberately avoid the bare generic-component names ('Avatar', 'Badge', 'Button',
// 'Shimmer', 'Divider') — the retained template catalog already registers sections under those
// exact ids, and CatalogShell's merged nav is keyed by id (see the "no duplicate ids" test above).
const COMPONENT_FAMILIES_PREVIEWS_PATH = 'native/catalog/hermes/HermesComponentFamiliesPreviews.tsx';

test('Card no longer describes stale 16pt-horizontal/14pt-vertical padding and states the approved 16pt-all-around default', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Card');
  assert.doesNotMatch(section, /14pt vertical/, 'the stale 16 horizontal / 14 vertical padding claim must be gone');
  assert.match(section, /16pt (?:content )?padding on every edge/, 'expected the approved 16pt-all-around default to be stated');
  // The real generic Card component (not a local recon style) is the source of truth for the default
  // padding claim — see the "Correction (gap 2)" tests below for its own density contract.
  const cardImplSrc = read('native/components/Card/Card.tsx');
  assert.match(cardImplSrc, /card:\s*\{[^}]*padding:\s*DS_SPACING\[800\]/s);
  assert.doesNotMatch(cardImplSrc, /paddingVertical|paddingHorizontal/);
});

test('Card documents HermexCard.swift as a new, foundation-only primitive that SectionCard does NOT delegate to — both remain separate, independently-implemented components', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Card');

  assert.match(section, /HermexCard\.swift is a new, foundation-only Card primitive/);
  assert.doesNotMatch(section, /SectionCard.*composition.*delegates.*HermexCard/is, 'must not claim SectionCard delegates its chrome to HermexCard.swift — SectionCard.swift does not reference HermexCard.swift');
  assert.match(section, /does not replace or share an implementation with the existing, already-adopted SectionCard\.swift/);
  assert.match(section, /outlined.*system background.*separator/is);
  assert.match(section, /no production file imports HermexCard\.swift/i);
});

test('Avatar broadens Identity Avatar into the umbrella while keeping the original approved introduction verbatim, truthfully separating the pre-existing adopted ServerAvatarBadge/bot-face system from the new unadopted HermexAvatar.swift/HermesAvatarSize', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(src, /id:\s*'Identity Avatar'/, 'the id must be renamed, not left alongside a new duplicate');
  const section = extractHermesSection(src, 'Hermes Avatar');
  assert.match(
    section,
    /Colored initials identify the active server or account\. In the Sessions header, the same control changes into a close button while search is open\./,
    'the original approved introduction must survive verbatim inside the broadened description',
  );
  assert.match(section, /pre-existing bot-face system/i);
  assert.match(section, /HermexAvatar\.swift and HermesAvatarSize.*new in this branch/is);
  assert.match(section, /HermesMobile\/Config\/HermesSpacing\.swift/, 'HermesAvatarSize now lives in HermesSpacing.swift, not BotProfileAppearance.swift');
  assert.match(section, /HermesAvatarSize is defined in HermesMobile\/Config\/HermesSpacing\.swift, not in the pre-existing bot-appearance files/i);
  assert.match(section, /BotAvatarMarkView/);
  assert.match(section, /BotAnimatedFaceView/);
  assert.match(section, /BotInteractiveFaceView/);
  assert.match(section, /HermesMobile\/Features\/Bots\/BotAvatarStore\.swift/);
  assert.match(section, /HermesMobile\/Features\/Bots\/BotFaceMotion\.swift/);
  // BotMarkPreview is composed inside AvatarFamilyGallery (the section's own `render`), not inlined
  // as a literal `variants.items` entry — see the Avatar named/custom size API tests above.
  assert.match(section, /render:\s*\(\)\s*=>\s*<AvatarFamilyGallery/);
  const galleryBody = extractFunctionBody(src, 'AvatarFamilyGallery');
  assert.match(galleryBody, /<BotMarkPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function BotMarkPreview/);
});

test('Row Divider documents the shared SwiftUI HermexDivider as a new, foundation-only component with no production call site', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Row Divider');
  assert.match(section, /HermexDivider/);
  assert.match(section, /No global free-floating opacity token/);
  assert.match(section, /HermesMobile\/Features\/Shared\/HermexDivider\.swift/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Settings\/SettingsView\.swift/, 'SettingsView.swift does not import HermexDivider.swift and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Shared\/SectionCard\.swift/, 'SectionCard.swift does not import HermexDivider.swift and must not be cited as a caller');
  assert.match(section, /FOUNDATION_ONLY_STATUS|no production call site/i);
  assert.match(section, /<HermexDividerPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function HermexDividerPreview/);
});

test('Tag is display-only, documents every Tag.Size case as a new foundation-only component, and truthfully states production\'s six independent capsule pills (still in their own pre-existing files, including SessionRowView.swift) have not migrated onto it', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Tag');
  assert.match(section, /always display-only/i);
  assert.match(section, /Inline Reference Link/);
  assert.doesNotMatch(section, /accessibilityRole="link"|onPress/, 'Tag must document no interactive prop, example, or styling');
  for (const size of ['.compact', '.regular', '.prominent']) {
    assert.ok(section.includes(size), `expected the ${size} size case to be documented`);
  }
  assert.doesNotMatch(section, /\.micro\b/, 'Tag.Size has no .micro case in production — it must not be documented');
  assert.match(section, /isDecorative/);
  assert.match(section, /HermesMobile\/Features\/Shared\/Tag\.swift/);
  assert.doesNotMatch(section, /StatusCapsule\.swift/, 'StatusCapsule.swift does not exist in this worktree — Tag.swift is the real, only source file');
  for (const notCallSite of [
    'HermesMobile/Features/SessionList/SessionListItem.swift',
    'HermesMobile/Features/Tasks/TasksView.swift',
    'HermesMobile/Features/Workspace/GitWorkspaceView.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Settings/SettingsView.swift',
  ]) {
    assert.doesNotMatch(section, new RegExp(notCallSite.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${notCallSite} does not import Tag.swift and must not be cited as a migrated call site`);
  }
  assert.match(section, /unmigrated capsule-style implementations/i);
  assert.match(section, /<TagGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function TagGallery/);
});

// Correction (production reconciliation): production's Tag.Size enum (StatusCapsule.swift) has only
// .compact/.regular/.prominent cases — no .micro. The catalog previously invented a fourth, 4/2-padding
// "micro" size for Sessions' Cached/Read-only/source tags that no production call site actually uses.
test('Correction (production reconciliation): the Tag gallery has no micro size — Sessions\' Cached/Read-only/source tags render at the retained compact (8/2 padding) size', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'TagGallery');
  assert.doesNotMatch(body, /micro/i, 'the TagGallery preview must not render or caption a micro size');
  assert.doesNotMatch(body, /hPad=\{4\}/, 'no TagSwatch may use the retired 4pt micro horizontal padding');
  assert.match(body, /Cached/);
  assert.match(body, /Read-only/);
  assert.match(body, /claude-code/);
  assert.match(body, /size: compact \(8\/2 padding\)/);
});

test('Inline Reference Link is a real focusable link, distinct from Tag — link semantics, no capsule styling, and a documented pressed/focus contrast', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Inline Reference Link');
  assert.match(section, /accessibilityRole:\s*"?link"?|accessibilityRole.*link/i);
  assert.match(section, /keyboard-focusable/i);
  assert.match(section, /Tag/);
  assert.match(section, /<InlineReferenceLinkPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function InlineReferenceLinkPreview/);
  const previewBody = extractFunctionBody(previewsSrc, 'InlineReferenceLinkPreview');
  assert.match(previewBody, /accessibilityRole="link"/);
  assert.match(previewBody, /onFocus=/);
  assert.match(previewBody, /onPressIn=/);
  assert.doesNotMatch(previewBody, /backgroundColor:|borderRadius:\s*999/, 'must carry no capsule-style fill/outline at any state');
});

test('Buttons documents every HermexButtonPressOnlyStyle.Chrome case and every HermexButtonEmphasis value as a new, foundation-only pair of ButtonStyles, names the shared applyingHermexButtonPressFeedback helper and optional haptics, and truthfully states that production\'s ChatTactileButtonStyle/.chatTactile and ChatDecisionButtonStyle/.chatDecision remain the real, current, unmigrated implementation', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Buttons');
  for (const chrome of ['.icon', '.compactControl', '.capsule', '.card', '.thumbnail']) {
    assert.ok(section.includes(chrome), `expected HermexButtonPressOnlyStyle.Chrome case ${chrome}`);
  }
  for (const emphasis of ['.primary', '.secondary', '.destructive']) {
    assert.ok(section.includes(emphasis), `expected HermexButtonEmphasis value ${emphasis}`);
  }
  assert.match(section, /HermesMobile\/Features\/Shared\/HermexButton\.swift/, 'expected the new, foundation-only Buttons source file');
  assert.match(section, /applyingHermexButtonPressFeedback/, 'expected the one shared press-feedback helper both ButtonStyles call');
  assert.match(section, /haptic/i, 'expected optional, opt-in haptics to be documented');
  assert.match(section, /Reduce Motion/);
  assert.match(section, /<ButtonDecisionAndTactilePreview/);

  // ChatTactileButtonStyle/.chatTactile and ChatDecisionButtonStyle/.chatDecision are the real,
  // current, unmigrated production implementation (18+ .chatTactile( call sites; the approval
  // overlay and bot pending-request card both call .chatDecision( directly) — they must be named as
  // such, never framed as "retired" or confined to a historical-only note.
  assert.match(section, /ChatTactileButtonStyle\.swift/, 'expected ChatTactileButtonStyle.swift named as the real, unchanged production file');
  assert.match(section, /\.chatTactile\(/, 'expected .chatTactile( named as a real, current production call');
  assert.match(section, /\.chatDecision\(/, 'expected .chatDecision( named as a real, current production call');
  assert.doesNotMatch(section, /retired|succeeds the retired|renamed/i, 'must not claim ChatTactileButtonStyle/ChatDecisionButtonStyle were retired, renamed, or succeeded — they are still the real production implementation');
  assert.match(section, /no \.hermexPressOnly\(_:\) call site exists in production yet/i);

  const pendingRequestSection = extractHermesSection(src, 'Pending Request');
  assert.match(pendingRequestSection, /\.chatTactile\(|\.chatDecision\(/, 'expected Pending Request to name the real .chatTactile(/.chatDecision( call sites its decision controls actually use');
  assert.doesNotMatch(pendingRequestSection, /\.hermexPressOnly\(|\.hermex\(_:emphasis:/, 'Pending Request must not claim its decision controls use the new, unadopted HermexButton API');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function ButtonDecisionAndTactilePreview/);
  const body = extractFunctionBody(previewsSrc, 'ButtonDecisionAndTactilePreview');
  assert.match(body, /HermexButtonPressOnlyStyle/);
});

test('the generic Button component gains a destructive variant backed by existing DS_SEMANTIC tokens, and the retained template catalog demonstrates it', () => {
  const typesSrc = read('native/components/Button/Button.types.ts');
  assert.match(typesSrc, /'destructive'/);

  const implSrc = read('native/components/Button/Button.tsx');
  assert.match(implSrc, /destructive:\s*\{/);
  assert.match(implSrc, /DS_SEMANTIC\.emphasis\.negative/);
  assert.match(implSrc, /DS_SEMANTIC\.shade\.negative/);
  assert.doesNotMatch(implSrc, /#[0-9a-fA-F]{3,8}/, 'the new variant must reuse existing semantic tokens, never a hardcoded hex');

  const templateSrc = read(CATALOG_EXAMPLE_PATH);
  assert.match(templateSrc, /variant:\s*'destructive'/);
});

// Root-cause fix (React Native Web Button rendering): `Animated.createAnimatedComponent(Pressable)`
// reserves its `style` prop for animated interpolation, so the function-valued
// `style={({ pressed }) => [...]}` Pressable itself supports was never invoked on web — every style
// depending on it (background, border, padding/sizing) silently dropped, rendering every documented
// Button transparent, borderless, and label-sized. The fix tracks `pressed` as plain state (the same
// pattern already used for `focused`) so `style` stays a plain array on every platform, rather than
// splitting into two nested Pressable/Animated.View layers.
test('Button fixes the reproduced React Native Web rendering bug by never passing a function to the Animated-wrapped Pressable\'s style prop, while preserving press-scale feedback, Reduce Motion, and accessibility semantics', () => {
  const implSrc = read('native/components/Button/Button.tsx');
  assert.match(implSrc, /const AnimatedPressable = Animated\.createAnimatedComponent\(Pressable\);/);
  assert.match(implSrc, /const \[pressed, setPressed\] = useState\(false\);/, 'expected pressed to be tracked as plain state, the same pattern as the existing focused state');
  assert.match(implSrc, /setPressed\(true\)/, 'expected handlePressIn to set pressed state');
  assert.match(implSrc, /setPressed\(false\)/, 'expected handlePressOut to clear pressed state');

  const returnMatch = implSrc.match(/return \(\s*<AnimatedPressable[\s\S]*?\n  \);\n\}/);
  assert.ok(returnMatch, 'expected to find the AnimatedPressable returned from ButtonImpl');
  const animatedPressableJsx = returnMatch[0];
  assert.doesNotMatch(
    animatedPressableJsx,
    /style=\{\s*\(\s*\{\s*pressed/,
    'the Animated-wrapped Pressable must never receive a function-valued style — it is silently dropped on React Native Web',
  );
  assert.match(animatedPressableJsx, /style=\{\[/, 'expected a plain style array, not a function, on the Animated-wrapped Pressable');
  assert.match(animatedPressableJsx, /variantStyle\.container/, 'expected the variant background to remain part of that plain style array');
  assert.match(animatedPressableJsx, /transform: \[\{ scale: scaleAnim \}\]/, 'expected press-scale feedback to be preserved');
  assert.match(implSrc, /useReduceMotion/, 'expected Reduce Motion handling to be preserved');
  assert.match(implSrc, /accessibilityRole="button"/);
  assert.match(implSrc, /accessibilityState=\{accessibilityState\}/);
});

test('Skeleton Loading is a new, foundation-only static primitive — no continuous shimmer introduced, and production\'s existing loading placeholders truthfully stated as not migrated onto it', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Skeleton Loading');
  assert.match(section, /foundation-only/i);
  assert.match(section, /HermesMobile\/Features\/Shared\/SkeletonPlaceholder\.swift/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/SessionList\/SessionListComponents\.swift/, 'must not be cited as a SkeletonPlaceholder caller — it does not import it');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Insights\/ProviderLimitsCard\.swift/, 'must not be cited as a SkeletonPlaceholder caller — it does not import it');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Chat\/ChatTranscriptSupportingViews\.swift/, 'must not be cited as a SkeletonPlaceholder caller — it does not import it');
  assert.match(section, /none imports SkeletonPlaceholder\.swift/i);
  assert.match(section, /<HermesSkeletonGallery/, 'the static gallery, not the animated Shimmer, must be this section\'s primary render');
  assert.doesNotMatch(section, /<ShimmerFamilyGallery/, 'the animated Shimmer must not be this section\'s primary render');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function HermesSkeletonGallery/);
  const staticBody = extractFunctionBody(previewsSrc, 'HermesSkeletonGallery');
  assert.doesNotMatch(staticBody, /Animated\.|useNativeDriver/, 'the static gallery must render plain (non-animated) shapes');
  for (const shapeHint of ['skeletonTextLine', 'skeletonCircle', 'skeletonRect', 'skeletonRoundedRect', 'skeletonCard']) {
    assert.ok(staticBody.includes(shapeHint), `expected the static gallery to render the ${shapeHint} shape`);
  }
  assert.match(staticBody, /Block/, 'expected the rectangle specimen to be named as the reusable block shape');
  assert.match(staticBody, /SkeletonGroup/, 'expected a grouped composition with one accessibility announcement');

  // The catalog's own animated Shimmer remains available as a distinct, non-primary reference.
  assert.match(previewsSrc, /export function ShimmerFamilyGallery/);
  assert.match(previewsSrc, /variant="circle"/);
});

test('List / ListItem and SessionListItem.swift are new, foundation-only in this branch — SessionRowView.swift genuinely still exists and is not "retired", and no picker sheet or BotInboxView has migrated onto ListItem', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.match(section, /Picker Row/);
  assert.match(section, /SessionListItem/);
  assert.match(section, /HermesMobile\/Features\/Shared\/ListItem\.swift/);
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListItem\.swift/, 'SessionListItem.swift is itself new in this branch, with no production caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/SessionList\/SessionListComponents\.swift/, 'must not claim SessionListComponents.swift wraps the new SessionListItem — it keeps its own pre-existing row implementation');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Bots\/BotsInboxView\.swift/, 'must not claim BotsInboxView.swift migrated onto ListItem');
  assert.doesNotMatch(section, /SessionRowView\.swift no longer exists|retired SessionRowView/i, 'SessionRowView.swift genuinely still exists in this worktree and is actively used — it was never split or retired');
  assert.match(section, /<ListItemFamilyGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function ListItemFamilyGallery/);
  const body = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.match(body, /Picker configuration/);
  assert.match(body, /SessionListItem composition/);

  // Ground truth, independent of the catalog text: SessionRowView.swift must actually exist in this
  // worktree, so the catalog can never truthfully claim it was split or retired.
  assert.ok(existsSync(path.join(ROOT, '../HermesMobile/Features/SessionList/SessionRowView.swift')), 'SessionRowView.swift must exist in the target worktree');
});

// Correction (2026-09-26 catalog/production reconciliation): Picker Row's retired shared metrics
// helpers (PickerRowMetrics.minHeight/cornerRadius, pickerSelectionPill(isSelected:)) were replaced
// in the final production tree by ListItem's own ListItemMetrics.minHeight/.cornerRadius and
// listItemSelectionPill(isSelected:) — the reusable-geometry facts table must not still cite the
// retired names/source file as active.
test('Correction (production reconciliation): the reusable-geometry facts table no longer cites the retired PickerRowMetrics/ModelPickerSheet.swift pairing', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(src, /PickerRowMetrics/, 'PickerRowMetrics was retired in favor of ListItemMetrics; no active reference/token data may still cite it');
  assert.doesNotMatch(src, /pickerSelectionPill/, 'pickerSelectionPill was retired in favor of listItemSelectionPill');
});

test('Picker Row no longer exists as a standalone family — no section id, no nav entry, and no dedicated preview component', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /id:\s*'Picker Row'/);
  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  assert.doesNotMatch(navBlockMatch[0], /Picker Row/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.doesNotMatch(previewsSrc, /export function PickerRowPreview/);
});

test('Correction (final-review truthfulness pass): the Disclosure Row preview caption truthfully distinguishes the adopted production TranscriptLogRowView from the new, foundation-only DisclosureRow reconstruction', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'DisclosureLogRowPreview');
  assert.doesNotMatch(
    body,
    /TranscriptLogRowView\.swift no longer exists|retired TranscriptLogRowView|renamed to DisclosureRow/i,
    'TranscriptLogRowView.swift genuinely still exists and is the real, adopted production component — it was never retired or renamed',
  );
  assert.doesNotMatch(body, /One DisclosureRow, three call sites/, 'must not claim DisclosureRow itself is used at the three production call sites');
  assert.match(body, /TranscriptLogRowView/, 'expected the caption to name TranscriptLogRowView as production\'s real, adopted row at the three call sites');
  assert.match(body, /foundation-only/i, 'expected the caption to state DisclosureRow is a new, foundation-only reconstruction');
});

// Correction (production reconciliation): DisclosureRow.swift uses one token-sized downward chevron
// and rotates it upward from the actual expansion state. The catalog follows the same state model
// instead of swapping glyphs or rendering an arbitrary fixed direction.
test('Correction (production reconciliation): the Disclosure Row preview rotates one downward shared Icon upward from actual expansion state', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /import\s*\{[^}]*\bDS_ICON_SIZE\b[^}]*\}\s*from\s*'\.\.\/\.\.\/\.\.\/tokens'/, 'expected DS_ICON_SIZE to be imported rather than an arbitrary chevron size literal');
  const chevronBody = extractFunctionBody(previewsSrc, 'DisclosureChevron');
  assert.match(chevronBody, /name="chevron-down"\s+size=\{DS_ICON_SIZE\.\w+\}/);
  assert.match(chevronBody, /rotate:\s*expanded\s*\?\s*'180deg'\s*:\s*'0deg'/);
  assert.doesNotMatch(chevronBody, /chevron-up/, 'rotation, not a second icon, owns the expanded state');

  for (const fnName of ['DisclosureLogRowPreview', 'TranscriptActivityPreview']) {
    const body = extractFunctionBody(previewsSrc, fnName);
    assert.doesNotMatch(body, /['"]⌄['"]|['"]›['"]/, `expected ${fnName} to render no chevron glyph literal`);
    assert.match(body, /<DisclosureChevron expanded=\{[^}]+\}\s*\/>/, `expected ${fnName} to pass actual expansion state to the shared chevron`);
  }

  const section = extractHermesSection(read(HERMES_SECTIONS_PATH), 'Disclosure Row');
  assert.doesNotMatch(section, /logChevron/, 'the removed logChevron style must not still be referenced');
});

test('Disclosure Row documents DisclosureRow.swift as a new, foundation-only reconstruction, and truthfully names the real, adopted TranscriptLogRowView.swift (which genuinely still exists and is not "retired") as the actual production row used by tool-call log, reasoning block, and bot activity call sites', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Disclosure Row');
  assert.match(section, /HermesMobile\/Features\/Chat\/DisclosureRow\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/TranscriptLogRowView\.swift/, 'TranscriptLogRowView.swift genuinely still exists and is the real, adopted production component');
  assert.doesNotMatch(section, /TranscriptLogRowView\.swift no longer exists|renamed to DisclosureRow/i, 'must not claim TranscriptLogRowView.swift was renamed or no longer exists');
  assert.match(section, /DisclosureRowMetrics/);
  assert.match(section, /<DisclosureLogRowPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function DisclosureLogRowPreview/);
});

test('Correction (design-system-foundation truthfulness pass): the reusable-geometry facts table cites the real, adopted TranscriptLogRowMetrics/TranscriptLogRowView.swift — which genuinely still exists and was never renamed — alongside DisclosureRowMetrics/DisclosureRow.swift as its new, foundation-only duplicate, and the Hermex Radius & Geometry section follows suit', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.match(src, /TranscriptLogRowMetrics/, 'TranscriptLogRowMetrics is the real, adopted symbol in TranscriptLogRowView.swift and must be cited as the geometry facts\' authoritative source');
  assert.match(src, /HermesMobile\/Features\/Chat\/TranscriptLogRowView\.swift/, 'TranscriptLogRowView.swift genuinely still exists in this worktree');
  assert.doesNotMatch(src, /TranscriptLogRowView\.swift no longer exists|renamed to DisclosureRow/i, 'must not claim TranscriptLogRowView.swift was renamed or removed');

  const geometrySection = extractHermesSection(src, 'Hermex Radius & Geometry');
  assert.match(geometrySection, /TranscriptLogRowMetrics/);
});

test('Correction (production reconciliation): the still-unadopted Radius/Geometry proposal\'s retained-exception fact also cites DisclosureRowMetrics, not the retired TranscriptLogRowMetrics', () => {
  const proposal = read(HERMES_TOKEN_PROPOSAL_PATH);
  assert.doesNotMatch(proposal, /TranscriptLogRowMetrics/, 'TranscriptLogRowMetrics was renamed to DisclosureRowMetrics in the final production tree');
  assert.match(proposal, /name:\s*'DisclosureRowMetrics\.bodyWindowHeight'/);
});

test('Attachment documents the new, foundation-only AttachmentFileType/AttachmentTile family, Compact Card composition, and the mini-preview staying outside Card, without claiming a production call site', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Attachment');
  assert.match(section, /HermesMobile\/Features\/Shared\/AttachmentFileType\.swift/);
  assert.match(section, /HermesMobile\/Features\/Shared\/AttachmentTile\.swift/);
  assert.match(section, /Compact Card/);
  assert.match(section, /<AttachmentTileGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function AttachmentTileGallery/);
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.match(body, /Compact Card/);
  assert.match(body, /Compact attachment preview/);
  assert.match(body, /File fallback/);
  assert.match(body, /Loading/);
  assert.match(body, /Failure/);
  assert.match(body, /attachmentRemove/);
});

// Correction (design-system-foundation truthfulness pass): compactCardSurface(cornerRadius:) and
// HermexCard.swift do not exist as a real dependency of MessageBubbleView.swift or
// ChatComposerAttachmentStripView.swift — neither file imports HermexCard.swift in this branch.
// Attachment must state this as foundation-only, not as an adopted production composition.
test('Correction (design-system-foundation truthfulness pass): Attachment states its Compact-Card composition as foundation-only — MessageBubbleView.swift and ChatComposerAttachmentStripView.swift do not import HermexCard.swift or call compactCardSurface', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Attachment');
  assert.match(section, /foundation-only/i);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Shared\/HermexCard\.swift/, 'Attachment does not depend on HermexCard.swift');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Chat\/MessageBubbleView\.swift/, 'MessageBubbleView.swift does not import AttachmentFileType.swift/AttachmentTile.swift and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Chat\/ChatComposerAttachmentStripView\.swift/, 'ChatComposerAttachmentStripView.swift does not import AttachmentFileType.swift/AttachmentTile.swift and must not be cited as a caller');
});

test('Correction (design-system-foundation truthfulness pass): Banner states the offline-cache consolidation as foundation-only — ChatView.swift and SessionListView.swift each keep their own separate, pre-existing offline notice, not Banner.offlineCache()', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Banner');
  assert.match(section, /foundation-only/i);
  assert.match(section, /HermesMobile\/Features\/Shared\/Banner\.swift/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Chat\/ChatView\.swift/, 'ChatView.swift does not import Banner.swift and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/SessionList\/SessionListView\.swift/, 'SessionListView.swift does not import Banner.swift and must not be cited as a caller');
  assert.match(section, /ChatView\.swift and SessionListView\.swift each still implement their own offline-cache notice independently/i);
});

// Correction (design-system-foundation truthfulness pass): ComposerChipToken.isInteractiveReference
// and ComposerChipVisualStyle do not exist anywhere in production source — ComposerChipToken.swift
// and ComposerChipRendering.swift render every reference kind through one uniform baked-image chip.
// Inline Reference Link must state this truthfully, not claim an adopted rendering/accessibility split.
test('Correction (design-system-foundation truthfulness pass): Inline Reference Link states there is no ComposerChipVisualStyle/isInteractiveReference split in production — every reference renders through one uniform chip', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Inline Reference Link');
  assert.match(section, /no ComposerChipVisualStyle type, no isInteractiveReference property/i);
  assert.match(section, /HermesMobile\/Features\/Chat\/ComposerChipRendering\.swift/);
});

// Controller correction (2026-09-26, gap 1): Reference Chip was superseded — it named the same
// ComposerChipRendering drawing path Tag and Inline Reference Link already document their own halves
// of (inert skill/bot references vs. tappable file references), so keeping it as a third, separate
// Components entry duplicated the taxonomy the approved specification actually adopted (§4.6). It
// must no longer exist as its own section id, nav entry, preview export, or active-family reference;
// the ComposerChipRendering evidence itself must survive, split across Tag/Inline Reference Link.
test('Reference Chip no longer exists as a standalone Component — no section id, no nav entry, no preview export — and Tag/Inline Reference Link carry the ComposerChipRendering split instead', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /id:\s*'Reference Chip'/, 'Reference Chip must no longer be a registered SectionDef');
  assert.doesNotMatch(sectionsSrc, /'Reference Chip'/, 'no reference to the retired Reference Chip id may remain, including in the HermesSectionId union or nav');
  assert.doesNotMatch(sectionsSrc, /<ReferenceChipPreview/, 'no section may still render the retired preview');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  assert.doesNotMatch(navBlockMatch[0], /Reference Chip/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.doesNotMatch(previewsSrc, /export function ReferenceChipPreview/, 'the retired preview component must be deleted, not left as dead code');

  // Tag and Inline Reference Link both reference the real, unified ComposerChipRendering drawing
  // path — truthfully, as one uniform chip renderer with no distinct visual/interactive split today,
  // not as evidence of an adopted Tag/Inline-Reference-Link migration.
  const tagSection = extractHermesSection(sectionsSrc, 'Tag');
  assert.match(tagSection, /ComposerChipRendering\.swift/, 'expected Tag to reference the real composer chip rendering path');
  assert.match(tagSection, /pre-existing, separately-implemented capsule styling|separate, pre-existing drawing path/i);

  const linkSection = extractHermesSection(sectionsSrc, 'Inline Reference Link');
  assert.match(linkSection, /ComposerChipRendering\.swift/, 'expected Inline Reference Link to reference the real composer chip rendering path');
  assert.match(linkSection, /uniform baked-image chip/i);
});

test('every Hermex-owned component-family section is reachable from Components — Hermex; native TopNav stays outside it', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  for (const id of [
    'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Row Divider', 'Tag',
    'Inline Reference Link', 'Search', 'Buttons', 'Hermes Checkbox', 'Skeleton Loading',
    'List / ListItem', 'Disclosure Row',
  ]) {
    assert.ok(ids.includes(id), `expected "${id}" in the Components — Hermex nav group`);
  }
  assert.ok(!ids.includes('Hermes TopNav'), 'native TopNav belongs in Native iOS — Hermex, not Components — Hermex');
});

test('Checkbox is a new, foundation-only Components — Hermex entry (no production call site) that reuses the real generic catalog Checkbox, documents checked/unchecked/disabled/focus/interactive/row-owned-indicator configurations, and stays distinct from Radio/Toggle/status-checkmark controls', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Hermes Checkbox'/, "expected 'Hermes Checkbox' in the HermesSectionId union");
  const section = extractHermesSection(sectionsSrc, 'Hermes Checkbox');
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /row-owned/i, 'expected the row-owned indicator configuration to be documented');
  assert.match(section, /accessibility-hidden/i, 'expected the decorative/accessibility-hidden behavior of the row-owned configuration to be documented');
  assert.match(section, /never a checkbox nested inside another control|controls are never nested/i);
  assert.match(section, /\bToggle\b/, 'expected Checkbox to be distinguished from native Toggle (not the nonexistent "Switch")');
  assert.doesNotMatch(section, /use Switch/, 'Switch is not a Hermex entry or a SwiftUI control');
  assert.match(section, /\bRadio\b/, 'expected Checkbox to be distinguished from Radio');
  assert.match(section, /Tag/, 'expected Checkbox to be distinguished from a Tag-style status/completion mark');
  assert.match(section, /HermesMobile\/Features\/Shared\/HermexCheckbox\.swift/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Bots\/BotPendingRequestCard\.swift/, 'BotPendingRequestCard.swift does not import HermexCheckbox.swift and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Kanban\/KanbanLabView\.swift/, 'KanbanLabView.swift does not import HermexCheckbox.swift and must not be cited as a caller');
  assert.match(section, /<CheckboxFamilyGallery/);

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.includes('Hermes Checkbox'), 'expected "Hermes Checkbox" in the Components — Hermex nav group');

  assert.match(sectionsSrc, /import\s*\{[^}]*\bCheckboxFamilyGallery\b[^}]*\}\s*from\s*'\.\/HermesComponentFamiliesPreviews'/);
});

test('the generic catalog Checkbox supports an omittable onChange for a row-owned, accessibility-hidden indicator, without a duplicate Hermex-specific component', () => {
  const implSrc = read('native/components/Checkbox/Checkbox.tsx');
  assert.match(implSrc, /onChange\?:\s*\(checked:\s*boolean\)\s*=>\s*void/, 'expected onChange to be optional');
  assert.match(implSrc, /accessibilityElementsHidden/, 'expected the row-owned configuration to hide the decorative box from assistive tech');
  assert.match(implSrc, /importantForAccessibility="no-hide-descendants"/);
  const rowOwnedBranchMatch = implSrc.match(/if \(!onChange\) \{([\s\S]*?)\n  \}/);
  assert.ok(rowOwnedBranchMatch, 'expected an explicit branch for the row-owned (no onChange) configuration');
  assert.doesNotMatch(rowOwnedBranchMatch[1], /accessibilityRole="checkbox"/, 'a non-interactive indicator must not still claim the checkbox accessibility role');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function CheckboxFamilyGallery/);
  const body = extractFunctionBody(previewsSrc, 'CheckboxFamilyGallery');
  assert.match(body, /<Checkbox checked=\{false\} onChange=\{\(\) => \{\}\} label="Unchecked"/, 'expected an unchecked instance');
  assert.match(body, /<Checkbox checked=\{true\} onChange=\{\(\) => \{\}\} label="Checked"/, 'expected a checked instance');
  assert.match(body, /disabled/, 'expected a disabled instance');
  assert.match(body, /<CheckboxRowOwnedDemo/, 'expected a row-owned indicator demo');
  const rowOwnedBody = extractFunctionBody(previewsSrc, 'CheckboxRowOwnedDemo');
  assert.match(rowOwnedBody, /<ListItem/, 'expected the row-owned demo to compose the real ListItem');
  assert.match(rowOwnedBody, /<Checkbox checked=\{[^}]+\}\s*\/>/, 'expected the row-owned Checkbox instance to omit onChange');
  assert.match(rowOwnedBody, /selected=\{/, 'expected the owning ListItem to expose its own selected state');
  assert.doesNotMatch(previewsSrc, /export function HermexCheckbox\b/, 'must not introduce a duplicate Hermex-specific checkbox component');
});

// Correction (#607 follow-up 2): the previous "Input Field" entry mis-registered production's native
// text entry as a Components — Hermex entry that reused the generic template InputField's
// floating-label visual — production never adopts that look. It was replaced by a "Text Input" entry
// under Native iOS — Hermex documenting the real native SwiftUI controls (TextField, SecureField,
// TextEditor, `.searchable`) with an honest native-style reconstruction instead.
//
// Issue #607 (Text Input family slice): Text Input itself now becomes a Hermex-owned Components entry
// once three thin foundation wrappers — HermexTextField, HermexSecureField, HermexNumberField
// (HermexTextInput.swift) — ship over native TextField/SecureField/TextField(value:format:), the same
// ownership-flip pattern Search went through for `.hermexSearch` over `.searchable`. Multiline stays
// truthfully native (TextEditor, not a newly owned wrapper) and Search stays its own separate
// Components family rather than a Text Input variant.
test('Issue #607: Text Input becomes a Hermex-owned Components entry (HermexTextField/HermexSecureField/HermexNumberField over native TextField/SecureField/TextField(value:format:)), truthfully keeping TextEditor native and Search separate', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /\| 'Input Field'/, "the retired 'Input Field' id must no longer appear in the HermesSectionId union");
  assert.match(sectionsSrc, /\| 'Text Input'/, "expected 'Text Input' in the HermesSectionId union");

  const section = extractHermesSection(sectionsSrc, 'Text Input');
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /HermexTextField/, 'expected the entry to name the Hermex-owned HermexTextField wrapper');
  assert.match(section, /HermexSecureField/, 'expected the entry to name the Hermex-owned HermexSecureField wrapper');
  assert.match(section, /HermexNumberField/, 'expected the entry to name the Hermex-owned HermexNumberField wrapper');
  assert.match(section, /HermexTextField\(_:text:prompt:\)/, 'expected the catalog API to include HermexTextField\'s optional native prompt');
  assert.match(section, /HermexSecureField\(_:text:prompt:\)/, 'expected the catalog API to include HermexSecureField\'s optional native prompt');
  assert.match(section, /HermexNumberField\(_:value:format:prompt:\)/, 'expected the catalog API to include HermexNumberField\'s optional native prompt');
  assert.match(section, /optional native `Text` prompt/i, 'expected the catalog to explain that prompt forwarding stays native');
  assert.match(section, /TextField\(value:format:\)|TextField\(_:value:format:\)/, 'expected the entry to name the native typed TextField(value:format:) path HermexNumberField forwards to');
  assert.match(section, /TextEditor/, 'expected TextEditor to remain named as a truthful native multiline alternative');
  assert.doesNotMatch(section, /<InputField\b/, 'must not render the generic template InputField as if it were production UI');
  assert.doesNotMatch(section, /<NativeTextInputPreview/, 'expected the retired native-only preview name to be gone from this entry\'s render reference');
  assert.match(section, /generic template InputField/i, 'expected the entry to explicitly disclaim the generic template InputField');

  const ref = extractHermesReferenceBlock(section);
  assert.doesNotMatch(ref, /\.searchable/, 'Search must not be listed as a Text Input variant/prop');
  const alts = extractAlternativeNames(ref);
  assert.ok(alts.includes('Search'), 'expected a reciprocal Search alternative');

  const state = extractAdoptionState(section);
  assert.equal(state, 'foundation-available', 'expected foundation-available, not native-platform, once the wrappers ship');
  assert.match(section, /foundation-available on this branch|are foundation-available/i, 'expected the adoptionStatus detail to state the wrappers are foundation-available on this branch');
  assert.match(section, /zero production screens use them/i, 'expected the adoptionStatus detail to truthfully report zero production adoption');
  assert.match(section, /remain unchanged/i, 'expected the adoptionStatus detail to state current direct native call sites remain unchanged');
  assert.match(section, /separate (?:adoption )?issue/i, 'expected migration to be scoped to a separate issue');
  assert.doesNotMatch(section, /adoptionStatus:\s*\{\s*state:\s*'production-adopted'/, 'Text Input must not claim production adoption');

  assert.match(section, /HermesMobile\/Features\/Shared\/HermexTextInput\.swift/, 'expected implementationNotes.sourcePaths to cite the new HermexTextInput.swift wrappers');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const nativeIOSGroupMatch = navBlockMatch[0].match(/label:\s*'Native iOS',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(nativeIOSGroupMatch, 'expected the Native iOS — Hermex nav group');
  assert.deepEqual(
    [...nativeIOSGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]),
    ['Hermes TopNav'],
    'expected Text Input to move out of Native iOS, leaving only Hermes TopNav there',
  );

  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const componentIds = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(!componentIds.includes('Input Field'), 'Input Field must no longer live in Components — Hermex');
  assert.ok(componentIds.includes('Text Input'), 'expected Text Input to move into the Components — Hermex nav group');
  assert.ok(componentIds.includes('Search'), 'Search is a Components — Hermex entry, not a Native iOS entry');

  assert.doesNotMatch(
    sectionsSrc,
    /import\s*\{[^}]*\bInputField\b[^}]*\}\s*from\s*'\.\.\/\.\.\/components'/,
    'hermesSections.tsx must no longer import the generic template InputField',
  );

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.doesNotMatch(previewsSrc, /export function NativeTextInputPreview/, 'expected the retired native-only preview to be gone');
  assert.match(section, /<HermexTextInputFamilyGallery/, 'expected Text Input to render the renamed Hermex family preview');
  assert.match(previewsSrc, /export function HermexTextInputFamilyGallery/);
  const body = extractFunctionBody(previewsSrc, 'HermexTextInputFamilyGallery');
  assert.match(body, /secureTextEntry/, 'expected an interactive secure-entry example');
  assert.doesNotMatch(body, /multiline/, 'must not demonstrate a multiline variant — TextEditor stays native, not a Text Input variant');
  assert.doesNotMatch(body, /accessibilityRole="search"/, 'must not demonstrate a search variant — Search stays its own family, not a Text Input variant');
  assert.doesNotMatch(body, /keyboardType=/, 'the number reconstruction must not imply that HermexNumberField forces a keyboard policy');
  assert.match(body, /onChangeText/, 'expected interactive entry, not a static mock');
});

// Issue #607 (Bottom Sheet family slice): a Hermex-owned Components entry for HermexBottomSheet — a
// content scaffold supplied to native SwiftUI `.sheet` (never a replacement for it), composing a
// NavigationStack, the existing TopNav (via native `.toolbar` at modal-appropriate placements), an
// unconstrained body slot (native List or arbitrary content), and an optional horizontal/vertical
// footer pinned with `.safeAreaInset`. Foundation-only: no production sheet adopts it in this slice.
test('Issue #607: Bottom Sheet becomes a Hermex-owned Components entry (HermexBottomSheet over native `.sheet`, composing TopNav + an unconstrained body slot + an optional horizontal/vertical footer), truthfully claiming zero production adoption and distinguishing itself from Dialog and a full-screen destination', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Bottom Sheet'/, "expected 'Bottom Sheet' in the HermesSectionId union");

  const section = extractHermesSection(sectionsSrc, 'Bottom Sheet');
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /HermexBottomSheet/, 'expected the entry to name the Hermex-owned HermexBottomSheet scaffold');
  assert.match(section, /NavigationStack/, 'expected the entry to document the owned NavigationStack');
  assert.match(section, /TopNav/, 'expected the entry to document composing the existing TopNav');
  assert.match(section, /\.cancellationAction/, 'expected the entry to document the modal-appropriate leading placement');
  assert.match(section, /\.confirmationAction/, 'expected the entry to document the modal-appropriate trailing placement');
  assert.match(section, /native List or arbitrary content|a native `?List`? or arbitrary content/i, 'expected the entry to document the body slot accepting List or arbitrary content');
  assert.match(section, /footerAxis/, 'expected the entry to document the footerAxis prop');
  assert.match(section, /horizontal/i);
  assert.match(section, /vertical/i);
  assert.match(section, /\.safeAreaInset/, 'expected the entry to document native safeAreaInset footer pinning');
  assert.match(section, /detents/i, 'expected the entry to state the caller keeps owning detents');
  assert.match(section, /drag indicator/i, 'expected the entry to state the caller keeps owning the drag indicator');
  assert.match(section, /interactive-dismiss/i, 'expected the entry to state the caller keeps owning interactive-dismiss policy');
  assert.match(section, /dismissal/i, 'expected the entry to state the caller keeps owning dismissal');
  assert.match(section, /Reduce Motion/, 'expected the entry to state native SwiftUI owns Reduce Motion');
  assert.match(section, /presentation motion|native SwiftUI (?:alone )?owns/i, 'expected the entry to state native SwiftUI owns presentation motion');

  const ref = extractHermesReferenceBlock(section);
  assert.match(ref, /Dialog/, 'expected avoidWhen to distinguish Bottom Sheet from the next approved Dialog family');
  assert.match(ref, /NavigationLink|navigationDestination|full-screen/i, 'expected avoidWhen/alternatives to distinguish Bottom Sheet from a full-screen/navigation destination');
  const alts = extractAlternativeNames(ref);
  assert.ok(alts.length > 0, 'expected at least one structured alternative');

  const state = extractAdoptionState(section);
  assert.equal(state, 'foundation-available');
  assert.match(section, /foundation-available on this branch/i, 'expected the adoptionStatus detail to state foundation-available on this branch');
  assert.match(section, /zero production screens use it/i, 'expected the adoptionStatus detail to truthfully report zero production adoption');
  assert.match(section, /remain unchanged|unchanged/i, 'expected the adoptionStatus detail to state existing production sheets remain unchanged');
  assert.match(section, /separate adoption issue/i, 'expected migration to be scoped to a separate adoption issue');
  assert.doesNotMatch(section, /adoptionStatus:\s*\{\s*state:\s*'production-adopted'/, 'Bottom Sheet must not claim production adoption');

  assert.match(section, /HermesMobile\/Features\/Shared\/HermexBottomSheet\.swift/, 'expected implementationNotes.sourcePaths to cite HermexBottomSheet.swift');
  assert.match(section, /generic template catalog/i, 'expected the entry to name the generic template catalog it is distinct from');
  assert.match(section, /own BottomSheet component/i, 'expected the entry to explicitly disclaim the generic template\'s own BottomSheet component');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const componentIds = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(componentIds.includes('Bottom Sheet'), 'expected Bottom Sheet to be registered in the Components — Hermex nav group');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(section, /<HermexBottomSheetFamilyGallery/, 'expected Bottom Sheet to render its own family gallery');
  assert.match(previewsSrc, /export function HermexBottomSheetFamilyGallery/);
  assert.match(previewsSrc, /function BottomSheetSpecimen/, 'expected a shared specimen helper for the gallery\'s two demonstrated combinations');
  const specimenBody = extractFunctionBody(previewsSrc, 'BottomSheetSpecimen');
  const galleryBody = extractFunctionBody(previewsSrc, 'HermexBottomSheetFamilyGallery');
  const body = specimenBody + galleryBody;
  assert.match(specimenBody, /<TopNav/, 'expected the gallery to reuse the real TopNav reconstruction');
  assert.match(galleryBody, /<List>/, 'expected the gallery to demonstrate a native List body using the real List reconstruction');
  assert.match(galleryBody, /<ListItem/, 'expected the List body demonstration to use the real ListItem reconstruction');
  assert.match(galleryBody, /footerAxis="horizontal"/, 'expected the gallery to demonstrate a horizontal footer axis');
  assert.match(galleryBody, /footerAxis="vertical"/, 'expected the gallery to demonstrate a vertical footer axis');
  assert.doesNotMatch(previewsSrc, /from '\.\.\/\.\.\/components\/BottomSheet'/, 'must not import the generic template BottomSheet component');
  assert.doesNotMatch(body, /<BottomSheet[\s>]/, 'must not compose the generic template BottomSheet component');
  assert.doesNotMatch(body, /DragGesture|Animated\.(Value|timing)/, 'must not invent custom drag/animated behavior in the reconstruction');
});

// Issue #607 (Dialog family slice): a Hermex-owned Components entry for HermexDialog — a fully
// custom, always-centered modal mounted through the shared same-window overlay host, never a
// native `.alert`/`.sheet`/`fullScreenCover`/`Menu`/`.popover`. Non-dismissible dimmed backdrop, an
// always-present standard close button, a generic header/body, and a caller-chosen horizontal or
// vertical footer. Foundation-only: no production confirmation/alert adopts it in this slice. The
// visible sidebar/title label stays the plain 'Dialog' even though the internal id is namespaced
// 'Hermes Dialog' to avoid colliding with the retained template catalog's own bare 'Dialog' id.
test('Issue #607: Dialog becomes a Hermex-owned Components entry (HermexDialog mounted through the shared same-window overlay host, non-dismissible backdrop, always-present close button, no scrolling or text input), truthfully claiming zero production adoption and distinguishing itself from Bottom Sheet', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Hermes Dialog'/, "expected 'Hermes Dialog' in the HermesSectionId union");

  const section = extractHermesSection(sectionsSrc, 'Hermes Dialog');
  assert.match(section, /displayName:\s*'Dialog'/, "expected the visible label to stay the plain 'Dialog', not the namespaced id");
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /HermexDialog/, 'expected the entry to name the Hermex-owned HermexDialog component');
  assert.match(section, /hermexDialog\(isPresented:footerAxis:header:content:footer:\)|\.hermexDialog\(/, 'expected the entry to name the hermexDialog(...) presentation modifier');
  assert.match(section, /same-window overlay host|HermexSameWindowOverlay/i, 'expected the entry to document the shared same-window overlay host');
  assert.match(section, /close button/i, 'expected the entry to document the always-present standard close button');
  assert.match(section, /never dismiss|does not dismiss|dimmed backdrop never dismisses/i, 'expected the entry to state the backdrop never dismisses Dialog');
  assert.match(section, /never scrolls|no internal scrolling|does not scroll/i, 'expected the entry to state Dialog never scrolls');
  assert.match(section, /text input|text field/i, 'expected the entry to state Dialog excludes text input');
  assert.match(section, /footerAxis/, 'expected the entry to document the footerAxis prop');
  assert.match(section, /horizontal/i);
  assert.match(section, /vertical/i);
  assert.match(section, /Escape/i, 'expected the entry to document accessibility Escape');
  assert.match(section, /heading/i, 'expected the entry to document heading-first focus/reading order');
  assert.match(section, /focus/i);
  assert.match(section, /Reduce Motion/, 'expected the entry to document the Reduce Motion fallback');

  const ref = extractHermesReferenceBlock(section);
  assert.match(ref, /Bottom Sheet/, 'expected alternatives to name Bottom Sheet for forms/long content');
  const alts = extractAlternativeNames(ref);
  assert.ok(alts.length > 0, 'expected at least one structured alternative');

  const state = extractAdoptionState(section);
  assert.equal(state, 'foundation-available');
  assert.match(section, /foundation-available on this branch/i, 'expected the adoptionStatus detail to state foundation-available on this branch');
  assert.match(section, /zero production screens use it/i, 'expected the adoptionStatus detail to truthfully report zero production adoption');
  assert.match(section, /separate adoption issue/i, 'expected migration to be scoped to a separate adoption issue');
  assert.doesNotMatch(section, /adoptionStatus:\s*\{\s*state:\s*'production-adopted'/, 'Dialog must not claim production adoption');

  assert.match(section, /HermesMobile\/Features\/Shared\/HermexDialog\.swift/, 'expected implementationNotes.sourcePaths to cite HermexDialog.swift');
  assert.match(section, /generic template catalog/i, 'expected the entry to name the generic template catalog it is distinct from');
  assert.match(section, /own Dialog/i, 'expected the entry to explicitly disclaim the generic template\'s own Dialog component');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const componentIds = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(componentIds.includes('Hermes Dialog'), 'expected Hermes Dialog to be registered in the Components — Hermex nav group');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(section, /<DialogFamilyGallery/, 'expected Dialog to render its own family gallery');
  assert.match(previewsSrc, /export function DialogFamilyGallery/);
  assert.match(previewsSrc, /function DialogSpecimen/, 'expected a shared specimen helper for the gallery\'s demonstrated combinations');
  const specimenBody = extractFunctionBody(previewsSrc, 'DialogSpecimen');
  const galleryBody = extractFunctionBody(previewsSrc, 'DialogFamilyGallery');
  const body = specimenBody + galleryBody;
  assert.match(galleryBody, /footerAxis="horizontal"/, 'expected the gallery to demonstrate a horizontal footer axis');
  assert.match(galleryBody, /footerAxis="vertical"/, 'expected the gallery to demonstrate a vertical footer axis');
  assert.match(body, /destructive/i, 'expected the gallery to demonstrate a destructive action');
  assert.doesNotMatch(previewsSrc, /from '\.\.\/\.\.\/components\/Dialog'/, 'must not import a generic template Dialog component');
  assert.doesNotMatch(body, /<Dialog[\s>]/, 'must not compose a generic template Dialog component');
  assert.doesNotMatch(body, /onPress=\{\(\) => \{\s*\/\/ dismiss/i, 'the backdrop specimen must not simulate background-tap dismissal');
});

// Search becomes a Hermex-owned shared foundation API (`.hermexSearch`, a thin wrapper over native
// `.searchable`) while production screens stay on their existing direct `.searchable` call sites —
// migration is a separate issue. This is the ownership-flip transaction: Search moves from Native
// iOS — Hermex into Components — Hermex, its preview becomes an interactive Hermex Search family
// demonstration (not a bare native reconstruction), and its adoptionStatus truthfully reports zero
// production adoption.
test('Search moves to Components — Hermex as a Hermex-owned foundation wrapper (.hermexSearch) over native .searchable, with a truthful zero-adoption status and an interactive family preview', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const search = extractHermesSection(sectionsSrc, 'Search');

  assert.match(search, /`\.hermexSearch/, 'expected the Search entry to name the Hermex-owned .hermexSearch wrapper');
  assert.match(search, /`\.searchable`|\.searchable\(/, 'expected the Search entry to still name the native .searchable it wraps');
  assert.match(search, /avoidWhen:\s*'[^']*custom chrome[^']*'/i, 'expected avoidWhen to still forbid custom search-field chrome');

  const state = extractAdoptionState(search);
  assert.equal(state, 'foundation-available', 'expected Search to report foundation-available, not native-platform, once the wrapper ships');
  assert.match(search, /adoptionStatus:\s*\{[\s\S]*?HermexSearch\.swift[\s\S]*?no production call site yet/, 'expected the adoptionStatus detail to name HermexSearch.swift and truthfully report zero production call sites');
  assert.match(search, /deferred to a separate issue|scoped to a separate issue|separate issue/i, 'expected the adoptionStatus/notes to state migration is deferred to another issue');
  assert.doesNotMatch(search, /adoptionStatus:\s*\{\s*state:\s*'production-adopted'/, 'Search must not claim production adoption');

  assert.match(search, /HermesMobile\/Features\/Shared\/HermexSearch\.swift/, 'expected implementationNotes.sourcePaths to cite the new HermexSearch.swift wrapper');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.doesNotMatch(previewsSrc, /export function NativeSearchPreview/, 'expected the retired native-only preview name to be gone');
  assert.match(search, /<SearchFamilyGallery/, 'expected Search to render the renamed Hermex Search family preview');
  assert.match(previewsSrc, /export function SearchFamilyGallery/);
  const gallery = extractFunctionBody(previewsSrc, 'SearchFamilyGallery');
  assert.match(gallery, /onChangeText=\{setQuery\}|onChangeText=\{[^}]*setQuery[^}]*\}/, 'expected interactive query entry');
  assert.match(gallery, /accessibilityLabel="Clear search"/, 'expected a native-style clear action, not custom chrome');
  assert.match(gallery, /ref=\{searchInputRef\}/, 'expected the native-style search input to expose a focus target');
  assert.match(gallery, /searchInputRef\.current\?\.focus\(\)/, 'expected clearing search to restore focus to the input after the clear control unmounts');
  assert.match(gallery, /No results for/, 'expected a specific no-results demonstration, not a generic empty state');
  assert.doesNotMatch(gallery, /struct HermexSearchField|HermexSearchBar/, 'must not imply a custom Hermex search-field component');
});

test('Materials — Hermex holds exactly Adaptive Glass, and Patterns — Hermex holds Content Unavailable, Pending Request, Transcript Activity, and Composer', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');

  const materialsMatch = navBlockMatch[0].match(/label:\s*'Materials',\s*\n\s*ids:\s*\[([^\]]*)\]/);
  assert.ok(materialsMatch, 'expected the Materials — Hermex nav group');
  const materialsIds = [...materialsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(materialsIds, ['Adaptive Glass']);

  const patternsMatch = navBlockMatch[0].match(/label:\s*'Patterns',\s*\n\s*ids:\s*\[([^\]]*)\]/);
  assert.ok(patternsMatch, 'expected the Patterns — Hermex nav group');
  const patternsIds = [...patternsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(patternsIds, ['Content Unavailable', 'Pending Request', 'Transcript Activity', 'Composer']);
});

// ─── Controller corrections (2026-09-26) ────────────────────────────────────────────────────────
// Three acceptance gaps a controller review found in the terminal-success result above: (1) the
// chat loading state must adopt a real shared SwiftUI primitive, not stay merely documented as a
// retained local implementation; (2) List/ListItem's public API must actually implement what
// "List / ListItem" already claims (title-adjacent slot, description/metadata, loading); (3)
// Divider must own its opacity as a component prop instead of the preview hacking it in via
// external `style`.

test('Correction (2026-09-26): the catalog-only animated Shimmer gallery copy names the shared production SkeletonPlaceholder primitive rather than contradicting it', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const previewBody = extractFunctionBody(previewsSrc, 'ShimmerFamilyGallery');
  assert.match(previewBody, /shared `?SkeletonPlaceholder`? primitive/i);
  assert.doesNotMatch(
    previewBody,
    /uses SwiftUI's platform `?\.redacted\(reason: \.placeholder\)`? directly/i,
    'the rendered preview copy must not contradict the shared production skeleton adoption',
  );
});

test('Correction (2026-09-26): the generic catalog Shimmer honors system Reduce Motion with a static fallback, observed at runtime, with no new dependency', () => {
  const implSrc = read('native/components/Shimmer/Shimmer.tsx');
  assert.match(
    implSrc,
    /import\s*\{[^}]*\bAccessibilityInfo\b[^}]*\}\s*from\s*'react-native'/,
    'expected AccessibilityInfo imported from react-native — the same module HermesMotionReference.tsx already uses, no new dependency',
  );
  assert.match(implSrc, /AccessibilityInfo\.isReduceMotionEnabled\(\)/, 'expected the initial-state check, same pattern as HermesMotionReference.tsx');
  assert.match(
    implSrc,
    /AccessibilityInfo\.addEventListener\(\s*'reduceMotionChanged'/,
    'expected runtime Reduce Motion changes to be observed, not only checked once at mount',
  );
  assert.match(implSrc, /reduceMotion/, 'expected a reduceMotion-driven code path in Breathing/Shimmer');
});

test('Correction (2026-09-26): the generic catalog Divider owns opacity as a component prop with a translucent default, and the preview demonstrates it via the prop instead of external style opacity', () => {
  const implSrc = read('native/components/Divider/Divider.tsx');
  assert.match(implSrc, /opacity\??:\s*number/, 'expected an opacity prop on DividerProps');
  assert.match(implSrc, /opacity\s*=\s*0\.\d+/, 'expected a translucent (< 1) default opacity applied by the component itself');
  assert.match(implSrc, /DS_SEMANTIC\.element\.divider/, 'expected the adaptive semantic divider color to stay in place');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const previewBody = extractFunctionBody(previewsSrc, 'HermexDividerPreview');
  assert.doesNotMatch(previewBody, /style=\{\{[^}]*opacity/, 'the preview must not apply opacity through external style anymore');
  assert.match(previewBody, /<Divider opacity=/, 'expected the preview to demonstrate the component-owned opacity prop');

  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Row Divider');
  assert.match(section, /generic catalog Divider/i);
  assert.match(section, /component-owned opacity/i);
  assert.match(section, /HermexDivider owns its SwiftUI opacity and pixel geometry/);
});

test('Correction (2026-09-26): ListItem genuinely supports a title-adjacent slot, description/metadata, and a loading state, while staying compatible with existing subtitle/footer/trailingText/trailingSubtext/trailing callers', () => {
  const implSrc = read('native/components/ListItem/ListItem.tsx');

  // New independently-optional slots/state.
  assert.match(implSrc, /titleAccessory/, 'expected a title-adjacent icon/custom node slot');
  assert.match(implSrc, /description/, 'expected a description slot (documented alias for subtitle)');
  assert.match(implSrc, /metadata/, 'expected a metadata slot (documented alias for footer)');
  assert.match(implSrc, /loading\??:\s*boolean/, 'expected a loading prop');

  // Existing callers must not break — every prior prop name must remain in the type.
  for (const name of ['subtitle', 'footer', 'trailingText', 'trailingSubtext', 'trailing']) {
    assert.match(implSrc, new RegExp(`${name}\\??:`), `expected the existing ${name} prop to still exist`);
  }

  // Loading uses the shared Shimmer/SkeletonGroup family, announced once, and is never pressable.
  assert.match(implSrc, /SkeletonGroup/, 'expected loading to use the shared SkeletonGroup so it announces once, not once per block');
  assert.match(implSrc, /Shimmer/, 'expected loading to render Shimmer placeholders, not a bespoke loading view');
  assert.match(implSrc, /if\s*\(loading\)/, 'expected an explicit loading branch');

  // A loading row must never remain pressable (loading returns early above); a commit-pending row is
  // also never pressable (see the "Correction (gap 4)" tests below for its own exact commitPending
  // gating). A merely-disabled row still renders through this same Pressable branch — see the
  // "Correction (accordion accessibility, 2026-09-28)" tests below for why it must keep real button
  // semantics instead of being demoted to a plain View.
  assert.match(implSrc, /isInteractive\s*=\s*!!onPress\s*&&\s*!commitPending/, 'expected the interactive branch to stay gated off only for a loading (returned above) or commit-pending row, not merely a disabled one');
  const pressableBlock = implSrc.match(/if\s*\(isInteractive\)\s*\{[\s\S]*?<Pressable[\s\S]*?<\/Pressable>[\s\S]*?\}/);
  assert.ok(pressableBlock, 'expected a Pressable branch guarded by isInteractive');
});

test('Correction (final-review truthfulness pass): the ListItem preview\'s SessionListItem-composition caption truthfully distinguishes the live production SessionRowView (wrapped by SessionInteractiveRow) from the new, foundation-only SessionListItem', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.doesNotMatch(
    body,
    /SessionRowView\.swift no longer exists|retired SessionRowView|split into SessionListItem/i,
    'SessionRowView.swift genuinely still exists and is the real, adopted production row — it was never retired or split',
  );
  assert.match(body, /SessionRowView/, 'expected the caption to name SessionRowView as production\'s real, live session row');
  assert.match(body, /SessionInteractiveRow/, 'expected the caption to name SessionInteractiveRow as the caller that wraps it in production');
  assert.match(body, /wraps SessionRowView/, 'expected the caption to state SessionInteractiveRow wraps SessionRowView, not SessionListItem');
  assert.match(body, /SessionListItem/, 'expected the caption to still name the foundation SessionListItem composition');
  assert.match(body, /foundation-only|no production call site/i, 'expected the caption to state SessionListItem is unadopted/foundation-only');
  assert.doesNotMatch(body, /highlights? a search match inside the title/i, 'SessionRowView keeps its title plain; production highlights the match in a separate excerpt line below it');
  assert.match(body, /separate highlighted\s+excerpt line beneath the title/, 'expected the caption to describe the production SessionSearchExcerpt anatomy truthfully');
});

test('Correction (2026-09-26): the ListItem preview visibly exercises the title-adjacent slot, description/metadata, trailing data/accessory, disabled, and loading configurations', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const previewBody = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.match(previewBody, /titleAccessory=/);
  assert.match(previewBody, /description=/);
  assert.match(previewBody, /metadata=/);
  assert.match(previewBody, /trailingText=/);
  assert.match(previewBody, /trailingSubtext=/);
  assert.match(previewBody, /disabled/);
  assert.match(previewBody, /loading/);
  assert.match(previewBody, /title="Login"/);
  assert.match(previewBody, /description="feature\/auth"/);
  assert.match(previewBody, /metadata="2 files"/);
  assert.doesNotMatch(previewBody, /title="Fix the login flow"/);
});

test('Correction (2026-09-26): List / ListItem no longer claims a prop the component does not implement — loading is documented alongside the other slots', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.match(section, /loading/i, 'expected the loading state to be documented now that it is implemented');
  assert.match(section, /title-adjacent/i);
  assert.match(section, /description/i);
  assert.match(section, /metadata/i);
});

// Controller correction (2026-09-26, gap 4): the List/ListItem section already claimed selected,
// commit-pending, an accessibility-label override, Dynamic Type reflow, and an independently
// operable trailing action, but the component only implemented loading/disabled — the rest were
// copy without a real API behind them. Each assertion below pins one concrete, previously-missing
// piece of that real API.
test('Correction (gap 4): ListItem exposes a real selected accessibility state, distinct from disabled/loading', () => {
  const implSrc = read('native/components/ListItem/ListItem.tsx');
  assert.match(implSrc, /selected\?:\s*boolean/, 'expected a selected prop on ListItemProps');
  assert.match(implSrc, /selected(?:,)?\s*=\s*false/, 'expected selected to default to false');
  assert.match(implSrc, /accessibilityState=\{\{[^}]*selected/, 'expected accessibilityState to carry the real selected value, not just disabled');
});

test('Correction (gap 4): ListItem has a distinct commitPending state that renders real content (never a generic Shimmer skeleton) and stays non-interactive', () => {
  const implSrc = read('native/components/ListItem/ListItem.tsx');
  assert.match(implSrc, /commitPending\?:\s*boolean/, 'expected a commitPending prop, distinct from loading');
  assert.doesNotMatch(
    implSrc,
    /if\s*\(commitPending\)\s*\{\s*return\s*\(\s*<SkeletonGroup/,
    'commit-pending must not become a generic skeleton row — it must render the row\'s real title/content with its own pending indicator',
  );
  assert.match(implSrc, /commitPending/g);
});

test('Correction (gap 4): ListItem accepts an accessibility-label override, used verbatim instead of the computed title+description default', () => {
  const implSrc = read('native/components/ListItem/ListItem.tsx');
  assert.match(
    implSrc,
    /accessibilityLabel\?:\s*string/,
    'expected an accessibilityLabel override prop on ListItemProps, alongside the existing computed default',
  );
  assert.match(
    implSrc,
    /accessibilityLabel\s*\?\?\s*\[title,\s*resolvedDescription\]\.filter\(Boolean\)\.join\(', '\)/,
    'expected the override to take priority over the computed title+description label, not replace it unconditionally',
  );
});

test('Correction (gap 4): ListItem\'s trailing accessory sits outside the row\'s own selecting Pressable, so it stays independently focusable/operable rather than being swallowed by the row\'s combined accessibility label', () => {
  const implSrc = read('native/components/ListItem/ListItem.tsx');
  const pressableMatch = implSrc.match(/<Pressable[\s\S]*?<\/Pressable>/);
  assert.ok(pressableMatch, 'expected a Pressable element in ListItem.tsx');
  assert.doesNotMatch(
    pressableMatch[0],
    /trailingGroup/,
    'the trailing accessory must not be nested inside the row-selecting Pressable — VoiceOver collapses an accessible Pressable\'s subviews into one element, and touch on a nested Pressable is fragile; it must be a sibling instead',
  );
});

test('Correction (gap 4): the ListItem preview exercises selected, commitPending, the accessibility-label override, and an independently-operable trailing action alongside a pressable row', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const previewBody = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.match(previewBody, /selected/);
  assert.match(previewBody, /commitPending/);
  assert.match(previewBody, /accessibilityLabel=/);
  // An independently-operable trailing action: a real interactive element (not plain text) passed as
  // `trailing`, alongside a row that is itself pressable (`onPress`).
  assert.match(previewBody, /onPress=\{[^}]*\}[\s\S]{0,400}trailing=\{<Button/);
});

// ─── Component families and Patterns (2026-09-26 revised specification) ─────────────────────────
// Source-contract tests for the approved four-group taxonomy (Foundations/Materials/Components/
// Patterns), Materials' Adaptive Glass, Card's Section/Request/Compact variants, the Banner family,
// unified Buttons, display-only Tag + Inline Reference Link, Picker Row's removal, static Skeleton,
// and the four Patterns entries. Written against, and passing against, the implementation landed in
// this same change — see the final report for the RED baseline captured before that implementation.

test('Adaptive Glass documents all six required states: Liquid Glass, Material fallback, opaque Reduce Transparency fallback, Increased Contrast stroke, interactive/non-interactive, and clipped-ancestor fallback', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Adaptive Glass');
  assert.match(section, /Liquid Glass/);
  assert.match(section, /Material \(fallback\)|Material fallback/);
  assert.match(section, /Opaque \(Reduce Transparency\)/);
  assert.match(section, /Increased Contrast/);
  assert.match(section, /non-interactive/i);
  assert.match(section, /interactive \(isInteractive: true\)/i);
  assert.match(section, /clipped-ancestor fallback/i);
  assert.match(section, /inheritsClipping/);
});

test('Card documents Section Card, Request Card, and an explicitly-named Compact Card, with Compact Card never a silent padding override', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Card');
  assert.match(section, /Section Card/);
  assert.match(section, /Request Card/);
  assert.match(section, /Compact Card/);
  assert.match(section, /explicitly.named|explicit.*compact density|never a silent (?:caller-side )?padding override/i);
  assert.match(section, /<CardChromePreview[^>]*kind="request"/);
  assert.match(section, /<CardChromePreview[^>]*kind="compact"/);
});

test('Card exposes the outlined white-surface variant used by the Tip Jar card instead of reconstructing it locally', () => {
  const implSrc = read('native/components/Card/Card.tsx');
  const section = extractHermesSection(read(HERMES_SECTIONS_PATH), 'Hermes Card');

  assert.match(implSrc, /export type CardSurface = 'elevated' \| 'outlined'/);
  assert.match(implSrc, /surface\?:\s*CardSurface/);
  assert.match(implSrc, /cardOutlined:\s*\{[^}]*borderColor:\s*DS_SEMANTIC\.border\.light/s);
  assert.match(section, /Outlined Card/);
  assert.match(section, /<CardChromePreview[^>]*kind="outlined"/);
  assert.match(section, /canonical outlined Card treatment/i);
});

test('Hermex Buttons document the gold brand-primary action and Typography exposes 16pt label and body roles', () => {
  const sectionsSrc = read('native/catalog/hermes/hermesSections.tsx');
  const previewsSrc = read('native/catalog/hermes/HermesComponentFamiliesPreviews.tsx');
  const buttons = extractHermesSection(sectionsSrc, 'Buttons');

  assert.match(buttons, /brandPrimary/);
  assert.match(buttons, /Gold 500/i);
  assert.match(previewsSrc, /Brand primary/);
  assert.match(previewsSrc, /HERMES_COLOR_RAMPS\.Gold\[500\]/);
  assert.match(sectionsSrc, /label: \{ fontSize: 16, fontWeight: '600'/);
  assert.match(sectionsSrc, /body: \{ fontSize: 16/);
});

// Controller correction (2026-09-26, gap 2): the generic Card only had a fixed 16pt-all-around
// default; the Card/Attachment previews faked Compact Card with a plain `View`, so the
// approved Compact Card density had no real, testable API behind it. Card itself must now expose an
// explicit density configuration, default unchanged at 16pt on every edge, and the previews claiming
// Compact Card must render the real component with that density — not a local recon `View`.
test('Correction (gap 2): the generic Card exposes an explicit density prop (default/compact); default padding stays exactly 16 on every edge, and compact is an explicit, reduced, token-based value — never a silent override', () => {
  const implSrc = read('native/components/Card/Card.tsx');
  assert.match(implSrc, /density\?:\s*CardDensity/, 'expected an explicit density prop on Card');
  assert.match(implSrc, /export type CardDensity = 'default' \| 'compact'/, "expected the density type to be exactly 'default' | 'compact'");
  assert.match(implSrc, /card:\s*\{[^}]*padding:\s*DS_SPACING\[800\]/s, 'expected Card\'s own default padding to remain the 16pt token (DS_SPACING[800]) on every edge');
  assert.match(implSrc, /cardCompact:\s*\{\s*padding:\s*DS_SPACING\[600\]/, "expected an explicit cardCompact style using a smaller token, never re-using the 16pt default");
  assert.doesNotMatch(implSrc, /paddingVertical|paddingHorizontal/, 'default padding must stay uniform (one `padding`, not separate vertical/horizontal overrides) so it is 16pt on every edge, not just some');
});

test('Correction (gap 2): the Card and Attachment previews render the real Card component with density="compact" for every claimed Compact Card composition, not a local recon View', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /import\s*\{[^}]*\bCard\b[^}]*\}\s*from\s*'\.\.\/\.\.\/components'/, 'expected hermesSections.tsx to import the real generic Card component');
  const cardChromePreviewBody = extractFunctionBody(sectionsSrc, 'CardChromePreview');
  assert.match(cardChromePreviewBody, /<Card\b/, 'expected CardChromePreview to render the real Card component');
  assert.match(cardChromePreviewBody, /density=\{kind === 'compact' \? 'compact' : 'default'\}/, "expected CardChromePreview to pass the real density prop, driven by its own `kind`");
  assert.doesNotMatch(cardChromePreviewBody, /cardContentCompact/, 'the fake local compact-padding style must no longer be used now that Card owns real density');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /import\s*\{[^}]*\bCard\b[^}]*\}\s*from\s*'\.\.\/\.\.\/components'/, 'expected the Attachment preview file to import the real Card component');
  const attachmentBody = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.match(attachmentBody, /<Card density="compact"/, 'expected the normal (non-mini) Attachment tiles to compose the real Card with density="compact", not a plain View');
});

// ─── Attachment token/color/component-composition slice (2026-09-26 catalog owner brief) ─────────
// Mirrors production's newly-adopted HermesAttachmentSize (HermesMobile/Config/HermesAttachmentSize.
// swift) and HermesIconSize.extraLarge. This catalog slice needs its own source-of-truth module (not
// a duplicate of the spacing/radius scale, not catalog chrome), real Hermex color-ramp values instead
// of local hex/rgb literals, real Icon/Button composition instead of text glyphs, and a full-box
// Shimmer/SkeletonGroup loading placeholder instead of a hand-built "Uploading…" tile.
const HERMES_ATTACHMENT_SIZE_PATH = 'native/catalog/hermes/hermesAttachmentSize.ts';

test('hermesAttachmentSize.ts defines the exact adopted HermesAttachmentSize component-size tokens and HermesIconSize.extraLarge, independent of the catalog\'s own spacing/radius scale', () => {
  assert.ok(existsSync(path.join(ROOT, HERMES_ATTACHMENT_SIZE_PATH)), `${HERMES_ATTACHMENT_SIZE_PATH} should exist as the Attachment size token source of truth`);
  const src = read(HERMES_ATTACHMENT_SIZE_PATH);
  assert.match(src, /export const HERMES_ATTACHMENT_SIZE = \{/);
  const expected = {
    compactPreview: 30,
    messageGridCell: 118,
    composerImage: 96,
    composerImageAccessibility: 108,
    fileIconPanelWidth: 58,
    fileIconPanelHeight: 68,
    fileIconPanelWidthAccessibility: 76,
    fileIconPanelHeightAccessibility: 84,
    composerFileTextWidth: 128,
    composerFileTextWidthAccessibility: 160,
    composerFileTileWidth: 222,
    composerFileTileWidthAccessibility: 280,
    composerFileTileMinHeight: 92,
    composerFileTileMinHeightAccessibility: 112,
    composerStripHeight: 108,
    composerStripHeightAccessibility: 132,
    messageFileTextInset: 18,
    removeControl: 24,
    removeOverlap: 6,
    accessibilityVerticalPadding: 10,
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.match(src, new RegExp(`${key}:\\s*${value}\\b`), `expected HERMES_ATTACHMENT_SIZE.${key} === ${value}`);
  }
  assert.doesNotMatch(src, /HERMES_ICON_SIZE_EXTRA_LARGE/, 'HermesIconSize.extraLarge now lives solely in the canonical ./hermesIconSize module, not duplicated here');
  assert.doesNotMatch(src, /from\s*'\.\.\/\.\.\/\.\.\/tokens'/, 'this module must not depend on the catalog\'s own spacing/radius scale — it is a standalone, Attachment-specific size table, not catalog chrome or a spacing token');
});

test('AttachmentTileGallery sizes its examples from the adopted HermesAttachmentSize/HermesIconSize tokens, not local hardcoded geometry', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(
    previewsSrc,
    /import\s*\{[^}]*HERMES_ATTACHMENT_SIZE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'/,
    'expected HermesComponentFamiliesPreviews.tsx to import the adopted Attachment size tokens from ./hermesAttachmentSize',
  );
  assert.match(
    previewsSrc,
    /import\s*\{\s*HERMES_ICON_SIZE\s*\}\s*from\s*'\.\/hermesIconSize'/,
    'expected HermesComponentFamiliesPreviews.tsx to import HermesIconSize.extraLarge from the canonical ./hermesIconSize module',
  );
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  for (const key of [
    'compactPreview', 'fileIconPanelWidth', 'fileIconPanelHeight',
    'fileIconPanelWidthAccessibility', 'fileIconPanelHeightAccessibility', 'composerFileTileWidth',
    'composerFileTileMinHeight', 'composerFileTextWidth', 'messageFileTextInset', 'removeControl',
    'removeOverlap', 'messageGridCell',
  ]) {
    assert.match(body, new RegExp(`HERMES_ATTACHMENT_SIZE\\.${key}\\b`), `expected AttachmentTileGallery to size an example from HERMES_ATTACHMENT_SIZE.${key}`);
  }
  assert.match(body, /HERMES_ICON_SIZE\.extraLarge\b/, 'expected the file-type icon to render at the adopted HermesIconSize.extraLarge');
  assert.doesNotMatch(body, /width:\s*96\b|height:\s*96\b|width:\s*168\b/, 'the old hand-picked 96/168 geometry must be replaced by the adopted token references above');
});

test('Attachment file-type colors come from the adopted HERMES_COLOR_RAMPS, never local hex/rgb literals', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(
    previewsSrc,
    /import\s*\{[^}]*HERMES_COLOR_RAMPS[^}]*\}\s*from\s*'\.\/hermesColorCatalogData'/,
    'expected HermesComponentFamiliesPreviews.tsx to import the adopted color ramp data',
  );
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.doesNotMatch(body, /#[0-9A-Fa-f]{3,8}\b/, 'no local hex color literals may remain in the Attachment gallery');
  assert.doesNotMatch(body, /rgba?\(/i, 'no local rgb/rgba color literals may remain in the Attachment gallery');
  for (const [type, ramp] of [['text-like', 'Blue'], ['PDF', 'Red'], ['archive', 'Orange'], ['unknown/default', 'Neutral']]) {
    assert.match(body, new RegExp(`HERMES_COLOR_RAMPS\\.${ramp}\\[500\\]`), `expected the ${type} file-type color to come from HERMES_COLOR_RAMPS.${ramp}[500]`);
  }

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Attachment');
  for (const mapping of [
    'spreadsheet → Green 500', 'text-like → Blue 500', 'PDF → Red 500', 'archive → Orange 500', 'unknown/default → Neutral 500',
  ]) {
    assert.ok(section.includes(mapping), `expected the Attachment section prose to document the file-color mapping "${mapping}"`);
  }
});

test('Attachment renders real Icon/Button composition instead of text glyphs, for the file icon, remove control, and retry control', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  // Scoped to the glyph as rendered JSX text content (`>×<`), not the character in general — "×" is
  // also legitimate multiplication notation in this same gallery's own dimension prose (e.g. "58×68pt").
  for (const glyph of ['▤', '▢', '⋯', '×', '⚠️']) {
    assert.ok(!body.includes(`>${glyph}<`), `expected the retired text-glyph-as-icon "${glyph}" to be replaced by a real Icon`);
  }
  assert.match(body, /<Icon\b[^>]*name="paperclip"/, 'expected the file-type icon to be a real Icon, not a text glyph');
  assert.match(body, /<Icon\b[^>]*name="(?:alert-circle|triangle-alert)"/, 'expected the failure badge to be a real Icon, not an emoji');
  assert.match(body, /<Button\b[^>]*iconName="clear"/, 'expected the remove control to compose the real Button, not a plain View with an "×" Text');
  assert.match(body, /<Button\b[^>]*label="Retry"/, 'expected a real Button-based retry control on the failure tile');
});

test('Attachment loading state is a single full-box Shimmer/SkeletonGroup placeholder, not the retired hand-built "Uploading…" tile', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(
    previewsSrc,
    /import\s*\{[^}]*\b(?:Shimmer|SkeletonGroup)\b[^}]*\}\s*from\s*'\.\.\/\.\.\/components'/,
    'expected HermesComponentFamiliesPreviews.tsx to import Shimmer/SkeletonGroup',
  );
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.doesNotMatch(body, /Uploading…/, 'the retired hand-built loading tile text must be removed');
  assert.match(body, /<Shimmer\b[^>]*variant="container"/, 'expected a single full-box container Shimmer standing in for the whole attachment tile while loading');
  assert.doesNotMatch(body, /claims? (?:a |the )?measurable upload progress/i, 'the loading example itself must not claim to represent measurable upload progress');

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Attachment');
  assert.match(section, /indefinite loading only/i, 'expected the section prose to state the Skeleton represents indefinite loading only, never a measurable upload percentage');
});

test('Attachment section documents HermesAttachmentSize geometry, states no new global spacing/radius/color family was created, and preserves the native-primitives-underneath framing', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(
    sectionsSrc,
    /import\s*\{[^}]*HERMES_ATTACHMENT_SIZE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'/,
    'expected hermesSections.tsx to import the adopted Attachment size tokens as its documentation source of truth',
  );
  assert.match(
    sectionsSrc,
    /import\s*\{\s*HERMES_ICON_SIZE\s*\}\s*from\s*'\.\/hermesIconSize'/,
    'expected hermesSections.tsx to import HermesIconSize.extraLarge from the canonical ./hermesIconSize module',
  );
  const section = extractHermesSection(sectionsSrc, 'Attachment');
  for (const key of [
    'compactPreview', 'messageGridCell', 'composerImage', 'composerImageAccessibility', 'fileIconPanelWidth',
    'fileIconPanelHeight', 'composerFileTextWidth', 'composerFileTextWidthAccessibility', 'composerFileTileWidth',
    'composerFileTileWidthAccessibility', 'composerFileTileMinHeight', 'composerFileTileMinHeightAccessibility',
    'composerStripHeight', 'composerStripHeightAccessibility', 'messageFileTextInset', 'removeControl',
    'removeOverlap', 'accessibilityVerticalPadding',
  ]) {
    assert.match(section, new RegExp(`HERMES_ATTACHMENT_SIZE\\.${key}\\b`), `expected the Attachment section to document HermesAttachmentSize.${key}`);
  }
  assert.match(section, /HERMES_ICON_SIZE\.extraLarge\b/, 'expected the Attachment section to document HermesIconSize.extraLarge');
  assert.match(section, /no new (?:global )?spacing[^.]*radius scale/i, 'expected the section to state HermesAttachmentSize is not a new global spacing/radius scale');
  assert.match(section, /no new color family/i, 'expected the section to state no new color family was introduced');
  assert.match(section, /native SwiftUI[^.]*remain/i, 'expected the section to restate that native/platform primitives remain underneath the Hermex compositions');
});

// ─── Attachment acceptance-parity correction (2026-09-27 controller inspection) ────────────────
test('Correction (attachment parity): the message attachment example is sized from HERMES_ATTACHMENT_SIZE.messageGridCell, not a raw 168 width baked into messageFileTile', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.doesNotMatch(previewsSrc, /width:\s*168\b/, 'the raw 168 message-tile width must no longer appear anywhere in the previews file');
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.match(
    body,
    /<Card density="compact" style=\{\[preview\.messageFileTile,\s*gridCellSize\]\}/,
    'expected the message attachment Card to size itself from HERMES_ATTACHMENT_SIZE.messageGridCell (via gridCellSize) at the call site, not a fixed width on the shared style object',
  );
  const messageCard = body.match(/<Card density="compact" style=\{\[preview\.messageFileTile,\s*gridCellSize\]\}>([\s\S]*?)<\/Card>/)?.[1] ?? '';
  assert.match(messageCard, /<Icon[^>]+HERMES_ICON_SIZE\.extraLarge/, 'message tile should render the file glyph directly in its vertical production anatomy');
  assert.match(messageCard, /preview\.tileName/, 'message tile should render its centered filename with the compact message-tile text style');
  assert.match(messageCard, /preview\.tileExt/, 'message tile should render its extension label below the filename');
  assert.doesNotMatch(messageCard, /preview\.fileIconPanel|preview\.composerTileText|preview\.composerTileDetail/, 'message tile must not reuse the horizontal composer icon-panel/text-detail anatomy that makes the 118pt tile clip');
  const messageStyle = previewsSrc.match(/messageFileTile:\s*\{([\s\S]*?)\n\s*\},/)?.[1] ?? '';
  assert.doesNotMatch(messageStyle, /flexDirection:\s*'row'/, 'message tile style should stay vertically stacked like GridAttachmentCell.fileCell');
  assert.match(messageStyle, /justifyContent:\s*'center'/, 'message tile contents should be centered inside the fixed square');
});

test('Correction (attachment parity): ComposerPatternPreview\'s embedded Attachment example composes the same adopted HermesAttachmentSize/HermesIconSize/HERMES_COLOR_RAMPS tokens and real Icon as AttachmentTileGallery, not raw 44×52 geometry, hex/rgba literals, or a text-glyph icon', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ComposerPatternPreview');
  // Scoped to just the embedded Attachment example's own <Card>...</Card> markup, not the whole
  // function body — ComposerPatternPreview also renders an Inline Reference Link example
  // immediately after it, which legitimately keeps its own raw hex per that family's own styling.
  const cardStart = body.indexOf('<Card density="compact"');
  assert.notEqual(cardStart, -1, 'expected the Composer pattern to render a Card density="compact" Attachment example');
  const cardEnd = body.indexOf('</Card>', cardStart);
  assert.notEqual(cardEnd, -1, 'expected the Composer pattern\'s Attachment Card to have a matching closing tag');
  const attachmentMarkup = body.slice(cardStart, cardEnd);
  assert.doesNotMatch(attachmentMarkup, /width:\s*44\b|height:\s*52\b/, 'the raw 44×52 icon-panel geometry must be replaced by HERMES_ATTACHMENT_SIZE.fileIconPanelWidth/fileIconPanelHeight');
  assert.doesNotMatch(attachmentMarkup, /#[0-9A-Fa-f]{3,8}\b/, 'no local hex color literals may remain in the Composer pattern\'s Attachment example');
  assert.doesNotMatch(attachmentMarkup, /rgba?\(/i, 'no local rgb/rgba color literals may remain in the Composer pattern\'s Attachment example');
  assert.ok(!attachmentMarkup.includes('>▤<'), 'expected the retired text-glyph-as-icon "▤" to be replaced by a real Icon');
  assert.match(attachmentMarkup, /<Icon\b[^>]*name="paperclip"/, 'expected the Composer pattern\'s file-type icon to be a real Icon, not a text glyph');
  assert.match(attachmentMarkup, /HERMES_ATTACHMENT_SIZE\.fileIconPanelWidth\b/, 'expected the Composer pattern\'s icon panel to size from HERMES_ATTACHMENT_SIZE.fileIconPanelWidth');
  assert.match(attachmentMarkup, /HERMES_ATTACHMENT_SIZE\.fileIconPanelHeight\b/, 'expected the Composer pattern\'s icon panel to size from HERMES_ATTACHMENT_SIZE.fileIconPanelHeight');
  assert.match(attachmentMarkup, /HERMES_ICON_SIZE\.extraLarge\b/, 'expected the Composer pattern\'s file icon to render at the adopted HermesIconSize.extraLarge');
  assert.match(attachmentMarkup, /HERMES_COLOR_RAMPS\.Blue\[100\]/, 'expected the Composer pattern\'s icon panel background to come from HERMES_COLOR_RAMPS.Blue[100]');
  assert.match(attachmentMarkup, /HERMES_COLOR_RAMPS\.Blue\[500\]/, 'expected the Composer pattern\'s icon/extension tint to come from HERMES_COLOR_RAMPS.Blue[500]');
});

test('Correction (attachment parity): hermesAttachmentSize.ts cites the real adopted Swift source path (HermesMobile/Config/HermesSpacing.swift), not the nonexistent HermesAttachmentSize.swift', () => {
  const src = read(HERMES_ATTACHMENT_SIZE_PATH);
  assert.match(src, /HermesMobile\/Config\/HermesSpacing\.swift/, 'expected the doc comment to cite the real Swift source path, HermesMobile/Config/HermesSpacing.swift');
  assert.doesNotMatch(src, /HermesAttachmentSize\.swift/, 'the nonexistent HermesAttachmentSize.swift path must no longer be cited');
});

test('Banner documents Information, Warning, Error, Success, and Offline variants with optional icon/action, inset/full-width presentation, and decorative icon semantics, and consolidates the offline-cache duplicates', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Banner');
  assert.match(section, /Information, Warning, Error, Success, and Offline variants/);
  assert.match(section, /decorative/i);
  assert.match(section, /<BannerFamilyGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'BannerFamilyGallery');
  for (const variant of ['variant="info"', 'variant="warning"', 'variant="negative"', 'variant="positive"']) {
    assert.ok(body.includes(variant), `expected the Banner gallery to demonstrate ${variant}`);
  }
  assert.match(body, /Offline/);
  assert.match(body, /action=\{\{/, 'expected an optional action example');
  assert.match(body, /Inset presentation/);
  assert.doesNotMatch(body, /accessibilityHidden/, 'decorative-icon semantics come from Banner\'s own default, not a per-preview override');
});

test('Buttons documents extra-small through large sizes, all four content configurations, and disabled/pending states', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Buttons');
  assert.match(section, /extraSmall \| small \| medium \| large/);
  assert.match(section, /glass surface option/i);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ButtonDecisionAndTactilePreview');
  assert.match(body, /size="extraSmall"/);
  assert.match(body, /size="small"/);
  assert.match(body, /size="medium"/);
  assert.match(body, /size="large"/);
  assert.match(body, /Label only/);
  assert.match(body, /showLabel=\{false\}/, 'expected an icon-only example');
  assert.match(body, /iconPosition="leading"/);
  assert.match(body, /iconPosition="trailing"/);
  assert.match(body, /Disabled and pending/);
  assert.match(body, /disabled onPress/);
  assert.match(body, /loading onPress/);
});

test('the generic Button component gains an extraSmall size, extending the existing size scale downward without removing any existing size', () => {
  const typesSrc = read('native/components/Button/Button.types.ts');
  assert.match(typesSrc, /'large' \| 'medium' \| 'small' \| 'extraSmall'/);

  const implSrc = read('native/components/Button/Button.tsx');
  assert.match(implSrc, /extraSmall:\s*\{/);
  for (const size of ['large', 'medium', 'small']) {
    assert.match(implSrc, new RegExp(`${size}:\\s*\\{`), `expected the existing ${size} size to remain defined`);
  }
});

// Controller correction (2026-09-26, gap 3): "Press Feedback" was documented as the default but never
// implemented in the generic Button — only its resting/pressed background color changed. The approved
// specification requires a real slight scale + opacity response, Reduce-Motion-safe (scale suppressed,
// not merely eased) by reading the same system AccessibilityInfo signal the rest of this catalog
// already uses (Shimmer.tsx, HermesMotionReference.tsx) — no new dependency.
test('Correction (gap 3): the generic Button implements real default Press Feedback — a slight scale response on press, driven by Animated, suppressed under system Reduce Motion — with haptics untouched (absent)', () => {
  const implSrc = read('native/components/Button/Button.tsx');
  assert.match(
    implSrc,
    /import\s*\{[^}]*\bAnimated\b[^}]*\}\s*from\s*'react-native'/,
    'expected Animated imported from react-native to drive the real press-scale response',
  );
  assert.match(
    implSrc,
    /import\s*\{[^}]*\bAccessibilityInfo\b[^}]*\}\s*from\s*'react-native'/,
    'expected AccessibilityInfo imported from react-native — same pattern as Shimmer.tsx/HermesMotionReference.tsx, no new dependency',
  );
  assert.match(implSrc, /AccessibilityInfo\.isReduceMotionEnabled\(\)/, 'expected the initial Reduce Motion check');
  assert.match(
    implSrc,
    /AccessibilityInfo\.addEventListener\(\s*'reduceMotionChanged'/,
    'expected runtime Reduce Motion changes to be observed, not only checked once at mount',
  );
  assert.match(implSrc, /scaleAnim/, 'expected an Animated.Value driving the press scale');
  assert.match(
    implSrc,
    /reduceMotion\s*\?[^:]*:\s*PRESS_SCALE|!reduceMotion\s*&&/s,
    'expected the scale response to be explicitly suppressed under Reduce Motion, not merely re-timed',
  );
  assert.doesNotMatch(implSrc, /expo-haptics|Haptics\./, 'physical haptics must remain absent from the web/catalog Button — Press Feedback here is visual only');
});

test('Correction (gap 3): the Buttons preview documents the real four-way emphasis mapping (including Neutral) and demonstrates the Adaptive Glass surface as a style composition, never a new Button variant', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ButtonDecisionAndTactilePreview');
  assert.match(body, /variant="tertiary"/, 'expected a Neutral-role example — the accurate mapping needs all four Hermex emphasis roles demonstrated, not three');
  assert.match(body, /Neutral/);
  assert.match(
    body,
    /neutral.*tertiary|tertiary.*neutral/is,
    'expected the mapping caption to name the accurate neutral → tertiary pairing, not silently drop the Neutral role',
  );
  assert.match(body, /Adaptive Glass/);
  assert.match(body, /style composition|composing Adaptive Glass|not a (?:new|separate) (?:Button )?variant/i);

  const typesSrc = read('native/components/Button/Button.types.ts');
  assert.doesNotMatch(typesSrc, /'glass'/, 'Glass must stay a style composition, never a duplicated Button variant enum value');
});

test('List / ListItem documents an accessibility-label override and Dynamic Type layout adaptation, matching the generic component\'s real behavior', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.match(section, /accessibility-label override|overridable/i);
  assert.match(section, /Dynamic Type/);
});

test('Disclosure Row documents its Buttons and Divider composition alongside Hermex typography/spacing/radius/motion', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Disclosure Row');
  assert.match(section, /Hermex typography, spacing, radius, motion, Buttons, and Divider/);
});

// Controller correction (2026-09-26, gap 5): the Disclosure Row preview rendered a disconnected,
// underlined "Expand/Collapse" text control below a non-interactive log row — the row itself never
// exposed accessibilityRole/expanded state and wasn't what a user would actually press. The real
// production row (TranscriptLogRowView) is itself the tappable disclosure.
test('Correction (gap 5): the Disclosure Row preview is itself the interactive, Button-like disclosure row — no disconnected underlined Expand/Collapse control — and exposes real expanded/collapsed accessibility state', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'DisclosureLogRowPreview');
  assert.doesNotMatch(body, /textDecorationLine:\s*'underline'/, 'the disconnected underlined Expand/Collapse text control must be removed');
  assert.doesNotMatch(body, />\s*\{expanded \? 'Collapse' : 'Expand'\}/, 'no separate "Collapse"/"Expand" text label toggling the row from outside it');
  assert.match(body, /<Pressable/, 'expected the log row to be a real Pressable');
  assert.match(body, /onPress=\{\(\)\s*=>\s*setExpanded/, 'expected the log row Pressable itself to toggle expanded on its own onPress');
  assert.match(body, /accessibilityRole="button"/, 'expected the log row Pressable to expose accessibilityRole="button"');
  assert.match(body, /accessibilityState=\{\{\s*expanded\s*\}\}/, 'expected the log row Pressable to expose accessibilityState.expanded');

  // Summary, optional detail/status, body, and copy behavior must all be visibly covered.
  assert.match(body, /logStatus/i, 'expected an optional detail/status element alongside the summary');
  assert.match(body, /onLongPress/, 'expected a long-press-to-copy reconstruction of the real row\'s copy behavior');

  // No animation is introduced — expand/collapse stays an immediate, Reduce-Motion-safe show/hide.
  assert.doesNotMatch(body, /Animated\.|useNativeDriver/, 'expand/collapse must stay a static, non-animated show/hide in this browser reference');
});

test('Content Unavailable documents Empty, No results, Error, Unavailable, and Custom variants composing icon treatment, typography, spacing, and Buttons, with optional description plus primary/secondary actions, as a new foundation-only pattern', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(section, /new, foundation-only reusable pattern/);
  assert.match(section, /composes Hermex icon treatment, typography, spacing, and Buttons/);
  for (const variant of ["key: 'empty'", "key: 'no-results'", "key: 'error'", "key: 'unavailable'", "key: 'custom'"]) {
    assert.ok(section.includes(variant), `expected the ${variant} Content Unavailable variant`);
  }
  assert.match(section, /primaryAction/);
  assert.match(section, /secondaryAction/);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /id:\s*'ContentUnavailableView'/, 'the direct-platform-usage id must be gone, replaced by the Hermex-owned pattern');
});

// Correction (#607 follow-up 2): the catalog's own ContentUnavailablePreview laid its primary and
// secondary actions out with `flexDirection: 'row'`, contradicting production HermexContentUnavailable
// .swift's `VStack(spacing: HermesSpacing.s8) { actionButtons }`, which stacks them vertically with the
// primary action first whenever both are present. The Custom variant and the "With primary + secondary
// actions" state both render two actions, so both must exercise the corrected vertical layout.
test('Correction (#607 follow-up 2): the Content Unavailable catalog preview stacks primary and secondary actions vertically, primary first, matching HermexContentUnavailable.swift\'s VStack — not a horizontal row', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const body = extractFunctionBody(sectionsSrc, 'ContentUnavailablePreview');
  assert.doesNotMatch(body, /flexDirection:\s*'row'/, 'the two-action layout must not be a horizontal row');

  const primaryIndex = body.indexOf('Retry');
  const secondaryIndex = body.indexOf('Learn more');
  assert.notEqual(primaryIndex, -1, 'expected a primary action example');
  assert.notEqual(secondaryIndex, -1, 'expected a secondary action example');
  assert.ok(primaryIndex < secondaryIndex, 'expected the primary action to render above/before the secondary action');

  const section = extractHermesSection(sectionsSrc, 'Content Unavailable');
  assert.match(section, /key: 'custom', name: 'Custom', node: <ContentUnavailablePreview variant="custom" primaryAction secondaryAction/, 'expected the Custom variant to exercise both actions');
  assert.match(section, /key: 'with-actions', name: 'With primary \+ secondary actions', node: <ContentUnavailablePreview primaryAction secondaryAction/, 'expected the "With primary + secondary actions" state to exercise both actions');
});

// Controller correction (production reconciliation): HermexContentUnavailable.swift is confirmed adopted for
// the four picker sheets' loading/error/empty states (ModelPickerSheet, DefaultProfilePickerView,
// CronJobSkillsPicker, CronJobConfigurationPickers) — ContentUnavailableView.search(text:)'s own
// no-results treatment intentionally stays a direct call even at those same call sites, and other
// screens (e.g. TasksView, SkillsView, MemoryView) still call ContentUnavailableView directly. The
// section must say "partially adopted", not "currently no Hermex-owned source file" / "Target
// architecture ... owned by a dedicated production workstream" — and must not overclaim full
// migration.
test('Correction (design-system-foundation truthfulness pass): Content Unavailable states foundation-only status — HermexContentUnavailable.swift has no production call site, and every screen (including the four picker sheets, Kanban, and Usage) still calls the native ContentUnavailableView directly', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.doesNotMatch(section, /partially adopted/i, 'HermexContentUnavailable.swift has zero production call sites — it must not be described as partially adopted');
  assert.match(section, /HermesMobile\/Features\/Shared\/HermexContentUnavailable\.swift/);
  for (const picker of [
    'HermesMobile/Features/Shared/ModelPickerSheet.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
    'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
  ]) {
    assert.doesNotMatch(section, new RegExp(picker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${picker} does not import HermexContentUnavailable.swift and must not be cited as an adopted call site`);
  }
  assert.match(section, /30 production files/i);
  assert.match(section, /68 source references/i);
});

// ─── Explicit full-screen placement (HermexContentUnavailable.Layout) ───────────────────────────

test('Content Unavailable documents the additive layout prop (.intrinsic default / .fullScreen) in its Props table, truthfully, with no production adoption claim', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(
    section,
    /name:\s*'layout'/,
    'expected a documented "layout" prop',
  );
  assert.match(
    section,
    /'\.intrinsic'\s*\|\s*'\.fullScreen'|"'intrinsic'\s*\|\s*'fullScreen'"/,
    'expected the layout prop\'s type to name both .intrinsic and .fullScreen',
  );
  assert.match(section, /one[- ]third/i, 'expected the layout prop description to name the one-third placement, truthfully');
  assert.doesNotMatch(section, /partially adopted/i, 'the new layout API must not be described as adopted in production — it is foundation-only, same as the rest of this entry');
});

test('Content Unavailable adds a bounded, phone-like full-screen-placement catalog specimen showing content beginning around one-third down, as a new States / Configurations item', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Content Unavailable');
  assert.match(
    section,
    /key:\s*'full-screen'[\s\S]{0,120}name:\s*'Full-screen placement'/,
    'expected a "Full-screen placement" States / Configurations item',
  );

  const previewMatch = section.match(/node:\s*<(\w+)\s*\/>\s*\},\s*\n\s*\],\s*\n\s*\},\s*\n\s*hermesReference:/);
  assert.ok(previewMatch, 'expected the full-screen states item to reference a dedicated preview component');
  const previewName = previewMatch[1];

  const previewBody = extractFunctionBody(sectionsSrc, previewName);
  // The preview's own outer frame is a style-sheet reference (recon.<name>), not an inline literal —
  // resolve it to its actual declaration to check the frame is "bounded, phone-like": a fixed,
  // finite width/height, not an unbounded flex fill.
  const frameStyleMatch = previewBody.match(/<View style=\{recon\.(\w+)\}>/);
  assert.ok(frameStyleMatch, 'expected the preview\'s outer View to reference a recon.<name> frame style');
  const frameStyleName = frameStyleMatch[1];
  const frameDeclIdx = sectionsSrc.indexOf(`${frameStyleName}:`);
  assert.ok(frameDeclIdx > -1, `expected a recon.${frameStyleName} style declaration`);
  // Scans a window after the frame style's own declaration (covering it and its immediate sibling
  // style(s), e.g. a top-spacer keyed off the same frame) rather than the whole multi-thousand-line
  // file, so this doesn't accidentally match an unrelated width/height/fraction elsewhere.
  const frameRegion = sectionsSrc.slice(frameDeclIdx, frameDeclIdx + 400);
  assert.match(frameRegion, /width:\s*\d/, 'expected the preview frame to declare a fixed width');
  assert.match(frameRegion, /height:\s*\d/, 'expected the preview frame to declare a fixed height');
  // Content begins ~1/3 down: a spacer/offset sized to roughly a third of the frame's own height,
  // the same relationship HermexContentUnavailable.swift computes via GeometryReader's `/ 3`.
  assert.match(frameRegion, /\/\s*3\b/, 'expected the preview to reserve roughly one third of the frame height above the content cluster');
});

test('Pending Request documents Request Card composition and preserves the domain-owned request-state disclaimer', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Pending Request');
  assert.match(section, /Request Card/);
  assert.match(section, /domain-owned states/);
  assert.match(section, /approval, denial, clarification, pending, disabled, success, failure, cancellation, and recovery/);
});

test('Transcript Activity documents Turn Summary Disclosure, the Activity Disclosure Row, a grouped-tool-history control, assistant message content, and message metadata, preserving domain ownership', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Transcript Activity');
  assert.match(section, /Turn Summary Disclosure/);
  assert.match(section, /Activity Disclosure Row/);
  assert.match(section, /grouped-tool-history control/);
  assert.match(section, /assistant message content/i);
  assert.match(section, /message metadata/i);
  assert.match(section, /Domain ownership boundary preserved/);
});

test('Composer documents composition of the composer surface, Input Field, Buttons, Tag, Inline Reference Link, Attachment, Adaptive Glass, and status/validation feedback, while preserving domain ownership of text editing, draft persistence, and send/stop lifecycle', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Composer');
  assert.match(section, /composer surface, an input field, Buttons, Tag, Inline Reference Link, Attachment, Adaptive Glass/);
  assert.match(section, /text editing, keyboard interaction, draft persistence, attachments, runtime selection, voice input, and send\/stop lifecycle/);
  assert.match(section, /<ComposerPatternPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function ComposerPatternPreview/);
});

// Controller correction (2026-09-26, gap 6): Transcript Activity rendered the same single log row
// (DisclosureLogRowPreview) as the standalone Disclosure Row entry, plus prose — not a composite of
// its five documented pieces. It needs its own preview genuinely composing all five.
test('Correction (gap 6): Transcript Activity renders a real composite preview of Turn Summary Disclosure, the Activity Disclosure Row, a grouped-tool-history control, assistant message content, and message metadata — not the standalone Disclosure Row preview reused verbatim', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Transcript Activity');
  assert.match(section, /<TranscriptActivityPreview/, 'expected Transcript Activity to render its own composite preview, not <DisclosureLogRowPreview />');
  assert.doesNotMatch(section, /<DisclosureLogRowPreview/, 'must no longer reuse the standalone Disclosure Row preview verbatim as this pattern\'s own render');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function TranscriptActivityPreview/);
  const body = extractFunctionBody(previewsSrc, 'TranscriptActivityPreview');
  assert.match(body, /accessibilityState=\{\{\s*expanded(?::\s*\w+)?\s*\}\}/, 'expected a genuine Turn Summary Disclosure with its own expand/collapse state');
  assert.match(body, /Thinking|Turn Summary/i, 'expected a labeled turn-summary disclosure, distinct from a plain tool-call log row');
  assert.match(body, /accessibilityRole="button"/, 'expected the grouped-tool-history control to be a real, focusable control');
  assert.match(body, /(?:more tool call|tool calls|Show \d)/i, 'expected a grouped-tool-history control (e.g. "Show N more tool calls")');
  assert.match(body, /<Button\b/, 'expected the grouped-tool-history control to compose the real Button component, per Buttons\' own family');
  assert.match(body, /assistant/i, 'expected assistant message content');
  assert.match(body, /Domain ownership/i, 'expected the domain-ownership boundary to be restated alongside the composite, not only in the section prose');
});

// Controller correction (2026-09-26, gap 6): the Composer preview mocked its input as bare Text (not
// a real text field), its send action as a plain View (not the real Button), and never demonstrated
// Tag or Inline Reference Link at all — three of the eight composed pieces the section's own copy
// already claims were missing from the rendered preview.
//
// Correction (#607 follow-up 2): the composer text field originally composed the generic template
// InputField, which visibly claims a floating-label look production doesn't use. It now composes a
// native-style TextInput reconstruction instead (see the Text Input entry), so this contract checks
// for that reconstruction rather than the generic InputField.
test('Correction (gap 6): the Composer preview visibly composes a native-style text input reconstruction, the real Button, Tag, Inline Reference Link, and Card-based Attachment, labels its Adaptive Glass treatment, and shows status/validation feedback', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ComposerPatternPreview');
  assert.doesNotMatch(body, /<InputField\b/, 'must no longer compose the generic template InputField');
  assert.match(body, /<TextInput\b/, 'expected the composer text field to compose a native-style TextInput reconstruction, not a bare Text placeholder');
  assert.match(body, /<Button\b/, 'expected the send action to compose the real generic Button, not a plain View');
  assert.match(body, /<Card density="compact"/, 'expected the composer\'s attachment tile to compose the real Card, per Attachment\'s own Compact Card composition');
  assert.match(body, /accessibilityRole="link"/, 'expected a real Inline Reference Link example (link semantics), not just an Attachment tile');
  assert.match(body, /Adaptive Glass/, 'expected the composer surface\'s glass treatment to be explicitly labeled, not just implied by an untitled translucent background');
  assert.match(body, /(?:invalid|too long|validation|warning)/i, 'expected explicit validation/status feedback beyond a single "Draft saved" status tag');

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Composer');
  // Domain-ownership copy must survive this preview rework verbatim.
  assert.match(section, /text editing, keyboard interaction, draft persistence, attachments, runtime selection, voice input, and send\/stop lifecycle/);
});

test('the four Patterns entries are the only members of the Patterns — Hermex group, and none of them is affirmatively described as a Card variant per the prohibited-list', () => {
  const src = read(HERMES_SECTIONS_PATH);
  for (const id of ['Content Unavailable', 'Pending Request', 'Transcript Activity', 'Composer']) {
    const section = extractHermesSection(src, id);
    assert.doesNotMatch(section, /is a Card variant|as generic Card props/i);
  }
});

// ─── Issue #607 follow-up: names + Avatar + TopNav + audits (2026-09-26) ────────────────────────
// "Hermex" is only removed from *catalog component display names* (Card, Banner, Checkbox, Avatar).
// Internal section ids can't literally become those bare strings: `sections` in
// HermesDesignSystemCatalog.tsx concatenates hermesSections with the retained template's own
// sections into one array keyed by `def.id` (CatalogShell's `sectionsById`), and the template
// already registers its own unrelated 'Card'/'Banner'/'Checkbox'/'Avatar' entries under those exact
// ids — reusing them here would silently collide in that shared lookup (whichever section is
// spread in last would win, and the other would become unreachable). So the renamed entries keep a
// unique, non-colliding 'Hermes <Name>' id (never starting with "Hermex") and declare `displayName`
// (SectionDef's own opt-in display override) with the plain name actually shown.

test('SectionDef supports an optional displayName, and the section title / sidebar nav label render it over the raw id', () => {
  const typesSrc = read(TYPES_PATH);
  assert.match(typesSrc, /displayName\?:\s*string/, 'expected an optional displayName field on SectionDef');

  const sectionBlockSrc = read(SECTION_BLOCK_PATH);
  assert.match(sectionBlockSrc, /\{def\.displayName\s*\?\?\s*def\.id\}/, 'expected the section title to prefer displayName over the raw id');

  const sidebarSrc = read(CATALOG_SIDEBAR_PATH);
  assert.match(sidebarSrc, /labelFor/, 'expected CatalogSidebar to accept a labelFor resolver');
  assert.match(sidebarSrc, /\{label\}/, 'expected NavItem to render the resolved label, not the raw id');

  const shellSrc = read(CATALOG_SHELL_PATH);
  assert.match(shellSrc, /labelFor\s*=\s*\(id[^)]*\)\s*=>\s*sectionsById\.get\(id\)\?\.displayName\s*\?\?\s*id/, 'expected CatalogShell to resolve each id\'s displayName from the same sectionsById map it already builds');
});

test('Foundations token sections keep namespaced internal ids but remove "Hermex" from their visible names', () => {
  const src = read(HERMES_SECTIONS_PATH);
  for (const [id, displayName] of [
    ['Hermex Colors', 'Colors'],
    ['Hermex Spacing', 'Spacing'],
    ['Hermex Typography', 'Typography'],
    ['Hermex Font', 'Font'],
    ['Hermex Motion', 'Motion'],
    ['Hermex Radius & Geometry', 'Radius & Geometry'],
    ['Hermex Shadow', 'Shadow'],
    ['Hermex Iconography', 'Iconography'],
  ]) {
    const section = extractHermesSection(src, id);
    assert.match(
      section,
      new RegExp(`displayName:\\s*'${displayName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}'`),
      `expected ${id} to render as ${displayName}`,
    );
  }
});

test('Card/Banner/Checkbox/Avatar keep unique, non-"Hermex"-prefixed internal ids and declare the plain displayName the brief requires', () => {
  const src = read(HERMES_SECTIONS_PATH);
  for (const stale of ["'Hermex Card'", "'Hermex Banner'", "'Hermex Checkbox'", "'Avatar & Bot Face'"]) {
    assert.ok(!src.includes(stale), `the pre-rename id ${stale} must no longer appear anywhere`);
  }
  for (const [id, displayName] of [
    ['Hermes Card', 'Card'],
    ['Hermes Banner', 'Banner'],
    ['Hermes Checkbox', 'Checkbox'],
    ['Hermes Avatar', 'Avatar'],
  ]) {
    assert.match(src, new RegExp(`\\| '${id}'`), `expected '${id}' in the HermesSectionId union`);
    const section = extractHermesSection(src, id);
    assert.match(section, new RegExp(`displayName:\\s*'${displayName}'`), `expected ${id} to declare displayName: '${displayName}'`);
  }
});

test('no id in the Components — Hermex nav group starts with "Hermex" (Foundations/token-family ids like "Hermex Colors" are out of this rename and keep their prefix)', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.ok(!id.startsWith('Hermex'), `component id "${id}" must not start with "Hermex"`);
  }

  const foundationsGroupMatch = navBlockMatch[0].match(/label:\s*'Foundations',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  assert.ok(foundationsGroupMatch, 'expected the Foundations — Hermex nav group');
  const foundationsIds = [...foundationsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(foundationsIds.every((id) => id.startsWith('Hermex')), 'Foundations/token-family ids keep their existing "Hermex" prefix — out of this rename\'s scope');
});

test('the Components — Hermex nav group preserves Hermex-owned family order while native TopNav lives in Native iOS', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, [
    'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Hermes Toast', 'Row Divider', 'Tag',
    'Inline Reference Link', 'Search', 'Text Input', 'Hermes Dropdown', 'Hermes Tooltip', 'Segmented Control',
    'Buttons', 'Hermes Checkbox', 'Hermes Radio', 'Skeleton Loading', 'List / ListItem', 'Accordion List', 'Disclosure Row',
    'Bottom Sheet', 'Hermes Dialog',
  ]);
});

test('the Components — Hermex nav group alphabetizes by visible display name at render time, not raw id', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',([\s\S]*?)ids:\s*\[/);
  assert.match(componentsGroupMatch[1], /alphabetizeByLabel:\s*true/, 'expected the Components — Hermex group to opt into label-based alphabetization');

  const foundationsGroupMatch = navBlockMatch[0].match(/label:\s*'Foundations',([\s\S]*?)ids:\s*\[/);
  assert.doesNotMatch(foundationsGroupMatch[1], /alphabetizeByLabel/, 'Foundations keeps its own intentional sequence, unaffected by the new opt-in');
});

test('sortIds sorts by raw id unless a group opts into label-based alphabetization', () => {
  const typesSrc = read('native/catalog/types.ts');
  assert.match(typesSrc, /alphabetizeByLabel\?:\s*boolean/, 'expected NavGroup to expose the opt-in flag');
  assert.match(
    typesSrc,
    /export function sortIds<TId extends string>\(ids: readonly TId\[\], keyFor\?: \(id: TId\) => string\): TId\[\]/,
    'expected sortIds to accept an optional per-id sort key, defaulting to the raw id',
  );

  for (const path of ['native/catalog/CatalogShell.tsx', 'native/catalog/CatalogSidebar.tsx']) {
    const src = read(path);
    assert.match(src, /g\.alphabetizeByLabel \? labelFor : undefined/, `expected ${path} to thread alphabetizeByLabel through sortIds`);
  }
});

// Correction (2026-09-27): the two tests above only check that a flag is set and that `sortIds`
// exists — neither actually computes the order a reader would see. This test recomputes it, the
// same way `CatalogShell`'s own `labelFor`/`sortIds` do (displayName, falling back to id, then
// localeCompare), and pins the result to a literal, humanly-verifiable alphabetical list — so a
// future id or displayName addition that breaks true alphabetical order fails here, not just in a
// visual review.
test('the Components — Hermex group\'s computed render order is actually alphabetical by display name, not merely flagged as such', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components',[\s\S]*?ids:\s*\[([\s\S]*?)\]/);
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const labelFor = (id) => {
    const section = extractHermesSection(src, id);
    const displayNameMatch = section.match(/displayName:\s*'([^']+)'/);
    return displayNameMatch ? displayNameMatch[1] : id;
  };
  const computedOrder = ids.slice().sort((a, b) => labelFor(a).localeCompare(labelFor(b)));

  assert.deepEqual(computedOrder.map(labelFor), [
    'Accordion List', 'Attachment', 'Avatar', 'Banner', 'Bottom Sheet', 'Buttons', 'Card', 'Checkbox', 'Dialog', 'Disclosure Row', 'Dropdown',
    'Inline Reference Link', 'List / ListItem', 'Radio', 'Row Divider', 'Search',
    'Segmented Control', 'Skeleton Loading', 'Tag', 'Text Input', 'Toast', 'Tooltip',
  ], 'expected the computed labelFor+sortIds order to be truly alphabetical by display name');
});

// ─── Avatar named/custom size API ────────────────────────────────────────────────────────────────

test('Avatar exports an immutable AVATAR_SIZE map (small=32/medium=40/large=48), defaults size to \'medium\', and keeps a numeric custom-size escape hatch', () => {
  const src = read('native/components/Avatar/Avatar.tsx');
  assert.match(src, /export const AVATAR_SIZE = Object\.freeze\(\{/, 'expected an exported, immutable size map');
  assert.match(src, /small:\s*32/);
  assert.match(src, /medium:\s*40/);
  assert.match(src, /large:\s*48/);
  assert.match(src, /export type AvatarSizeName = keyof typeof AVATAR_SIZE/);
  assert.match(src, /size\?:\s*AvatarSizeName \| number/, 'expected size to accept a named step or a raw number');
  assert.match(src, /size = 'medium'/, "expected size to default to 'medium'");
  assert.match(src, /typeof size === 'number' \? size : AVATAR_SIZE\[size\]/, 'expected the numeric escape hatch to bypass the named map entirely');

  const indexSrc = read('native/components/Avatar/index.ts');
  assert.match(indexSrc, /export \{ Avatar, AVATAR_SIZE \} from '\.\/Avatar'/);
  assert.match(indexSrc, /export type \{ AvatarProps, AvatarSizeName \} from '\.\/Avatar'/);
});

test('the Avatar family entry\'s specimens show the three named sizes, one intentional custom size, and the existing image/icon/initials/bot-face variants', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const previewSrc = read('native/catalog/hermes/HermesComponentFamiliesPreviews.tsx');
  const section = extractHermesSection(sectionsSrc, 'Hermes Avatar');
  assert.match(section, /<AvatarFamilyGallery/);
  assert.match(section, /AVATAR_SIZE/, 'expected the props table to reference the exported size map');

  const body = extractFunctionBody(sectionsSrc, 'AvatarFamilyGallery');
  assert.match(body, /size="small"/);
  assert.doesNotMatch(body, /size="medium"/, 'medium is the default — demonstrate it by omission, not by passing the value explicitly');
  assert.match(body, /size="large"/);
  assert.match(body, /size=\{64\}/, 'expected exactly one intentional custom numeric size example');
  assert.match(body, /imageUrl=/, 'expected the image content variant');
  assert.match(body, /iconName="menu"/, 'expected the icon content variant');
  assert.match(body, /initials="JS"/, 'expected an initials content variant beyond the production identity examples');
  assert.match(body, /<IdentityAvatarPreview/, 'expected the existing production identity variants to survive');
  assert.match(body, /<BotMarkPreview/, 'expected the existing bot-face variant to survive');
  assert.match(sectionsSrc, /avatarGallery:\s*\{[^}]*width:\s*'100%'[^}]*minWidth:\s*0/s, 'expected the Avatar gallery to be allowed to shrink inside the Variants column');
  assert.match(sectionsSrc, /avatarPreviewRow:\s*\{[^}]*flexWrap:\s*'wrap'[^}]*width:\s*'100%'[^}]*minWidth:\s*0/s, 'expected Avatar specimen rows to wrap instead of overflowing into Props');
  assert.match(sectionsSrc, /avatarIdentityItem:\s*\{[^}]*maxWidth:\s*'100%'[^}]*minWidth:\s*0[^}]*flexShrink:\s*1/s, 'expected long identity labels to shrink within their row');
  assert.match(previewSrc, /botMarkPreview:\s*\{[^}]*flexBasis:\s*220[^}]*maxWidth:\s*'100%'[^}]*minWidth:\s*0/s, 'expected the bot-face explanation to wrap inside the Avatar specimen row');
  assert.match(previewSrc, /<View style=\{preview\.botMarkPreview\}>/);
});

test('Avatar accepts an optional iconSize override that replaces the default half-diameter icon ratio, without changing existing callers\' default behavior', () => {
  const src = read('native/components/Avatar/Avatar.tsx');
  assert.match(src, /iconSize\?:\s*number/, 'expected an optional iconSize override prop');
  assert.match(src, /const resolvedIconSize = iconSize \?\? Math\.round\(resolvedSize \* 0\.5\)/, 'expected the override to fall back to the existing default half-diameter ratio when omitted, so every existing caller keeps its current icon size');
  assert.match(src, /<Icon name=\{iconName\} size=\{resolvedIconSize\}/, 'expected the icon to render at the resolved (possibly overridden) size');
});

test('AvatarSystemImageIdentityPreview renders the production system-image identity specimen for every HERMES_ICON_AVATAR_PAIRING entry (32→20, 40→24, 48→32), driven from the pairing data rather than duplicated literals or a stale caption', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(previewsSrc, /import \{ HERMES_ICON_AVATAR_PAIRING \} from '\.\/hermesIconSize'/, 'expected the pairing import alongside the existing icon-size import');
  assert.match(previewsSrc, /export function AvatarSystemImageIdentityPreview/);
  const body = extractFunctionBody(previewsSrc, 'AvatarSystemImageIdentityPreview');
  assert.match(body, /Object\.entries\(HERMES_ICON_AVATAR_PAIRING\)/, 'expected the gallery to render every pairing entry, not a hand-duplicated list');
  assert.match(body, /size=\{avatar\}/, 'expected each specimen to use the pairing\'s own avatar diameter');
  assert.match(body, /iconSize=\{icon\}/, 'expected each specimen to use the pairing\'s own icon size override');
  assert.doesNotMatch(body, /\b32\b|\b40\b|\b48\b|\b20\b|\b24\b/, 'must not duplicate a pairing diameter/icon size as a local literal');
  assert.doesNotMatch(body, /Large \(48\)|icon 24/i, 'must not carry the stale hand-typed caption');

  const avatarGallery = extractFunctionBody(sectionsSrc, 'AvatarFamilyGallery');
  assert.match(avatarGallery, /<AvatarSystemImageIdentityPreview\s*\/>/, 'expected the live Avatar family gallery to compose the corrected production pairing specimen');
  assert.doesNotMatch(avatarGallery, /Large \(48\) · icon 24/, 'the stale production pairing must not remain rendered beside the corrected specimen');
});

// ─── TopNav slot contract + specimens ────────────────────────────────────────────────────────────

test('TopNav exposes explicit leadingPrimary/leadingSecondary/center/trailingPrimary/trailingSecondary slots, keeps leading/trailing as backward-compatible fallbacks, and reserves a symmetric per-side minimum width', () => {
  const src = read('native/components/TopNav/TopNav.tsx');
  for (const prop of ['leadingPrimary', 'leadingSecondary', 'trailingPrimary', 'trailingSecondary', 'center']) {
    assert.match(src, new RegExp(`${prop}\\?:\\s*ReactNode`), `expected an explicit ${prop} slot prop`);
  }
  assert.match(src, /resolvedLeadingPrimary\s*=\s*leadingPrimary\s*\?\?\s*leading/, 'expected leadingPrimary to fall back to the deprecated leading prop');
  assert.match(src, /resolvedTrailingPrimary\s*=\s*trailingPrimary\s*\?\?\s*trailing/, 'expected trailingPrimary to fall back to the deprecated trailing prop');
  assert.match(src, /slotGroup:\s*\{[^}]*minWidth:\s*SLOT_SIZE \* 2/s, 'expected each side to reserve a symmetric two-slot minimum width');

  // Existing consumers (Dropdown, the retained template catalog) pass `leading`/`trailing` directly —
  // the fallback above must keep them working without their own call sites changing.
  const dropdownSrc = read('native/components/Dropdown/Dropdown.tsx');
  assert.match(dropdownSrc, /<TopNav[\s\S]*?trailing=\{/, 'expected the pre-existing Dropdown TopNav usage to keep working unchanged');
});

test('the Hermes TopNav entry documents a new, foundation-only ToolbarContent contract with no production call site, that simple screens may keep a native navigation title, and that bottom/keyboard toolbars are out of scope', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Hermes TopNav'/, "expected 'Hermes TopNav' in the HermesSectionId union");
  const section = extractHermesSection(sectionsSrc, 'Hermes TopNav');
  assert.match(section, /displayName:\s*'TopNav'/);
  assert.match(section, /ToolbarContent/, 'expected the new ToolbarContent type to be named');
  assert.doesNotMatch(section, /fully adopted/i, 'TopNav.swift has no production call site — it must not be described as fully adopted');
  assert.doesNotMatch(section, /57 top-navigation toolbar blocks/i, 'the "57 blocks across 39 files" migration claim is fabricated and must not appear');
  assert.match(section, /no production file imports or composes the new TopNav\.swift/i);
  assert.match(section, /HermesMobile\/Features\/Shared\/TopNav\.swift/, 'expected the new component source to be linked');
  assert.match(section, /native navigation title/i, 'expected the native-navigation-title escape hatch for simple screens to be documented');
  assert.match(section, /out of scope/i, 'expected bottom/keyboard toolbars to be explicitly scoped out');
  assert.match(section, /[Bb]ottom.*keyboard toolbar|keyboard.*[Tt]oolbar/, 'expected bottom/keyboard toolbars to be named as the excluded concern');
  assert.match(section, /<TopNavFamilyGallery/);
});

test('TopNav specimens cover standard navigation, a modal/editor, and populated two-leading/two-trailing slots', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function TopNavFamilyGallery/);
  assert.match(previewsSrc, /topNavActionButton:\s*\{[^}]*minWidth:\s*44[^}]*minHeight:\s*44/s, 'expected TopNav specimen actions to preserve a 44pt hit target');
  assert.match(previewsSrc, /function iconSlotButton[\s\S]*?size="small"[\s\S]*?style=\{preview\.topNavActionButton\}/, 'expected compact TopNav icon visuals inside a 44pt action target');
  const body = extractFunctionBody(previewsSrc, 'TopNavFamilyGallery');

  // Standard navigation.
  assert.match(body, /leadingPrimary=\{iconSlotButton\('chevron-left', 'Back'\)\}/);
  assert.match(body, /trailingPrimary=\{iconSlotButton\('search', 'Search'\)\}/);

  // Modal/editor.
  assert.match(body, /size="small" label="Cancel"[\s\S]*?style=\{preview\.topNavActionButton\}/, 'expected a compact modal Cancel action inside a 44pt target');
  assert.match(body, /size="small" label="Save"[\s\S]*?style=\{preview\.topNavActionButton\}/, 'expected a compact modal Save action inside a 44pt target');

  // Populated two-leading/two-trailing coverage, all four slots at once.
  const fourSlotBlock = body.match(/<TopNav\s+title="quarterly-report\.pdf"[\s\S]*?\/>/);
  assert.ok(fourSlotBlock, 'expected a specimen naming all four optional slots together');
  for (const prop of ['leadingPrimary', 'leadingSecondary', 'trailingSecondary', 'trailingPrimary']) {
    assert.match(fourSlotBlock[0], new RegExp(`${prop}=`), `expected the four-slot specimen to populate ${prop}`);
  }
});

test('the TopNav entry documents that actions retain labels and hit targets, center truncates rather than overlapping actions, and slot order stays semantic', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sectionsSrc, 'Hermes TopNav');
  assert.match(section, /accessibilityLabel/, 'expected retained action labels to be documented');
  assert.match(section, /44.{0,3}44pt hit target|hit target/i, 'expected the minimum hit target to be documented');
  assert.match(section, /truncat/i, 'expected center truncation (not overlap) to be documented');
  assert.match(section, /semantic/i, 'expected slot order to be documented as semantic, not just visual');
});

// ─── Attachment/Card radius parity + opaque close-control tokens ────────────────────────────────

test('Correction (attachment parity): normal Attachment outer surfaces reference the same Card radius token as Card (DS_RADIUS.medium), never an independent Attachment-only outer-radius value', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /import\s*\{[^}]*\bDS_RADIUS\b[^}]*\}\s*from\s*'\.\.\/\.\.\/\.\.\/tokens'/, 'expected DS_RADIUS to be imported directly, not a re-derived value');
  const tileBoxMatch = previewsSrc.match(/tileBox:\s*\{[^}]*\}/s);
  assert.ok(tileBoxMatch, 'expected a tileBox style');
  assert.match(tileBoxMatch[0], /borderRadius:\s*DS_RADIUS\.medium/, 'tileBox must reference DS_RADIUS.medium directly');
  assert.doesNotMatch(tileBoxMatch[0], /borderRadius:\s*\d/, 'must not hardcode a numeric radius independent of the shared Card token');

  const cardImplSrc = read('native/components/Card/Card.tsx');
  assert.match(cardImplSrc, /card:\s*\{[^}]*borderRadius:\s*DS_RADIUS\.medium/s, 'expected Card\'s own outer radius to be the same DS_RADIUS.medium token being asserted above');
});

test('Correction (attachment parity): the Attachment remove/close control uses an opaque semantic color token (the "white" Button variant), never the alpha-derived "secondary" variant', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'AttachmentTileGallery');
  assert.match(body, /variant="white"[\s\S]{0,160}?iconName="clear"/, 'expected the remove control to use the opaque "white" variant');
  assert.doesNotMatch(body, /variant="secondary"[\s\S]{0,160}?iconName="clear"/, 'must not pair the alpha-derived "secondary" variant with the remove control');

  const buttonImplSrc = read('native/components/Button/Button.tsx');
  const whiteVariantMatch = buttonImplSrc.match(/white:\s*\{\s*container:[\s\S]*?label:[^}]*\},\s*\n\s*\}/);
  assert.ok(whiteVariantMatch, 'expected to find the "white" Button variant\'s style block');
  assert.doesNotMatch(whiteVariantMatch[0], /rgba\(/i, 'the opaque "white" variant must never resolve through an alpha/opacity-derived rgba() color');
});

// ─── Foundation branch-status summary (replaces the former production-adoption matrix) ───────────
// Required correction 1: the branch is foundation-only. New Design System tokens/components are
// available in the repository candidate, but production-screen migration/adoption is intentionally
// excluded. These tests pin down the truthful replacement for the removed screen-by-screen
// PRODUCTION_ADOPTION_AUDIT table.

test('the catalog replaces the former screen-by-screen production-adoption matrix with a compact, truthful branch-status summary — foundation-only, not a per-screen adoption audit', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /PRODUCTION_ADOPTION_AUDIT/, 'the screen-by-screen adoption matrix must be removed');
  assert.doesNotMatch(sectionsSrc, /HermesProductionAdoptionAuditTable/, 'the screen-by-screen adoption table component must be removed');
  assert.doesNotMatch(sectionsSrc, /function HermesProductionAdoptionAuditTable/);

  assert.match(sectionsSrc, /function HermesFoundationBranchStatusTable/, 'expected a dedicated, truthful branch-status table component');
  assert.match(sectionsSrc, /FOUNDATION_BRANCH_STATUS/);
  assert.match(sectionsSrc, /HermesFoundationBranchStatusTable/, 'expected it to actually be rendered');
  assert.doesNotMatch(sectionsSrc, /id:\s*'[^']*[Aa]doption [Aa]udit[^']*'/, 'the branch-status summary must not be registered as its own nav-linked SectionDef — it belongs in the overview, not repeated per component');

  assert.match(sectionsSrc, /Foundation APIs\/components\/tokens are available in the current repository candidate/i);
  assert.match(sectionsSrc, /Production-screen migration\/adoption is not included in this branch/i);
  assert.match(sectionsSrc, /Branch status/i);
  assert.doesNotMatch(sectionsSrc, /screen-by-screen snapshot of how much of the design system each screen uses/i, 'must not still claim to audit per-screen adoption');

  // None of the specific per-screen "Strong"/"Yes" adoption claims from the removed matrix may
  // survive anywhere in the file.
  for (const stale of [
    "screen: 'Tasks', level: 'Strong'",
    "screen: 'Kanban', level: 'Strong'",
    "screen: 'Skills', level: 'Strong'",
    "screen: 'Memory', level: 'Strong'",
    "screen: 'Usage', level: 'Strong'",
    "'\"Enjoying Hermex?\" (TipJarCard.swift)'",
    "screen: 'Conversation loading', level: 'Yes'",
  ]) {
    assert.ok(!sectionsSrc.includes(stale), `did not expect the retired per-screen adoption claim "${stale}" to survive`);
  }
});

test('the foundation branch-status table names the one verified real adoption (AppTheme.swift/HermesProductPalette) and states every new component family has no production call site', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const tableMatch = sectionsSrc.match(/const FOUNDATION_BRANCH_STATUS: FoundationStatusRow\[\] = \[[\s\S]*?\n\];/);
  assert.ok(tableMatch, 'expected a FOUNDATION_BRANCH_STATUS array literal');
  const table = tableMatch[0];
  assert.match(table, /AppTheme\.swift/);
  assert.match(table, /HermesProductPalette/);
  assert.match(table, /No production screen reads from them yet/i);
  assert.match(table, /None has a production call site in this branch/i);
});

// ─── #607 correction slice: Content Unavailable, HermexList, HermesUsageSize — foundation-only ────

test('Content Unavailable truthfully states Kanban\'s status/filter empty branch and Usage\'s loading/error/empty states, alongside the four picker sheets, all still call the native ContentUnavailableView directly (no HermexContentUnavailable adoption)', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(section, /Kanban/);
  assert.match(section, /Usage/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/Kanban\/KanbanLabView\.swift/, 'KanbanLabView.swift does not import HermexContentUnavailable.swift and must not be cited as a caller');
  assert.doesNotMatch(section, /HermesMobile\/Features\/Insights\/InsightsView\.swift/, 'InsightsView.swift does not import HermexContentUnavailable.swift and must not be cited as a caller');
  for (const picker of [
    'HermesMobile/Features/Shared/ModelPickerSheet.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
    'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
  ]) {
    assert.doesNotMatch(section, new RegExp(picker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${picker} does not import HermexContentUnavailable.swift and must not be cited as an adopted call site`);
  }
});

// Foundation split (#607): shared List/ListItem capabilities are new and unadopted. No production
// screen — including Session's main menu and its utility/disclosure rows — has migrated onto them.
test('List / ListItem documents its foundation capabilities without claiming any production adoption, including the deferred Session utility-row migration', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.match(section, /HermexList/);
  assert.doesNotMatch(section, /HermesMobile\/Features\/SessionList\/SessionListView\.swift/, 'SessionListView.swift does not import HermexList.swift and must not be cited as a caller');
  assert.match(section, /hapticFeedbackStyle/, 'expected the opt-in ListItem haptic capability to be documented');
  assert.match(section, /no production caller/i);
  assert.doesNotMatch(section, /retired bespoke SidebarNavButton/i);
  assert.doesNotMatch(section, /Bots\/Tasks\/Kanban\/Skills\/Memory\/Usage/);
});

test('Hermex Spacing catalogs every HermesUsageSize component token by semantic name and value', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const gallery = extractFunctionBody(src, 'HermesSpacingGallery');
  assert.match(gallery, /HERMES_USAGE_SIZE/);
  for (const [name, value] of [
    ['chartHeight', '180'],
    ['legendIndicator', '7'],
    ['balanceBarHeight', '8'],
    ['minimumBalanceFill', '8'],
  ]) {
    assert.match(src, new RegExp(`name:\\s*'HermesUsageSize\\.${name}'[\\s\\S]*?value:\\s*'${value}pt'`));
  }
});

test('Hermex Spacing renders a decision ladder choosing among the existing 12 steps by relationship, not adding new values', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const gallery = extractFunctionBody(src, 'HermesSpacingGallery');
  assert.match(gallery, /HERMES_SPACING_LADDER/, 'expected the gallery to render a data-driven decision ladder');
  assert.match(src, /Decision ladder/);

  const ladderMatch = src.match(/const HERMES_SPACING_LADDER: SpacingLadderRung\[\] = \[([\s\S]*?)\n\];/);
  assert.ok(ladderMatch, 'expected a HERMES_SPACING_LADDER data array');
  const ladderSrc = ladderMatch[1];

  // Every rung's step(s) must be one of the real, already-existing HermesSpacing step names —
  // never a new numeric literal outside that scale (mirrors HERMES_SPACING_STEPS itself, asserted
  // verbatim against hermesTokenProposal.ts elsewhere in this file).
  const approvedSteps = [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
  const stepRefs = [...ladderSrc.matchAll(/space\.(\d+)/g)].map((m) => Number(m[1]));
  assert.ok(stepRefs.length > 0, 'expected the ladder to cite real space.N step names');
  for (const step of stepRefs) {
    assert.ok(approvedSteps.includes(step), `ladder cites space.${step}, which is not one of HermesSpacing's approved steps`);
  }

  // At minimum distinguishes: micro/inline, related controls, compact component padding, default
  // card/screen inset, major content groups, and section separation.
  for (const relationship of [
    /micro.*inline/i,
    /related controls/i,
    /compact component padding/i,
    /card.*screen inset/i,
    /major content groups/i,
    /section separation/i,
  ]) {
    assert.match(ladderSrc, relationship, `expected the decision ladder to cover a rung matching ${relationship}`);
  }
});

// ─── #607 follow-up: catalog framework (two-column Variants, five-line Props clamp) ─────────────

test('a Variants specimen box lays out two responsive columns when width permits, falling back to one at narrow widths, but never for a wide itemsFill slot', () => {
  const src = read(SECTION_BLOCK_PATH);
  assert.match(src, /twoColumn\?:\s*boolean/, 'expected SlotItems to accept an opt-in twoColumn flag');
  assert.match(src, /<SlotItems slot=\{def\.variants\} twoColumn \/>/, 'expected only the Variants block to opt in, not States/Configurations');
  assert.doesNotMatch(src, /<SlotItems slot=\{def\.states\}[^/]*twoColumn/, 'States/Configurations must not opt into the two-column grid');
  assert.match(src, /useGrid\s*=\s*twoColumn\s*&&\s*!slot\.itemsFill\s*&&\s*!isNarrow\s*&&\s*slot\.items\.length > 1/, 'expected the grid to fall back to one column for a narrow viewport or a wide itemsFill slot');
  assert.match(src, /exampleGrid:\s*\{\s*flexDirection:\s*'row',\s*flexWrap:\s*'wrap'/, 'expected a wrapping row style for the two-column grid');
});

test('a Props row clamps to five lines and only exposes an expand/collapse control once the real content actually exceeds that', () => {
  const src = read(PROPS_TABLE_PATH);
  assert.match(src, /CLAMPED_LINES\s*=\s*5/, 'expected the five-line clamp constant');
  assert.match(src, /onTextLayout=\{/, 'expected a real measurement pass rather than a character-count guess');
  assert.match(src, /setCanExpand\(\(e\.nativeEvent\.lines\?\.length \?\? 0\) > CLAMPED_LINES\)/, 'expected canExpand to reflect the real measured line count, not a heuristic');
  assert.match(src, /measured && canExpand && \(/, 'expected the expand control to render only once content is confirmed to overflow');
  assert.match(src, /accessibilityRole="button"/, 'expected the expand control to be a real button, keyboard and touch reachable');
  assert.match(src, /accessibilityState=\{\{\s*expanded\s*\}\}/, 'expected the control\'s accessibility state to reflect its true expanded/collapsed state');
  assert.match(src, /expanded \? 'Show less' : 'Show more'/, 'expected the visible label to match the true expanded state');
});

// ─── #607 follow-up: AccordionList (collection-level expandable ListItem groups) ────────────────

const ACCORDION_LIST_PATH = 'native/components/AccordionList/AccordionList.tsx';
const LIST_ITEM_COMPONENT_PATH = 'native/components/ListItem/ListItem.tsx';
const COMPONENTS_INDEX_PATH = 'native/components/index.ts';

test('AccordionList exists, is exported, and requires explicit appearance and separator choices', () => {
  assert.ok(existsSync(path.join(ROOT, ACCORDION_LIST_PATH)));
  const accordion = read(ACCORDION_LIST_PATH);
  const index = read(COMPONENTS_INDEX_PATH);
  assert.match(accordion, /appearance:\s*'card'\s*\|\s*'cardless'/);
  assert.match(accordion, /separatorStyle:\s*'none'\s*\|\s*'betweenRows'\s*\|\s*'topAndBottom'\s*\|\s*'all'/);
  assert.doesNotMatch(accordion, /appearance\s*=\s*['"]/);
  assert.doesNotMatch(accordion, /separatorStyle\s*=\s*['"]/);
  assert.match(index, /export \* from '\.\/AccordionList'/);
});

test('AccordionList owns one accessible header press target, header-aligned body rows, and reduced-motion behavior', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(accordion, /expanded=\{expanded\}/);
  assert.match(accordion, /AnimatedChevron/);
  assert.match(accordion, /AccessibilityInfo\.isReduceMotionEnabled/);
  assert.match(accordion, /AVATAR_SIZE\.small\s*\+\s*DS_SPACING\[600\]/);
  assert.match(accordion, /React\.cloneElement/);
  assert.doesNotMatch(accordion, /ScrollView/);
});

test('ListItem supports semantic title roles and an indicator inside its row press target', () => {
  const listItem = read(LIST_ITEM_COMPONENT_PATH);
  assert.match(listItem, /titleRole\?:\s*'body'\s*\|\s*'label'/);
  assert.match(listItem, /rowIndicator\?:\s*ReactNode/);
  assert.match(listItem, /expanded\?:\s*boolean/);
  assert.match(listItem, /accessibilityState=\{\{\s*disabled,\s*selected,\s*expanded\s*\}\}/);
  assert.match(listItem, /accessibilityElementsHidden/);
  const rowMainStart = listItem.indexOf('const mainContent');
  const pressableEnd = listItem.indexOf('</Pressable>');
  const indicator = listItem.indexOf('{rowIndicator');
  assert.ok(rowMainStart < indicator && indicator < pressableEnd, 'rowIndicator must stay inside the header Pressable');
});

// Controller correction (accordion accessibility, 2026-09-28): browser DOM inspection of the
// rendered AccordionList catalog found three coupled defects in ListItem, all of which break the
// header's approved "one button, whole header tappable, expanded/collapsed announced" contract.
test('Correction (accordion accessibility, 2026-09-28): ListItem exposes an explicit aria-expanded on its own row Pressable, since react-native-web does not translate accessibilityState.expanded into aria-expanded on its own', () => {
  const implSrc = read(LIST_ITEM_COMPONENT_PATH);
  const pressableBlock = implSrc.match(/if\s*\(isInteractive\)\s*\{[\s\S]*?<Pressable[\s\S]*?<\/Pressable>[\s\S]*?\}/);
  assert.ok(pressableBlock, 'expected a Pressable branch guarded by isInteractive');
  // Preserved from the original contract.
  assert.match(pressableBlock[0], /accessibilityState=\{\{\s*disabled,\s*selected,\s*expanded\s*\}\}/);
  // The actual fix: same escape-hatch convention as HermesReferenceDetails' own DisclosureTrigger —
  // an explicit `aria-expanded` prop is required because react-native-web's accessibility-prop
  // mapping has no case for `accessibilityState.expanded`.
  assert.match(
    pressableBlock[0],
    /aria-expanded=\{expanded\}/,
    'expected an explicit aria-expanded prop wired to the row\'s own expanded state, living on the row\'s Pressable itself',
  );
});

test('Correction (accordion accessibility, 2026-09-28): a disabled row with onPress still renders as a real, disabled button, rather than being demoted to a plain non-interactive View', () => {
  const implSrc = read(LIST_ITEM_COMPONENT_PATH);
  const pressableBlock = implSrc.match(/if\s*\(isInteractive\)\s*\{[\s\S]*?<Pressable[\s\S]*?<\/Pressable>[\s\S]*?\}/);
  assert.ok(pressableBlock, 'expected a Pressable branch guarded by isInteractive');
  assert.match(
    pressableBlock[0],
    /disabled=\{disabled\}/,
    'expected the row\'s real disabled state passed to the Pressable itself, so it cannot activate while still exposing disabled button semantics — not merely folded into accessibilityState while the row falls back to a plain View',
  );
});

test('Correction (accordion accessibility, 2026-09-28): the row-selecting Pressable owns the row\'s visible vertical padding and minimum touch-target height, not just the non-interactive outer wrapper', () => {
  const implSrc = read(LIST_ITEM_COMPONENT_PATH);
  const rowMainStyleMatch = implSrc.match(/rowMain:\s*\{([\s\S]*?)\n {2}\},/);
  assert.ok(rowMainStyleMatch, 'expected a rowMain style block');
  assert.match(
    rowMainStyleMatch[1],
    /paddingVertical:\s*DS_SPACING\[800\]/,
    'expected the Pressable itself to own the row\'s vertical padding, so its own hit rectangle matches the full visible row height',
  );
  assert.match(
    rowMainStyleMatch[1],
    /minHeight:\s*DS_A11Y_MIN_TOUCH_TARGET/,
    'expected the Pressable itself to guarantee the 44pt minimum touch-target height',
  );
});

test('Correction (accordion accessibility, 2026-09-28): the decorative row indicator (e.g. the accordion chevron) is explicitly hidden from the web accessibility tree, not just native', () => {
  const implSrc = read(LIST_ITEM_COMPONENT_PATH);
  // Preserved native hiding.
  assert.match(implSrc, /accessibilityElementsHidden/);
  assert.match(implSrc, /importantForAccessibility="no-hide-descendants"/);
  // The actual fix: `accessibilityElementsHidden`/`importantForAccessibility` are native-only —
  // react-native-web needs its own explicit `aria-hidden` so the chevron can never surface as a
  // separate accessibility element in the browser catalog.
  assert.match(
    implSrc,
    /aria-hidden/,
    'expected an explicit web aria-hidden on the decorative row-indicator wrapper',
  );
});

test('Accordion List is registered in Components — Hermex as available, not adopted', () => {
  const sections = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(sections, 'Accordion List');
  assert.match(sections, /label: 'Components'[\s\S]*'Accordion List'/);
  assert.match(section, /available/i);
  assert.doesNotMatch(section, /status:\s*ADOPTED_STATUS/);
  assert.match(section, /HermesMobile\/Features\/Shared\/AccordionList\.swift/);
  assert.doesNotMatch(section, /SessionListView\.swift|SessionListComponents\.swift/);
});

test('Accordion List gallery covers both appearances, all separators, expansion modes, and hierarchy', () => {
  const previews = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previews, 'AccordionListFamilyGallery');
  for (const value of ['card', 'cardless', 'none', 'betweenRows', 'topAndBottom', 'all', 'single', 'multiple']) {
    assert.match(body, new RegExp(value));
  }
  assert.match(body, /Loading sessions/);
  assert.match(body, /No sessions/);
  assert.match(body, /Show all sessions/);
  assert.match(body, /Header titles use label typography/);
});

// ─── #607 follow-up: card padding, chevron size, divider alignment, and motion ──────────────────

test('AccordionList composes the shared catalog Card component for its card appearance, rather than hand-reconstructed chrome', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(accordion, /import\s*\{[^}]*\bCard\b[^}]*\}\s*from\s*'\.\.\/Card'/, 'expected AccordionList to import the shared Card component');
  assert.match(accordion, /<Card[^>]*surface="outlined"/s, 'expected the card appearance to render an outlined Card');
  assert.doesNotMatch(
    accordion,
    /cardGroup:\s*\{[^}]*borderWidth/s,
    'expected card chrome (border/background/radius) to come from Card, not a hand-rolled cardGroup style',
  );
});

test('AccordionList card appearance keeps Card\'s 16pt horizontal content padding (DS_SPACING[800]) without doubling ListItem\'s own vertical padding', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(
    accordion,
    /paddingVertical:\s*0/,
    'expected the Card composition to zero out Card\'s own vertical padding, since ListItem rows already own their vertical rhythm',
  );
});

test('AccordionList cardless appearance adds no Accordion-level horizontal outer padding', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.doesNotMatch(
    accordion,
    /cardlessStack:\s*\{[^}]*padding/s,
    'expected the cardless stack to carry no Accordion-level horizontal outer padding',
  );
});

test('AccordionList header chevron uses the 20pt (md) icon-size step, not the 16pt (sm) default', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  const chevronBlock = accordion.match(/<AnimatedChevron[\s\S]*?\/>/);
  assert.ok(chevronBlock, 'expected an AnimatedChevron element');
  assert.match(chevronBlock[0], /size=\{DS_ICON_SIZE\.md\}/, 'expected the accordion header chevron to opt into the medium icon-size step');
});

test('AccordionList body-row dividers begin at the body row\'s actual text-content alignment (avatar width + header/body gap + ListItem\'s own horizontal inset), not full width', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(
    accordion,
    /AVATAR_SIZE\.small\s*\+\s*DS_SPACING\[600\]\s*\+\s*DS_SPACING\[400\]/,
    'expected the body-row divider inset to derive from the avatar width, the header/body gap, and ListItem\'s own horizontal inset',
  );
});

test('AccordionList hides a collapsed section\'s body rows from the accessibility tree (native and web) even though they stay mounted for the collapse animation', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(accordion, /accessibilityElementsHidden=\{!expanded\}/, 'expected collapsed body content hidden from native AT');
  assert.match(accordion, /importantForAccessibility=\{expanded \? 'auto' : 'no-hide-descendants'\}/);
  assert.match(accordion, /aria-hidden=\{!expanded\}/, 'expected an explicit web aria-hidden, matching ListItem\'s own escape-hatch convention for react-native-web');
});

test('AccordionList body expansion/collapse visibly animates using existing catalog motion tokens and respects Reduce Motion', () => {
  const accordion = read(ACCORDION_LIST_PATH);
  assert.match(accordion, /Animated\.timing/, 'expected a real Animated.timing-driven expand/collapse, not an instant mount/unmount');
  assert.match(accordion, /DS_MOTION_EASING\.standard/, 'expected the shared standard easing token, not a new one');
  assert.match(accordion, /useNativeDriver:\s*false/, 'expected a JS-driven animation so it also animates in the web preview, matching Banner\'s own collapse');
  assert.match(
    accordion,
    /reduceMotion\s*\?\s*0\s*:\s*DS_MOTION_DURATION\.base/,
    'expected the body collapse duration to respect Reduce Motion the same way the chevron already does',
  );
});

// ─── AI/human selection-guidance contract (#607 human/AI readiness) ─────────────────────────────
// Every current Hermex reference (token group, material, native-iOS pattern, component, pattern)
// must declare four exact structured fields — useWhen, avoidWhen, alternatives, adoptionStatus —
// visible under the exact human labels "Use when" / "Avoid when" / "Alternatives" / "Adoption
// status", and those same facts must survive into the plain-JSON manifest for AI/tool use.

test('types.ts declares the structured Hermex decision-contract fields: HermesAdoptionState (a closed vocabulary), HermesAlternative, HermesAdoptionStatus, and their presence on HermesReferenceMeta', () => {
  const typesSrc = read(TYPES_PATH);
  assert.match(typesSrc, /export type HermesAdoptionState\s*=/, 'expected an exported HermesAdoptionState union');
  for (const state of ['foundation-available', 'production-adopted', 'partially-adopted', 'native-platform', 'reference-only']) {
    assert.ok(typesSrc.includes(`'${state}'`), `expected HermesAdoptionState to include '${state}'`);
  }
  assert.match(typesSrc, /export interface HermesAlternative\s*\{/);
  assert.match(typesSrc, /export interface HermesAlternative[^}]*name:\s*string/s);
  assert.match(typesSrc, /export interface HermesAlternative[^}]*useWhen:\s*string/s);
  assert.match(typesSrc, /export interface HermesAdoptionStatus\s*\{/);
  assert.match(typesSrc, /export interface HermesAdoptionStatus[^}]*state:\s*HermesAdoptionState/s);
  assert.match(typesSrc, /export interface HermesAdoptionStatus[^}]*detail:\s*string/s);

  const metaMatch = typesSrc.match(/export interface HermesReferenceMeta\s*\{[\s\S]*?\n\}/);
  assert.ok(metaMatch, 'expected an exported HermesReferenceMeta interface');
  const meta = metaMatch[0];
  assert.match(meta, /useWhen\?:\s*string/);
  assert.match(meta, /avoidWhen\?:\s*string/);
  assert.match(meta, /alternatives\?:\s*HermesAlternative\[\]/);
  assert.match(meta, /adoptionStatus\?:\s*HermesAdoptionStatus/);
});

test('HermesReferenceDetails renders the four decision fields under their exact human labels, in the primary reading flow (never behind a Disclosure)', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  assert.match(detailsSrc, /Use when/);
  assert.match(detailsSrc, /Avoid when/);
  assert.match(detailsSrc, /Alternatives/);
  assert.match(detailsSrc, /Adoption status/);
  // "Primary reading flow" means outside any <Disclosure>...</Disclosure> pair — approximated here
  // by requiring the four labels to appear textually before the file's first Disclosure usage,
  // since both existing disclosures ("Where it appears", "Implementation notes") are rendered later.
  const firstDisclosureIdx = detailsSrc.indexOf('<Disclosure label=');
  assert.ok(firstDisclosureIdx > -1, 'expected at least one <Disclosure> in HermesReferenceDetails');
  for (const label of ['Use when', 'Avoid when', 'Alternatives', 'Adoption status']) {
    const idx = detailsSrc.indexOf(label);
    assert.ok(idx > -1 && idx < firstDisclosureIdx, `expected "${label}" to render before the first Disclosure, not gated behind one`);
  }
});

test('HermesReferenceDetails always renders the Alternatives field, falling back to a truthful "No direct alternative." note when an entry intentionally has an empty alternatives array, instead of hiding the field entirely', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  assert.match(
    detailsSrc,
    /No direct alternative\./,
    'expected a truthful fallback string for entries with an empty alternatives array',
  );
  assert.doesNotMatch(
    detailsSrc,
    /\{alternatives\.length > 0 \? \(\s*<DecisionField label="Alternatives">/,
    'expected the whole Alternatives DecisionField to no longer be gated behind alternatives.length > 0 — it must render unconditionally, with the fallback covering the empty case',
  );
});

test('SectionBlock no longer renders the superseded def.whenToUse "VS" note for a Hermex reference entry once it has migrated to the new useWhen/avoidWhen decision contract, avoiding rendering the same fact twice', () => {
  const sectionBlockSrc = read(SECTION_BLOCK_PATH);
  assert.match(
    sectionBlockSrc,
    /def\.whenToUse\s*&&\s*!def\.hermesReference\?\.useWhen/,
    'expected the Hermex supporting-content block to suppress the legacy whenToUse note once hermesReference.useWhen covers the same decision',
  );
});

// ─── Responsive three-column Hermex reference-details row ───────────────────────────────────────

test('HermesReferenceDetails renders exactly three lower supporting cards, in semantic order Decision & product context, Implementation notes, Accessibility, each a restrained card reusing existing catalog tokens (white surface, hairline border, CATALOG_RADIUS.sm, CATALOG_SPACE.lg padding) distinct from the upper specimen cards', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);

  const decisionIdx = detailsSrc.indexOf('Decision & product context');
  const implementationIdx = detailsSrc.indexOf('Implementation notes');
  const accessibilityIdx = detailsSrc.indexOf('Accessibility');
  assert.ok(decisionIdx > -1, 'expected a "Decision & product context" supporting-card heading');
  assert.ok(implementationIdx > -1, 'expected an "Implementation notes" supporting-card heading');
  assert.ok(accessibilityIdx > -1, 'expected an "Accessibility" supporting-card heading');
  assert.ok(
    decisionIdx < implementationIdx && implementationIdx < accessibilityIdx,
    'expected the three supporting cards in this exact order: Decision & product context, Implementation notes, Accessibility',
  );

  // Every human label the frozen scope requires stays discoverable in source.
  for (const label of ['Use when', 'Avoid when', 'Alternatives', 'Adoption status', 'Product context', 'Implementation notes', 'Accessibility']) {
    assert.ok(detailsSrc.includes(label), `expected the exact human label "${label}" in HermesReferenceDetails`);
  }

  assert.match(
    detailsSrc,
    /backgroundColor:\s*CATALOG_COLOR\.surface\b/,
    'expected the supporting cards to use the white CATALOG_COLOR.surface token, distinct from the upper specimen cards\' surfaceMuted',
  );
  assert.match(
    detailsSrc,
    /borderRadius:\s*CATALOG_RADIUS\.sm\b/,
    'expected the supporting cards to use CATALOG_RADIUS.sm, distinct from the upper specimen cards\' CATALOG_RADIUS.md',
  );
  assert.match(
    detailsSrc,
    /padding:\s*CATALOG_SPACE\.lg\b/,
    'expected the supporting cards to use CATALOG_SPACE.lg padding',
  );
  assert.match(
    detailsSrc,
    /borderColor:\s*CATALOG_COLOR\.borderHairline\b/,
    'expected the supporting cards to use a hairline border',
  );
  assert.doesNotMatch(detailsSrc, /CATALOG_RADIUS\.md/, 'the supporting cards must not reuse the upper specimen cards\' own radius token');
});

test('HermesReferenceDetails stacks its three supporting cards into one column, in the same semantic order, below CATALOG_NARROW_BREAKPOINT — reading the live viewport width the same way SectionBlock does', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  assert.match(detailsSrc, /import\s*\{[^}]*\buseWindowDimensions\b[^}]*\}\s*from\s*'react-native'/, 'expected useWindowDimensions imported from react-native');
  assert.match(
    detailsSrc,
    /import\s*\{[^}]*\bCATALOG_NARROW_BREAKPOINT\b[^}]*\}\s*from\s*'\.\.\/tokens'/,
    'expected CATALOG_NARROW_BREAKPOINT imported from the shared tokens module',
  );
  assert.match(detailsSrc, /width\s*<\s*CATALOG_NARROW_BREAKPOINT/, 'expected a narrow-viewport comparison against the shared breakpoint');
  assert.match(detailsSrc, /flexDirection:\s*'column'/, 'expected a column stack for the narrow-viewport supporting row');
});

test('HermesReferenceDetails no longer collapses Implementation notes behind a Disclosure — its status/source paths/notes/implementationContent are visible directly in their own card — while Where it appears remains an accessible disclosure (aria-expanded, focus treatment, animated chevron)', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  const referenceDetailsBody = extractFunctionBody(detailsSrc, 'HermesReferenceDetails');
  assert.doesNotMatch(
    referenceDetailsBody,
    /<Disclosure label="Implementation notes"/,
    'expected the section reference-details implementation to keep Implementation notes visible in its own card',
  );
  assert.match(referenceDetailsBody, /<Disclosure label="Where it appears"/, 'expected the Where it appears Disclosure to remain');
  assert.match(detailsSrc, /accessibilityRole="button"/);
  assert.match(detailsSrc, /accessibilityState=\{\{\s*expanded\s*\}\}/);
  assert.match(detailsSrc, /aria-expanded=\{expanded\}/);
  assert.match(detailsSrc, /<AnimatedChevron/);
  assert.match(detailsSrc, /triggerFocused/, 'expected the disclosure trigger to keep its focus-ring treatment');
});

test('HermesReferenceDetails accepts an accessibilityContent prop (the entry\'s accessibility guidance, with the existing truthful fallback already computed by SectionBlock) and renders it inside the Accessibility supporting card', () => {
  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  assert.match(
    detailsSrc,
    /accessibilityContent\??:\s*React\.ReactNode/,
    'expected HermesReferenceDetailsProps to declare an accessibilityContent: React.ReactNode prop (optionally with its own default, for the one non-SectionBlock caller)',
  );
  const accessibilityHeadingIdx = detailsSrc.indexOf('Accessibility');
  const propUsageIdx = detailsSrc.indexOf('accessibilityContent', accessibilityHeadingIdx);
  assert.ok(propUsageIdx > -1, 'expected accessibilityContent to be rendered after the Accessibility heading');
});

test('the catalog overview keeps its implementation-only evidence compact instead of inheriting empty Decision and Accessibility cards from section reference details', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const overviewBody = extractFunctionBody(sectionsSrc, 'HermesOverview');
  assert.doesNotMatch(
    overviewBody,
    /<HermesReferenceDetails/,
    'the overview is not a SectionDef reference entry and must not render the three-card section contract around implementation-only evidence',
  );
  assert.match(
    overviewBody,
    /<HermesOverviewImplementationDetails/,
    'expected overview-only evidence to use the compact implementation-details presentation',
  );

  const detailsSrc = read(HERMES_REFERENCE_DETAILS_PATH);
  assert.match(detailsSrc, /export function HermesOverviewImplementationDetails/);
  const compactBody = extractFunctionBody(detailsSrc, 'HermesOverviewImplementationDetails');
  assert.match(compactBody, /<Disclosure label="Implementation notes"/);
  assert.doesNotMatch(compactBody, /Decision & product context|Accessibility/);
});

test('manifest.ts supports an includeTokenGalleries option (default off, preserving the template catalog\'s existing component-only manifest) and carries the structured hermesReference decision fields through to plain JSON', () => {
  const manifestSrc = read('native/catalog/manifest.ts');
  assert.match(manifestSrc, /includeTokenGalleries/, 'expected an includeTokenGalleries option on buildComponentManifest');
  assert.match(manifestSrc, /tokenGallery\?:\s*boolean/, 'expected ComponentManifestEntry to expose its own tokenGallery flag');
  assert.match(manifestSrc, /hermesReference\?:/, 'expected ComponentManifestEntry to expose a hermesReference field');
  assert.match(manifestSrc, /useWhen\?:\s*string/);
  assert.match(manifestSrc, /avoidWhen\?:\s*string/);
  assert.match(manifestSrc, /alternatives:\s*HermesAlternative\[\]/);
  assert.match(manifestSrc, /adoptionStatus\?:\s*HermesAdoptionStatus/);
});

test('the Hermex catalog builds and exposes its own manifest (including Foundations token galleries, unlike the filtered-out default) directly inside the catalog, discoverable without leaving the default route', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /import\s*\{\s*buildComponentManifest\s*\}\s*from\s*'\.\.\/manifest'/, 'expected hermesSections.tsx to import buildComponentManifest');
  assert.match(sectionsSrc, /buildComponentManifest\(\s*hermesSections,\s*hermesNav,\s*\{\s*includeTokenGalleries:\s*true\s*\}\s*\)/, 'expected the Hermex manifest to be built with token galleries included');
  assert.match(sectionsSrc, /export function HermesManifest/, 'expected an exported HermesManifest component rendering the built manifest');

  const catalogSrc = hermesCatalogSource();
  assert.match(catalogSrc, /HermesManifest/, 'expected the manifest surface to actually be wired into the rendered Hermex catalog (e.g. inside the Overview), not just defined and unused');
});

// adoptionStatus is declared either inline ({ state: '...', detail: '...' }) or via one of the two
// shared shorthand constants (FOUNDATION_AVAILABLE_ADOPTION / PRODUCTION_ADOPTED_ADOPTION) that
// hermesSections.tsx defines for its two most common cases — both are read here.
const ADOPTION_SHORTHAND_STATE = {
  FOUNDATION_AVAILABLE_ADOPTION: 'foundation-available',
  PRODUCTION_ADOPTED_ADOPTION: 'production-adopted',
};
function extractAdoptionState(block) {
  const inlineMatch = block.match(/adoptionStatus:\s*\{\s*state:\s*'([^']+)',\s*detail:\s*'[^']+'/);
  if (inlineMatch) return inlineMatch[1];
  const shorthandMatch = block.match(/adoptionStatus:\s*(FOUNDATION_AVAILABLE_ADOPTION|PRODUCTION_ADOPTED_ADOPTION)/);
  if (shorthandMatch) return ADOPTION_SHORTHAND_STATE[shorthandMatch[1]];
  return undefined;
}

test('every current Hermex reference entry (Foundations token groups, Materials, Native iOS patterns, Components, and Patterns) declares useWhen, avoidWhen, a structured alternatives array, and an adoptionStatus with a closed-vocabulary state plus truthful detail', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const ids = [...src.matchAll(/^ {4}id: '([^']+)',/gm)].map((m) => m[1]);
  assert.ok(ids.length >= 30, `expected the full set of Hermex section ids, found ${ids.length}`);

  const ALLOWED_STATES = ['foundation-available', 'production-adopted', 'partially-adopted', 'native-platform', 'reference-only'];

  for (const id of ids) {
    const block = extractHermesSection(src, id);
    assert.match(block, /hermesReference:\s*\{/, `expected "${id}" to declare hermesReference`);
    assert.match(block, /useWhen:\s*'[^']+'/, `expected "${id}" to declare a non-empty hermesReference.useWhen`);
    assert.match(block, /avoidWhen:\s*'[^']+'/, `expected "${id}" to declare a non-empty hermesReference.avoidWhen`);
    assert.match(block, /alternatives:\s*\[/, `expected "${id}" to declare a structured hermesReference.alternatives array`);
    const state = extractAdoptionState(block);
    assert.ok(state, `expected "${id}" to declare adoptionStatus with a state and a non-empty detail`);
    assert.ok(
      ALLOWED_STATES.includes(state),
      `expected "${id}"'s adoptionStatus.state ("${state}") to be one of ${ALLOWED_STATES.join(', ')}`,
    );
  }
});

test('every declared alternatives entry is structured as { name, useWhen } rather than a single prose blob', () => {
  const src = read(HERMES_SECTIONS_PATH);
  // Non-greedy up to the *first* closing bracket — safe because no alternatives entry itself
  // contains a nested array, unlike the broader SectionDef object these are found inside.
  const alternativesBlocks = [...src.matchAll(/alternatives:\s*\[([\s\S]*?)\]/g)].map((m) => m[1]);
  assert.ok(alternativesBlocks.length > 0, 'expected at least one alternatives array in hermesSections.tsx');
  const nonEmptyBlocks = alternativesBlocks.filter((block) => block.trim().length > 0);
  assert.ok(nonEmptyBlocks.length > 0, 'expected at least one non-empty alternatives array (a real alternative exists for some entry)');
  for (const block of nonEmptyBlocks) {
    const entryCount = [...block.matchAll(/\{\s*name:/g)].length;
    assert.ok(entryCount > 0, `expected each non-empty alternatives array to contain at least one { name: ... } entry, got: ${block.slice(0, 120)}`);
    assert.match(block, /name:\s*'[^']+'/, 'expected each alternative entry to declare a name');
    assert.match(block, /useWhen:\s*'[^']+'/, 'expected each alternative entry to declare its own useWhen condition');
  }
});

test('the known Hermes Avatar and Pending Request decision-guidance gaps are closed with real useWhen/avoidWhen content, not merely present-but-empty fields', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const avatar = extractHermesSection(src, 'Hermes Avatar');
  assert.match(avatar, /useWhen:\s*'[^']{20,}'/);
  assert.match(avatar, /avoidWhen:\s*'[^']{20,}'/);
  assert.equal(extractAdoptionState(avatar), 'partially-adopted', 'expected Hermes Avatar to truthfully report a mixed adopted/foundation-only status, not a single blanket claim');

  const pendingRequest = extractHermesSection(src, 'Pending Request');
  assert.match(pendingRequest, /useWhen:\s*'[^']{20,}'/);
  assert.match(pendingRequest, /avoidWhen:\s*'[^']{20,}'/);
  assert.equal(extractAdoptionState(pendingRequest), 'production-adopted', 'expected Pending Request to keep its genuine, already-adopted production status');
});

test('adoptionStatus wording preserves the truthful availability-vs-adoption boundary — a foundation-only entry\'s adoptionStatus must never claim production adoption', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const ids = [...src.matchAll(/^ {4}id: '([^']+)',/gm)].map((m) => m[1]);
  for (const id of ids) {
    const block = extractHermesSection(src, id);
    if (/status:\s*FOUNDATION_ONLY_STATUS/.test(block)) {
      const state = extractAdoptionState(block);
      assert.ok(state, `expected "${id}" to declare adoptionStatus`);
      assert.notEqual(state, 'production-adopted', `"${id}" is foundation-only (no production call site) and must not declare adoptionStatus.state 'production-adopted'`);
    }
  }
});

test('AGENTS.md points agents to the canonical Design System guidance: the shared Swift foundation/component sources, the Hermex catalog, and its machine-readable manifest, and states catalog metadata changes travel with the shared API change', () => {
  const agentsSrc = read('../AGENTS.md');
  assert.match(agentsSrc, /## Design System/);
  assert.match(agentsSrc, /HermesMobile\/Config\//);
  assert.match(agentsSrc, /HermesMobile\/Features\/Shared\//);
  assert.match(agentsSrc, /design-system-catalog\//);
  assert.match(agentsSrc, /manifest/i);
  assert.match(agentsSrc, /same PR/i);
});

test('README.md no longer claims the default Hermex route uses the stale template-heavy main navigation, obsolete section names/counts, or a Manifest page that isn\'t actually on that route', () => {
  const readme = read('README.md');
  assert.doesNotMatch(readme, /Components — Hermex/, 'the two-top-level-prefix ("Components —" / "Tokens —") navigation is retired; README must not still describe it as the default route\'s nav');
  assert.doesNotMatch(readme, /Tokens — Hermex/);

  const hermesSectionIdx = readme.indexOf('## Hermex Design System catalog');
  assert.ok(hermesSectionIdx > -1, 'expected a "Hermex Design System catalog" section in README.md');
  const nextSectionIdx = readme.indexOf('\n## ', hermesSectionIdx + 1);
  const hermesSection = readme.slice(hermesSectionIdx, nextSectionIdx === -1 ? readme.length : nextSectionIdx);
  assert.doesNotMatch(
    hermesSection,
    /"Manifest" page/i,
    'the default Hermex route has no sidebar Manifest page; README\'s own Hermex section must not claim one (the template\'s separate ?catalog=template Manifest page is a different, still-accurate claim outside this section)',
  );
});

test('WHEN_TO_USE.md is a truthful Hermex decision guide: it explains the decision model and points to the structured source of truth rather than re-describing generic template-only components Hermex does not own', () => {
  const whenToUse = read('WHEN_TO_USE.md');
  assert.match(whenToUse, /Hermex/);
  assert.match(whenToUse, /hermesSections\.tsx|hermesReference/, 'expected WHEN_TO_USE.md to point at the structured Hermex source of truth');
  for (const templateOnly of ['SearchField', 'FieldContainer', 'PillRow', 'UnderlineTabs']) {
    assert.doesNotMatch(whenToUse, new RegExp(templateOnly), `WHEN_TO_USE.md must not still describe the generic template-only component "${templateOnly}", which Hermex does not own`);
  }
});

// ─── Semantic-guidance correction (Claude Fable review edd81c9d, 0 Critical / 10 Important /
// 14 Minor) ───────────────────────────────────────────────────────────────────────────────────
// Every test below pins one or more of that review's findings so the corrected useWhen/avoidWhen/
// alternatives content can never silently regress back to the reviewed defects.

// Generic brace-depth extractor for a nested object literal reachable only by a start pattern
// (e.g. `hermesReference: {`), unlike extractFunctionBody (which expects a `function name(...) {`
// header) or extractHermesSection (which is already scoped to one whole SectionDef).
function extractBraceBlock(src, startPattern) {
  const match = src.match(startPattern);
  assert.ok(match, `expected to find a block starting with ${startPattern}`);
  const start = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('unterminated block');
}

const extractHermesReferenceBlock = (sectionSrc) => extractBraceBlock(sectionSrc, /hermesReference:\s*\{/);

const extractAlternativeNames = (referenceBlockSrc) => {
  const match = referenceBlockSrc.match(/alternatives:\s*\[([\s\S]*?)\]/);
  assert.ok(match, 'expected an alternatives array');
  return [...match[1].matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]);
};

test('Hermex Colors routes semantic roles to their bound Apple Color, restricts non-500 ramp steps to contrast-validated pairings, and classifies semantic roles as documentation-only bindings rather than a fabricated Hermex Swift API', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermex Colors');
  const ref = extractHermesReferenceBlock(section);

  assert.match(ref, /Color\(\.label\)|Color\(\.secondarySystemBackground\)/, 'expected useWhen to route to a real bound Apple Color, not an invented semantic-color type');
  assert.match(ref, /500 step/, 'expected useWhen to name the 500 step for a brand/accent tint');
  assert.match(ref, /non-500/, 'expected avoidWhen to state the non-500 ramp-step restriction');
  assert.match(ref, /contrast validation|contrast-validated/i, 'expected avoidWhen to require contrast validation before consuming a non-500 step');
  assert.match(ref, /no Hermex semantic-color type exists|not a Swift API/, 'expected avoidWhen to disclaim a fabricated Hermex semantic-color Swift API');
  assert.doesNotMatch(ref, /semantic roles.{0,80}foundation-only/is, 'must not classify the semantic roles as an unshipped foundation-only Swift API — they are documentation-only platform-color bindings');
  assert.match(ref, /documentation-only/, 'expected the adoption detail to classify semantic roles as documentation-only bindings');
});

test('Adaptive Glass, Hermes Card, and Pending Request agree on one opaque approval/clarification surface: Pending Request\'s adopted pendingRequestCardSurface, never HermexCard\'s uncalled requestCardSurface', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const glass = extractHermesSection(src, 'Adaptive Glass');
  const glassRef = extractHermesReferenceBlock(glass);
  assert.ok(extractAlternativeNames(glassRef).includes('Pending Request'), 'expected Adaptive Glass to point an unconditionally-opaque approval surface at Pending Request, not at Hermes Card');
  assert.match(glassRef, /pendingRequestCardSurface|unconditionally opaque/, 'expected the Pending Request alternative to explain why (its adopted opaque surface)');

  const card = extractHermesSection(src, 'Hermes Card');
  const cardRef = extractHermesReferenceBlock(card);
  assert.doesNotMatch(cardRef, /Request Card for an approval/i, 'Hermes Card\'s own requestCardSurface has zero call sites — useWhen must not steer readers to it for approval/clarification work');
  assert.doesNotMatch(card, /Request Card for an approval/i, 'the top-level whenToUse prose duplicates useWhen and must be corrected the same way');
  assert.ok(extractAlternativeNames(cardRef).includes('Pending Request'), 'expected Hermes Card to point approval/clarification work at Pending Request');
  assert.match(cardRef, /Pending Request/, 'expected useWhen to route approval/clarification surfaces to the Pending Request pattern');
});

test('Hermes Banner and Hermes Toast never claim Toast self-dismisses; Toast\'s guidance and WHEN_TO_USE.md both state caller-owned dismissal', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const banner = extractHermesSection(src, 'Hermes Banner');
  assert.doesNotMatch(banner, /self-dismiss/i, 'HermexToast has no internal timer or auto-dismiss (HermexToast.swift); Banner must not describe it as self-dismissing');

  const toast = extractHermesSection(src, 'Hermes Toast');
  const toastRef = extractHermesReferenceBlock(toast);
  assert.doesNotMatch(toast, /self-dismiss/i);
  assert.match(toastRef, /caller owns|no auto-dismiss|clear it yourself/i, 'expected Toast\'s useWhen to state caller-owned dismissal');

  const whenToUse = read('WHEN_TO_USE.md');
  assert.doesNotMatch(whenToUse, /self-dismiss/i, 'WHEN_TO_USE.md must not claim Toast self-dismisses');
  assert.match(whenToUse, /caller dismisses/i, 'expected WHEN_TO_USE.md to state the caller owns Toast dismissal');
  // The exclusive-selection distinction (Checkbox vs Radio vs Segmented Control) must survive the edit.
  assert.match(whenToUse, /Segmented Control is also exclusive selection/);
});

test('ToastFamilyGallery adds a compact interactive motion specimen that toggles the generic catalog Toast\'s visible prop, replaying the top-edge slide + opacity transition, alongside the existing static semantic variants and trailing-action specimens', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /function ToastMotionDemo/);
  const demoBody = extractFunctionBody(previewsSrc, 'ToastMotionDemo');
  assert.match(demoBody, /useState/, 'expected the demo to own real toggle state, not a static prop');
  assert.match(demoBody, /onPress=\{\(\) => setVisible/, 'expected a real control that flips the toggle state');
  assert.match(demoBody, /visible=\{visible\}/, 'expected the demo to drive the generic Toast\'s own visible prop from that state');

  const galleryBody = extractFunctionBody(previewsSrc, 'ToastFamilyGallery');
  assert.match(galleryBody, /<ToastMotionDemo/, 'expected the motion demo wired into the existing Toast family gallery');
  // Existing static specimens must survive alongside the new interactive one.
  assert.match(galleryBody, /variant="success"/);
  assert.match(galleryBody, /variant="informational"/);
  assert.match(galleryBody, /variant="warning"/);
  assert.match(galleryBody, /variant="negative"/);
  assert.match(galleryBody, /action=\{\{ label: 'Undo'/);
});

test('Radio, Dropdown, and Segmented Control name each other as reciprocal alternatives, closing the exclusive-selection disambiguation gap WHEN_TO_USE.md already describes', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const radio = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Hermes Radio')));
  assert.ok(radio.includes('Segmented Control'), 'expected Radio to name Segmented Control');
  assert.ok(radio.includes('Hermes Dropdown'), 'expected Radio to name Hermes Dropdown');

  const dropdown = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Hermes Dropdown')));
  assert.ok(dropdown.includes('Hermes Radio'), 'expected Dropdown to name Hermes Radio');
  assert.ok(dropdown.includes('Segmented Control'), 'expected Dropdown to name Segmented Control');

  const segmented = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Segmented Control')));
  assert.ok(segmented.includes('Hermes Radio'), 'expected Segmented Control to name Hermes Radio');
  assert.ok(segmented.includes('Hermes Dropdown'), 'expected Segmented Control to name Hermes Dropdown');
});

test('List/ListItem, Row Divider, and Skeleton Loading state real selection boundaries instead of adoption disclaimers, and name their real neighbors (Card, Accordion List, native containers, Content Unavailable\'s spinner)', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const listItem = extractHermesSection(src, 'List / ListItem');
  const listItemRef = extractHermesReferenceBlock(listItem);
  assert.doesNotMatch(listItemRef, /avoidWhen:\s*'Avoid claiming it replaces/, 'avoidWhen must no longer be a pure adoption disclaimer');
  assert.match(listItemRef, /Card|Accordion List/, 'expected avoidWhen to state the real Card/Accordion List selection boundary');
  const listItemAlts = extractAlternativeNames(listItemRef);
  assert.ok(listItemAlts.includes('Hermes Card'), 'expected List/ListItem to name Hermes Card as an alternative');
  assert.ok(listItemAlts.includes('Accordion List'), 'expected List/ListItem to name Accordion List as an alternative');

  const divider = extractHermesSection(src, 'Row Divider');
  const dividerRef = extractHermesReferenceBlock(divider);
  assert.match(dividerRef, /HermexList|Accordion List/, 'expected avoidWhen to prohibit use inside a container that already owns separators');
  assert.ok(extractAlternativeNames(dividerRef).includes('List / ListItem'), 'expected Row Divider to name List / ListItem as an alternative');

  const skeleton = extractHermesSection(src, 'Skeleton Loading');
  const skeletonRef = extractHermesReferenceBlock(skeleton);
  assert.doesNotMatch(skeletonRef, /Catalog Shimmer/, 'Catalog Shimmer is not a choosable Hermex entry and must no longer be the sole alternative');
  assert.match(skeletonRef, /ProgressView|spinner|indeterminate/i, 'expected Skeleton Loading to route an indeterminate fetch to a spinner alternative');
});

test('Content Unavailable documents its real Swift .loading variant end-to-end: the variant prop type, a rendered Loading specimen, and a useWhen/avoidWhen that includes it and states the partial/transient-failure boundary', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  const ref = extractHermesReferenceBlock(section);

  assert.match(section, /type:\s*"'loading' \|/, 'expected the variant prop type union to lead with \'loading\'');
  assert.match(section, /key: 'loading'/, 'expected a rendered Loading variant specimen in the variants gallery');
  assert.match(ref, /loading/i, 'expected useWhen to mention the loading state');
  assert.match(ref, /Toast or Banner/, 'expected avoidWhen to route a transient failure while content remains visible to Toast/Banner, not this pattern');

  assert.match(src, /'loading'\s*\|\s*'empty'\s*\|\s*'noResults'/, 'expected CONTENT_UNAVAILABLE_COPY (or its type) to include a loading key');
  assert.match(src, /variant === 'loading'/, 'expected the ContentUnavailablePreview reconstruction to render a distinct loading (spinner-only) branch');
});

test('Buttons states a real component-owned-chrome/file-link avoidWhen (not adoption-only), names its production/Inline-Reference-Link alternatives, and its whenToUse sentence about Yes/No/Approve/Deny no longer contradicts itself', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Buttons');
  const ref = extractHermesReferenceBlock(section);

  assert.match(ref, /Inline Reference Link/, 'expected avoidWhen or alternatives to name Inline Reference Link for a tappable file reference');
  const alts = extractAlternativeNames(ref);
  assert.ok(alts.some((n) => /ChatTactileButtonStyle|ChatDecisionButtonStyle/.test(n)), 'expected Buttons to name its real production analog as an alternative');
  assert.ok(alts.includes('Inline Reference Link'), 'expected Inline Reference Link as a structured alternative');

  assert.doesNotMatch(
    section,
    /only needs Reduce-Motion-safe press feedback, including for a Yes\/No\/Approve\/Deny-style choice, which uses \.hermex\(_:emphasis:\) directly/,
    'the whenToUse sentence must no longer contradict itself about which style a Yes/No/Approve/Deny choice uses',
  );
  assert.match(section, /Yes\/No\/Approve\/Deny choice uses \.hermex\(_:emphasis:\)/, 'expected a standalone, non-contradictory sentence stating which style a decision choice uses');
});

test('Checkbox names native Toggle (never the nonexistent "Switch"), and its alternatives cover every control avoidWhen names', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Checkbox');
  const ref = extractHermesReferenceBlock(section);

  assert.doesNotMatch(section, /use Switch/, 'Switch is not a Hermex entry or a SwiftUI control');
  assert.match(section, /native Toggle/, 'expected Checkbox to name the real SwiftUI control, Toggle');

  const alts = extractAlternativeNames(ref);
  for (const expected of ['Native Toggle', 'List / ListItem', 'Segmented Control', 'Hermes Radio', 'Tag']) {
    assert.ok(alts.includes(expected), `expected Checkbox alternatives to include "${expected}"`);
  }
});

test('Disclosure Row, Search, and Attachment name the design-time neighbors their own avoidWhen/description already implies', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const disclosure = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Disclosure Row')));
  assert.ok(disclosure.includes('Accordion List'), 'expected Disclosure Row to name Accordion List (Accordion List already names Disclosure Row)');
  assert.ok(disclosure.some((n) => /TranscriptLogRowView/.test(n)), 'expected Disclosure Row to name its adopted production analog');

  const search = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Search')));
  assert.ok(search.includes('Text Input'), 'expected Search to name Text Input for an inline filter field');

  const attachment = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Attachment')));
  assert.ok(attachment.includes('Inline Reference Link'), 'expected Attachment to name Inline Reference Link for a tappable file name');
});

test('Pending Request, Transcript Activity, Composer, and Hermex Font state real boundaries/conditions instead of an adoption note, a cross-reference, or a circular restatement', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const pendingRequest = extractHermesReferenceBlock(extractHermesSection(src, 'Pending Request'));
  assert.doesNotMatch(pendingRequest, /avoidWhen:\s*'Avoid reaching for the new, unadopted Buttons family/, 'avoidWhen must state a boundary on the surfaces themselves, not a Buttons-adoption note');
  assert.match(pendingRequest, /needs no user response/i, 'expected avoidWhen to state the real boundary: content needing no user response belongs on a general card');

  const transcript = extractHermesSection(src, 'Transcript Activity');
  const transcriptRef = extractHermesReferenceBlock(transcript);
  assert.doesNotMatch(transcriptRef, /useWhen:\s*'Use it to understand how a transcript turn\\'s collapsible pieces relate to one another\.'/, 'useWhen must become an actionable rule, not "understand how ... relate"');
  assert.match(transcriptRef, /TranscriptLogRowView/, 'expected useWhen to point implementers at TranscriptLogRowView for any individual row');
  assert.match(transcriptRef, /one collapsible row/i, 'expected the Disclosure Row alternative to state a real condition, not a bare cross-reference');

  const composer = extractAlternativeNames(extractHermesReferenceBlock(extractHermesSection(src, 'Composer')));
  assert.ok(composer.includes('Text Input'), 'expected Composer to name Text Input for a field outside the chat composer');

  const font = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Font'));
  assert.doesNotMatch(font, /useWhen:\s*'Reach for a named Hermex Typography role — the role alone decides weight and design\.'/, 'useWhen must stop restating Typography\'s own rule');
  assert.ok(extractAlternativeNames(font).includes('Hermex Typography'), 'expected Font to point to Typography for choosing a role');
});

test('The five foundation token groups (Spacing, Radius & Geometry, Motion, Shadow, Iconography) state a real avoidWhen boundary instead of only an adoption disclaimer', () => {
  const src = read(HERMES_SECTIONS_PATH);

  const spacing = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Spacing'));
  assert.match(spacing, /HermesUsageSize|HermesAttachmentSize/, 'expected Spacing avoidWhen to route component-owned fixed geometry away from the spacing scale');
  assert.match(spacing, /named exception/i, 'expected Spacing avoidWhen to require a named exception for an off-scale value');

  const radius = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Radius & Geometry'));
  assert.match(radius, /Capsule\(\)/, 'expected Radius & Geometry avoidWhen to route a fully rounded edge to Capsule()');
  assert.match(radius, /ChatComposerMetrics|TranscriptLogRowMetrics|AdaptiveReadableContentWidth/, 'expected avoidWhen to name the feature-scoped geometry that stays outside the scale');

  const motion = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Motion'));
  assert.match(motion, /feedbackPress/, 'expected Motion avoidWhen to point at a real named Bundle case');
  assert.match(motion, /one-off spring/i, 'expected Motion avoidWhen to prohibit a one-off spring literal');

  const shadow = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Shadow'));
  assert.match(shadow, /eight roles/i, 'expected Shadow avoidWhen to point at the named-role scale');
  assert.match(shadow, /Outlined Card/, 'expected Shadow avoidWhen to prohibit a shadow on the no-elevation Outlined Card');

  const icon = extractHermesReferenceBlock(extractHermesSection(src, 'Hermex Iconography'));
  assert.match(icon, /literal point size/i, 'expected Iconography avoidWhen to prohibit a literal point size on a new SF Symbol');
  assert.match(icon, /HermesIconSize/, 'expected Iconography avoidWhen to route to the named HermesIconSize scale instead');
});

test('every alternative name across every Hermex catalog entry resolves to a real entry id/displayName or an explicit reviewed native/platform/production allowlist — never a nonexistent control or a non-choosable catalog artifact', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const ids = [...src.matchAll(/^ {4}id: '([^']+)',/gm)].map((m) => m[1]);
  assert.ok(ids.length >= 34, 'expected at least the 34 known Hermex entries');

  const validNames = new Set();
  for (const id of ids) {
    validNames.add(id);
    const block = extractHermesSection(src, id);
    const displayNameMatch = block.match(/displayName:\s*'([^']+)'/);
    if (displayNameMatch) validNames.add(displayNameMatch[1]);
  }

  // Explicit, reviewed allowlist: real native/platform/production analogs that are intentionally
  // not their own catalog entry (see WHEN_TO_USE.md's adoptionStatus guidance) — never grown to
  // launder a name that should instead resolve to a real entry.
  const EXTERNAL_ALTERNATIVE_ALLOWLIST = new Set([
    'SectionCard / SettingsCard (production)',
    'MessageBubbleView / ChatComposerAttachmentStripView (production)',
    'Native Divider (production)',
    'Native List row (production)',
    'Native Toggle',
    'Native navigation title',
    'ChatTactileButtonStyle / ChatDecisionButtonStyle (production)',
    'TranscriptLogRowView (production)',
    'Native ContentUnavailableView',
    'Native NavigationLink / .navigationDestination (production)',
  ]);

  let checkedCount = 0;
  for (const id of ids) {
    const block = extractHermesSection(src, id);
    const ref = extractHermesReferenceBlock(block);
    const names = extractAlternativeNames(ref);
    for (const name of names) {
      checkedCount += 1;
      assert.ok(
        validNames.has(name) || EXTERNAL_ALTERNATIVE_ALLOWLIST.has(name),
        `alternative "${name}" in "${id}" does not resolve to a real catalog entry id/displayName, nor is it on the reviewed native/production allowlist`,
      );
    }
  }
  assert.ok(checkedCount > 15, 'expected the majority of Hermex entries to carry at least one alternative to validate');
});
