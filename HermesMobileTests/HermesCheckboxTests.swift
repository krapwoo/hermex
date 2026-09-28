import XCTest
@testable import HermesMobile

final class HermesCheckboxTests: XCTestCase {
    private func source(_ relativePath: String) throws -> String {
        let testsDirectory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        let repositoryRoot = testsDirectory.deletingLastPathComponent()
        return try String(contentsOf: repositoryRoot.appendingPathComponent(relativePath), encoding: .utf8)
    }

    func testMetricsMeetVisualAndAccessibilityContracts() {
        XCTAssertEqual(HermesCheckboxMetrics.boxSize, 20)
        XCTAssertEqual(HermesCheckboxMetrics.borderWidth, 2)
        XCTAssertEqual(HermesCheckboxMetrics.minimumHitTarget, 44)
    }

    func testInteractiveCheckboxUsesNativeToggleAccessibilityRepresentation() throws {
        let component = try source("HermesMobile/Features/Shared/HermesCheckbox.swift")
        XCTAssertTrue(component.contains(".accessibilityRepresentation"))
        XCTAssertTrue(component.contains("Toggle("))
        XCTAssertTrue(component.contains(".accessibilityHidden(true)"))
    }

}
