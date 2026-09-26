import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the shared Banner family (`Banner.swift`), including the consolidation of the
/// Session-list and Chat offline-cache notices — previously `OfflineCacheBanner` and
/// `ChatOfflineCacheBanner`, two exact-contract duplicates — into `Banner.offlineCache()`. A SwiftUI
/// view tree isn't inspectable at runtime without a rendering harness, so consolidation at each call
/// site is a source contract; the semantic/model mapping is a pure contract.
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

    // MARK: - Source contracts: the two exact-duplicate offline banners are consolidated

    func testSessionListNoLongerDefinesItsOwnOfflineCacheBanner() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")
        XCTAssertFalse(src.contains("struct OfflineCacheBanner"))
    }

    func testChatNoLongerDefinesItsOwnOfflineCacheBanner() throws {
        let src = try source("HermesMobile/Features/Chat/ChatTranscriptSupportingViews.swift")
        XCTAssertFalse(src.contains("struct ChatOfflineCacheBanner"))
    }

    func testSessionListViewAdoptsTheSharedOfflineBanner() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListView.swift")
        XCTAssertTrue(src.contains("Banner.offlineCache("))
        XCTAssertFalse(src.contains("OfflineCacheBanner()"))
    }

    func testChatViewAdoptsTheSharedOfflineBanner() throws {
        let src = try source("HermesMobile/Features/Chat/ChatView.swift")
        XCTAssertTrue(src.contains("Banner.offlineCache("))
        XCTAssertFalse(src.contains("ChatOfflineCacheBanner()"))
    }
}
