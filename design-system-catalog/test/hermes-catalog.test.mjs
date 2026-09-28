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

// The catalog route (HermesDesignSystemCatalog.tsx) assembles nav/sections; the actual Phase 0
// audit data (ids, groups, per-entry metadata, evidence status) lives in hermesSections.tsx, which
// it imports — together they're "the Hermex catalog" these assertions check against. Concatenated
// in the combined nav's real runtime order (hermesNav's groups, then the template groups the
// catalog route re-labels) so an order assertion over the joined text matches the actual sidebar.
const hermesCatalogSource = () => read(HERMES_SECTIONS_PATH) + '\n' + read(HERMES_CATALOG_PATH);

test('Hermex catalog file exists and exports the combined catalog component', () => {
  assert.ok(existsSync(path.join(ROOT, HERMES_CATALOG_PATH)), `${HERMES_CATALOG_PATH} should exist`);
  assert.ok(existsSync(path.join(ROOT, HERMES_SECTIONS_PATH)), `${HERMES_SECTIONS_PATH} should exist`);
  const src = read(HERMES_CATALOG_PATH);
  assert.match(src, /export function HermesDesignSystemCatalog/);
  assert.match(src, /title="Hermex Design System"/);
});

test('every Hermex-owned nav group begins with an approved taxonomy prefix, including a separate Native iOS group', () => {
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

  const catalogSrc = read(HERMES_CATALOG_PATH);
  // The template groups are re-labeled programmatically (a template literal / computed string), not
  // as a list of literal labels — so this pins down the two literal prefixes that computation must
  // produce, rather than executing the .tsx to observe the resulting array.
  assert.match(
    catalogSrc,
    /`Components — Template library \(not adopted\) · \$\{group\.label\}`/,
    'expected the non-token template groups to be re-labeled under the "Components —" prefix',
  );
  assert.match(
    catalogSrc,
    /'Tokens — Template library \(not adopted\)'/,
    'expected the template\'s own "Tokens" group to be re-labeled under the "Tokens —" prefix',
  );
});

test('sidebar order places Native iOS before Hermex Components and Patterns', () => {
  const catalogSrc = read(HERMES_CATALOG_PATH);
  // Scoped to the `nav` array's own assembly, not the whole file — `templateComponentGroups` etc.
  // are also declared earlier in the file, so searching the whole source would match those
  // declarations instead of their actual position inside the combined `nav` array.
  const navBlockMatch = catalogSrc.match(/const nav: NavGroup<HermesCatalogSectionId>\[\] = \[[\s\S]*?\];/);
  assert.ok(navBlockMatch, `expected a "const nav: NavGroup<HermesCatalogSectionId>[] = [...]" assembly in ${HERMES_CATALOG_PATH}`);
  const navBlock = navBlockMatch[0];
  const required = [
    "hermesNav.filter((group) => group.label.startsWith('Foundations'))",
    "hermesNav.filter((group) => group.label.startsWith('Materials'))",
    "hermesNav.filter((group) => group.label.startsWith('Native iOS'))",
    "hermesNav.filter((group) => group.label.startsWith('Components'))",
    "hermesNav.filter((group) => group.label.startsWith('Patterns'))",
    'templateComponentGroups',
    'templateTokenGroups',
  ];
  const positions = required.map((needle) => {
    const i = navBlock.indexOf(needle);
    assert.notEqual(i, -1, `expected "${needle}" while assembling the combined nav in ${HERMES_CATALOG_PATH}`);
    return i;
  });
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i] > positions[i - 1], `"${required[i]}" should be assembled after "${required[i - 1]}"`);
  }
});

test('no disposition-named ("Verified foundations" / "Migration candidates" / "Conditional / retained") group labels remain, and there is no separate "Overview" sidebar group', () => {
  const src = hermesCatalogSource();
  for (const stale of ['Hermex — Verified foundations', 'Hermex — Migration candidates', 'Hermex — Conditional / retained', "label: 'Overview'"]) {
    assert.ok(!src.includes(stale), `did not expect the retired group label/pattern "${stale}" to still appear`);
  }
});

test('native iOS controls stay separate while the custom Segmented Control lives in Components — Hermex', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlock = src.match(/export const hermesNav:[^;]*;/s)?.[0] ?? '';

  assert.match(navBlock, /label: 'Native iOS — Hermex'/);
  assert.match(navBlock, /ids: \['Search', 'Hermes TopNav'\]/);
  assert.match(navBlock, /label: 'Components — Hermex'[\s\S]*'Segmented Control'/);
  assert.doesNotMatch(src, /Hermex Segmented Control|Hermes Segmented Control/);

  const search = extractHermesSection(src, 'Search');
  assert.match(search, /\.searchable/);
  assert.match(search, /native/i);

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

test('every original template nav group (from CatalogExample.tsx) is still reachable and every re-labeled template group says "not adopted"', () => {
  const templateSrc = read(CATALOG_EXAMPLE_PATH);
  const templateNavBlockMatch = templateSrc.match(/export const nav:[^;]*;/s);
  assert.ok(templateNavBlockMatch, 'expected an exported nav array in CatalogExample.tsx');
  const originalLabels = [...templateNavBlockMatch[0].matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(originalLabels.length >= 10, `expected the template's own full set of nav groups, found ${originalLabels.length}`);

  const catalogSrc = read(HERMES_CATALOG_PATH);
  // The re-labeling is computed (a template literal keyed on `group.label`), so every one of the
  // template's own original labels is still threaded through unchanged into the new label — this
  // confirms the source re-labels by appending, never by replacing/dropping the original name.
  assert.match(catalogSrc, /· \$\{group\.label\}/, 'expected the Components re-label to preserve the original group label verbatim');
  assert.match(catalogSrc, /'not adopted'|\(not adopted\)/i, 'expected "not adopted" to appear in the re-labeling logic');
  assert.match(catalogSrc, /Components — Template library \(not adopted\)/);
  assert.match(catalogSrc, /Tokens — Template library \(not adopted\)/);
  // Manifest is a component-documentation page (not raw token data) — its original "Reference" group
  // must fall on the Components side, not be dropped or moved under Tokens.
  assert.ok(originalLabels.includes('Reference'), 'expected the template\'s Manifest page to still live under its own "Reference" nav group');
  assert.match(
    catalogSrc,
    /templateComponentGroups[\s\S]*?filter\(\(group\) => group\.label !== TEMPLATE_TOKENS_LABEL\)/,
    'expected every non-"Tokens" original template group (including "Reference"/Manifest) to be routed under the Components prefix',
  );
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

test('catalog implementation status names the current issue branch, is versioned in-repository, and does not claim there is no pushed implementation branch', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.match(src, /issue\/607-shared-design-system/);
  assert.doesNotMatch(src, /chore\/production-token-adoption|9faf1f7|no pushed implementation branch/);
  assert.match(src, /contains the verified issue work and the current migration candidate/i);
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
  assert.match(src, /No pull request, TestFlight upload, release, or deployment/i);
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

test('SectionBlock uses the approved two-column documentation hierarchy: wide Variants/States primary column, narrow Props/Accessibility secondary column', () => {
  const src = read(SECTION_BLOCK_PATH);

  assert.match(
    src,
    /const primaryBlocks: BlockDef\[\] = \[[\s\S]*label: 'Variants'[\s\S]*label: 'States \/ Configurations'/,
    'expected Variants and States / Configurations to stack in the primary column',
  );
  assert.match(
    src,
    /const secondaryBlocks: BlockDef\[\] = \[[\s\S]*label: 'Props'[\s\S]*label: 'Accessibility'/,
    'expected Props and Accessibility to stack in the secondary column',
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
  const tokensGroupMatch = navBlockMatch[0].match(/label:\s*'Foundations — Hermex',\s*\n\s*ids:\s*\[([^\]]*)\]/);
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

test('ContentUnavailableView cites production files + source references, not literal "call sites"', () => {
  const src = hermesCatalogSource();
  assert.doesNotMatch(
    src,
    /28 call sites/i,
    'ContentUnavailableView must not claim "28 call sites" — the verified count is 28 production files / 66 source references, not 28 literal call sites',
  );
  assert.match(src, /28 production files/i, 'ContentUnavailableView should cite 28 production files');
  assert.match(src, /66 source references/i, 'ContentUnavailableView should cite 66 source references');
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

// Correction (2026-09-26 catalog/production reconciliation): the outer Request Card surface was
// promoted from a chat-local pendingRequestCardSurface(cornerRadius:) into HermesCard.swift as
// requestCardSurface(cornerRadius:material:), with a RequestCardMaterial enum (.opaque default,
// .translucentOverScrim for the approval overlay's own scrim case) — and ApprovalRequestOverlay
// became a fourth real caller alongside the three already-covered above.
test('Correction (production reconciliation): Pending Request documents the promoted requestCardSurface(cornerRadius:material:) in HermesCard.swift, its RequestCardMaterial.translucentOverScrim exception, and ApprovalRequestOverlay as a caller', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Pending Request');
  assert.match(section, /requestCardSurface\(cornerRadius:material:\)/);
  assert.doesNotMatch(section, /pendingRequestCardSurface\(cornerRadius:\)/, 'pendingRequestCardSurface(cornerRadius:) was promoted/renamed into HermesCard.swift\'s requestCardSurface(cornerRadius:material:)');
  assert.match(section, /RequestCardMaterial/);
  assert.match(section, /\.opaque/);
  assert.match(section, /translucentOverScrim/);
  assert.match(section, /ApprovalRequestOverlay/);
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesCard\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ApprovalRequestOverlay\.swift/);
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

// Finding 5: the default computed subtitle ("Hermex · 59 components & tokens") merges 12 actually-
// audited Hermex entries with 47 un-audited retained template references into one misleading number.
// CatalogShell gains an optional override; only the Hermex route uses it — generic routes (the
// template's own two catalogs) keep the plain computed default.
test('CatalogShell accepts an optional subtitle override; the Hermex route states its corrected component/token count after the AppFont split and Adaptive Glass move, and generic routes keep the computed default', () => {
  const shellSrc = read(CATALOG_SHELL_PATH);
  assert.match(shellSrc, /subtitle\?:\s*string/, 'expected CatalogShell to accept an optional subtitle override prop');

  const catalogSrc = read(HERMES_CATALOG_PATH);
  assert.match(catalogSrc, /subtitle="Hermex · 21 visual references · token coverage in overview · 47 template references"/);

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

  assert.match(catalogSrc, /subtitle="Hermex · 21 visual references · token coverage in overview · 47 template references"/);
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

test('Card documents HermesCard as the chrome owner and SectionCard as a composition over it', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Card');

  assert.match(section, /HermesCard\.swift owns the canonical Card chrome/);
  assert.match(section, /SectionCard.*composition.*delegates.*HermesCard/is);
  assert.match(section, /outlined.*system background.*separator/is);
});

test('Avatar broadens Identity Avatar into the umbrella while keeping the original approved introduction verbatim and cross-referencing the separately-implemented bot-face system', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(src, /id:\s*'Identity Avatar'/, 'the id must be renamed, not left alongside a new duplicate');
  const section = extractHermesSection(src, 'Hermes Avatar');
  assert.match(
    section,
    /Colored initials identify the active server or account\. In the Sessions header, the same control changes into a close button while search is open\./,
    'the original approved introduction must survive verbatim inside the broadened description',
  );
  assert.match(section, /bot-face system covers static, animated, and interactive bot identity/i);
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

test('Row Divider documents the shared SwiftUI HermesDivider and component-owned opacity', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Row Divider');
  assert.match(section, /HermesDivider/);
  assert.match(section, /No global free-floating opacity token/);
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesDivider\.swift/);
  assert.match(section, /HermesMobile\/Features\/Settings\/SettingsView\.swift/);
  assert.match(section, /HermesMobile\/Features\/Shared\/SectionCard\.swift/);
  assert.match(section, /<HermexDividerPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function HermexDividerPreview/);
});

test('Tag is display-only, documents every StatusCapsule.Size and its six migrated production call sites, and cross-references Inline Reference Link for the interactive counterpart', () => {
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
  assert.match(section, /HermesMobile\/Features\/Shared\/StatusCapsule\.swift/);
  for (const callSite of [
    'HermesMobile/Features/SessionList/SessionListItem.swift',
    'HermesMobile/Features/Tasks/TasksView.swift',
    'HermesMobile/Features/Workspace/GitWorkspaceView.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Settings/SettingsView.swift',
  ]) {
    assert.ok(section.includes(callSite), `expected migrated call site ${callSite}`);
  }
  assert.doesNotMatch(section, /SessionRowView\.swift/, 'SessionSourceBadge/SessionRowStateBadge now live in SessionListItem.swift, not the retired SessionRowView.swift');
  assert.match(section, /SessionSourceBadge/);
  assert.match(section, /SessionRowStateBadge/);
  assert.match(section, /StatusBadge/);
  assert.match(section, /GitStatusChip/);
  assert.match(section, /ProfileStatusBadge/);
  assert.match(section, /SettingsStatusPill/);
  assert.match(section, /<TagGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function TagGallery/);
  assert.doesNotMatch(previewsSrc, /export function StatusCapsuleGallery/);
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

test('Buttons documents every HermesButtonPressOnlyStyle.Chrome case and every HermesButtonEmphasis value, names the shared applyingHermesButtonPressFeedback helper and optional haptics, and is cross-referenced from Pending-Request Surface', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Buttons');
  for (const chrome of ['.icon', '.compactControl', '.capsule', '.card', '.thumbnail']) {
    assert.ok(section.includes(chrome), `expected HermesButtonPressOnlyStyle.Chrome case ${chrome}`);
  }
  for (const emphasis of ['.primary', '.secondary', '.destructive']) {
    assert.ok(section.includes(emphasis), `expected HermesButtonEmphasis value ${emphasis}`);
  }
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesButton\.swift/, 'expected the current, unified Buttons source file');
  assert.doesNotMatch(section, /ChatTactileButtonStyle\.swift|ChatDecisionButtonStyle\.swift/, 'the retired per-family source files must not be cited as current evidence');
  assert.match(section, /applyingHermesButtonPressFeedback/, 'expected the one shared press-feedback helper both ButtonStyles call');
  assert.match(section, /haptic/i, 'expected optional, opt-in haptics to be documented');
  assert.match(section, /Reduce Motion/);
  assert.match(section, /<ButtonDecisionAndTactilePreview/);

  // Historical names may still appear, but only inside one explicitly historical migration note —
  // find that note (containing the word "Historical") and require every retired name inside it.
  const historicalNoteMatch = section.match(/'[^']*Historical[^']*'/s);
  assert.ok(historicalNoteMatch, 'expected one note string containing the word "Historical"');
  const historicalNote = historicalNoteMatch[0];
  for (const retiredName of ['ChatTactileButtonStyle', '.chatTactile', 'ChatDecisionButtonStyle', '.chatDecision']) {
    assert.ok(historicalNote.includes(retiredName), `expected the historical migration note to name ${retiredName}`);
  }
  // Every other appearance of a retired name, outside that one note, is disallowed.
  const outsideHistoricalNote = section.replace(historicalNote, '');
  assert.doesNotMatch(outsideHistoricalNote, /ChatTactileButtonStyle|\.chatTactile\(|ChatDecisionButtonStyle|\.chatDecision\(/, 'retired names must appear only inside the one historical migration note');

  const pendingRequestSection = extractHermesSection(src, 'Pending Request');
  assert.match(pendingRequestSection, /Buttons/, 'expected Pending-Request Surface to cross-reference the Button family for its decision controls');
  assert.doesNotMatch(pendingRequestSection, /\.chatTactile\(|\.chatDecision\(/, 'Pending Request must reference the current .hermes(...)/.hermesPressOnly(...) call sites, not the retired modifiers');

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function ButtonDecisionAndTactilePreview/);
  const body = extractFunctionBody(previewsSrc, 'ButtonDecisionAndTactilePreview');
  assert.match(body, /HermesButtonPressOnlyStyle/);
  assert.doesNotMatch(body, /ChatTactileButtonStyle/);
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

test('Skeleton Loading aligns with the authoritative static production primitive — no continuous shimmer introduced or described as the section\'s primary render', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Skeleton Loading');
  assert.match(section, /no Hermex-owned animated shimmer exists/i);
  assert.match(section, /\.redacted\(reason: \.placeholder\)/);
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListComponents\.swift/);
  assert.match(section, /HermesMobile\/Features\/Insights\/ProviderLimitsCard\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ChatTranscriptSupportingViews\.swift/);
  assert.match(section, /HermesMobile\/Features\/Shared\/SkeletonPlaceholder\.swift/);
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

test('List / ListItem no longer claims no Hermex-owned row component exists — Picker Row folds into its configuration and SessionListItem is documented (via the final SessionListItem.swift/SessionListComponents.swift split), while BotInboxRow stays retained separately', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.doesNotMatch(section, /No Hermex-owned List\/ListItem exists in production/);
  assert.match(section, /Picker Row/);
  assert.match(section, /SessionListItem/);
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListItem\.swift/, 'expected the final row-content type, not the retired SessionRowView');
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListComponents\.swift/, 'expected the caller that wraps SessionListItem in a Button, selection background, swipe actions, context menus, and transitions');
  assert.doesNotMatch(section, /SessionRowView\.swift/, 'SessionRowView.swift no longer exists — it was split into SessionListItem.swift and SessionListComponents.swift');
  assert.match(section, /HermesMobile\/Features\/Bots\/BotsInboxView\.swift/);
  assert.match(section, /<ListItemFamilyGallery/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function ListItemFamilyGallery/);
  const body = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.match(body, /Picker configuration/);
  assert.match(body, /SessionListItem composition/);
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

test('Correction (production reconciliation): the Disclosure Row preview caption names DisclosureRow, not the retired TranscriptLogRowView', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'DisclosureLogRowPreview');
  assert.doesNotMatch(body, /TranscriptLogRowView/, 'TranscriptLogRowView no longer exists — it was renamed to DisclosureRow');
  assert.match(body, /One DisclosureRow, three call sites/);
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

test('Disclosure Row documents DisclosureRow.swift (the final component, superseding the retired TranscriptLogRowView.swift) and its three call sites (tool-call log, reasoning block, bot activity)', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Disclosure Row');
  assert.match(section, /HermesMobile\/Features\/Chat\/DisclosureRow\.swift/);
  assert.doesNotMatch(section, /TranscriptLogRowView\.swift|TranscriptLogRowMetrics/, 'TranscriptLogRowView.swift/TranscriptLogRowMetrics were renamed to DisclosureRow.swift/DisclosureRowMetrics in the final production tree');
  assert.match(section, /DisclosureRowMetrics\.minimumHeight/);
  assert.match(section, /DisclosureRowMetrics\.bodyIndent/);
  assert.match(section, /DisclosureRowMetrics\.bodyWindowHeight/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ToolCallLogRowView\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ReasoningBlockView\.swift/);
  assert.match(section, /HermesMobile\/Features\/Bots\/BotActivityViews\.swift/);
  assert.match(section, /<DisclosureLogRowPreview/);

  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(previewsSrc, /export function DisclosureLogRowPreview/);
});

test('Correction (production reconciliation): the reusable-geometry facts table cites DisclosureRowMetrics/DisclosureRow.swift, not the retired TranscriptLogRowMetrics/TranscriptLogRowView.swift, and the Hermex Radius & Geometry section follows suit', () => {
  const src = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(src, /TranscriptLogRowMetrics/, 'TranscriptLogRowMetrics was renamed to DisclosureRowMetrics in the final production tree');
  assert.doesNotMatch(src, /TranscriptLogRowView\.swift/, 'TranscriptLogRowView.swift no longer exists — it was renamed to DisclosureRow.swift');

  const geometrySection = extractHermesSection(src, 'Hermex Radius & Geometry');
  assert.match(geometrySection, /DisclosureRowMetrics/);
  assert.match(geometrySection, /HermesMobile\/Features\/Chat\/DisclosureRow\.swift/);
});

test('Correction (production reconciliation): the still-unadopted Radius/Geometry proposal\'s retained-exception fact also cites DisclosureRowMetrics, not the retired TranscriptLogRowMetrics', () => {
  const proposal = read(HERMES_TOKEN_PROPOSAL_PATH);
  assert.doesNotMatch(proposal, /TranscriptLogRowMetrics/, 'TranscriptLogRowMetrics was renamed to DisclosureRowMetrics in the final production tree');
  assert.match(proposal, /name:\s*'DisclosureRowMetrics\.bodyWindowHeight'/);
});

test('Attachment documents the shared AttachmentFileType extraction, both call sites, Compact Card composition for normal tiles, and the mini-preview staying outside Card', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Attachment');
  assert.match(section, /HermesMobile\/Features\/Shared\/AttachmentFileType\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/MessageBubbleView\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ChatComposerAttachmentStripView\.swift/);
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

// Correction (production reconciliation): both normal Attachment tiles' Compact Card composition
// is confirmed adopted in the final production tree (compactCardSurface(cornerRadius:) in
// HermesCard.swift, called from both MessageBubbleView.swift and ChatComposerAttachmentStripView.swift)
// — Attachment must state this as adopted, not as future "Target architecture" work still "owned by
// the production workstream".
test('Correction (production reconciliation): Attachment states Compact Card composition as adopted (compactCardSurface in HermesCard.swift), not future production-workstream work', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Attachment');
  assert.doesNotMatch(section, /Target architecture/i, 'Compact Card composition for both normal tiles is already adopted, not a future target');
  assert.doesNotMatch(section, /owned by the production workstream/i);
  assert.match(section, /compactCardSurface/, 'expected the final compactCardSurface(cornerRadius:) modifier to be named');
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesCard\.swift/);
});

test('Correction (production reconciliation): Banner states the offline-cache consolidation as adopted (Banner.offlineCache(), ChatView.swift, SessionListView.swift), not future production-workstream work', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Hermes Banner');
  assert.doesNotMatch(section, /Target architecture/i, 'the offline-cache Banner consolidation is already adopted, not a future target');
  assert.doesNotMatch(section, /owned by the production workstream/i);
  assert.match(section, /Banner\.offlineCache/);
  assert.match(section, /HermesMobile\/Features\/Shared\/Banner\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ChatView\.swift/);
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListView\.swift/);
  assert.doesNotMatch(section, /ChatTranscriptSupportingViews\.swift/, 'the offline banner call site is ChatView.swift, not ChatTranscriptSupportingViews.swift');
});

// Correction (production reconciliation): Inline Reference Link's interactive-file-reference split
// is adopted in the shared ComposerChipRendering/ComposerChipToken pipeline (ComposerChipToken.
// isInteractiveReference, ComposerChipVisualStyle.inlineReferenceLink) — it must be documented as
// adopted, and explicitly as a rendering/accessibility split in that one shared pipeline, not a
// second, separately-tappable Tag.
test('Correction (production reconciliation): Inline Reference Link states the ComposerChipRendering/ComposerChipToken split as adopted, explicitly as a rendering/accessibility split rather than a second tappable Tag', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Inline Reference Link');
  assert.doesNotMatch(section, /Target architecture/i, 'the ComposerChipRendering/ComposerChipToken split is already adopted, not a future target');
  assert.doesNotMatch(section, /owned by the production workstream/i);
  assert.match(section, /ComposerChipVisualStyle\.inlineReferenceLink|ComposerChipVisualStyle/);
  assert.match(section, /isInteractiveReference/);
  assert.match(section, /rendering\/accessibility split/i);
  assert.match(section, /HermesMobile\/Features\/Chat\/ComposerChipRendering\.swift/);
  assert.match(section, /HermesMobile\/Features\/Chat\/ComposerChipToken\.swift/);
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

  // The evidence Reference Chip used to own (ComposerChipRendering, one drawing path shared by the
  // composer pill and the sent user bubble) must survive, split across the two entries the approved
  // architecture actually assigns it to.
  const tagSection = extractHermesSection(sectionsSrc, 'Tag');
  assert.match(tagSection, /HermesMobile\/Features\/Chat\/ComposerChipRendering\.swift/, 'expected Tag to document the inert-reference half of ComposerChipRendering');
  assert.match(tagSection, /inert skill and bot references/i);

  const linkSection = extractHermesSection(sectionsSrc, 'Inline Reference Link');
  assert.match(linkSection, /HermesMobile\/Features\/Chat\/ComposerChipRendering\.swift/, 'expected Inline Reference Link to document the tappable-reference half of ComposerChipRendering');
  assert.match(linkSection, /composer pill/);
  assert.match(linkSection, /sent user bubble/);
});

test('every Hermex-owned component-family section is reachable from Components — Hermex; native TopNav stays outside it', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  for (const id of [
    'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Row Divider', 'Tag',
    'Inline Reference Link', 'Buttons', 'Hermes Checkbox', 'Skeleton Loading',
    'List / ListItem', 'Disclosure Row',
  ]) {
    assert.ok(ids.includes(id), `expected "${id}" in the Components — Hermex nav group`);
  }
  assert.ok(!ids.includes('Hermes TopNav'), 'native TopNav belongs in Native iOS — Hermex, not Components — Hermex');
});

test('Checkbox is an adopted Components — Hermex entry that reuses the real generic catalog Checkbox, documents checked/unchecked/disabled/focus/interactive/row-owned-indicator configurations, and stays distinct from Radio/Switch/status-checkmark controls', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Hermes Checkbox'/, "expected 'Hermes Checkbox' in the HermesSectionId union");
  const section = extractHermesSection(sectionsSrc, 'Hermes Checkbox');
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /row-owned/i, 'expected the row-owned indicator configuration to be documented');
  assert.match(section, /accessibility-hidden/i, 'expected the decorative/accessibility-hidden behavior of the row-owned configuration to be documented');
  assert.match(section, /never a checkbox nested inside another control|controls are never nested/i);
  assert.match(section, /\bSwitch\b/, 'expected Checkbox to be distinguished from Switch');
  assert.match(section, /\bRadio\b/, 'expected Checkbox to be distinguished from Radio');
  assert.match(section, /Tag/, 'expected Checkbox to be distinguished from a Tag-style status/completion mark');
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesCheckbox\.swift/);
  assert.match(section, /HermesMobile\/Features\/Bots\/BotPendingRequestCard\.swift/);
  assert.match(section, /HermesMobile\/Features\/Kanban\/KanbanLabView\.swift/);
  assert.match(section, /<CheckboxFamilyGallery/);

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
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
  assert.doesNotMatch(previewsSrc, /export function HermesCheckbox\b/, 'must not introduce a duplicate Hermex-specific checkbox component');
});

// Controller correction (2026-09-26, gap 1): the approved specification's Components list (§3)
// includes Input Field, but the catalog never registered it — reusing the existing generic
// InputField implementation and tokens rather than adding a competing input component.
test('Correction (gap 1): Input Field is a Components — Hermex entry that reuses the existing generic InputField implementation and tokens, with a concise state sample, not a competing input component', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /'Input Field'/, "expected 'Input Field' in the HermesSectionId union");
  const section = extractHermesSection(sectionsSrc, 'Input Field');
  assert.match(section, /hermesReference:\s*\{/);
  assert.match(section, /generic (?:catalog )?InputField/i, 'expected the section to name the reused generic InputField component, not a new one');
  assert.doesNotMatch(sectionsSrc, /function Hermes\w*InputField\w*Preview/, 'must not introduce a bespoke recon preview component — it should render the real generic InputField directly');

  const navBlockMatch = sectionsSrc.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.includes('Input Field'), 'expected "Input Field" in the Components — Hermex nav group');

  assert.match(sectionsSrc, /import\s*\{[^}]*\bInputField\b[^}]*\}\s*from\s*'\.\.\/\.\.\/components'/, 'expected hermesSections.tsx to import the real generic InputField component');
  assert.match(section, /<InputField\b/, 'expected the section to render the real InputField component');
});

test('Materials — Hermex holds exactly Adaptive Glass, and Patterns — Hermex holds Content Unavailable, Pending Request, Transcript Activity, and Composer', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  assert.ok(navBlockMatch, 'expected an exported hermesNav array');

  const materialsMatch = navBlockMatch[0].match(/label:\s*'Materials — Hermex',\s*\n\s*ids:\s*\[([^\]]*)\]/);
  assert.ok(materialsMatch, 'expected the Materials — Hermex nav group');
  const materialsIds = [...materialsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(materialsIds, ['Adaptive Glass']);

  const patternsMatch = navBlockMatch[0].match(/label:\s*'Patterns — Hermex',\s*\n\s*ids:\s*\[([^\]]*)\]/);
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
  assert.match(section, /HermesDivider owns its SwiftUI opacity and pixel geometry/);
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

  // A disabled or loading row must never remain pressable (loading returns early above; the
  // interactive branch itself is additionally gated by an explicit `isInteractive` computation — see
  // the "Correction (gap 4)" tests below for its own exact disabled/commitPending gating).
  assert.match(implSrc, /isInteractive\s*=\s*!!onPress\s*&&\s*!disabled\s*&&\s*!commitPending/, 'expected the interactive branch to be gated off for a disabled, loading (returned above), or commit-pending row');
  const pressableBlock = implSrc.match(/if\s*\(isInteractive\)\s*\{[\s\S]*?<Pressable[\s\S]*?<\/Pressable>[\s\S]*?\}/);
  assert.ok(pressableBlock, 'expected a Pressable branch guarded by isInteractive');
});

test('Correction (production reconciliation): the ListItem preview\'s SessionListItem-composition caption names SessionListItem, not the retired SessionRowView', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ListItemFamilyGallery');
  assert.doesNotMatch(body, /SessionRowView/, 'SessionRowView.swift no longer exists — it was split into SessionListItem.swift and SessionListComponents.swift');
  assert.match(body, /SessionListItem/);
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
  assert.match(src, /export const HERMES_ICON_SIZE_EXTRA_LARGE = 32\b/, 'expected the adopted HermesIconSize.extraLarge (32) alongside the Attachment sizes');
  assert.doesNotMatch(src, /from\s*'\.\.\/\.\.\/\.\.\/tokens'/, 'this module must not depend on the catalog\'s own spacing/radius scale — it is a standalone, Attachment-specific size table, not catalog chrome or a spacing token');
});

test('AttachmentTileGallery sizes its examples from the adopted HermesAttachmentSize/HermesIconSize tokens, not local hardcoded geometry', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  assert.match(
    previewsSrc,
    /import\s*\{[^}]*HERMES_ATTACHMENT_SIZE[^}]*HERMES_ICON_SIZE_EXTRA_LARGE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'|import\s*\{[^}]*HERMES_ICON_SIZE_EXTRA_LARGE[^}]*HERMES_ATTACHMENT_SIZE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'/,
    'expected HermesComponentFamiliesPreviews.tsx to import the adopted Attachment size tokens from ./hermesAttachmentSize',
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
  assert.match(body, /HERMES_ICON_SIZE_EXTRA_LARGE/, 'expected the file-type icon to render at the adopted HermesIconSize.extraLarge');
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
    /import\s*\{[^}]*HERMES_ATTACHMENT_SIZE[^}]*HERMES_ICON_SIZE_EXTRA_LARGE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'|import\s*\{[^}]*HERMES_ICON_SIZE_EXTRA_LARGE[^}]*HERMES_ATTACHMENT_SIZE[^}]*\}\s*from\s*'\.\/hermesAttachmentSize'/,
    'expected hermesSections.tsx to import the adopted Attachment size tokens as its documentation source of truth',
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
  assert.match(section, /HERMES_ICON_SIZE_EXTRA_LARGE/, 'expected the Attachment section to document HermesIconSize.extraLarge');
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
  assert.match(messageCard, /<Icon[^>]+HERMES_ICON_SIZE_EXTRA_LARGE/, 'message tile should render the file glyph directly in its vertical production anatomy');
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
  assert.match(attachmentMarkup, /HERMES_ICON_SIZE_EXTRA_LARGE\b/, 'expected the Composer pattern\'s file icon to render at the adopted HermesIconSize.extraLarge');
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

test('Content Unavailable documents Empty, No results, Error, Unavailable, and Custom variants composing icon treatment, typography, spacing, and Buttons, with optional description plus primary/secondary actions', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(section, /Hermex-owned reusable pattern/);
  assert.match(section, /composes Hermex icon treatment, typography, spacing, and Buttons/);
  for (const variant of ["key: 'empty'", "key: 'no-results'", "key: 'error'", "key: 'unavailable'", "key: 'custom'"]) {
    assert.ok(section.includes(variant), `expected the ${variant} Content Unavailable variant`);
  }
  assert.match(section, /primaryAction/);
  assert.match(section, /secondaryAction/);

  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.doesNotMatch(sectionsSrc, /id:\s*'ContentUnavailableView'/, 'the direct-platform-usage id must be gone, replaced by the Hermex-owned pattern');
});

// Correction (production reconciliation): HermesContentUnavailable.swift is confirmed adopted for
// the four picker sheets' loading/error/empty states (ModelPickerSheet, DefaultProfilePickerView,
// CronJobSkillsPicker, CronJobConfigurationPickers) — ContentUnavailableView.search(text:)'s own
// no-results treatment intentionally stays a direct call even at those same call sites, and other
// screens (e.g. TasksView, SkillsView, MemoryView) still call ContentUnavailableView directly. The
// section must say "partially adopted", not "currently no Hermex-owned source file" / "Target
// architecture ... owned by a dedicated production workstream" — and must not overclaim full
// migration.
test('Correction (production reconciliation): Content Unavailable states partial adoption — HermesContentUnavailable.swift in the four picker sheets\' loading/error/empty states, while search no-results and other direct call sites intentionally stay direct', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.doesNotMatch(section, /currently no Hermex-owned source file/i, 'HermesContentUnavailable.swift now exists and is adopted in the four picker sheets');
  assert.doesNotMatch(section, /Target architecture/i);
  assert.doesNotMatch(section, /owned by a dedicated production workstream/i);
  assert.match(section, /partially adopted/i);
  assert.match(section, /HermesMobile\/Features\/Shared\/HermesContentUnavailable\.swift/);
  for (const picker of [
    'HermesMobile/Features/Shared/ModelPickerSheet.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
    'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
  ]) {
    assert.ok(section.includes(picker), `expected the adopted picker call site ${picker}`);
  }
  assert.match(section, /ContentUnavailableView\.search\(text:\)/, 'expected the intentionally-retained direct no-results call to be named');
  assert.match(section, /28 production files/i);
  assert.match(section, /66 source references/i);
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
// the real generic InputField), its send action as a plain View (not the real Button), and never
// demonstrated Tag or Inline Reference Link at all — three of the eight composed pieces the section's
// own copy already claims were missing from the rendered preview.
test('Correction (gap 6): the Composer preview visibly composes the real InputField, Button, Tag, Inline Reference Link, and Card-based Attachment, labels its Adaptive Glass treatment, and shows status/validation feedback', () => {
  const previewsSrc = read(COMPONENT_FAMILIES_PREVIEWS_PATH);
  const body = extractFunctionBody(previewsSrc, 'ComposerPatternPreview');
  assert.match(body, /<InputField\b/, 'expected the composer text field to compose the real generic InputField, not a bare Text placeholder');
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
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  assert.ok(componentsGroupMatch, 'expected the Components — Hermex nav group');
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.ok(!id.startsWith('Hermex'), `component id "${id}" must not start with "Hermex"`);
  }

  const foundationsGroupMatch = navBlockMatch[0].match(/label:\s*'Foundations — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  assert.ok(foundationsGroupMatch, 'expected the Foundations — Hermex nav group');
  const foundationsIds = [...foundationsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(foundationsIds.every((id) => id.startsWith('Hermex')), 'Foundations/token-family ids keep their existing "Hermex" prefix — out of this rename\'s scope');
});

test('the Components — Hermex nav group preserves Hermex-owned family order while native TopNav lives in Native iOS', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const navBlockMatch = src.match(/export const hermesNav:[^;]*;/s);
  const componentsGroupMatch = navBlockMatch[0].match(/label:\s*'Components — Hermex',\s*\n\s*ids:\s*\[([\s\S]*?)\]/);
  const ids = [...componentsGroupMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids, [
    'Hermes Avatar', 'Hermes Card', 'Attachment', 'Hermes Banner', 'Row Divider', 'Tag',
    'Inline Reference Link', 'Input Field', 'Segmented Control', 'Buttons', 'Hermes Checkbox',
    'Skeleton Loading', 'List / ListItem', 'Disclosure Row',
  ]);
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

test('the Hermes TopNav entry documents production ToolbarContent, that simple screens may keep a native navigation title, and that bottom/keyboard toolbars are out of scope', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /\| 'Hermes TopNav'/, "expected 'Hermes TopNav' in the HermesSectionId union");
  const section = extractHermesSection(sectionsSrc, 'Hermes TopNav');
  assert.match(section, /displayName:\s*'TopNav'/);
  assert.match(section, /ToolbarContent/, 'expected production ToolbarContent to be named');
  assert.match(section, /Production adoption:\s*fully adopted/i, 'expected the catalog to report the completed production migration');
  assert.match(section, /57 top-navigation toolbar blocks/i, 'expected the verified migration population to be documented');
  assert.match(section, /HermesMobile\/Features\/Shared\/TopNav\.swift/, 'expected the production component source to be linked');
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

// ─── Production-adoption audit matrix ────────────────────────────────────────────────────────────

test('the catalog documents one concise implementation-backed production-adoption matrix with the approved per-screen conclusions', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  assert.match(sectionsSrc, /function HermesProductionAdoptionAuditTable/, 'expected a dedicated audit-table component');
  assert.match(sectionsSrc, /PRODUCTION_ADOPTION_AUDIT/);
  assert.match(sectionsSrc, /HermesProductionAdoptionAuditTable/, 'expected it to actually be rendered');
  assert.doesNotMatch(sectionsSrc, /id:\s*'[^']*[Aa]doption [Aa]udit[^']*'/, 'the audit must not be registered as its own nav-linked SectionDef — it belongs in the overview, not repeated per component');

  assert.doesNotMatch(sectionsSrc, /Production-adoption audit \(documentation-only\)/i);
  assert.match(sectionsSrc, /mirrors the current local migration candidate/i);

  const rows = [
    ["screen: 'Tasks'", "level: 'Strong'", 'Shared native List container plus fixed Segmented Control'],
    ["screen: 'Kanban'", "level: 'Strong'", 'Scrolling Segmented Control, Banner, Divider, Buttons, and Checkbox are shared'],
    ["screen: 'Skills'", "level: 'Strong'", 'Display-only Tag and Divider are shared'],
    ["screen: 'Memory'", "level: 'Strong'", 'Native List/Section remain intentional for long content'],
    ["screen: 'Usage'", "level: 'Strong'", 'fixed Segmented Control for window and Cost/Tokens choices'],
    ['TipJarCard.swift', "level: 'Strong'", 'Gold ramp token replace hand-built surface/action/accent styling'],
    ["screen: 'Conversation loading'", "level: 'Yes'", 'neutral shared Skeleton text-line geometry'],
  ];
  for (const [screenNeedle, levelNeedle, noteNeedle] of rows) {
    assert.ok(sectionsSrc.includes(screenNeedle), `expected an audit row for ${screenNeedle}`);
    assert.ok(sectionsSrc.includes(levelNeedle), `expected ${screenNeedle}'s row to declare ${levelNeedle}`);
    assert.ok(sectionsSrc.includes(noteNeedle), `expected ${screenNeedle}'s row to include the note "${noteNeedle}"`);
  }
});

// ─── #607 correction slice: Kanban/Usage Content Unavailable adoption, HermesList, HermesUsageSize ──

test('Content Unavailable names Kanban\'s status/filter empty branch and Usage\'s loading/error/empty states as adopted call sites, alongside the existing picker sheets', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'Content Unavailable');
  assert.match(section, /noResults/);
  assert.match(section, /Kanban/);
  assert.match(section, /HermesMobile\/Features\/Kanban\/KanbanLabView\.swift/);
  assert.match(section, /Clear Filters/);
  assert.match(section, /Usage/);
  assert.match(section, /HermesMobile\/Features\/Insights\/InsightsView\.swift/);
  // The four picker sheets stay documented — this is additive, not a replacement.
  for (const picker of [
    'HermesMobile/Features/Shared/ModelPickerSheet.swift',
    'HermesMobile/Features/Settings/DefaultProfilePickerView.swift',
    'HermesMobile/Features/Tasks/CronJobSkillsPicker.swift',
    'HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift',
  ]) {
    assert.ok(section.includes(picker), `expected the previously-adopted picker call site ${picker} to remain documented`);
  }
});

test('List / ListItem documents the Session main menu\'s HermesList container adoption while its navigation/disclosure row anatomy stays feature-specific', () => {
  const src = read(HERMES_SECTIONS_PATH);
  const section = extractHermesSection(src, 'List / ListItem');
  assert.match(section, /HermesList/);
  assert.match(section, /HermesMobile\/Features\/SessionList\/SessionListView\.swift/);
  assert.match(section, /SidebarNavButton/);
  assert.match(section, /SidebarDisclosureButton/);
});

test('the production-adoption matrix documents Usage\'s SectionCard/HermesCard, HermesDivider, Tag, HermesContentUnavailable, semantic HermesColorRamp colors, screen spacing, and the four HermesUsageSize values', () => {
  const sectionsSrc = read(HERMES_SECTIONS_PATH);
  const usageRowMatch = sectionsSrc.match(/\{\s*screen:\s*'Usage'[\s\S]*?\},/);
  assert.ok(usageRowMatch, 'expected a Usage row in PRODUCTION_ADOPTION_AUDIT');
  const usageRow = usageRowMatch[0];
  for (const needle of [
    'HermesDivider',
    'Tag',
    'HermesContentUnavailable',
    'HermesColorRamp',
    'HermesUsageSize',
  ]) {
    assert.ok(usageRow.includes(needle), `expected the Usage adoption row to mention ${needle}`);
  }
  for (const value of ['180', '7', '8']) {
    assert.ok(usageRow.includes(value), `expected the Usage adoption row to cite the HermesUsageSize value ${value}`);
  }
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
