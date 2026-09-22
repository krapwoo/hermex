#!/usr/bin/env python3
import argparse
import os
import re

# The 55 candidate-baseline weight overrides plus 2 current-master Push overrides,
# re-verified directly against pinned baseline
# d29dda8a3b3d86b3e85cf1223ed7ce399a121c1b by the same regex WEIGHT_OVERRIDE_PATTERN below finds at
# audit time — this list is not hand-curated independently of that pattern; it is that pattern's own
# verified output at this session's pinned baseline, checked in so a future run can detect drift
# (a site added, removed, or moved) explicitly rather than silently.
EXCEPTIONS = [
    ("HermesMobile/Features/Insights/UsageTotalsGrid.swift", 38, "semibold"),
    ("HermesMobile/Features/Insights/UsageModelRows.swift", 33, "medium"),
    ("HermesMobile/Features/Insights/UsageModelRows.swift", 46, "medium"),
    ("HermesMobile/Features/Insights/UsageModelRows.swift", 84, "medium"),
    ("HermesMobile/Features/Insights/ProviderLimitsCard.swift", 20, "semibold"),
    ("HermesMobile/Features/Insights/ProviderLimitsCard.swift", 77, "semibold"),
    ("HermesMobile/Features/Insights/ProviderLimitsCard.swift", 155, "medium"),
    ("HermesMobile/Features/Insights/ProviderLimitsCard.swift", 215, "semibold"),
    ("HermesMobile/Features/Insights/UsageChartCard.swift", 63, "bold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1417, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1426, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1601, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1698, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1704, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1830, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1844, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1865, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1871, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1879, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1964, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 1999, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 2027, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 2063, "medium"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 2080, "semibold"),
    ("HermesMobile/Features/Settings/SettingsView.swift", 2131, "medium"),
    ("HermesMobile/Features/Settings/AppIconSettingsSection.swift", 107, "semibold"),
    ("HermesMobile/Features/Settings/AppIconSettingsSection.swift", 134, "semibold"),
    ("HermesMobile/Features/Chat/TranscriptTurnFolding.swift", 244, "medium"),
    ("HermesMobile/Features/Chat/MarkerMessageCardView.swift", 95, "semibold"),
    ("HermesMobile/Features/Chat/ToolActivityGroupView.swift", 66, "medium"),
    ("HermesMobile/Features/Chat/ChatMessageMeta.swift", 81, "medium"),
    ("HermesMobile/Features/Chat/TranscriptLogRowView.swift", 146, "semibold"),
    ("HermesMobile/Features/Chat/TranscriptLogRowView.swift", 206, "semibold"),
    ("HermesMobile/Features/Chat/ChatComposerView.swift", 21, "bold"),
    ("HermesMobile/Features/Chat/ToolCallLogRowView.swift", 122, "semibold"),
    ("HermesMobile/Features/Chat/ToolCallLogRowView.swift", 135, "semibold"),
    ("HermesMobile/Features/Chat/ToolCallLogRowView.swift", 151, "semibold"),
    ("HermesMobile/Features/Bots/HermexPushSectionView.swift", 38, "medium"),
    ("HermesMobile/Features/Bots/HermexPushSectionView.swift", 138, "medium"),
    ("HermesMobile/Features/Workspace/GitDiffView.swift", 104, "semibold"),
    ("HermesMobile/Features/Workspace/GitDiffView.swift", 111, "semibold"),
    ("HermesMobile/Features/Workspace/GitWorkspaceView.swift", 122, "semibold"),
    ("HermesMobile/Features/Workspace/GitWorkspaceView.swift", 204, "semibold"),
    ("HermesMobile/Features/Workspace/GitWorkspaceView.swift", 236, "semibold"),
    ("HermesMobile/Features/Workspace/GitActionToastOverlay.swift", 119, "semibold"),
    ("HermesMobile/Features/Workspace/GitCommitView.swift", 174, "semibold"),
    ("HermesMobile/Features/Workspace/GitCommitView.swift", 296, "semibold"),
    ("HermesMobile/Features/Workspace/GitCommitView.swift", 312, "semibold"),
    ("HermesMobile/Features/Workspace/SourceViewer/SourceFileSurface.swift", 79, "medium"),
    ("HermesMobile/Features/Workspace/SourceViewer/SourceFileSurface.swift", 91, "semibold"),
    ("HermesMobile/Features/Workspace/SourceViewer/SourceFileSurface.swift", 100, "semibold"),
    ("HermesMobile/Features/Shared/SectionCard.swift", 40, "semibold"),
    ("HermesMobile/Features/SessionList/SessionRowView.swift", 213, "semibold"),
    ("HermesMobile/Features/SessionList/SessionRowView.swift", 224, "semibold"),
    ("HermesMobile/Features/SessionList/SessionRowView.swift", 492, "semibold"),
    ("HermesMobile/Features/SessionList/SessionRowView.swift", 506, "semibold"),
    ("HermesMobile/Features/SessionList/SessionListComponents.swift", 1541, "semibold"),
]

# (R3 correction) The same pattern EXCEPTIONS above was verified against — re-run at audit time so a
# future call site this pinned list does not yet name is caught as a genuine UNCLASSIFIED failure,
# not silently ignored. Scans the same three production roots the rest of this plan's tooling scans.
#
# (Kept scoped to the deprecated-factory shape only, deliberately.) `.appFont(<role>, weight: .x)` —
# TY-7's own migration destination for these 55 sites — is indistinguishable, by source text alone,
# from a `.appFont(<role>, weight: .x)` call TY-6 produced for a raw `.font(<role>.weight(.x))` site
# that was never one of these 55 pinned exceptions (TY-6 migrates hundreds of such sites). Widening
# this pattern to also match `.appFont(...)` would fold that unrelated TY-6 population into the
# "zero-unclassified" cross-check below and report it as spurious UNCLASSIFIED failures — a false
# alarm, not a real gap. `audit_line` below still verifies each pinned EXCEPTIONS row's own
# statement — its pinned line number and that line's own more-indented continuation lines — by exact
# substring match regardless of whether that statement currently reads the deprecated
# `AppFont.<role>(weight:)` shape or TY-7's migrated `.appFont(<role>, weight:)` shape — so a real
# weight-token drop or omission at any of these 55 sites is still caught. The cross-check's own job
# is narrower: confirm no *additional*, still-deprecated `AppFont.<role>(weight:)` call site is
# missing from the pinned list before TY-7 migrates it.
WEIGHT_OVERRIDE_PATTERN = re.compile(r"AppFont\.[a-zA-Z0-9]+\(weight: \.(semibold|medium|bold)")
SCAN_ROOTS = ["HermesMobile", "HermesShareExtension", "HermesLiveActivityWidget"]


def audit_line(text, path, line_number, expected_weight):
    # (Family 06 correction) A pinned statement's weight token may sit on the pinned physical line
    # itself, or — after an approved reformat — on one of that statement's own more-indented chained-
    # modifier continuation lines. Only lines strictly more indented than the pinned line, with no
    # same-or-less-indented line in between, belong to that same statement; a sibling statement below
    # it (same or lesser indentation) must never satisfy the pinned exception.
    lines = text.split("\n")
    if line_number - 1 >= len(lines):
        return [f"{path}:{line_number} does not exist"]
    line = lines[line_number - 1]
    needle = f".{expected_weight}"
    base_indent = len(line) - len(line.lstrip(" "))
    for continuation in lines[line_number:]:
        if needle in line:
            return []
        if not continuation.strip():
            continue
        if len(continuation) - len(continuation.lstrip(" ")) <= base_indent:
            break
        line = continuation
    if needle in line:
        return []
    return [f"{path}:{line_number} no longer contains '.{expected_weight}' — weight exception was not preserved: '{lines[line_number - 1].strip()}'"]


def find_real_weight_override_sites(repo_root):
    sites = []
    for root in SCAN_ROOTS:
        root_path = os.path.join(repo_root, root)
        for dirpath, _dirnames, filenames in os.walk(root_path):
            for filename in filenames:
                if not filename.endswith(".swift"):
                    continue
                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, repo_root)
                with open(full_path, "r", encoding="utf-8") as f:
                    for line_number, line in enumerate(f, start=1):
                        match = WEIGHT_OVERRIDE_PATTERN.search(line)
                        if match:
                            sites.append((rel_path, line_number, match.group(1)))
    return sites


def audit_repo(repo_root):
    failures = []
    for rel_path, line_number, expected_weight in EXCEPTIONS:
        full_path = os.path.join(repo_root, rel_path)
        with open(full_path, "r", encoding="utf-8") as f:
            text = f.read()
        failures.extend(audit_line(text, rel_path, line_number, expected_weight))

    # (R3 correction) Zero-unclassified cross-check: EXCEPTIONS must be the COMPLETE real
    # population, not merely a check that these known sites individually survive.
    real_sites = set(find_real_weight_override_sites(repo_root))
    pinned_sites = set(EXCEPTIONS)
    unclassified = real_sites - pinned_sites
    for rel_path, line_number, weight in sorted(unclassified):
        failures.append(
            f"UNCLASSIFIED: {rel_path}:{line_number} (.{weight}) is a real weight-override site "
            "not present in the pinned EXCEPTIONS list — add it explicitly or document why it is "
            "intentionally excluded, never leave it silently unaudited."
        )
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = parser.parse_args()
    failures = audit_repo(args.repo)
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)
    print(f"hermex-typography-weight-exception-audit: PASS ({len(EXCEPTIONS)} sites, zero unclassified)")


if __name__ == "__main__":
    main()
