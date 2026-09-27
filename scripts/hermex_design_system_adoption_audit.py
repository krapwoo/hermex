#!/usr/bin/env python3
"""Fail closed on Hermex Design System contracts that partner changes must preserve."""

import argparse
import os
from pathlib import Path
from typing import Mapping


SEGMENTED_PATH = "HermesMobile/Features/Shared/SegmentedControl.swift"
APP_FONT_PATH = "HermesMobile/Config/AppFont.swift"
CARD_PATH = "HermesMobile/Features/Shared/HermesCard.swift"
SECTION_CARD_PATH = "HermesMobile/Features/Shared/SectionCard.swift"
TIP_JAR_PATH = "HermesMobile/Features/SessionList/TipJarCard.swift"
SESSION_COMPONENTS_PATH = "HermesMobile/Features/SessionList/SessionListComponents.swift"
SESSION_ITEM_PATH = "HermesMobile/Features/SessionList/SessionListItem.swift"

REQUIRED_PATHS = (
    SEGMENTED_PATH,
    APP_FONT_PATH,
    CARD_PATH,
    SECTION_CARD_PATH,
    TIP_JAR_PATH,
    SESSION_COMPONENTS_PATH,
    SESSION_ITEM_PATH,
)


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
