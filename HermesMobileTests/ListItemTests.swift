import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `ListItem` (`ListItem.swift`), which replaces the standalone Picker Row component:
/// `ModelPickerSheet`, `CronJobSkillsPicker`, `CronJobConfigurationPickers`, and
/// `DefaultProfilePickerView` all compose it instead of hand-rolling their own row scaffolding. A
/// SwiftUI view tree isn't inspectable at runtime without a rendering harness, so adoption at each
/// site is a source contract; the shared metrics and state default are pure contracts.
final class ListItemTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

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

    // MARK: - Source contracts: Picker Row is removed as a standalone component

    func testPickerRowMetricsNoLongerExists() throws {
        for path in [
            "HermesMobile/Features/Shared/ModelPickerSheet.swift",
            "HermesMobile/Features/Tasks/CronJobSkillsPicker.swift",
            "HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift",
            "HermesMobile/Features/Settings/DefaultProfilePickerView.swift"
        ] {
            let src = try source(path)
            XCTAssertFalse(src.contains("PickerRowMetrics"), "\(path) must not reference the removed PickerRowMetrics")
            XCTAssertFalse(src.contains("pickerSelectionPill"), "\(path) must not reference the removed pickerSelectionPill")
        }
    }

    // MARK: - Source contracts: the four picker implementations compose ListItem

    func testModelPickerSheetComposesListItem() throws {
        let src = try source("HermesMobile/Features/Shared/ModelPickerSheet.swift")
        XCTAssertTrue(src.contains("ListItem("))
    }

    func testCronJobSkillsPickerComposesListItem() throws {
        let src = try source("HermesMobile/Features/Tasks/CronJobSkillsPicker.swift")
        XCTAssertTrue(src.contains("ListItem("))
    }

    func testCronJobConfigurationPickersComposeListItem() throws {
        let src = try source("HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift")
        XCTAssertTrue(src.contains("ListItem("))
    }

    func testDefaultProfilePickerViewComposesListItem() throws {
        let src = try source("HermesMobile/Features/Settings/DefaultProfilePickerView.swift")
        XCTAssertTrue(src.contains("ListItem("))
    }
}
