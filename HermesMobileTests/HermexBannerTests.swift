import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexBanner` (`HermexBanner.swift`, Issue #607, DSR2-15), which replaces the
/// legacy `Banner`/`Banner.swift`. Title and description are independently caller-optional — the
/// supported content combinations are title+description, title-only, and description-only — with no
/// interactive collapse/disclosure state; "hide" means the caller simply omits that region. At least
/// one of the two must be present, guarded by a debug/runtime invariant. This suite also pins zero
/// production adoption in this branch and the DEBUG overlay lab's deterministic Banner fixtures.
///
/// This suite is written before `HermexBanner.swift` exists and before `HermexOverlayLab.swift`
/// adopts it, so most of the contracts below are expected to fail red through
/// one explicit, readable XCTest assertion rather than a raw file-not-found/compile error — mirroring
/// the established pattern in `HermexSelectionSheetTests`/`HermexComposerToolbarTests`. A handful of
/// preservation contracts (composer status priority order, the dismiss action's icon/label, voice
/// status surfaces) pin behavior that must survive the coming change and are expected to already pass.
final class HermexBannerTests: XCTestCase {
    private static let bannerSourcePath = "HermesMobile/Features/Shared/HermexBanner.swift"
    private static let legacyBannerSourcePath = "HermesMobile/Features/Shared/Banner.swift"
    private static let chatComposerViewPath = "HermesMobile/Features/Chat/ChatComposerView.swift"
    private static let overlayLabPath = "HermesMobile/Features/Shared/HermexOverlayLab.swift"
    private static let pbxprojPath = "HermesMobile.xcodeproj/project.pbxproj"

    // MARK: - Source helpers

    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    /// Loads the future `HermexBanner.swift` source if it exists, or records one clear, explicit
    /// XCTest failure and returns `nil` so the caller can bail out safely — never a raw "file
    /// doesn't exist" error that would mask the intended contract being pinned.
    private func hermexBannerSource(file: StaticString = #filePath, line: UInt = #line) -> String? {
        let url = resourceURL(Self.bannerSourcePath)
        guard FileManager.default.fileExists(atPath: url.path) else {
            XCTFail(
                "\(Self.bannerSourcePath) does not exist yet — DSR2-15 adds it, replacing the legacy Banner.swift",
                file: file,
                line: line
            )
            return nil
        }
        return try? String(contentsOf: url, encoding: .utf8)
    }

    // MARK: - Pure model contracts: semantics, presentation, and content combinations

    func testEverySemanticHasATintAndADefaultIcon() {
        XCTAssertEqual(HermexBanner.Semantic.information.tint, .blue)
        XCTAssertEqual(HermexBanner.Semantic.warning.tint, .yellow)
        XCTAssertEqual(HermexBanner.Semantic.error.tint, .red)
        XCTAssertEqual(HermexBanner.Semantic.success.tint, .green)
        XCTAssertEqual(HermexBanner.Semantic.offline.tint, .orange)

        XCTAssertEqual(HermexBanner.Semantic.offline.defaultIcon, "wifi.slash")
    }

    func testInitializerAcceptsIndependentOptionalTitleAndDescription() {
        let titleAndDescription = HermexBanner(.information, title: Text("Synced"), description: Text("All caught up"))
        XCTAssertNotNil(titleAndDescription.title)
        XCTAssertNotNil(titleAndDescription.description)

        let titleOnly = HermexBanner(.warning, title: Text("Update available"))
        XCTAssertNotNil(titleOnly.title)
        XCTAssertNil(titleOnly.description)

        let descriptionOnly = HermexBanner(.error, description: Text("Something failed."))
        XCTAssertNil(descriptionOnly.title)
        XCTAssertNotNil(descriptionOnly.description)
    }

    func testBothPresentationCasesRemainConstructible() {
        let fullWidth = HermexBanner(.information, description: Text("Synced"), presentation: .fullWidth())
        let inset = HermexBanner(.error, description: Text("Failed"), presentation: .inset)

        XCTAssertEqual(fullWidth.presentation, .fullWidth(horizontalPadding: HermesSpacing.s16))
        XCTAssertEqual(inset.presentation, .inset)
    }

    func testExplicitIconOverridesTheSemanticDefault() {
        let banner = HermexBanner(.information, description: Text("Synced"), icon: "checkmark.circle")

        XCTAssertEqual(banner.icon, "checkmark.circle")
    }

    func testDecorativeIconFlagRemainsCallerConfigurable() {
        let decorative = HermexBanner(.warning, description: Text("Heads up"))
        let meaningful = HermexBanner(.warning, description: Text("Heads up"), isIconDecorative: false)

        XCTAssertTrue(decorative.isIconDecorative)
        XCTAssertFalse(meaningful.isIconDecorative)
    }

    // MARK: - Pure model contracts: the optional Action, with enough data for an icon-only dismiss

    func testActionRetainsATextTitleForATextButtonStyleAction() {
        let action = HermexBanner.Action(title: "Update", handler: {})

        XCTAssertEqual(action.title, "Update")
        XCTAssertNil(action.icon)
        XCTAssertNil(action.accessibilityLabel)
    }

    func testActionCanCarryAnIconAndAccessibilityLabelPreservingTheAttachmentErrorDismissAction() {
        let action = HermexBanner.Action(icon: "xmark", accessibilityLabel: "Dismiss attachment error", handler: {})

        XCTAssertNil(action.title)
        XCTAssertEqual(action.icon, "xmark")
        XCTAssertEqual(action.accessibilityLabel, "Dismiss attachment error")
    }

    func testBannerCompilesWithAnIconOnlyDismissAction() {
        let banner = HermexBanner(
            .error,
            description: Text("Couldn't attach the file."),
            presentation: .inset,
            action: HermexBanner.Action(icon: "xmark", accessibilityLabel: "Dismiss attachment error", handler: {})
        )

        XCTAssertNotNil(banner.action)
        XCTAssertEqual(banner.action?.icon, "xmark")
        XCTAssertEqual(banner.action?.accessibilityLabel, "Dismiss attachment error")
    }

    // MARK: - offlineCache() factory

    func testOfflineCacheFactoryUsesTheOfflineSemanticAndTheSharedCopy() {
        let banner = HermexBanner.offlineCache()

        XCTAssertEqual(banner.semantic, .offline)
        XCTAssertEqual(banner.icon, "wifi.slash")
        XCTAssertEqual(banner.presentation, .fullWidth(horizontalPadding: HermesSpacing.s16))
        XCTAssertTrue(
            banner.title != nil || banner.description != nil,
            "expected the shared offline-cache copy to live in either title or description"
        )
    }

    func testOfflineCacheFactoryHonorsACustomHorizontalPadding() {
        let banner = HermexBanner.offlineCache(horizontalPadding: HermesSpacing.s24)

        XCTAssertEqual(banner.presentation, .fullWidth(horizontalPadding: HermesSpacing.s24))
    }

    // MARK: - #607 follow-up: the inline icon adopts the accepted semantic icon size (carried forward)

    func testTheIconNoLongerUsesImageScaleOnlySizing() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertFalse(src.contains(".imageScale(.small)"), "HermexBanner's icon should size from HermesIconSize, not .imageScale alone")
        XCTAssertTrue(src.contains("HermesIconSize.small"), "HermexBanner's icon should adopt the size paired with its subheadline-weight text")
    }

    func testDecorativeAccessibilityBehaviorIsUnchanged() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertTrue(src.contains(".accessibilityHidden(isIconDecorative)"))
    }

    // MARK: - Source contract: at least one of title/description is required

    func testSourceGuardsAgainstBothTitleAndDescriptionBeingAbsent() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertNotNil(
            src.range(
                of: #"(assert|precondition)\([^\n]*title\s*!=\s*nil\s*\|\|\s*description\s*!=\s*nil"#,
                options: .regularExpression
            ),
            "expected a debug/runtime guard preventing a HermexBanner with neither a title nor a description"
        )
    }

    // MARK: - Source contract: no interactive collapse/disclosure state

    func testSourceHasNoInteractiveCollapseOrDisclosureState() throws {
        guard let src = hermexBannerSource() else { return }
        for token in ["isExpanded", "collapsible", "Collapsible", "DisclosureGroup"] {
            XCTAssertFalse(src.contains(token), "HermexBanner has no interactive collapse/disclosure state; found forbidden token \(token)")
        }
    }

    // MARK: - Source contract: title/description render conditionally with no reserved placeholder space

    func testTitleRenderingIsConditionalOnItsPresence() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertTrue(
            src.contains("if let title"),
            "expected the title region to render conditionally on its presence, not always with an empty placeholder"
        )
    }

    func testDescriptionRenderingIsConditionalOnItsPresence() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertTrue(
            src.contains("if let description"),
            "expected the description region to render conditionally on its presence, not always with an empty placeholder"
        )
    }

    func testNoEmptyTitleOrDescriptionPlaceholderIsRenderedWhenAbsent() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertNil(
            src.range(of: #"title\s*\?\?\s*Text\(""\)"#, options: .regularExpression),
            "expected no empty-string title placeholder that would still reserve layout space when title is absent"
        )
        XCTAssertNil(
            src.range(of: #"description\s*\?\?\s*Text\(""\)"#, options: .regularExpression),
            "expected no empty-string description placeholder that would still reserve layout space when description is absent"
        )
    }

    // MARK: - Source contract: accessibility stays keyed off the presence of an action

    func testAccessibilityElementCombinesWithoutAnActionAndContainsWithOne() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertTrue(
            src.contains(".accessibilityElement(children: action == nil ? .combine : .contain)"),
            "expected accessibility children behavior to stay keyed off the presence of an action"
        )
    }

    // MARK: - Source contract: semantic meaning is conveyed by icon/text, never color tint alone

    func testSemanticMeaningIsConveyedByIconAndTextNeverColorTintAlone() throws {
        guard let src = hermexBannerSource() else { return }
        XCTAssertTrue(
            src.contains("semantic.defaultIcon"),
            "expected a semantic default icon, so meaning is never conveyed by color tint alone"
        )
        XCTAssertTrue(
            src.contains(".foregroundStyle(semantic.tint)"),
            "expected tint to style the existing icon/text, not stand alone as the only semantic signal"
        )
    }

    func testInsetPresentationUsesAStrongerSameSemanticFamilyBorderThanItsFill() throws {
        guard let src = hermexBannerSource() else { return }
        guard let insetStart = src.range(of: "case .inset:") else {
            XCTFail("expected an inset presentation branch")
            return
        }
        let insetBranch = String(src[insetStart.lowerBound...])

        XCTAssertTrue(
            insetBranch.contains(".fill(semantic.tint.opacity(0.12))"),
            "expected the inset background to keep its light semantic-family fill"
        )
        XCTAssertTrue(
            insetBranch.contains(".stroke(semantic.tint.opacity(0.28), lineWidth: 0.5)"),
            "expected a subtle border from the same semantic color family at a stronger opacity than the fill"
        )
    }

    // MARK: - Retirement contracts: the legacy Banner/Banner.swift/BannerTests.swift are fully gone

    func testLegacyBannerSourceIsRemoved() {
        let url = resourceURL(Self.legacyBannerSourcePath)
        XCTAssertFalse(
            FileManager.default.fileExists(atPath: url.path),
            "expected the legacy Banner.swift to be deleted once HermexBanner.swift replaces it — no shim or deprecation wrapper retained"
        )
    }

    func testLegacyBannerTestsFileIsRemoved() {
        let url = resourceURL("HermesMobileTests/BannerTests.swift")
        XCTAssertFalse(
            FileManager.default.fileExists(atPath: url.path),
            "expected the legacy BannerTests.swift to be deleted alongside the retired Banner.swift"
        )
    }

    func testNoProductionSourceRedeclaresTheLegacyBannerTypeOrExtension() throws {
        let hermesMobileURL = resourceURL("HermesMobile")
        guard let enumerator = FileManager.default.enumerator(at: hermesMobileURL, includingPropertiesForKeys: nil) else {
            XCTFail("expected to enumerate HermesMobile/")
            return
        }
        for case let fileURL as URL in enumerator where fileURL.pathExtension == "swift" {
            guard let text = try? String(contentsOf: fileURL, encoding: .utf8) else { continue }
            XCTAssertFalse(
                text.contains("struct Banner: View"),
                "\(fileURL.lastPathComponent) must not redeclare the legacy `struct Banner: View`"
            )
            XCTAssertNil(
                text.range(of: #"extension Banner\b"#, options: .regularExpression),
                "\(fileURL.lastPathComponent) must not redeclare the legacy `extension Banner`"
            )
        }
    }

    func testProjectFileNoLongerReferencesTheLegacyBannerOrBannerTestsFilenames() throws {
        let src = try source(Self.pbxprojPath)
        XCTAssertNil(
            src.range(of: #"(?<!Hermex)Banner\.swift\b"#, options: .regularExpression),
            "expected no active pbxproj reference to the legacy production Banner.swift"
        )
        XCTAssertNil(
            src.range(of: #"(?<!Hermex)BannerTests\.swift\b"#, options: .regularExpression),
            "expected no active pbxproj reference to the legacy BannerTests.swift"
        )
    }

    // MARK: - Production boundary: Banner remains foundation/catalog-only

    func testMainChatComposerHasNoHermexBannerCallSite() throws {
        let src = try source(Self.chatComposerViewPath)
        XCTAssertFalse(src.contains("HermexBanner("), "expected zero new production Banner adoption in ChatComposerView")
        XCTAssertTrue(src.contains("ComposerStatusView("), "expected the existing composer status surface to remain production-owned")
        XCTAssertTrue(src.contains("isError: composerStatus.isError"), "expected error styling to remain on the existing status surface")
    }

    func testUploadAttachmentErrorsPreserveTheDismissActionsIconAndAccessibilityLabel() throws {
        let src = try source(Self.chatComposerViewPath)
        XCTAssertTrue(src.contains("\"xmark\""), "expected the dismiss action to keep its xmark icon")
        XCTAssertTrue(src.contains("\"Dismiss attachment error\""), "expected the dismiss action to keep its accessibility label")
    }

    func testComposerStatusPriorityOrderStaysByteObservable() throws {
        let src = try source(Self.chatComposerViewPath)
        guard let propertyRange = src.range(of: "private var composerStatus:") else {
            XCTFail("expected a `composerStatus` computed property to scope this contract to")
            return
        }
        let remainder = src[propertyRange.lowerBound...]
        guard let boundaryRange = remainder.range(of: "\n    private var voiceStatus:") else {
            XCTFail("expected `composerStatus` to be followed by `voiceStatus` so this contract can scope to just its own body")
            return
        }
        let body = String(remainder[remainder.startIndex..<boundaryRange.lowerBound])

        let orderedTokens = [
            "readOnlyMessage",
            "isCancellingStream",
            "isCompressingSession",
            "uploadAttachmentErrorMessage",
            "isSendingVoiceNote",
            "isUploadingAttachment",
            "errorMessage",
            "configurationErrorMessage",
            "isUpdatingConfiguration",
        ]
        var searchStart = body.startIndex
        for token in orderedTokens {
            guard let tokenRange = body.range(of: token, range: searchStart..<body.endIndex) else {
                XCTFail("expected `\(token)` to remain part of composerStatus's priority order, in order")
                return
            }
            searchStart = tokenRange.upperBound
        }
    }

    func testAllComposerStatusesStillRouteThroughTheExistingComposerStatusView() throws {
        let src = try source(Self.chatComposerViewPath)
        XCTAssertNotNil(
            src.range(of: #"\bComposerStatusView\b"#, options: .regularExpression),
            "expected all composer statuses to keep routing through the existing production status view, not HermexBanner"
        )
    }

    func testVoiceStatusSurfacesRemainUnchanged() throws {
        let src = try source(Self.chatComposerViewPath)
        XCTAssertTrue(src.contains("ComposerVoiceStatusView(status: voiceNoteStatus)"))
        XCTAssertTrue(src.contains("ComposerVoiceStatusView(status: voiceStatus)"))
    }

    func testThisBannerSliceDoesNotChangeComposerToolbarAdoptionStatus() throws {
        let src = try source(Self.chatComposerViewPath)
        XCTAssertFalse(
            src.contains("HermexComposerToolbar("),
            "expected this Banner slice not to change HermexComposerToolbar's adoption status in ChatComposerView"
        )
    }

    // MARK: - DEBUG lab reachability: a dedicated Banner section with real, stably-identified specimens

    func testRemainsReachableFromTheDebugOverlayLabWithADedicatedBannerSection() throws {
        let src = try source(Self.overlayLabPath)
        XCTAssertTrue(
            src.contains("--hermex-overlay-lab-banner"),
            "expected a deterministic launch flag scrolling straight to the Banner fixtures"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-banner-section"),
            "expected a deterministic scroll anchor for the Banner section"
        )
    }

    func testDebugLabExposesAllThreeContentCombinationSpecimensAndAComposerStyleErrorSpecimen() throws {
        let src = try source(Self.overlayLabPath)
        for identifier in [
            "overlay-lab-banner-title-description",
            "overlay-lab-banner-title-only",
            "overlay-lab-banner-description-only",
            "overlay-lab-banner-composer-error",
        ] {
            XCTAssertTrue(src.contains(identifier), "expected a stable identifier for \(identifier)")
        }
    }

    func testDebugLabComposerStyleErrorSpecimenUsesDescriptionOnlyInsetErrorPresentation() throws {
        let src = try source(Self.overlayLabPath)
        guard let anchorRange = src.range(of: "overlay-lab-banner-composer-error") else {
            XCTFail("expected an overlay-lab-banner-composer-error identifier to scope this contract to")
            return
        }
        let windowStart = src.index(anchorRange.lowerBound, offsetBy: -400, limitedBy: src.startIndex) ?? src.startIndex
        let windowEnd = src.index(anchorRange.upperBound, offsetBy: 400, limitedBy: src.endIndex) ?? src.endIndex
        let window = String(src[windowStart..<windowEnd])

        XCTAssertTrue(window.contains("HermexBanner(.error"), "expected the composer-error specimen to compose HermexBanner(.error, ...)")
        XCTAssertTrue(window.contains("title: nil"), "expected the composer-error specimen to be description-only")
        XCTAssertTrue(window.contains(".inset"), "expected the composer-error specimen to use inset presentation")
    }

    func testDebugLabIncludesAtLeastOneActionSpecimen() throws {
        let src = try source(Self.overlayLabPath)
        guard let sectionStart = src.range(of: "overlay-lab-banner-section") else {
            XCTFail("expected an overlay-lab-banner-section anchor to scope this contract to")
            return
        }
        let remainder = src[sectionStart.upperBound...]
        let sectionEnd = remainder.range(of: "\n}") ?? remainder.range(of: "\nprivate struct")
        let section = sectionEnd.map { String(remainder[remainder.startIndex..<$0.lowerBound]) } ?? String(remainder)
        XCTAssertTrue(section.contains("action:"), "expected at least one Banner specimen with an action")
    }

    func testDebugLabBannerSpecimensComposeTheRealHermexBannerAtLeastFourTimes() throws {
        let src = try source(Self.overlayLabPath)
        XCTAssertTrue(
            src.components(separatedBy: "HermexBanner(").count - 1 >= 4,
            "expected at least four real HermexBanner( specimens (title+description, title only, description only, composer-style error)"
        )
    }
}
