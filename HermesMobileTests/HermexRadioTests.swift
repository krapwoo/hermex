import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexRadio` (`HermexRadio.swift`): one-of-many selected state, disabled state,
/// native Button semantics, and DS sizing, mirroring `HermexCheckbox`'s established architecture with
/// a circular selected/unselected treatment instead of a boolean toggle. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a compile contract plus pure-value
/// and source contracts for its sizing and accessibility state.
final class HermexRadioTests: XCTestCase {
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
        XCTAssertEqual(HermexRadioMetrics.circleSize, HermexCheckboxMetrics.boxSize)
    }

    func testMinimumHitTargetMatchesTheEstablishedControlConvention() {
        XCTAssertEqual(HermexRadioMetrics.minimumHitTarget, 44)
    }

    // MARK: - Compile contracts: selected/unselected, enabled/disabled, interactive/indicator-only

    func testSelectedAndUnselectedCompile() {
        let selected = HermexRadio(isSelected: true, label: "Option A", action: {})
        let unselected = HermexRadio(isSelected: false, label: "Option B", action: {})
        XCTAssertFalse(String(describing: type(of: selected)).isEmpty)
        XCTAssertFalse(String(describing: type(of: unselected)).isEmpty)
    }

    func testDisabledAndIndicatorOnlyCompile() {
        let disabled = HermexRadio(isSelected: false, isEnabled: false, label: "Option C", action: {})
        let indicatorOnly = HermexRadio(isSelected: true, label: "Option D")
        XCTAssertFalse(String(describing: type(of: disabled)).isEmpty)
        XCTAssertFalse(String(describing: type(of: indicatorOnly)).isEmpty)
    }

    // MARK: - Source contract: selected accessibility state, native Button semantics

    func testUsesTheSelectedAccessibilityTraitRatherThanAToggleRepresentation() throws {
        let src = try source("HermesMobile/Features/Shared/HermexRadio.swift")
        XCTAssertTrue(src.contains(".isSelected"))
        XCTAssertTrue(src.contains("Button(action:"))
    }

    func testSelectedRingAndInnerDotUseTheAdaptiveSemanticPrimaryColorNotAFixedAccent() throws {
        let src = try source("HermesMobile/Features/Shared/HermexRadio.swift")
        XCTAssertTrue(src.contains("isSelected ? Color.primary : Color(.separator)"))
        XCTAssertTrue(src.contains(".fill(Color.primary)"))
        XCTAssertFalse(src.contains("Color.accentColor"))
    }
}
