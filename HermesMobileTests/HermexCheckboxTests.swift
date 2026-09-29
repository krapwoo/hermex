import XCTest
@testable import HermesMobile

final class HermexCheckboxTests: XCTestCase {
    private func source(_ relativePath: String) throws -> String {
        let testsDirectory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        let repositoryRoot = testsDirectory.deletingLastPathComponent()
        return try String(contentsOf: repositoryRoot.appendingPathComponent(relativePath), encoding: .utf8)
    }

    func testMetricsMeetVisualAndAccessibilityContracts() {
        XCTAssertEqual(HermexCheckboxMetrics.boxSize, 20)
        XCTAssertEqual(HermexCheckboxMetrics.borderWidth, 2)
        XCTAssertEqual(HermexCheckboxMetrics.minimumHitTarget, 44)
    }

    func testInteractiveCheckboxUsesNativeToggleAccessibilityRepresentation() throws {
        let component = try source("HermesMobile/Features/Shared/HermexCheckbox.swift")
        XCTAssertTrue(component.contains(".accessibilityRepresentation"))
        XCTAssertTrue(component.contains("Toggle("))
        XCTAssertTrue(component.contains(".accessibilityHidden(true)"))
    }

    func testCheckedFillAndBorderUseTheAdaptiveSemanticPrimaryColorNotAFixedAccent() throws {
        let component = try source("HermesMobile/Features/Shared/HermexCheckbox.swift")
        XCTAssertTrue(component.contains("isChecked ? Color.primary : Color.clear"))
        XCTAssertTrue(component.contains("isChecked ? Color.primary : Color(.separator)"))
        XCTAssertFalse(component.contains("Color.accentColor"))
    }

}
