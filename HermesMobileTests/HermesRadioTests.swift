import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermesRadio` (`HermesRadio.swift`): one-of-many selected state, disabled state,
/// native Button semantics, and DS sizing, mirroring `HermesCheckbox`'s established architecture with
/// a circular selected/unselected treatment instead of a boolean toggle. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a compile contract plus pure-value
/// and source contracts for its sizing and accessibility state.
final class HermesRadioTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Pure contracts: DS sizing

    func testCircleSizeMatchesTheCheckboxBoxSizeForVisualRhythm() {
        XCTAssertEqual(HermesRadioMetrics.circleSize, HermesCheckboxMetrics.boxSize)
    }

    func testMinimumHitTargetMatchesTheEstablishedControlConvention() {
        XCTAssertEqual(HermesRadioMetrics.minimumHitTarget, 44)
    }

    // MARK: - Compile contracts: selected/unselected, enabled/disabled, interactive/indicator-only

    func testSelectedAndUnselectedCompile() {
        let selected = HermesRadio(isSelected: true, label: "Option A", action: {})
        let unselected = HermesRadio(isSelected: false, label: "Option B", action: {})
        XCTAssertFalse(String(describing: type(of: selected)).isEmpty)
        XCTAssertFalse(String(describing: type(of: unselected)).isEmpty)
    }

    func testDisabledAndIndicatorOnlyCompile() {
        let disabled = HermesRadio(isSelected: false, isEnabled: false, label: "Option C", action: {})
        let indicatorOnly = HermesRadio(isSelected: true, label: "Option D")
        XCTAssertFalse(String(describing: type(of: disabled)).isEmpty)
        XCTAssertFalse(String(describing: type(of: indicatorOnly)).isEmpty)
    }

    // MARK: - Source contract: selected accessibility state, native Button semantics

    func testUsesTheSelectedAccessibilityTraitRatherThanAToggleRepresentation() throws {
        let src = try source("HermesMobile/Features/Shared/HermesRadio.swift")
        XCTAssertTrue(src.contains(".isSelected"))
        XCTAssertTrue(src.contains("Button(action:"))
    }
}
