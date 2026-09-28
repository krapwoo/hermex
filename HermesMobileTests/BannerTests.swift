import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the shared Banner family (`Banner.swift`), including the `Banner.offlineCache()`
/// factory available for screens to adopt. A SwiftUI view tree isn't inspectable at runtime without a
/// rendering harness, so the icon-sizing and accessibility source contracts below read `Banner.swift`
/// itself; the semantic/model mapping is a pure contract.
final class BannerTests: XCTestCase {
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

    func testEverySemanticHasATintAndADefaultIcon() {
        XCTAssertEqual(Banner.Semantic.information.tint, .blue)
        XCTAssertEqual(Banner.Semantic.warning.tint, .yellow)
        XCTAssertEqual(Banner.Semantic.error.tint, .red)
        XCTAssertEqual(Banner.Semantic.success.tint, .green)
        XCTAssertEqual(Banner.Semantic.offline.tint, .orange)

        XCTAssertEqual(Banner.Semantic.offline.defaultIcon, "wifi.slash")
    }

    func testOfflineCacheFactoryUsesTheOfflineSemanticAndTheSharedMessage() {
        let banner = Banner.offlineCache()

        XCTAssertEqual(banner.semantic, .offline)
        XCTAssertEqual(banner.icon, "wifi.slash")
        XCTAssertEqual(banner.presentation, .fullWidth(horizontalPadding: HermesSpacing.s16))
    }

    func testOfflineCacheFactoryHonorsACustomHorizontalPadding() {
        let banner = Banner.offlineCache(horizontalPadding: HermesSpacing.s24)

        XCTAssertEqual(banner.presentation, .fullWidth(horizontalPadding: HermesSpacing.s24))
    }

    func testExplicitIconOverridesTheSemanticDefault() {
        let banner = Banner(.information, message: Text("Synced"), icon: "checkmark.circle")

        XCTAssertEqual(banner.icon, "checkmark.circle")
    }

    // MARK: - #607 follow-up: the inline icon adopts the accepted semantic icon size

    func testTheIconNoLongerUsesImageScaleOnlySizing() throws {
        let src = try source("HermesMobile/Features/Shared/Banner.swift")
        XCTAssertFalse(src.contains(".imageScale(.small)"), "Banner's icon should size from HermesIconSize, not .imageScale alone")
        XCTAssertTrue(src.contains("HermesIconSize.small"), "Banner's icon should adopt the size paired with its subheadline-weight message")
    }

    func testDecorativeAccessibilityBehaviorIsUnchanged() throws {
        let src = try source("HermesMobile/Features/Shared/Banner.swift")
        XCTAssertTrue(src.contains(".accessibilityHidden(isIconDecorative)"))
    }
}
