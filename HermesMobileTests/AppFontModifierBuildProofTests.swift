import XCTest
import SwiftUI
@testable import HermesMobile

final class AppFontModifierBuildProofTests: XCTestCase {
    func testAppFontModifierCompilesAndProducesAView() {
        let view: some View = Text("proof").appFont(.body)
        XCTAssertNotNil(view)
    }

    func testAppFontModifierAcceptsExplicitWeightAndMonospacedDesign() {
        let view: some View = Text("proof").appFont(.caption, weight: .semibold, design: .monospaced)
        XCTAssertNotNil(view)
    }

    func testTextAppFontOverloadConcatenatesAsText() {
        let fragment: Text = Text("summary").appFont(.caption, dynamicTypeSize: .large, weight: .semibold)
            + Text(" ")
            + Text("detail").appFont(.caption, dynamicTypeSize: .large)
        XCTAssertNotNil(fragment)
    }

    // MARK: - Production Token Evidence Lab (DEBUG-only fixture)

    func testProductionTokenEvidenceLabDeclaresEveryAppFontRoleExactlyOnce() {
        let declaredRoles = ProductionTokenEvidenceLabView.fontRoleOrder
        XCTAssertEqual(Set(declaredRoles), Set(AppFont.Role.allCases))
        XCTAssertEqual(declaredRoles.count, AppFont.Role.allCases.count)
    }

    func testProductionTokenEvidenceLabViewCompiles() {
        let view: some View = NavigationStack { ProductionTokenEvidenceLabView() }
        XCTAssertNotNil(view)
    }

    func testProductionTokenEvidenceLabShadowRouteCompiles() {
        let view: some View = NavigationStack {
            ProductionTokenEvidenceLabView(scrollsToShadowOnLaunch: true)
        }
        XCTAssertNotNil(view)
    }
}
