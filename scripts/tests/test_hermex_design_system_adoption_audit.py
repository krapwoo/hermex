import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_design_system_adoption_audit import audit_contract  # noqa: E402


SEGMENTED_PATH = "HermesMobile/Features/Shared/SegmentedControl.swift"
APP_FONT_PATH = "HermesMobile/Config/AppFont.swift"
CARD_PATH = "HermesMobile/Features/Shared/HermesCard.swift"
SECTION_CARD_PATH = "HermesMobile/Features/Shared/SectionCard.swift"
TIP_JAR_PATH = "HermesMobile/Features/SessionList/TipJarCard.swift"
SESSION_COMPONENTS_PATH = "HermesMobile/Features/SessionList/SessionListComponents.swift"
SESSION_ITEM_PATH = "HermesMobile/Features/SessionList/SessionListItem.swift"


def passing_files():
    return {
        SEGMENTED_PATH: """
struct SegmentedControl<Value: Hashable>: View {
    case fixed
    case scrolling
    matchedGeometryEffect(id: "selection", in: selectionAnimation)
    SegmentedControlMetrics.visualHeight
    SegmentedControlMetrics.minimumTouchHeight
    HermesMotion.Bundle.contentReposition
    .subheadlineSemibold
    .appFont(.mono12)
}
""",
        APP_FONT_PATH: """
case headlineSemibold
case subheadlineSemibold
case captionSemibold
case mono14
case mono12
""",
        CARD_PATH: """
struct HermesCard<Content: View>: View {
    case outlined
    Color(.systemBackground)
    Color(.separator)
}
""",
        SECTION_CARD_PATH: """
struct SectionCard<Content: View>: View {
    cardContent.hermesCardSurface(surface, cornerRadius: HermesRadius.r20)
}
""",
        TIP_JAR_PATH: """
SectionCard(surface: .outlined) {
    BotAvatarMarkView(
    .buttonStyle(.hermes(.medium, emphasis: .brandPrimary))
}
""",
        SESSION_COMPONENTS_PATH: """
struct SidebarNavButton: View {
    Text(title)
        .appFont(.label)
}
struct SidebarDisclosureButton: View {
    Text(title)
        .appFont(.label)
}
""",
        SESSION_ITEM_PATH: """
Text(title)
    .appFont(.body, weight: .semibold)
Text(attentionStateText)
    .appFont(.captionSemibold)
""",
    }


class DesignSystemAdoptionAuditTests(unittest.TestCase):
    def test_approved_design_system_contract_passes(self):
        self.assertEqual(audit_contract(passing_files()), [])

    def test_native_segmented_picker_is_rejected_anywhere_in_production(self):
        files = passing_files()
        files["HermesMobile/Features/Tasks/TasksView.swift"] = ".pickerStyle(.segmented)"

        failures = audit_contract(files)

        self.assertTrue(any("native segmented Picker" in failure for failure in failures))

    def test_section_card_must_not_recreate_card_chrome(self):
        files = passing_files()
        files[SECTION_CARD_PATH] += "\n.stroke(Color(.separator))"

        failures = audit_contract(files)

        self.assertTrue(any("SectionCard must delegate chrome" in failure for failure in failures))

    def test_main_menu_requires_hermex_label_typography(self):
        files = passing_files()
        files[SESSION_COMPONENTS_PATH] = files[SESSION_COMPONENTS_PATH].replace(
            ".appFont(.label)", ".font(.body)", 1
        )

        failures = audit_contract(files)

        self.assertTrue(any("SidebarNavButton" in failure for failure in failures))

    def test_named_typography_roles_are_required(self):
        files = passing_files()
        files[APP_FONT_PATH] = files[APP_FONT_PATH].replace("case mono12\n", "")

        failures = audit_contract(files)

        self.assertTrue(any("mono12" in failure for failure in failures))


if __name__ == "__main__":
    unittest.main()
