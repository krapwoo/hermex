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
SESSION_LIST_VIEW_PATH = "HermesMobile/Features/SessionList/SessionListView.swift"
KANBAN_LAB_PATH = "HermesMobile/Features/Kanban/KanbanLabView.swift"
INSIGHTS_VIEW_PATH = "HermesMobile/Features/Insights/InsightsView.swift"
PROVIDER_LIMITS_PATH = "HermesMobile/Features/Insights/ProviderLimitsCard.swift"
USAGE_CHART_DATA_PATH = "HermesMobile/Features/Insights/UsageChartData.swift"
USAGE_CHART_CARD_PATH = "HermesMobile/Features/Insights/UsageChartCard.swift"
HERMES_SPACING_PATH = "HermesMobile/Config/HermesSpacing.swift"
CONTENT_UNAVAILABLE_PATH = "HermesMobile/Features/Shared/HermesContentUnavailable.swift"


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
        SESSION_LIST_VIEW_PATH: """
    private var content: some View {
        let groups = scheduledSessionGroups
        return HermesList {
            header
        }
    }
""",
        KANBAN_LAB_PATH: """
    private var emptyContent: some View {
        HermesContentUnavailable(
            variant: model.hasActiveFilters ? .noResults : .empty,
            title: "No matching Cards",
            systemImage: "line.3.horizontal.decrease.circle",
            description: Text("Change or clear the filters to see more Cards."),
            primaryAction: nil
        )
    }
""",
        INSIGHTS_VIEW_PATH: """
    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading && !viewModel.hasLoadedAnalytics {
            HermesContentUnavailable(variant: .loading, description: Text("Loading usage..."))
        } else if let errorMessage = viewModel.errorMessage, !viewModel.hasLoadedAnalytics {
            HermesContentUnavailable(
                variant: .error,
                title: "Could Not Load Usage",
                description: Text(errorMessage)
            )
        } else if !viewModel.hasLoadedAnalytics {
            HermesContentUnavailable(
                variant: .empty,
                title: "No Data",
                systemImage: "chart.bar"
            )
        } else {
            loadedContent
        }
    }
""",
        PROVIDER_LIMITS_PATH: """
struct ProviderLimitsCard: View {
    var body: some View {
        HermesDivider()
        Tag(label: plan, tint: .secondary)
    }
}
private struct ProviderLimitRowView: View {
    private var tintColor: Color {
        switch tint {
        case .normal:
            .accentColor
        case .warning:
            HermesColorRamp.Orange.s500.color
        case .critical:
            HermesColorRamp.Red.s500.color
        }
    }
}
private struct ProviderLimitBar: View {
    var body: some View {
        Capsule()
            .frame(height: HermesUsageSize.balanceBarHeight)
            .frame(width: HermesUsageSize.minimumBalanceFill)
    }
}
""",
        USAGE_CHART_DATA_PATH: """
    var color: Color {
        switch self {
        case .input:
            HermesColorRamp.Blue.s500.color
        case .output:
            HermesColorRamp.Orange.s500.color
        case .cacheRead:
            HermesColorRamp.Cyan.s500.color
        case .cost:
            HermesColorRamp.Purple.s600.color
        case .sessions:
            HermesColorRamp.Purple.s500.color
        }
    }
""",
        USAGE_CHART_CARD_PATH: """
struct UsageChartCard: View {
    var body: some View {
        Circle().frame(width: HermesUsageSize.legendIndicator, height: HermesUsageSize.legendIndicator)
    }
    private var chart: some View {
        Chart {}
            .frame(height: HermesUsageSize.chartHeight)
    }
}
""",
        HERMES_SPACING_PATH: """
enum HermesUsageSize {
    static let chartHeight: CGFloat = 180
    static let legendIndicator: CGFloat = 7
    static let balanceBarHeight: CGFloat = 8
    static let minimumBalanceFill: CGFloat = 8
}
""",
        CONTENT_UNAVAILABLE_PATH: """
struct HermesContentUnavailable: View {
    enum Variant {
        case loading
        case empty
        case noResults
        case error
        case unavailable
        case custom
    }
}
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

    # MARK: - #607 correction slice

    def test_main_menu_hermes_list_regression_is_rejected(self):
        files = passing_files()
        files[SESSION_LIST_VIEW_PATH] = files[SESSION_LIST_VIEW_PATH].replace(
            "return HermesList {", "return List {"
        )

        failures = audit_contract(files)

        self.assertTrue(any("HermesList" in failure for failure in failures))

    def test_kanban_empty_content_regression_to_direct_content_unavailable_is_rejected(self):
        files = passing_files()
        files[KANBAN_LAB_PATH] = """
    private var emptyContent: some View {
        ContentUnavailableView {
            Label("No matching Cards", systemImage: "line.3.horizontal.decrease.circle")
        }
    }
"""

        failures = audit_contract(files)

        self.assertTrue(any(KANBAN_LAB_PATH in failure and "emptyContent" in failure for failure in failures))

    def test_insights_states_regression_to_direct_content_unavailable_is_rejected(self):
        files = passing_files()
        files[INSIGHTS_VIEW_PATH] = files[INSIGHTS_VIEW_PATH].replace(
            'HermesContentUnavailable(variant: .loading, description: Text("Loading usage..."))',
            'ProgressView("Loading usage...")',
        )

        failures = audit_contract(files)

        self.assertTrue(any(INSIGHTS_VIEW_PATH in failure for failure in failures))

    def test_provider_limits_raw_divider_regression_is_rejected(self):
        files = passing_files()
        files[PROVIDER_LIMITS_PATH] = files[PROVIDER_LIMITS_PATH].replace("HermesDivider()", "Divider()")

        failures = audit_contract(files)

        self.assertTrue(any("raw Divider" in failure for failure in failures))

    def test_provider_limits_feature_local_plan_capsule_regression_is_rejected(self):
        files = passing_files()
        files[PROVIDER_LIMITS_PATH] += "\n.stroke(Color.primary.opacity(0.18), lineWidth: 0.8)"

        failures = audit_contract(files)

        self.assertTrue(any("plan-capsule chrome" in failure for failure in failures))

    def test_usage_chart_retired_raw_color_regression_is_rejected(self):
        files = passing_files()
        files[USAGE_CHART_DATA_PATH] = files[USAGE_CHART_DATA_PATH].replace(
            "HermesColorRamp.Blue.s500.color\n", ".blue\n"
        )

        failures = audit_contract(files)

        self.assertTrue(any("retired raw named color" in failure for failure in failures))

    def test_provider_limits_retired_raw_tint_color_regression_is_rejected(self):
        files = passing_files()
        files[PROVIDER_LIMITS_PATH] = files[PROVIDER_LIMITS_PATH].replace(
            "case .warning:\n            HermesColorRamp.Orange.s500.color",
            "case .warning:\n            .orange",
        )

        failures = audit_contract(files)

        self.assertTrue(any("retired raw named tint color" in failure for failure in failures))

    def test_usage_size_token_drift_is_rejected(self):
        files = passing_files()
        files[HERMES_SPACING_PATH] = files[HERMES_SPACING_PATH].replace(
            "chartHeight: CGFloat = 180", "chartHeight: CGFloat = 200"
        )

        failures = audit_contract(files)

        self.assertTrue(any("HermesUsageSize" in failure for failure in failures))

    def test_usage_chart_card_un_tokenized_height_regression_is_rejected(self):
        files = passing_files()
        files[USAGE_CHART_CARD_PATH] = files[USAGE_CHART_CARD_PATH].replace(
            "HermesUsageSize.chartHeight", "180"
        ) + "\nprivate static let chartHeight: CGFloat = 180"

        failures = audit_contract(files)

        self.assertTrue(any("un-tokenized chart height" in failure for failure in failures))

    def test_provider_limits_un_tokenized_balance_bar_height_regression_is_rejected(self):
        files = passing_files()
        files[PROVIDER_LIMITS_PATH] = files[PROVIDER_LIMITS_PATH].replace(
            "HermesUsageSize.balanceBarHeight", "8"
        )

        failures = audit_contract(files)

        self.assertTrue(any("un-tokenized balance-bar height" in failure for failure in failures))

    def test_new_direct_content_unavailable_site_outside_baseline_is_rejected(self):
        files = passing_files()
        files["HermesMobile/Features/NewFeature/NewFeatureView.swift"] = """
struct NewFeatureView: View {
    var body: some View {
        ContentUnavailableView {
            Label("Nothing here", systemImage: "tray")
        }
    }
}
"""

        failures = audit_contract(files)

        self.assertTrue(
            any("NewFeatureView.swift" in failure and "new direct ContentUnavailableView" in failure for failure in failures)
        )

    def test_new_direct_content_unavailable_convenience_initializer_is_rejected(self):
        files = passing_files()
        files["HermesMobile/Features/NewFeature/NewFeatureView.swift"] = """
struct NewFeatureView: View {
    var body: some View {
        ContentUnavailableView("Nothing here", systemImage: "tray")
    }
}
"""

        failures = audit_contract(files)

        self.assertTrue(
            any("NewFeatureView.swift" in failure and "new direct ContentUnavailableView" in failure for failure in failures)
        )

    def test_increased_direct_content_unavailable_usage_beyond_baseline_is_rejected(self):
        files = passing_files()
        files["HermesMobile/Features/Skills/SkillsView.swift"] = "\n".join(
            "ContentUnavailableView {\n}" for _ in range(7)
        )

        failures = audit_contract(files)

        self.assertTrue(
            any(
                "HermesMobile/Features/Skills/SkillsView.swift" in failure and "grew from" in failure
                for failure in failures
            )
        )

    def test_baseline_count_at_or_below_the_retained_ceiling_is_accepted(self):
        files = passing_files()
        files["HermesMobile/Features/Skills/SkillsView.swift"] = "\n".join(
            "ContentUnavailableView {\n}" for _ in range(6)
        )

        failures = audit_contract(files)

        self.assertFalse(any("SkillsView.swift" in failure for failure in failures))

    def test_content_unavailable_search_call_is_never_flagged_by_the_baseline_guard(self):
        files = passing_files()
        files["HermesMobile/Features/Shared/SomeSearchSheet.swift"] = "ContentUnavailableView.search(text: query)"

        failures = audit_contract(files)

        self.assertFalse(any("SomeSearchSheet.swift" in failure for failure in failures))


if __name__ == "__main__":
    unittest.main()
