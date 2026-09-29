# When to use X vs Y (Hermex)

This is a decision **guide**, not the source of truth. Every current Hermex catalog entry — a
token group, material, native-iOS pattern, component, or pattern — carries its own structured
decision contract in `native/catalog/hermes/hermesSections.tsx` (the `hermesReference` field on its
`SectionDef`, typed in `native/catalog/types.ts`):

- **`useWhen`** — the deciding condition under which to reach for this entry.
- **`avoidWhen`** — the deciding condition under which it's the wrong choice, even if it looks
  applicable at a glance.
- **`alternatives`** — structured `{ name, useWhen }` entries naming what to reach for instead, and
  under what condition — never a single prose blob.
- **`adoptionStatus`** — a closed-vocabulary state (`foundation-available`, `production-adopted`,
  `partially-adopted`, `native-platform`, or `reference-only`) plus truthful plain-English detail,
  so a choice between two entries also accounts for which one is actually shipping today.

Those four fields render live in the catalog under the exact labels **Use when** / **Avoid when** /
**Alternatives** / **Adoption status** (`HermesReferenceDetails`), and the same facts are available
as plain JSON from the catalog's own machine-readable manifest (`HermesOverview` → "Machine-readable
manifest", built via `buildComponentManifest()` in `native/catalog/manifest.ts`) for a tool or agent
instead of a human. Read an entry's own fields there before guessing from its name or description
alone — this file exists to explain *the decision model*, not to duplicate every entry's prose.

## The decision model in practice

A few representative, real Hermex disambiguations — read as examples of how `useWhen`/`avoidWhen`/
`alternatives` combine, not as the complete list (every entry's own fields are the complete list):

- **Toast vs Banner** — both are transient/persistent status surfaces. Toast is a one-off
  confirmation the caller dismisses after a short interval — it has no internal timer or
  auto-dismiss (HermexToast.swift), so the caller's own binding is what clears it; Banner stays
  in-flow until the condition it describes resolves. Reaching for the wrong one shows either a
  message that never clears, or a persistent condition that silently disappears.
- **Checkbox vs Radio vs Segmented Control** — Checkbox records an independent multi-select fact;
  Radio is one-of-many exclusive selection; Segmented Control is also exclusive selection, but as a
  primary, prominent view switch rather than a list-style choice. Picking Checkbox for exclusive
  selection lets two conflicting states coexist; picking Radio for an independent fact silently
  un-checks a sibling the user meant to keep checked.
- **Tag vs Inline Reference Link** — both can look like a small pill of text. Tag is always
  display-only; Inline Reference Link is always tappable, with real link/control semantics. Styling
  a tappable element like a Tag (or vice versa) breaks the affordance VoiceOver and sighted users
  both rely on.
- **Card vs Disclosure Row vs Hermes Tooltip vs Accordion List** — all show supplementary detail,
  differing in how much and how persistently. Card is a standalone, always-visible surface;
  Disclosure Row is one collapsed line that expands into longer detail; Hermes Tooltip is a
  tap-triggered aside anchored to a control; Accordion List is a *collection* of expandable
  `ListItem` rows, not a single expandable surface — reach for it over Disclosure Row specifically
  when the pattern repeats across a list, not for one status line.
- **List / ListItem vs Hermes Card** — a homogeneous set of peer rows (settings, search results,
  sessions) is List/ListItem, which supplies the shared surface and dividers; a standalone
  self-contained unit sitting alongside differently-shaped content is a Card.
- **Dialog vs Bottom Sheet** — both are Hermex-owned custom-presented surfaces, but for opposite
  jobs. Dialog (`HermexDialog`) is an always-centered, fully custom modal for a short, focused
  interruption or confirmation — it never scrolls, never accepts text input, and its dimmed
  backdrop never dismisses it. The component always supplies the standard close button and
  accessibility Escape; the caller supplies the footer actions. Bottom Sheet (`HermexBottomSheet`) is content supplied to native
  `.sheet` for forms, editable content, or a longer workflow that may need to scroll — the caller
  keeps owning `.sheet` itself, including its dismiss policy. Reaching for Dialog with form fields or
  long content forces content past the point Dialog is contracted to stay short; reaching for Bottom
  Sheet for a one- or two-action confirmation loses Dialog's forced-attention, non-dismissible
  backdrop.
- **Native iOS patterns (Search, Text Input) vs a Hermex-owned wrapper** — Hermex intentionally
  keeps some surfaces on the platform primitive (`.searchable`, `TextField`/`SecureField`/
  `TextEditor`) rather than a custom component. Their `adoptionStatus` is `native-platform`, not
  `foundation-available` — there is no Hermex-owned alternative to adopt later, by design.

## Reading an entry's `adoptionStatus`

Before recommending a component, check whether it is actually shipping. `foundation-available` means
the Swift exists and is tested but no production screen calls it yet — treat any "used in" screen
name in that entry as relevant *context* for how it would compose, never as a current production
call site. `production-adopted` and `native-platform` are real, current production behavior.
`partially-adopted` means part of the entry is adopted and part is not — read the `detail` string to
find out which part is which before making a claim either way. `reference-only` marks a
target-architecture/documentation pattern with no adoption claim to make.
