import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the Card family's shared defaults (`HermesCard.swift`): the exact 16-point content
/// padding Section Card and Request Card both wrap their content in, and the Compact Card surface
/// normal Attachment tiles compose for their outer chrome. A SwiftUI view tree isn't inspectable at
/// runtime without a rendering harness, so adoption at each surface is a source contract; the padding
/// value itself is a pure contract.
final class HermesCardTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Pure contract

    func testCardContentPaddingIsExactlySixteenPointsOnEveryEdge() {
        XCTAssertEqual(HermesCardMetrics.contentPadding, HermesSpacing.s16)
        XCTAssertEqual(HermesCardMetrics.contentPadding, 16)
    }

    // MARK: - Compile contract

    func testCompactCardSurfaceCompilesWithDefaultAndClearFill() {
        let filled = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16)
        let bordered = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16, fill: .clear)
        XCTAssertFalse(String(describing: type(of: filled)).isEmpty)
        XCTAssertFalse(String(describing: type(of: bordered)).isEmpty)
    }

    // MARK: - Source contracts: Section Card and Request Card adopt the shared default

    func testSectionCardAdoptsTheSharedContentPadding() throws {
        let src = try source("HermesMobile/Features/Shared/SectionCard.swift")
        XCTAssertTrue(src.contains(".padding(.horizontal, HermesCardMetrics.contentPadding)"))
        XCTAssertTrue(src.contains(".padding(.vertical, HermesCardMetrics.contentPadding)"))
    }

    func testSectionCardSupportsOutlinedSurfaceAndTipJarAdoptsIt() throws {
        let card = try source("HermesMobile/Features/Shared/HermesCard.swift")
        let sectionCard = try source("HermesMobile/Features/Shared/SectionCard.swift")
        let tipJar = try source("HermesMobile/Features/SessionList/TipJarCard.swift")

        XCTAssertTrue(card.contains("enum HermesCardSurface"))
        XCTAssertTrue(card.contains("case outlined"))
        XCTAssertTrue(card.contains("func hermesCardSurface("))
        XCTAssertTrue(card.contains("Color(.systemBackground)"))
        XCTAssertTrue(card.contains("Color(.separator)"))
        XCTAssertTrue(sectionCard.contains("HermesCardSurface"))
        XCTAssertTrue(sectionCard.contains(".hermesCardSurface(surface, cornerRadius: HermesRadius.r20)"))
        XCTAssertFalse(sectionCard.contains("Color(.systemBackground)"))
        XCTAssertFalse(sectionCard.contains("Color(.separator)"))
        XCTAssertTrue(tipJar.contains("SectionCard(surface: .outlined)"))
    }

    func testClarificationRequestCardAdoptsTheSharedContentPadding() throws {
        let src = try source("HermesMobile/Features/Chat/ClarificationRequestCard.swift")
        XCTAssertTrue(src.contains("HermesCardMetrics.contentPadding"))
    }

    func testApprovalRequestOverlayAdoptsTheSharedContentPadding() throws {
        let src = try source("HermesMobile/Features/Chat/ApprovalRequestOverlay.swift")
        XCTAssertTrue(src.contains("HermesCardMetrics.contentPadding"))
    }

    func testBotPendingRequestCardAdoptsTheSharedContentPadding() throws {
        let src = try source("HermesMobile/Features/Bots/BotPendingRequestCard.swift")
        XCTAssertTrue(src.contains("HermesCardMetrics.contentPadding"))
    }

    // MARK: - Source contracts: normal Attachment tiles compose Compact Card

    // `cornerRadius` now defaults to `HermesRadius.card` (issue #607) so a normal Attachment tile's
    // outer radius can no longer drift from Card's: the call site composes `compactCardSurface()`
    // with no independent radius choice of its own.
    func testComposerFileAttachmentTileComposesCompactCard() throws {
        let src = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")
        XCTAssertTrue(src.contains(".compactCardSurface()"))
        XCTAssertFalse(src.contains(".compactCardSurface(cornerRadius:"))
    }

    func testMessageFileAttachmentTileComposesCompactCard() throws {
        let src = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")
        XCTAssertTrue(src.contains(".compactCardSurface()"))
        XCTAssertFalse(src.contains(".compactCardSurface(cornerRadius:"))
    }

    // MARK: - Request Card lives in the Card family (production correction 4)

    func testRequestCardSurfaceIsDefinedInTheCardFamilyFile() throws {
        let src = try source("HermesMobile/Features/Shared/HermesCard.swift")
        XCTAssertTrue(src.contains("func requestCardSurface(cornerRadius:"))
    }

    func testPendingRequestSurfacesNoLongerDuplicatesTheCardSurfaceDefinition() throws {
        let src = try source("HermesMobile/Features/Chat/PendingRequestSurfaces.swift")
        XCTAssertFalse(src.contains("func pendingRequestCardSurface("))
    }

    func testClarificationBarAndCardUseTheSharedRequestCardSurface() throws {
        let src = try source("HermesMobile/Features/Chat/ClarificationRequestCard.swift")
        let occurrences = src.components(separatedBy: ".requestCardSurface(cornerRadius: ChatComposerMetrics.cardCornerRadius)").count - 1
        XCTAssertEqual(occurrences, 2, "expected both the bar and the expanded card to use the shared surface")
    }

    func testBotPendingRequestCardUsesTheSharedRequestCardSurface() throws {
        let src = try source("HermesMobile/Features/Bots/BotPendingRequestCard.swift")
        XCTAssertTrue(src.contains(".requestCardSurface(cornerRadius: Self.cornerRadius)"))
    }

    func testBotRoomPendingRequestSurfaceUsesTheSharedRequestCardSurface() throws {
        let src = try source("HermesMobile/Features/Bots/BotRoomComposerView.swift")
        XCTAssertTrue(src.contains(".requestCardSurface(cornerRadius: BotPendingRequestCard.cornerRadius)"))
    }

    func testApprovalRequestOverlayUsesTheSharedRequestCardSurfaceInsteadOfHandRolledMaterialChrome() throws {
        let src = try source("HermesMobile/Features/Chat/ApprovalRequestOverlay.swift")
        XCTAssertTrue(src.contains(".requestCardSurface(cornerRadius: HermesRadius.r16, material: .translucentOverScrim)"))
        XCTAssertFalse(src.contains(".background(.regularMaterial, in: RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))"))
    }

    func testMiniAttachmentPreviewTileStaysIndependentOfCompactCard() throws {
        let src = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")
        // ComposerAttachmentPillPreview's 30x30 tile must not adopt the Compact Card surface.
        guard let range = src.range(of: "struct ComposerAttachmentPillPreview") else {
            return XCTFail("ComposerAttachmentPillPreview not found")
        }
        let tail = src[range.lowerBound...]
        guard let nextStruct = tail.range(of: "\nprivate struct ComposerAttachmentThumbnailView") else {
            return XCTFail("could not bound ComposerAttachmentPillPreview's body")
        }
        let body = tail[tail.startIndex..<nextStruct.lowerBound]
        XCTAssertFalse(body.contains(".compactCardSurface("))
    }
}
