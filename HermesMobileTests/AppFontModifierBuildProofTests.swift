import XCTest
import SwiftUI
@testable import HermesMobile

final class AppFontModifierBuildProofTests: XCTestCase {
    func testAppFontModifierCompilesAndProducesAView() {
        let view: some View = Text("proof").appFont(.body)
        XCTAssertNotNil(view)
    }

    func testAppFontModifierAcceptsTheNamedMonospacedRole() {
        let view: some View = Text("proof").appFont(.mono12)
        XCTAssertNotNil(view)
    }

    func testTextAppFontOverloadConcatenatesAsText() {
        let fragment: Text = Text("summary").appFont(.captionSemibold, dynamicTypeSize: .large)
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

    func testProductionTokenEvidenceLabAttachmentRouteCompiles() {
        let view: some View = NavigationStack {
            ProductionTokenEvidenceLabView(scrollsToAttachmentsOnLaunch: true)
        }
        XCTAssertNotNil(view)
    }
}
