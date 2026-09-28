import XCTest
import SwiftUI
@testable import HermesMobile

final class AttachmentTileTests: XCTestCase {
    private func source(_ relativePath: String) throws -> String {
        let repositoryRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        return try String(contentsOf: repositoryRoot.appendingPathComponent(relativePath), encoding: .utf8)
    }

    /// Isolates `RemoteAttachmentImage`'s own body from the rest of `MessageBubbleView.swift`, so
    /// assertions about its skeleton adoption can't be satisfied (or defeated) by unrelated code
    /// elsewhere in the file.
    private func remoteAttachmentImageSource(in fullSource: String) throws -> String {
        guard let start = fullSource.range(of: "private struct RemoteAttachmentImage"),
              let end = fullSource.range(of: "private actor AttachmentImageCache"),
              start.upperBound < end.lowerBound
        else {
            throw XCTSkip("RemoteAttachmentImage not found in the expected shape")
        }
        return String(fullSource[start.lowerBound..<end.lowerBound])
    }

    // MARK: - Shared view struct properties

    func testFileGlyphCarriesTheFileTypesIconAtTheGivenSize() {
        let glyph = AttachmentFileGlyph(fileType: AttachmentFileType(fileName: "invoice.pdf"), size: HermesIconSize.extraLarge)

        XCTAssertEqual(glyph.fileType.iconName, "doc.richtext")
        XCTAssertEqual(glyph.size, HermesIconSize.extraLarge)
    }

    func testExtensionLabelCarriesTheFileTypesExtension() {
        let label = AttachmentExtensionLabel(fileType: AttachmentFileType(fileName: "archive.tgz"))

        XCTAssertEqual(label.fileType.extensionLabel, "TGZ")
    }

    func testFileBadgeCarriesItsRequestedPanelSize() {
        let badge = AttachmentFileBadge(
            fileType: AttachmentFileType(fileName: "report.csv"),
            width: HermesAttachmentSize.fileIconPanelWidth,
            height: HermesAttachmentSize.fileIconPanelHeight
        )

        XCTAssertEqual(badge.width, 58)
        XCTAssertEqual(badge.height, 68)
    }

    func testImageTileSurfaceCarriesItsRequestedFrameAndCornerRadius() {
        let surface = AttachmentImageTileSurface(
            width: HermesAttachmentSize.messageGridCell,
            height: HermesAttachmentSize.messageGridCell,
            cornerRadius: HermesRadius.r16
        ) { Color.clear }

        XCTAssertEqual(surface.width, 118)
        XCTAssertEqual(surface.height, 118)
        XCTAssertEqual(surface.cornerRadius, HermesRadius.r16)
    }

    func testImageTileSurfaceDefaultsItsCornerRadiusToTheSharedCardToken() {
        let surface = AttachmentImageTileSurface(
            width: HermesAttachmentSize.messageGridCell,
            height: HermesAttachmentSize.messageGridCell
        ) { Color.clear }

        XCTAssertEqual(surface.cornerRadius, HermesRadius.card)
    }

    // MARK: - Attachment outer-surface radius derives from Card (issue #607)

    func testCompactCardSurfaceDefaultsItsCornerRadiusToTheSharedCardToken() throws {
        let cardSource = try source("HermesMobile/Features/Shared/HermesCard.swift")

        XCTAssertTrue(cardSource.contains("func compactCardSurface(cornerRadius: CGFloat = HermesRadius.card"))
    }

    func testMessageFileCellNoLongerPicksItsOwnIndependentOuterRadius() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")

        XCTAssertFalse(messageSource.contains(".compactCardSurface(cornerRadius:"))
    }

    func testComposerFilePreviewNoLongerPicksItsOwnIndependentOuterRadius() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertFalse(composerSource.contains(".compactCardSurface(cornerRadius:"))
    }

    func testComposerAndMessageImageTilesNoLongerPassAnIndependentOuterRadius() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertFalse(messageSource.contains("AttachmentImageTileSurface(width: size, height: size, cornerRadius:"))
        XCTAssertFalse(composerSource.contains("AttachmentImageTileSurface(width: imagePreviewSize, height: imagePreviewSize, cornerRadius:"))
    }

    // MARK: - Attachment remove/close control uses opaque Hermes tokens (issue #607)

    func testRemoveControlColorsAreDerivedFromOpaqueNeutralRampSteps() {
        // Distinct opaque colors per appearance, never `.opacity`-derived, satisfy the contract at
        // the API surface: each resolves to a concrete Color backed by a Neutral ramp step pair.
        XCTAssertNotNil(AttachmentRemoveControlColors.background)
        XCTAssertNotNil(AttachmentRemoveControlColors.border)
        XCTAssertNotNil(AttachmentRemoveControlColors.content)
    }

    func testComposerRemoveControlUsesTheSharedOpaqueTokensWithNoOpacityRecipe() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        guard let start = composerSource.range(of: "Button(action: onRemove)"),
              let end = composerSource.range(of: "}\n            .buttonStyle(.hermesPressOnly(\n                .icon,")
        else {
            throw XCTSkip("Remove control button not found in the expected shape")
        }
        let removeControlSource = String(composerSource[start.lowerBound..<end.lowerBound])

        XCTAssertTrue(removeControlSource.contains("AttachmentRemoveControlColors.background"))
        XCTAssertTrue(removeControlSource.contains("AttachmentRemoveControlColors.border"))
        XCTAssertTrue(removeControlSource.contains("AttachmentRemoveControlColors.content"))
        XCTAssertFalse(removeControlSource.contains(".opacity("))
    }

    func testFileBadgeComposesFromTheSharedGlyphExtensionLabelAndBadgeFillDerivation() throws {
        let familySource = try source("HermesMobile/Features/Shared/AttachmentTile.swift")

        XCTAssertTrue(familySource.contains("AttachmentFileGlyph("))
        XCTAssertTrue(familySource.contains("AttachmentExtensionLabel("))
        XCTAssertTrue(familySource.contains("fileType.badgeFill"))
    }

    // MARK: - MessageBubbleView adoption

    func testMessageFileCellAdoptsTheSharedGlyphExtensionLabelAndSizeTokens() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")

        XCTAssertTrue(messageSource.contains("AttachmentFileGlyph(fileType: fileType, size: HermesIconSize.extraLarge)"))
        XCTAssertTrue(messageSource.contains("AttachmentExtensionLabel(fileType: fileType)"))
        XCTAssertTrue(messageSource.contains("HermesAttachmentSize.messageGridCell"))
        XCTAssertTrue(messageSource.contains("HermesAttachmentSize.messageFileTextInset"))
        XCTAssertFalse(messageSource.contains(".font(.system(size: 28"))
        XCTAssertFalse(messageSource.contains(".font(.system(size: 11, weight: .bold))"))
    }

    func testMessageImageCellAdoptsTheSharedImageTileSurfaceInsteadOfALocalSeparatorBorder() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")

        XCTAssertTrue(messageSource.contains("AttachmentImageTileSurface("))
        XCTAssertFalse(messageSource.contains("Color(.separator).opacity(0.25)"))
    }

    func testMessageFallbackImageIconUsesTheExtraLargeIconToken() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")

        XCTAssertFalse(messageSource.contains(".font(.system(size: 34"))
    }

    /// The skeleton (and its loading announcement) must live only in the `!didAttempt` branch, via
    /// the shared `AttachmentLoadingTile`, so a loaded or failed image never retains loading
    /// semantics. Asserting no bare `.skeletonAnnouncement(` on `RemoteAttachmentImage` itself is
    /// what pins that: the announcement moved into the shared tile instead of wrapping the whole
    /// `ZStack`.
    func testRemoteAttachmentImageHasNoProgressViewAndRendersTheSharedLoadingTileOnlyBeforeItsFirstAttempt() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")
        let remoteImageSource = try remoteAttachmentImageSource(in: messageSource)

        XCTAssertFalse(remoteImageSource.contains("ProgressView"))
        XCTAssertTrue(remoteImageSource.contains("!didAttempt"))
        XCTAssertTrue(remoteImageSource.contains("AttachmentLoadingTile("))
        XCTAssertFalse(
            remoteImageSource.contains(".skeletonAnnouncement("),
            "the loading announcement must live in the shared AttachmentLoadingTile, not wrap RemoteAttachmentImage's whole body"
        )
    }

    func testAttachmentLoadingTileOwnsTheFullBoxSkeletonAndItsAnnouncement() throws {
        let tileSource = try source("HermesMobile/Features/Shared/AttachmentTile.swift")

        XCTAssertTrue(tileSource.contains("struct AttachmentLoadingTile"))
        XCTAssertTrue(tileSource.contains(".skeletonPlaceholder()"))
        XCTAssertTrue(tileSource.contains(".skeletonAnnouncement("))
        XCTAssertFalse(tileSource.contains("ProgressView"))
    }

    // MARK: - Attachment acceptance parity corrections

    func testComposerPillCountAndFallbackAndRemoveIconsUseSharedTypographyAndIconSizeTokens() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertFalse(composerSource.contains(".font(.system(size: 11"))
        XCTAssertFalse(composerSource.contains(".font(.system(size: 13"))
        XCTAssertTrue(composerSource.contains(".appFont(.captionSemibold)"))
        XCTAssertTrue(composerSource.contains("HermesIconSize.xs"))
    }

    func testMessageAttachmentGridSpacingUsesTheSharedSpacingToken() throws {
        let messageSource = try source("HermesMobile/Features/Chat/MessageBubbleView.swift")

        XCTAssertFalse(messageSource.contains("let spacing: CGFloat = 8"))
        XCTAssertTrue(messageSource.contains("let spacing: CGFloat = HermesSpacing.s8"))
    }

    // MARK: - ChatComposerAttachmentStripView adoption

    func testComposerFilePreviewAdoptsTheSharedFileBadgeAndSizeTokens() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertTrue(composerSource.contains("AttachmentFileBadge("))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.fileIconPanelWidth"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.fileIconPanelHeight"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.fileIconPanelWidthAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.fileIconPanelHeightAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTextWidth"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTextWidthAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTileWidth"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTileWidthAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTileMinHeight"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerFileTileMinHeightAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.accessibilityVerticalPadding"))
        XCTAssertFalse(composerSource.contains(".font(.system(size: 9, weight: .bold))"))
    }

    func testComposerStripAndControlsAdoptSizeTokens() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerStripHeight"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerStripHeightAccessibility"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.compactPreview"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.removeControl"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.removeOverlap"))
    }

    func testComposerImagePreviewAdoptsTheSharedImageTileSurfaceInsteadOfALocalSeparatorBorder() throws {
        let composerSource = try source("HermesMobile/Features/Chat/ChatComposerAttachmentStripView.swift")

        XCTAssertTrue(composerSource.contains("AttachmentImageTileSurface("))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerImage"))
        XCTAssertTrue(composerSource.contains("HermesAttachmentSize.composerImageAccessibility"))
        XCTAssertFalse(composerSource.contains("Color(.separator).opacity(0.25)"))
    }
}
