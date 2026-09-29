import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `ListItem` (`ListItem.swift`): its shared metrics, default state, and the
/// defaulted-initializer/haptic-feedback compile contracts.
final class ListItemTests: XCTestCase {
    // MARK: - Pure contracts

    func testMetricsMatchTheExistingPickerRowGeometry() {
        XCTAssertEqual(ListItemMetrics.minHeight, 48)
        XCTAssertEqual(ListItemMetrics.cornerRadius, HermesRadius.field)
    }

    func testStateDefaultsToNormal() {
        let state = ListItemState()
        XCTAssertFalse(state.isSelected)
        XCTAssertFalse(state.isPending)
        XCTAssertFalse(state.isDisabled)
    }

    // MARK: - Compile contract

    func testEveryDefaultedInitializerCompiles() {
        let plain = ListItem(title: Text("Server default"), action: {})
        let withLeading = ListItem(title: Text("Row"), action: {}, leading: { Image(systemName: "circle") })
        let withTrailing = ListItem(title: Text("Row"), action: {}, trailingAccessory: { Image(systemName: "star") })
        let full = ListItem(
            title: Text("Row"),
            subtitle: Text("Detail"),
            action: {},
            leading: { Image(systemName: "circle") },
            titleAccessory: { Tag(label: "Selected", tint: .accentColor) },
            trailingAccessory: { Image(systemName: "star") }
        )
        XCTAssertFalse(String(describing: type(of: plain)).isEmpty)
        XCTAssertFalse(String(describing: type(of: withLeading)).isEmpty)
        XCTAssertFalse(String(describing: type(of: withTrailing)).isEmpty)
        XCTAssertFalse(String(describing: type(of: full)).isEmpty)
    }

    // MARK: - Haptic feedback option

    func testHapticFeedbackStyleOptionDefaultsToNilAndCanBeSetExplicitly() {
        let withoutHaptic = ListItem(title: Text("Row"), action: {}, leading: { Image(systemName: "circle") })
        let withHaptic = ListItem(
            title: Text("Row"),
            hapticFeedbackStyle: .light,
            action: {},
            leading: { Image(systemName: "circle") }
        )
        XCTAssertNil(withoutHaptic.hapticFeedbackStyle, "the default must remain a plain native Button")
        XCTAssertEqual(withHaptic.hapticFeedbackStyle, .light)
    }

    // MARK: - Accordion header seams

    func testSemanticTitleRoleAndInRowIndicatorCanBeConfigured() {
        let header = ListItem(
            title: Text("Hermex"),
            titleRole: .label,
            rowIndicatorSystemImage: "chevron.down",
            action: {},
            leading: { Image(systemName: "folder") }
        )

        switch header.titleRole {
        case .label:
            break
        default:
            XCTFail("Accordion headers must be able to request the semantic label role")
        }
        XCTAssertEqual(header.rowIndicatorSystemImage, "chevron.down")
    }

    func testSemanticTitleRoleAndInRowIndicatorKeepExistingDefaults() {
        let row = ListItem(title: Text("Session"), action: {})

        switch row.titleRole {
        case .body:
            break
        default:
            XCTFail("Existing ListItem callers must keep the body role")
        }
        XCTAssertNil(row.rowIndicatorSystemImage)
        XCTAssertEqual(
            row.rowIndicatorSize,
            HermesIconSize.small,
            "existing ListItem callers must keep the current 16pt indicator size"
        )
    }

    func testRowIndicatorSizeCanBeConfiguredForAnAccordionHeaderChevron() {
        let header = ListItem(
            title: Text("Hermex"),
            rowIndicatorSystemImage: "chevron.down",
            rowIndicatorSize: HermesIconSize.medium,
            action: {},
            leading: { Image(systemName: "folder") }
        )
        XCTAssertEqual(header.rowIndicatorSize, HermesIconSize.medium)
    }

    func testRowIndicatorLivesInsideTheRowButtonAndIsAccessibilityHidden() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(src.contains("rowIndicatorSystemImage"))
        XCTAssertTrue(src.contains("Image(systemName: rowIndicatorSystemImage)"))
        XCTAssertTrue(src.contains(".accessibilityHidden(true)"))
        XCTAssertTrue(src.contains(".appFont(titleRole)"))
        XCTAssertTrue(
            src.contains(".font(.system(size: rowIndicatorSize, weight: .semibold))"),
            "the indicator's rendered size must come from the configurable rowIndicatorSize seam, not a hardcoded token"
        )
    }

    // MARK: - Selection Sheet seam: additive, default-preserving selectionChrome (Issue #607)
    //
    // `ListItemSelectionChrome` does not exist yet — Task 2 of the Selection Sheet implementation
    // plan adds it. Before that lands, these are source-only contracts (no compile reference to the
    // missing enum), so the test target itself keeps building while pinning the approved seam: a
    // `.standard` default that preserves every existing caller's current selected pill/checkmark and
    // accessibility behavior unchanged, plus an additive `.indicatorOnly` mode Selection Sheet opts
    // into so a row-owned Radio/Checkbox visual never duplicates the built-in selected mark.

    func testDefinesAnAdditiveSelectionChromeEnumDefaultingToStandard() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(src.contains("enum ListItemSelectionChrome"), "expected a ListItemSelectionChrome enum")
        XCTAssertTrue(src.contains("case standard"), "expected a .standard case")
        XCTAssertTrue(src.contains("case indicatorOnly"), "expected an additive .indicatorOnly case")
        XCTAssertTrue(
            src.contains("var selectionChrome: ListItemSelectionChrome = .standard"),
            "expected a stored selectionChrome property defaulting to .standard"
        )
    }

    func testSelectedAccessibilityTraitStaysDrivenByStateIsSelectedRegardlessOfChrome() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(
            src.contains(".accessibilityAddTraits(state.isSelected ? .isSelected : [])"),
            "expected the selected accessibility trait to remain driven by state.isSelected, unconditioned on selectionChrome, for both .standard and .indicatorOnly rows"
        )
    }

    func testSelectionPillAndBuiltInCheckmarkAreGatedToStandardChromeOnly() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(
            src.contains("listItemSelectionPill(isSelected: state.isSelected && selectionChrome == .standard)"),
            "expected the selected pill treatment to render only under .standard chrome, so .indicatorOnly rows can pair with a Radio/Checkbox visual without a duplicate selection mark"
        )
        XCTAssertTrue(
            src.contains("state.isSelected && selectionChrome == .standard"),
            "expected the built-in trailing selected checkmark to be gated the same way, only under .standard chrome"
        )
    }

    func testIndicatorOnlySelectedSubtitleDoesNotUseTheStandardPillInverseColor() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(
            src.contains("state.isSelected && selectionChrome == .standard"),
            "expected every inverse selected foreground to require the standard filled pill"
        )
        XCTAssertTrue(
            src.contains("private var subtitleForeground")
                && src.contains("state.isSelected && selectionChrome == .standard ? Color(.systemBackground).opacity(0.7) : Color.secondary"),
            "an indicator-only selected row has no dark pill, so its subtitle must remain secondary rather than becoming an unreadable inverse color"
        )
    }

    func testEveryConvenienceInitializerForwardsSelectionChromeWithAStandardDefault() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        // Count declared `init(` headers only, excluding the forwarding `self.init(` calls each
        // convenience initializer's body makes to the designated one.
        let declaredInitializerCount = src.components(separatedBy: "init(").count - 1
            - (src.components(separatedBy: "self.init(").count - 1)
        // The stored property's own declaration ("var selectionChrome: ListItemSelectionChrome =
        // .standard") also contains this substring, so it must be excluded to count only
        // initializer-parameter declarations.
        let selectionChromeParameterCount = src.components(
            separatedBy: "selectionChrome: ListItemSelectionChrome = .standard"
        ).count - 1 - (src.contains("var selectionChrome: ListItemSelectionChrome = .standard") ? 1 : 0)
        XCTAssertGreaterThan(declaredInitializerCount, 1, "expected ListItem to keep its multiple defaulted convenience initializers")
        XCTAssertEqual(
            selectionChromeParameterCount,
            declaredInitializerCount,
            "expected every declared ListItem convenience initializer to forward selectionChrome with a .standard default, so no existing call site must change"
        )
    }

    // MARK: - Source helpers

    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }
}
