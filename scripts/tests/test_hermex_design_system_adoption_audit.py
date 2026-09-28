"""Run with: python3 -m unittest scripts.tests.test_hermex_design_system_adoption_audit -v

Fixture-based tests for scripts/hermex_design_system_adoption_audit.py. Each test builds a minimal,
self-contained fake repository tree under a temporary directory — never the real repository — so the
audit's checks can be exercised in isolation, including against the live repository only in the one
test reserved for that (test_passes_against_the_real_repository).
"""
from __future__ import annotations

import importlib.machinery
import importlib.util
import pathlib
import subprocess
import sys
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "hermex_design_system_adoption_audit.py"
REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]

loader = importlib.machinery.SourceFileLoader("hermex_design_system_adoption_audit", str(SCRIPT))
spec = importlib.util.spec_from_loader(loader.name, loader)
audit = importlib.util.module_from_spec(spec)
loader.exec_module(audit)


VALID_APP_FONT = """
import SwiftUI
enum AppFont {
    enum Role: CaseIterable {
        case body
    }
}
extension View {
    func appFont(_ role: AppFont.Role) -> some View {
        self
    }
}
""".strip()

VALID_HERMES_SPACING = """
enum HermesSpacing {
    static let s16: CGFloat = 16
}

enum HermesIconSize {
    static let xs: CGFloat = 12
    static let small: CGFloat = 16
    static let medium: CGFloat = 20
    static let large: CGFloat = 24
    static let extraLarge: CGFloat = 32

    enum Avatar {
        static let small = HermesIconSize.medium
        static let medium = HermesIconSize.large
        static let large = HermesIconSize.extraLarge
    }
}

enum HermesAvatarSize: CGFloat, CaseIterable {
    case small = 32
    case medium = 40
    case large = 48
}
""".strip()

SIMPLE_SNIPPETS = {
    "HermesMobile/Features/Shared/HermesCard.swift": "enum HermesCardSurface { case glass }",
    "HermesMobile/Features/Shared/HermesButton.swift": (
        "struct HermesButtonStyle: ButtonStyle {}\nstruct HermesButtonPressOnlyStyle: ButtonStyle {}"
    ),
    "HermesMobile/Features/Shared/HermesCheckbox.swift": "struct HermesCheckbox: View {}",
    "HermesMobile/Features/Shared/HermesRadio.swift": "struct HermesRadio: View {}",
    "HermesMobile/Features/Shared/HermesDropdown.swift": "struct HermesDropdown: View {}",
    "HermesMobile/Features/Shared/HermesToast.swift": "struct HermesToast: View {}",
    "HermesMobile/Features/Shared/HermesTooltip.swift": "struct HermesTooltip: View {}",
    "HermesMobile/Features/Shared/HermesAvatar.swift": "struct HermesAvatar: View {}",
    "HermesMobile/Features/Shared/HermesDivider.swift": "struct HermesDivider: View {}",
    "HermesMobile/Features/Shared/HermesContentUnavailable.swift": "struct HermesContentUnavailable: View {}",
    "HermesMobile/Features/Shared/ListItem.swift": "struct ListItem<Leading: View>: View {}",
    "HermesMobile/Features/Shared/HermesList.swift": "struct HermesList<Content: View>: View {}",
    "HermesMobile/Features/Shared/SegmentedControl.swift": "struct SegmentedControl<Value: Hashable>: View {}",
    "HermesMobile/Features/Shared/TopNav.swift": "struct TopNav: ToolbarContent {}",
    "HermesMobile/Features/Shared/Banner.swift": "struct Banner: View {}",
    "HermesMobile/Features/Shared/Tag.swift": "struct Tag: View {}",
    "HermesMobile/Features/Shared/AttachmentFileType.swift": "enum AttachmentFileType {}",
    "HermesMobile/Features/Shared/AttachmentTile.swift": "struct AttachmentTile: View {}",
    "HermesMobile/Features/Shared/SkeletonPlaceholder.swift": "struct SkeletonPlaceholder: View {}",
    "HermesMobile/Features/Shared/HermesSearch.swift": (
        "extension View {\n"
        "    func hermesSearch(\n"
        "        text: Binding<String>,\n"
        "        placement: SearchFieldPlacement = .automatic,\n"
        "        prompt: Text? = nil\n"
        "    ) -> some View {\n"
        "        searchable(text: text, placement: placement, prompt: prompt)\n"
        "    }\n"
        "}"
    ),
    "HermesMobile/Config/HermesColor.swift": "enum HermesColorRamp {}",
    "HermesMobile/Config/HermesMotion.swift": "enum HermesMotion {}",
    "HermesMobile/Config/HermesRadius.swift": "enum HermesRadius {}",
    "HermesMobile/Config/HermesShadow.swift": "enum HermesShadow {}",
}


def write(root: pathlib.Path, rel_path: str, content: str) -> None:
    full_path = root / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")


def build_valid_fixture_tree(root: pathlib.Path) -> None:
    write(root, "HermesMobile/Config/AppFont.swift", VALID_APP_FONT)
    write(root, "HermesMobile/Config/HermesSpacing.swift", VALID_HERMES_SPACING)
    for rel_path, snippet in SIMPLE_SNIPPETS.items():
        write(root, rel_path, snippet)
    write(
        root,
        "HermesMobile/Features/Insights/InsightsView.swift",
        "struct InsightsView: View {\n    var body: some View { Picker(\"\", selection: .constant(0)) { }.pickerStyle(.segmented) }\n}",
    )
    write(
        root,
        "HermesMobile/Features/Tasks/TasksView.swift",
        "struct TasksView: View {\n    var body: some View { Picker(\"\", selection: .constant(0)) { }.pickerStyle(.segmented) }\n}",
    )
    write(
        root,
        "HermesMobile/Features/Skills/SkillsView.swift",
        "struct SkillsView: View {\n    var body: some View { ContentUnavailableView(\"Empty\", systemImage: \"tray\") }\n}",
    )
    write(
        root,
        "HermesMobile/Features/SessionList/SessionListComponents.swift",
        "struct SessionListComponents: View {\n    var body: some View { List {}.searchable(text: .constant(\"\"), prompt: \"Search sessions\") }\n}",
    )


class RequiredFilesAndSnippetsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        # Reduce the three frozen baselines to what this fixture tree actually contains, so these
        # tests are isolated from the real repository's exact counts.
        self._orig_segmented = audit.SEGMENTED_CONTROL_BASELINE
        self._orig_content_unavailable = audit.CONTENT_UNAVAILABLE_BASELINE
        self._orig_searchable = audit.SEARCHABLE_BASELINE
        audit.SEGMENTED_CONTROL_BASELINE = {
            "HermesMobile/Features/Insights/InsightsView.swift": 1,
            "HermesMobile/Features/Tasks/TasksView.swift": 1,
        }
        audit.CONTENT_UNAVAILABLE_BASELINE = {
            "HermesMobile/Features/Skills/SkillsView.swift": 1,
        }
        audit.SEARCHABLE_BASELINE = {
            "HermesMobile/Features/SessionList/SessionListComponents.swift": 1,
        }
        self.addCleanup(self._restore_baselines)

    def _restore_baselines(self):
        audit.SEGMENTED_CONTROL_BASELINE = self._orig_segmented
        audit.CONTENT_UNAVAILABLE_BASELINE = self._orig_content_unavailable
        audit.SEARCHABLE_BASELINE = self._orig_searchable

    def test_valid_foundation_passes(self):
        build_valid_fixture_tree(self.root)
        self.assertEqual(audit.run(self.root), [])

    def test_scope_documentation_names_all_three_frozen_baselines(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("three pre-existing production baselines", source)
        self.assertIn("Only the three explicitly frozen baselines below are enforced", source)
        self.assertNotIn("Only the two explicitly frozen baselines below are enforced", source)

    def test_missing_required_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermesCard.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any("missing required foundation file" in f and "HermesCard.swift" in f for f in failures),
            failures,
        )

    def test_missing_required_snippet_fails(self):
        build_valid_fixture_tree(self.root)
        write(self.root, "HermesMobile/Features/Shared/HermesCard.swift", "// no HermesCardSurface here")
        failures = audit.run(self.root)
        self.assertTrue(
            any("missing load-bearing snippet" in f and "HermesCard.swift" in f for f in failures),
            failures,
        )

    def test_icon_scale_drift_fails(self):
        build_valid_fixture_tree(self.root)
        drifted = VALID_HERMES_SPACING.replace(
            "static let extraLarge: CGFloat = 32", "static let extraLarge: CGFloat = 28"
        )
        write(self.root, "HermesMobile/Config/HermesSpacing.swift", drifted)
        failures = audit.run(self.root)
        self.assertTrue(any("rejected size" in f and "28" in f for f in failures), failures)

    def test_icon_scale_missing_approved_size_fails(self):
        build_valid_fixture_tree(self.root)
        missing = VALID_HERMES_SPACING.replace("static let xs: CGFloat = 12\n    ", "")
        write(self.root, "HermesMobile/Config/HermesSpacing.swift", missing)
        failures = audit.run(self.root)
        self.assertTrue(any("missing approved named size" in f and "12" in f for f in failures), failures)

    def test_avatar_pairing_drift_fails(self):
        build_valid_fixture_tree(self.root)
        drifted = VALID_HERMES_SPACING.replace(
            "static let small = HermesIconSize.medium", "static let small = HermesIconSize.small"
        )
        write(self.root, "HermesMobile/Config/HermesSpacing.swift", drifted)
        failures = audit.run(self.root)
        self.assertTrue(
            any("HermesAvatarSize.small" in f and "expected 20pt" in f for f in failures), failures
        )

    def test_new_native_segmented_control_path_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Kanban/KanbanLabView.swift",
            "struct KanbanLabView: View {\n    var body: some View { Picker(\"\", selection: .constant(0)) { }.pickerStyle(.segmented) }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "native segmented control" in f and "new, unfrozen call site" in f and "KanbanLabView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_increased_native_segmented_control_count_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Tasks/TasksView.swift",
            (
                "struct TasksView: View {\n"
                "    var body: some View { Picker(\"\", selection: .constant(0)) { }.pickerStyle(.segmented) }\n"
                "    var body2: some View { Picker(\"\", selection: .constant(0)) { }.pickerStyle(.segmented) }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "native segmented control" in f and "increased from 1 to 2" in f and "TasksView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_new_direct_searchable_path_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Kanban/KanbanLabView.swift",
            "struct KanbanLabView: View {\n    var body: some View { List {}.searchable(text: .constant(\"\"), prompt: \"Search Cards\") }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct .searchable" in f and "new, unfrozen call site" in f and "KanbanLabView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_increased_direct_searchable_count_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/SessionList/SessionListComponents.swift",
            (
                "struct SessionListComponents: View {\n"
                "    var body: some View { List {}.searchable(text: .constant(\"\"), prompt: \"Search sessions\") }\n"
                "    var body2: some View { List {}.searchable(text: .constant(\"\"), prompt: \"Search sessions\") }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct .searchable" in f and "increased from 1 to 2" in f and "SessionListComponents.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_searchable_baseline_ignores_the_shared_hermes_search_wrapper_itself(self):
        build_valid_fixture_tree(self.root)
        # HermesSearch.swift forwards to native `.searchable` without a leading dot (an implicit
        # `self` call inside the View extension), but exercise the exclusion directly regardless.
        write(
            self.root,
            "HermesMobile/Features/Shared/HermesSearch.swift",
            "extension View {\n    func hermesSearch(text: Binding<String>) -> some View { self.searchable(text: text) }\n}",
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermesSearch.swift" in f for f in failures),
            failures,
        )

    def test_new_direct_content_unavailable_path_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Memory/MemoryView.swift",
            "struct MemoryView: View {\n    var body: some View { ContentUnavailableView(\"Empty\", systemImage: \"tray\") }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct ContentUnavailableView" in f and "new, unfrozen call site" in f and "MemoryView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_increased_content_unavailable_count_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Skills/SkillsView.swift",
            (
                "struct SkillsView: View {\n"
                "    var body: some View { ContentUnavailableView(\"Empty\", systemImage: \"tray\") }\n"
                "    var body2: some View { ContentUnavailableView(\"Also Empty\", systemImage: \"tray\") }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct ContentUnavailableView" in f and "increased from 1 to 2" in f and "SkillsView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_content_unavailable_baseline_ignores_the_canonical_hermes_content_unavailable_file_itself(self):
        build_valid_fixture_tree(self.root)
        # HermesContentUnavailable.swift's own required snippet references "View", not
        # ContentUnavailableView, but exercise the exclusion directly regardless.
        write(
            self.root,
            "HermesMobile/Features/Shared/HermesContentUnavailable.swift",
            "struct HermesContentUnavailable: View {\n    var body: some View { ContentUnavailableView(\"x\") }\n}",
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermesContentUnavailable.swift" in f for f in failures),
            failures,
        )

    def test_unchanged_approved_legacy_baselines_do_not_fail(self):
        build_valid_fixture_tree(self.root)
        failures = audit.run(self.root)
        segmented_failures = [f for f in failures if "segmented" in f]
        content_unavailable_failures = [f for f in failures if "ContentUnavailableView" in f]
        searchable_failures = [f for f in failures if "direct .searchable" in f]
        self.assertEqual(segmented_failures, [])
        self.assertEqual(content_unavailable_failures, [])
        self.assertEqual(searchable_failures, [])

    def test_a_baseline_path_that_disappears_entirely_is_not_a_failure(self):
        # Migrating a call site away entirely (fewer files matching) is allowed without updating the
        # baseline first — only new paths or increased counts fail.
        build_valid_fixture_tree(self.root)
        write(self.root, "HermesMobile/Features/Tasks/TasksView.swift", "struct TasksView: View {}")
        failures = audit.run(self.root)
        self.assertFalse(any("TasksView.swift" in f for f in failures), failures)


class CliTests(unittest.TestCase):
    def test_cli_exits_nonzero_with_readable_failures_on_a_broken_fixture(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            build_valid_fixture_tree(root)
            (root / "HermesMobile/Features/Shared/HermesCard.swift").unlink()
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing required foundation file", result.stderr)
            self.assertIn("HermesCard.swift", result.stderr)

    def test_cli_exits_zero_on_a_valid_fixture(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            build_valid_fixture_tree(root)
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("OK", result.stdout)

    def test_passes_against_the_real_repository(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
