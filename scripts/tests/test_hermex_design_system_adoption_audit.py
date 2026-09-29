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
    "HermesMobile/Features/Shared/HermexCard.swift": "enum HermexCardSurface { case glass }",
    "HermesMobile/Features/Shared/HermexButton.swift": (
        "struct HermexButtonStyle: ButtonStyle {}\nstruct HermexButtonPressOnlyStyle: ButtonStyle {}"
    ),
    "HermesMobile/Features/Shared/HermexCheckbox.swift": "struct HermexCheckbox: View {}",
    "HermesMobile/Features/Shared/HermexRadio.swift": "struct HermexRadio: View {}",
    "HermesMobile/Features/Shared/HermexSelectionSheet.swift": (
        "import SwiftUI\n"
        "struct HermexSelectionSheetOption<Value: Hashable>: Identifiable {\n"
        "    let value: Value\n"
        "    var id: Value { value }\n"
        "}\n"
        "struct HermexSelectionSheet<Value: Hashable>: View {\n"
        "    var body: some View {\n"
        "        HermexBottomSheet(\"Select\") { EmptyView() }\n"
        "    }\n"
        "}"
    ),
    "HermesMobile/Features/Shared/HermexToast.swift": "struct HermexToast: View {}",
    "HermesMobile/Features/Shared/HermexTooltip.swift": "struct HermexTooltip: View {}",
    "HermesMobile/Features/Shared/HermexAvatar.swift": "struct HermexAvatar: View {}",
    "HermesMobile/Features/Shared/HermexDivider.swift": "struct HermexDivider: View {}",
    "HermesMobile/Features/Shared/HermexContentUnavailable.swift": "struct HermexContentUnavailable: View {}",
    "HermesMobile/Features/Shared/ListItem.swift": "struct ListItem<Leading: View>: View {}",
    "HermesMobile/Features/Shared/HermexList.swift": (
        "struct HermexList<Content: View>: View {\n"
        "    enum Style {\n"
        "        case standard\n"
        "        case compactOverlay\n"
        "    }\n"
        "}"
    ),
    "HermesMobile/Features/Shared/SegmentedControl.swift": "struct SegmentedControl<Value: Hashable>: View {}",
    "HermesMobile/Features/Shared/TopNav.swift": "struct TopNav: ToolbarContent {}",
    "HermesMobile/Features/Shared/Banner.swift": "struct Banner: View {}",
    "HermesMobile/Features/Shared/Tag.swift": "struct Tag: View {}",
    "HermesMobile/Features/Shared/AttachmentFileType.swift": "enum AttachmentFileType {}",
    "HermesMobile/Features/Shared/AttachmentTile.swift": "struct AttachmentTile: View {}",
    "HermesMobile/Features/Shared/SkeletonPlaceholder.swift": "struct SkeletonPlaceholder: View {}",
    "HermesMobile/Features/Shared/HermexSearch.swift": (
        "import SwiftUI\n"
        "struct HermexSearchField: View {\n"
        "    var body: some View { EmptyView() }\n"
        "}\n"
        "extension View {\n"
        "    func hermexSearch(\n"
        "        _ titleKey: LocalizedStringKey,\n"
        "        text: Binding<String>\n"
        "    ) -> some View {\n"
        "        safeAreaInset(edge: .top, spacing: 0) {\n"
        "            HermexSearchField(titleKey, text: text)\n"
        "        }\n"
        "    }\n"
        "}"
    ),
    "HermesMobile/Features/Shared/HermexTextInput.swift": (
        "struct HermexTextField: View {}\n"
        "struct HermexSecureField: View {}\n"
        "struct HermexNumberField<Value, Format: ParseableFormatStyle>: View "
        "where Format.FormatInput == Value, Format.FormatOutput == String {}"
    ),
    "HermesMobile/Features/Shared/HermexBottomSheet.swift": (
        "struct HermexBottomSheet<Content: View>: View {\n"
        "    enum FooterAxis {\n"
        "        case horizontal\n"
        "        case vertical\n"
        "    }\n"
        "}"
    ),
    "HermesMobile/Features/Shared/HermexSameWindowOverlay.swift": (
        "struct HermexSameWindowOverlay<Overlay: View>: UIViewControllerRepresentable {}"
    ),
    "HermesMobile/Features/Shared/HermexOverlayLifecycle.swift": (
        "struct HermexOverlayLifecycle {}\nstruct HermexOverlayActionContext {}"
    ),
    "HermesMobile/Features/Shared/HermexDialog.swift": (
        "enum HermexDialogFooterAxis {\n"
        "    case horizontal\n"
        "    case vertical\n"
        "}\n"
        "extension View {\n"
        "    func hermexDialog() -> some View { self }\n"
        "}"
    ),
    "HermesMobile/Features/Shared/HermexPopoverMenu.swift": (
        "struct HermexPopoverMenuAction {}\n"
        "extension View {\n"
        "    func hermexPopoverMenu(\n"
        "        isPresented: Binding<Bool>,\n"
        "        accessibilityLabel: Text,\n"
        "        actions: [HermexPopoverMenuAction]\n"
        "    ) -> some View { self }\n"
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
    write(
        root,
        "HermesMobile/Features/Onboarding/OnboardingConnectPage.swift",
        (
            "struct OnboardingConnectPage: View {\n"
            "    var body: some View { TextField(\"Server\", text: .constant(\"\")) }\n"
            "    var body2: some View { SecureField(\"Password\", text: .constant(\"\")) }\n"
            "}"
        ),
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
        self._orig_text_field = audit.TEXT_FIELD_BASELINE
        self._orig_secure_field = audit.SECURE_FIELD_BASELINE
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
        audit.TEXT_FIELD_BASELINE = {
            "HermesMobile/Features/Onboarding/OnboardingConnectPage.swift": 1,
        }
        audit.SECURE_FIELD_BASELINE = {
            "HermesMobile/Features/Onboarding/OnboardingConnectPage.swift": 1,
        }
        self.addCleanup(self._restore_baselines)

    def _restore_baselines(self):
        audit.SEGMENTED_CONTROL_BASELINE = self._orig_segmented
        audit.CONTENT_UNAVAILABLE_BASELINE = self._orig_content_unavailable
        audit.SEARCHABLE_BASELINE = self._orig_searchable
        audit.TEXT_FIELD_BASELINE = self._orig_text_field
        audit.SECURE_FIELD_BASELINE = self._orig_secure_field

    def test_valid_foundation_passes(self):
        build_valid_fixture_tree(self.root)
        self.assertEqual(audit.run(self.root), [])

    def test_scope_documentation_names_all_five_frozen_baselines(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertIn("five pre-existing production baselines", source)
        self.assertIn("Only the five explicitly frozen baselines below are enforced", source)
        self.assertNotIn("Only the three explicitly frozen baselines below are enforced", source)

    def test_missing_required_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexCard.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any("missing required foundation file" in f and "HermexCard.swift" in f for f in failures),
            failures,
        )

    def test_missing_required_snippet_fails(self):
        build_valid_fixture_tree(self.root)
        write(self.root, "HermesMobile/Features/Shared/HermexCard.swift", "// no HermexCardSurface here")
        failures = audit.run(self.root)
        self.assertTrue(
            any("missing load-bearing snippet" in f and "HermexCard.swift" in f for f in failures),
            failures,
        )

    def test_missing_bottom_sheet_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexBottomSheet.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexBottomSheet.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_drifted_bottom_sheet_declaration_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexBottomSheet.swift",
            "// HermexBottomSheet renamed away, no FooterAxis either",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexBottomSheet.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_bottom_sheet_missing_footer_axis_enum_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexBottomSheet.swift",
            "struct HermexBottomSheet<Content: View>: View {}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexBottomSheet.swift" in f and "FooterAxis" in f
                for f in failures
            ),
            failures,
        )

    def test_missing_dialog_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexDialog.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexDialog.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_drifted_dialog_declaration_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexDialog.swift",
            "// HermexDialog renamed away, no hermexDialog( either",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexDialog.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_dialog_missing_footer_axis_enum_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexDialog.swift",
            "extension View {\n    func hermexDialog() -> some View { self }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexDialog.swift" in f and "HermexDialogFooterAxis" in f
                for f in failures
            ),
            failures,
        )

    # ─── Selection Sheet family slice / Dropdown retirement (Issue #607, test-first phase) ────────
    # `HermexSelectionSheet.swift` does not exist yet and `HermexDropdown.swift` has not been
    # deleted yet — Task 3 of the Selection Sheet implementation plan ships the retirement and the
    # addition together. Until then these tests pin the contract that slice must satisfy.

    def test_missing_selection_sheet_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexSelectionSheet.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexSelectionSheet.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_drifted_selection_sheet_declaration_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexSelectionSheet.swift",
            "// HermexSelectionSheet renamed away, no HermexSelectionSheetOption either",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexSelectionSheet.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_selection_sheet_missing_bottom_sheet_composition_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexSelectionSheet.swift",
            (
                "struct HermexSelectionSheetOption<Value: Hashable>: Identifiable {\n"
                "    let value: Value\n"
                "    var id: Value { value }\n"
                "}\n"
                "struct HermexSelectionSheet<Value: Hashable>: View {\n"
                "    var body: some View { EmptyView() }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f
                and "HermexSelectionSheet.swift" in f
                and "HermexBottomSheet" in f
                for f in failures
            ),
            "expected the audit to require Selection Sheet to compose HermexBottomSheet(, not a "
            f"bespoke presentation: {failures}",
        )

    def test_the_audit_module_no_longer_declares_the_retired_hermex_dropdown_foundation_requirement(self):
        # Confirms REQUIRED_FOUNDATION_FILES was swapped, not merely extended: the audit itself must
        # no longer require HermexDropdown.swift once Selection Sheet replaces it as the registered
        # Hermex foundation for this role.
        self.assertNotIn("HermesMobile/Features/Shared/HermexDropdown.swift", audit.REQUIRED_FOUNDATION_FILES)
        self.assertIn("HermesMobile/Features/Shared/HermexSelectionSheet.swift", audit.REQUIRED_FOUNDATION_FILES)

    # ─── Popover Menu family slice (test-first phase) ────────────────────────────────────────────
    # `HermexPopoverMenu.swift` and `HermexList`'s `case compactOverlay` do not exist yet — Task 7/8
    # of the implementation plan ship them, along with the audit's own REQUIRED_FOUNDATION_FILES/
    # REQUIRED_SNIPPETS additions, in the same PR. Until then these three regressions are expected
    # to fail red: they pin the contract the *next* audit update must satisfy, not the current one.

    def test_missing_popover_menu_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexPopoverMenu.swift",
            (
                "extension View {\n"
                "    func hermexPopoverMenu() -> some View { self }\n"
                "}\n"
                "struct HermexPopoverMenuAction {}\n"
            ),
        )
        (self.root / "HermesMobile/Features/Shared/HermexPopoverMenu.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexPopoverMenu.swift" in f
                for f in failures
            ),
            "expected the audit to require HermexPopoverMenu.swift once the Popover Menu slice "
            f"lands; currently red because it is not yet a required foundation file: {failures}",
        )

    def test_drifted_popover_menu_declaration_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexPopoverMenu.swift",
            "// HermexPopoverMenu renamed away, no hermexPopoverMenu( either",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexPopoverMenu.swift" in f
                for f in failures
            ),
            "expected the audit to pin hermexPopoverMenu(/HermexPopoverMenuAction once the Popover "
            f"Menu slice lands; currently red because no snippet is required yet: {failures}",
        )

    def test_hermex_list_missing_compact_overlay_case_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexList.swift",
            "struct HermexList<Content: View>: View {}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing load-bearing snippet" in f and "HermexList.swift" in f and "compactOverlay" in f
                for f in failures
            ),
            "expected the audit to pin `case compactOverlay` once the compact-overlay List style "
            f"lands; currently red because it is not yet a required snippet: {failures}",
        )

    def test_missing_same_window_overlay_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexSameWindowOverlay.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexSameWindowOverlay.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_missing_overlay_lifecycle_foundation_file_fails(self):
        build_valid_fixture_tree(self.root)
        (self.root / "HermesMobile/Features/Shared/HermexOverlayLifecycle.swift").unlink()
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "missing required foundation file" in f and "HermexOverlayLifecycle.swift" in f
                for f in failures
            ),
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

    def test_hermex_search_swift_is_no_longer_excluded_and_a_stray_searchable_call_fails(self):
        build_valid_fixture_tree(self.root)
        # Unlike the old thin-wrapper foundation, the custom HermexSearchField/.hermexSearch
        # implementation must never call native `.searchable` again — HermexSearch.swift is no
        # longer excluded from this accounting, so a stray `.searchable(` call inside it now fails
        # like any other new, unfrozen call site.
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexSearch.swift",
            (
                "import SwiftUI\n"
                "struct HermexSearchField: View {\n"
                "    var body: some View { EmptyView().searchable(text: .constant(\"\")) }\n"
                "}\n"
                "extension View {\n"
                "    func hermexSearch(\n"
                "        _ titleKey: LocalizedStringKey,\n"
                "        text: Binding<String>\n"
                "    ) -> some View {\n"
                "        safeAreaInset(edge: .top, spacing: 0) {\n"
                "            HermexSearchField(titleKey, text: text)\n"
                "        }\n"
                "    }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct .searchable" in f
                and "new, unfrozen call site" in f
                and "HermexSearch.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_new_direct_text_field_path_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Kanban/KanbanLabView.swift",
            "struct KanbanLabView: View {\n    var body: some View { TextField(\"Title\", text: .constant(\"\")) }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct TextField" in f and "new, unfrozen call site" in f and "KanbanLabView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_increased_direct_text_field_count_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Onboarding/OnboardingConnectPage.swift",
            (
                "struct OnboardingConnectPage: View {\n"
                "    var body: some View { TextField(\"Server\", text: .constant(\"\")) }\n"
                "    var body2: some View { TextField(\"Username\", text: .constant(\"\")) }\n"
                "    var body3: some View { SecureField(\"Password\", text: .constant(\"\")) }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct TextField" in f and "increased from 1 to 2" in f and "OnboardingConnectPage.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_text_field_baseline_ignores_the_shared_hermes_text_input_wrapper_itself(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexTextInput.swift",
            (
                "struct HermexTextField: View {\n"
                "    var body: some View { TextField(\"x\", text: .constant(\"\")) }\n"
                "}\n"
                "struct HermexSecureField: View {}\n"
                "struct HermexNumberField<Value, Format: ParseableFormatStyle>: View "
                "where Format.FormatInput == Value, Format.FormatOutput == String {}"
            ),
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermexTextInput.swift" in f for f in failures),
            failures,
        )

    def test_text_field_baseline_ignores_the_hermex_search_field_itself(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexSearch.swift",
            (
                "import SwiftUI\n"
                "struct HermexSearchField: View {\n"
                "    var body: some View { TextField(\"x\", text: .constant(\"\")) }\n"
                "}\n"
                "extension View {\n"
                "    func hermexSearch(\n"
                "        _ titleKey: LocalizedStringKey,\n"
                "        text: Binding<String>\n"
                "    ) -> some View {\n"
                "        safeAreaInset(edge: .top, spacing: 0) {\n"
                "            HermexSearchField(titleKey, text: text)\n"
                "        }\n"
                "    }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermexSearch.swift" in f and "direct TextField" in f for f in failures),
            failures,
        )

    def test_new_direct_secure_field_path_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Kanban/KanbanLabView.swift",
            "struct KanbanLabView: View {\n    var body: some View { SecureField(\"Token\", text: .constant(\"\")) }\n}",
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct SecureField" in f and "new, unfrozen call site" in f and "KanbanLabView.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_increased_direct_secure_field_count_fails(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Onboarding/OnboardingConnectPage.swift",
            (
                "struct OnboardingConnectPage: View {\n"
                "    var body: some View { TextField(\"Server\", text: .constant(\"\")) }\n"
                "    var body2: some View { SecureField(\"Password\", text: .constant(\"\")) }\n"
                "    var body3: some View { SecureField(\"PIN\", text: .constant(\"\")) }\n"
                "}"
            ),
        )
        failures = audit.run(self.root)
        self.assertTrue(
            any(
                "direct SecureField" in f and "increased from 1 to 2" in f and "OnboardingConnectPage.swift" in f
                for f in failures
            ),
            failures,
        )

    def test_secure_field_baseline_ignores_the_shared_hermes_text_input_wrapper_itself(self):
        build_valid_fixture_tree(self.root)
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexTextInput.swift",
            (
                "struct HermexTextField: View {}\n"
                "struct HermexSecureField: View {\n"
                "    var body: some View { SecureField(\"x\", text: .constant(\"\")) }\n"
                "}\n"
                "struct HermexNumberField<Value, Format: ParseableFormatStyle>: View "
                "where Format.FormatInput == Value, Format.FormatOutput == String {}"
            ),
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermexTextInput.swift" in f for f in failures),
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
        # HermexContentUnavailable.swift's own required snippet references "View", not
        # ContentUnavailableView, but exercise the exclusion directly regardless.
        write(
            self.root,
            "HermesMobile/Features/Shared/HermexContentUnavailable.swift",
            "struct HermexContentUnavailable: View {\n    var body: some View { ContentUnavailableView(\"x\") }\n}",
        )
        failures = audit.run(self.root)
        self.assertFalse(
            any("HermexContentUnavailable.swift" in f for f in failures),
            failures,
        )

    def test_unchanged_approved_legacy_baselines_do_not_fail(self):
        build_valid_fixture_tree(self.root)
        failures = audit.run(self.root)
        segmented_failures = [f for f in failures if "segmented" in f]
        content_unavailable_failures = [f for f in failures if "ContentUnavailableView" in f]
        searchable_failures = [f for f in failures if "direct .searchable" in f]
        text_field_failures = [f for f in failures if "direct TextField" in f]
        secure_field_failures = [f for f in failures if "direct SecureField" in f]
        self.assertEqual(segmented_failures, [])
        self.assertEqual(content_unavailable_failures, [])
        self.assertEqual(searchable_failures, [])
        self.assertEqual(text_field_failures, [])
        self.assertEqual(secure_field_failures, [])

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
            (root / "HermesMobile/Features/Shared/HermexCard.swift").unlink()
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing required foundation file", result.stderr)
            self.assertIn("HermexCard.swift", result.stderr)

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
