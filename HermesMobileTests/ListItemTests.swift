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
    }

    func testRowIndicatorLivesInsideTheRowButtonAndIsAccessibilityHidden() throws {
        let src = try source("HermesMobile/Features/Shared/ListItem.swift")
        XCTAssertTrue(src.contains("rowIndicatorSystemImage"))
        XCTAssertTrue(src.contains("Image(systemName: rowIndicatorSystemImage)"))
        XCTAssertTrue(src.contains(".accessibilityHidden(true)"))
        XCTAssertTrue(src.contains(".appFont(titleRole)"))
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
