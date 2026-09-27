#!/usr/bin/env python3
"""Fail closed on Hermex Design System contracts that partner changes must preserve."""

import argparse
import os
import re
from pathlib import Path
from typing import Mapping


SEGMENTED_PATH = "HermesMobile/Features/Shared/SegmentedControl.swift"
APP_FONT_PATH = "HermesMobile/Config/AppFont.swift"
CARD_PATH = "HermesMobile/Features/Shared/HermesCard.swift"
SECTION_CARD_PATH = "HermesMobile/Features/Shared/SectionCard.swift"
TIP_JAR_PATH = "HermesMobile/Features/SessionList/TipJarCard.swift"
SESSION_COMPONENTS_PATH = "HermesMobile/Features/SessionList/SessionListComponents.swift"
SESSION_ITEM_PATH = "HermesMobile/Features/SessionList/SessionListItem.swift"
SESSION_LIST_VIEW_PATH = "HermesMobile/Features/SessionList/SessionListView.swift"
KANBAN_LAB_PATH = "HermesMobile/Features/Kanban/KanbanLabView.swift"
INSIGHTS_VIEW_PATH = "HermesMobile/Features/Insights/InsightsView.swift"
PROVIDER_LIMITS_PATH = "HermesMobile/Features/Insights/ProviderLimitsCard.swift"
USAGE_CHART_DATA_PATH = "HermesMobile/Features/Insights/UsageChartData.swift"
USAGE_CHART_CARD_PATH = "HermesMobile/Features/Insights/UsageChartCard.swift"
HERMES_SPACING_PATH = "HermesMobile/Config/HermesSpacing.swift"
CONTENT_UNAVAILABLE_PATH = "HermesMobile/Features/Shared/HermesContentUnavailable.swift"

REQUIRED_PATHS = (
    SEGMENTED_PATH,
    APP_FONT_PATH,
    CARD_PATH,
    SECTION_CARD_PATH,
    TIP_JAR_PATH,
    SESSION_COMPONENTS_PATH,
    SESSION_ITEM_PATH,
    SESSION_LIST_VIEW_PATH,
    KANBAN_LAB_PATH,
    INSIGHTS_VIEW_PATH,
    PROVIDER_LIMITS_PATH,
    USAGE_CHART_DATA_PATH,
    USAGE_CHART_CARD_PATH,
    HERMES_SPACING_PATH,
    CONTENT_UNAVAILABLE_PATH,
)

# Explicit, owned baseline of production files that still construct a native
# ContentUnavailableView directly (not through HermesContentUnavailable) and the count of direct
# constructors each is allowed to retain. Both trailing-closure and convenience initializers count;
# `ContentUnavailableView.search(text:)` does not match the constructor pattern and remains the
# intentional platform search-empty treatment.
#
# A path missing from this dict, or a count that grows past its baseline, fails the audit: migrate
# the new site to HermesContentUnavailable, or — if it is a deliberate, reviewed exception — raise
# this baseline with a comment naming the owner and the condition under which it should come back
# down (e.g. "remove once #NNN migrates this screen").
CONTENT_UNAVAILABLE_CONSTRUCTOR = re.compile(r"\bContentUnavailableView\s*(?:\{|\()")
CONTENT_UNAVAILABLE_LEGACY_OWNER = "@uzairansaruzi"
CONTENT_UNAVAILABLE_LEGACY_REMOVAL_CONDITION = (
    "Remove each file's allowance when its retained native constructors migrate to "
    "HermesContentUnavailable; do not increase a count without a maintainer-approved issue."
)
CONTENT_UNAVAILABLE_LEGACY_BASELINE = {
    "HermesMobile/Features/Bots/BotArtifactPreview.swift": 1,
    "HermesMobile/Features/Bots/BotChatView.swift": 1,
    "HermesMobile/Features/Bots/BotDelegatedWorkView.swift": 2,
    "HermesMobile/Features/Bots/BotProfileEditorView.swift": 1,
    "HermesMobile/Features/Bots/BotQuickRepliesEditorView.swift": 1,
    "HermesMobile/Features/Bots/BotSearchView.swift": 1,
    "HermesMobile/Features/Bots/BotsInboxView.swift": 1,
    "HermesMobile/Features/Chat/ChatAttachmentPreviewView.swift": 2,
    "HermesMobile/Features/Chat/ChatComposerSelectorSheets.swift": 1,
    "HermesMobile/Features/Chat/ChatTranscriptView.swift": 2,
    "HermesMobile/Features/Chat/TranscriptMediaView.swift": 2,
    "HermesMobile/Features/Kanban/KanbanCardDetailView.swift": 2,
    "HermesMobile/Features/Kanban/KanbanLabView.swift": 2,
    "HermesMobile/Features/Memory/MemoryView.swift": 1,
    "HermesMobile/Features/SessionList/SessionListView.swift": 2,
    "HermesMobile/Features/Settings/ProvidersView.swift": 3,
    "HermesMobile/Features/Skills/SkillsView.swift": 6,
    "HermesMobile/Features/Tasks/TaskRunOutputSheet.swift": 2,
    "HermesMobile/Features/Tasks/TasksView.swift": 3,
    "HermesMobile/Features/Workspace/FileBrowserView.swift": 2,
    "HermesMobile/Features/Workspace/FilePreviewView.swift": 4,
    "HermesMobile/Features/Workspace/GitCommitView.swift": 3,
    "HermesMobile/Features/Workspace/GitDiffView.swift": 1,
    "HermesMobile/Features/Workspace/GitWorkspaceView.swift": 3,
    "HermesMobile/Features/Workspace/WorkspaceManagerView.swift": 1,
}


def extract_named_block(source: str, declaration: str):
    start = source.find(declaration)
    if start == -1:
        return None
    opening = source.find("{", start)
    if opening == -1:
        return None

    depth = 0
    for index in range(opening, len(source)):
        character = source[index]
        if character == "{":
            depth += 1
        elif character == "}":
            depth -= 1
            if depth == 0:
                return source[start : index + 1]
    return None


def audit_contract(files: Mapping[str, str]):
    failures = []

    def source(path: str):
        value = files.get(path)
        if value is None:
            failures.append(f"missing required design-system source: {path}")
            return ""
        return value

    def require(path: str, needle: str, reason: str):
        if needle not in source(path):
            failures.append(f"{path}: {reason}; expected `{needle}`")

    for path in REQUIRED_PATHS:
        source(path)

    for path, text in files.items():
        if path.startswith("HermesMobile/") and path.endswith(".swift"):
            if ".pickerStyle(.segmented)" in text or "UISegmentedControl" in text:
                failures.append(
                    f"{path}: native segmented Picker/control is not allowed; use the shared custom SegmentedControl"
                )

    segmented_requirements = (
        ("struct SegmentedControl", "shared SegmentedControl type is missing"),
        ("case fixed", "fixed presentation is missing"),
        ("case scrolling", "scrolling presentation is missing"),
        ("matchedGeometryEffect", "selection transition is missing"),
        ("SegmentedControlMetrics.visualHeight", "compact visual pill height is not tokenized"),
        ("SegmentedControlMetrics.minimumTouchHeight", "44-point touch target contract is missing"),
        ("HermesMotion.Bundle.contentReposition", "shared selection motion is missing"),
        (".subheadlineSemibold", "selected option must use Hermex semibold subheadline typography"),
        (".appFont(.mono12)", "count label must use the Hermex 12-point mono role"),
    )
    for needle, reason in segmented_requirements:
        require(SEGMENTED_PATH, needle, reason)

    for role in ("headlineSemibold", "subheadlineSemibold", "captionSemibold", "mono14", "mono12"):
        require(APP_FONT_PATH, role, f"Hermex typography role {role} is missing")

    require(CARD_PATH, "case outlined", "canonical outlined Card surface is missing")
    require(CARD_PATH, "Color(.systemBackground)", "outlined Card must use the adaptive system background")
    require(CARD_PATH, "Color(.separator)", "outlined Card must use the semantic neutral border")

    section_card = source(SECTION_CARD_PATH)
    require(
        SECTION_CARD_PATH,
        ".hermesCardSurface(surface",
        "SectionCard must delegate its visual surface to the Hermex Card foundation",
    )
    for forbidden in ("RoundedRectangle(", ".stroke(", "Color(.separator)", "Color(.systemBackground)"):
        if forbidden in section_card:
            failures.append(
                f"{SECTION_CARD_PATH}: SectionCard must delegate chrome to HermesCard instead of recreating `{forbidden}`"
            )

    require(TIP_JAR_PATH, "SectionCard(surface: .outlined)", '"Enjoying Hermex?" must use the canonical outlined Card')
    require(TIP_JAR_PATH, "BotAvatarMarkView(", '"Enjoying Hermex?" must use the shared Avatar family')
    require(
        TIP_JAR_PATH,
        ".buttonStyle(.hermes(.medium, emphasis: .brandPrimary))",
        '"Buy Uzi a coffee" must use the shared Gold brand-primary Button',
    )

    session_components = source(SESSION_COMPONENTS_PATH)
    for name in ("SidebarNavButton", "SidebarDisclosureButton"):
        block = extract_named_block(session_components, f"struct {name}")
        if block is None:
            failures.append(f"{SESSION_COMPONENTS_PATH}: could not locate {name}")
        elif ".appFont(.label)" not in block:
            failures.append(
                f"{SESSION_COMPONENTS_PATH}: {name} must use Hermex `.appFont(.label)` typography"
            )

    require(
        SESSION_ITEM_PATH,
        ".appFont(.body, weight: .semibold)",
        "Session title must use the 16-point Hermex body role with semibold emphasis",
    )
    require(
        SESSION_ITEM_PATH,
        ".appFont(.captionSemibold)",
        "Session attention status must use the named Hermex caption-semibold role",
    )

    # --- #607 correction slice -------------------------------------------------------------

    require(
        SESSION_LIST_VIEW_PATH,
        "HermesList {",
        "main menu content seam must delegate to the shared HermesList container",
    )
    if "return List {" in source(SESSION_LIST_VIEW_PATH):
        failures.append(
            f"{SESSION_LIST_VIEW_PATH}: main menu content seam regressed to a direct List container; use HermesList"
        )

    kanban_empty_block = extract_named_block(source(KANBAN_LAB_PATH), "private var emptyContent")
    if kanban_empty_block is None:
        failures.append(f"{KANBAN_LAB_PATH}: could not locate emptyContent")
    elif "HermesContentUnavailable(" not in kanban_empty_block:
        failures.append(
            f"{KANBAN_LAB_PATH}: emptyContent regressed to a direct ContentUnavailableView; use HermesContentUnavailable"
        )

    insights_content_block = extract_named_block(source(INSIGHTS_VIEW_PATH), "private var content: some View")
    if insights_content_block is None:
        failures.append(f"{INSIGHTS_VIEW_PATH}: could not locate the loading/error/empty content seam")
    else:
        for needle, state in (
            ("HermesContentUnavailable(variant: .loading", "loading"),
            ("variant: .error", "error"),
            ("variant: .empty", "empty"),
        ):
            if needle not in insights_content_block:
                failures.append(
                    f"{INSIGHTS_VIEW_PATH}: the {state} state regressed off HermesContentUnavailable"
                )

    require(PROVIDER_LIMITS_PATH, "HermesDivider(", "Provider Limits must use the shared HermesDivider")
    if "Divider()" in source(PROVIDER_LIMITS_PATH).replace("HermesDivider()", ""):
        failures.append(f"{PROVIDER_LIMITS_PATH}: regressed to a raw Divider(); use HermesDivider")

    require(
        PROVIDER_LIMITS_PATH,
        "Tag(label: plan, tint: .secondary)",
        "Provider Limits plan badge must use Tag's component-owned tint/fill treatment",
    )
    if ".stroke(Color.primary.opacity(0.18)" in source(PROVIDER_LIMITS_PATH):
        failures.append(
            f"{PROVIDER_LIMITS_PATH}: regressed to feature-local plan-capsule chrome; use Tag"
        )
    if "Color.secondary.opacity(0.12)" in source(PROVIDER_LIMITS_PATH):
        failures.append(
            f"{PROVIDER_LIMITS_PATH}: repeats Tag's component-owned fill-opacity recipe; use the tint initializer"
        )

    require(
        USAGE_CHART_DATA_PATH,
        "HermesColorRamp.",
        "Usage chart segment colors must use HermesColorRamp",
    )
    for retired in (".blue\n", ".teal\n", ".indigo\n"):
        if retired in source(USAGE_CHART_DATA_PATH):
            failures.append(
                f"{USAGE_CHART_DATA_PATH}: retired raw named color `{retired.strip()}` reappeared; use HermesColorRamp"
            )

    require(
        PROVIDER_LIMITS_PATH,
        "HermesColorRamp.",
        "Provider Limits tint colors must use HermesColorRamp",
    )
    for retired in ("case .warning:\n            .orange", "case .critical:\n            .red"):
        if retired in source(PROVIDER_LIMITS_PATH):
            failures.append(
                f"{PROVIDER_LIMITS_PATH}: retired raw named tint color reappeared; use HermesColorRamp"
            )

    require(HERMES_SPACING_PATH, "enum HermesUsageSize", "Usage-family size tokens are missing")
    for needle in (
        "chartHeight: CGFloat = 180",
        "legendIndicator: CGFloat = 7",
        "balanceBarHeight: CGFloat = 8",
        "minimumBalanceFill: CGFloat = 8",
    ):
        require(HERMES_SPACING_PATH, needle, "a HermesUsageSize token value is missing or has drifted")

    require(USAGE_CHART_CARD_PATH, "HermesUsageSize.chartHeight", "chart height must use HermesUsageSize")
    require(
        USAGE_CHART_CARD_PATH,
        "HermesUsageSize.legendIndicator",
        "legend indicator size must use HermesUsageSize",
    )
    if "CGFloat = 180" in source(USAGE_CHART_CARD_PATH):
        failures.append(f"{USAGE_CHART_CARD_PATH}: regressed to an un-tokenized chart height literal")

    require(
        PROVIDER_LIMITS_PATH,
        "HermesUsageSize.balanceBarHeight",
        "balance bar height must use HermesUsageSize",
    )
    require(
        PROVIDER_LIMITS_PATH,
        "HermesUsageSize.minimumBalanceFill",
        "minimum balance fill must use HermesUsageSize",
    )
    if "frame(height: 8)" in source(PROVIDER_LIMITS_PATH):
        failures.append(
            f"{PROVIDER_LIMITS_PATH}: regressed to an un-tokenized balance-bar height literal"
        )

    for path, text in files.items():
        if not (path.startswith("HermesMobile/") and path.endswith(".swift")):
            continue
        if path == CONTENT_UNAVAILABLE_PATH:
            continue
        count = len(CONTENT_UNAVAILABLE_CONSTRUCTOR.findall(text))
        if count == 0:
            continue
        baseline = CONTENT_UNAVAILABLE_LEGACY_BASELINE.get(path)
        if baseline is None:
            failures.append(
                f"{path}: introduces a new direct ContentUnavailableView constructor; migrate it to "
                "HermesContentUnavailable, or add an owned baseline exception (with a removal "
                "condition) in scripts/hermex_design_system_adoption_audit.py"
            )
        elif count > baseline:
            failures.append(
                f"{path}: direct ContentUnavailableView usage grew from {baseline} to {count}; migrate "
                "the new site to HermesContentUnavailable, or raise the owned baseline (with a removal "
                "condition) in scripts/hermex_design_system_adoption_audit.py"
            )

    return failures


def read_production_sources(repo_root: Path):
    files = {}
    app_root = repo_root / "HermesMobile"
    for path in app_root.rglob("*.swift"):
        files[path.relative_to(repo_root).as_posix()] = path.read_text(encoding="utf-8")
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo",
        default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        help="Hermex repository root",
    )
    args = parser.parse_args()

    failures = audit_contract(read_production_sources(Path(args.repo)))
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)

    print("hermex-design-system-adoption-audit: PASS")


if __name__ == "__main__":
    main()
