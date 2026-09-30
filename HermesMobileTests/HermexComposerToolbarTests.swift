import SwiftUI
import XCTest
@testable import HermesMobile

/// Contracts for `HermexComposerToolbar` (`HermexComposerToolbar.swift`, not yet created): the
/// shared horizontal composer-toolbar row generalized from `ComposerToolbarScroller`
/// (`ChatComposerToolbarScroller.swift`) as a catalog foundation for future adoption. The current
/// Chat and Bots feature-local scrollers remain unchanged and are not migrated by this suite.
/// These tests reference the future public/pure symbols
/// (`HermexComposerToolbarAppearance`, `HermexComposerToolbarEdgeFades`, `HermexComposerToolbar`)
/// directly, so this suite is expected to fail to compile until a later task adds them — mirroring
/// the established pattern in `HermexCodeInputTests`. Non-directly-observable behavior (exact view
/// body wiring, the conditional appearance branch, the fade-visibility gate) stays a source
/// contract read against the shared file itself via `requiredSource()`/`hermexComposerToolbarRegion()`,
/// mirroring `HermexSurfaceBorderTests`/`HermexPopoverMenuTests`/`HermexCodeInputTests`, each of
/// which fails through one explicit XCTest assertion rather than an uncaught file error. Production
/// preservation contracts pin that `ComposerToolbarScroller` keeps its current public behavior and
/// that no production call site adopts `HermexComposerToolbar` yet.
final class HermexComposerToolbarTests: XCTestCase {
    private static let sourcePath = "HermesMobile/Features/Shared/HermexComposerToolbar.swift"
    private static let productionScrollerPath = "HermesMobile/Features/Chat/ChatComposerToolbarScroller.swift"
    private static let chatComposerViewPath = "HermesMobile/Features/Chat/ChatComposerView.swift"
    private static let botChatComposerViewPath = "HermesMobile/Features/Bots/BotChatComposerView.swift"
    private static let botRoomComposerViewPath = "HermesMobile/Features/Bots/BotRoomComposerView.swift"

    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func sourceIfExists(_ relativePath: String) -> String? {
        try? String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    private func requiredSource() throws -> String {
        try XCTUnwrap(
            sourceIfExists(Self.sourcePath),
            "expected \(Self.sourcePath) to exist — HermexComposerToolbar is not yet defined"
        )
    }

    private func requiredExistingSource(_ relativePath: String) throws -> String {
        try XCTUnwrap(sourceIfExists(relativePath), "expected \(relativePath) to exist")
    }

    /// Isolates the `HermexComposerToolbar` struct body from the rest of the shared file so source
    /// contracts about its internals don't accidentally match unrelated code elsewhere in the file,
    /// mirroring `HermexCodeInputTests.hermexCodeInputRegion()`.
    private func hermexComposerToolbarRegion() throws -> String {
        let src = try requiredSource()
        guard let structRange = src.range(of: "struct HermexComposerToolbar<Content: View>: View") else {
            XCTFail("expected `struct HermexComposerToolbar<Content: View>: View` in \(Self.sourcePath)")
            return ""
        }
        let remainder = src[structRange.lowerBound...]
        guard let nextStructRange = remainder.range(
            of: #"\nstruct \w"#,
            options: .regularExpression,
            range: remainder.index(after: remainder.startIndex)..<remainder.endIndex
        ) else {
            return String(remainder)
        }
        return String(remainder[remainder.startIndex..<nextStructRange.lowerBound])
    }

    // MARK: - Pure edge-fades math

    func testNoFadesWhenContentFits() {
        let fades = HermexComposerToolbarEdgeFades(offset: 0, contentWidth: 300, viewportWidth: 320)

        XCTAssertFalse(fades.leading)
        XCTAssertFalse(fades.trailing)
    }

    func testOnlyTrailingFadeAtStartOfOverflowingContentInLTR() {
        let fades = HermexComposerToolbarEdgeFades(offset: 0, contentWidth: 500, viewportWidth: 320)

        XCTAssertFalse(fades.leading)
        XCTAssertTrue(fades.trailing)
    }

    func testBothFadesMidScrollInLTR() {
        let fades = HermexComposerToolbarEdgeFades(offset: 90, contentWidth: 500, viewportWidth: 320)

        XCTAssertTrue(fades.leading)
        XCTAssertTrue(fades.trailing)
    }

    func testOnlyLeadingFadeAtEndInLTR() {
        let fades = HermexComposerToolbarEdgeFades(offset: 180, contentWidth: 500, viewportWidth: 320)

        XCTAssertTrue(fades.leading)
        XCTAssertFalse(fades.trailing)
    }

    func testEdgesWithinEpsilonCountAsReached() {
        let nearStart = HermexComposerToolbarEdgeFades(offset: 3, contentWidth: 500, viewportWidth: 320)
        let nearEnd = HermexComposerToolbarEdgeFades(offset: 177, contentWidth: 500, viewportWidth: 320)

        XCTAssertFalse(nearStart.leading)
        XCTAssertFalse(nearEnd.trailing)
    }

    func testRightToLeftFlipsRawOffsetAtStart() {
        let atStart = HermexComposerToolbarEdgeFades(
            offset: 180, contentWidth: 500, viewportWidth: 320, layoutDirection: .rightToLeft
        )

        XCTAssertFalse(atStart.leading)
        XCTAssertTrue(atStart.trailing)
    }

    func testRightToLeftFlipsRawOffsetAtEnd() {
        let atEnd = HermexComposerToolbarEdgeFades(
            offset: 0, contentWidth: 500, viewportWidth: 320, layoutDirection: .rightToLeft
        )

        XCTAssertTrue(atEnd.leading)
        XCTAssertFalse(atEnd.trailing)
    }

    // MARK: - Compile contracts

    @MainActor
    func testHermexComposerToolbarCompilesWithTheDefaultElevatedAppearance() {
        struct Host: View {
            var body: some View {
                HermexComposerToolbar {
                    Button("Model") {}
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testHermexComposerToolbarCompilesWithAnExplicitTransparentAppearance() {
        struct Host: View {
            var body: some View {
                HermexComposerToolbar(appearance: .transparent) {
                    Button("Profile") {}
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testHermexComposerToolbarCompilesWithMixedCallerContentAndNoFeatureSpecificTypes() {
        struct Host: View {
            var body: some View {
                HermexComposerToolbar {
                    Button("Model") {}
                    Text("gpt-5.5")
                    Button("Profile") {}
                    Text("main")
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contract: the foundation file must exist

    func testFoundationFileExistsAtItsNamedSharedPath() {
        XCTAssertNotNil(
            sourceIfExists(Self.sourcePath),
            "expected \(Self.sourcePath) to exist as the shared composer toolbar foundation"
        )
    }

    // MARK: - Source contract: appearance enum

    func testSourceDefinesTheAppearanceEnumWithElevatedAndTransparentCases() throws {
        let src = try requiredSource()
        XCTAssertTrue(src.contains("enum HermexComposerToolbarAppearance"), "expected the approved appearance enum")
        XCTAssertTrue(src.contains("case elevated"), "expected an .elevated case")
        XCTAssertTrue(src.contains("case transparent"), "expected a .transparent case")
    }

    // MARK: - Source contract: the toolbar struct's shape

    func testSourceDefinesAGenericToolbarStructConformingToView() throws {
        let src = try requiredSource()
        XCTAssertTrue(
            src.contains("struct HermexComposerToolbar<Content: View>: View"),
            "expected a generic HermexComposerToolbar<Content: View>: View"
        )
    }

    func testSourceInitTakesAViewBuilderContentClosure() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(
            region.contains("@ViewBuilder content: () -> Content"),
            "expected the approved @ViewBuilder content closure"
        )
    }

    // MARK: - Source contract: layout skeleton

    func testSourceUsesExactlyOneHorizontalScrollViewAndOneHStack() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertEqual(
            region.components(separatedBy: "ScrollView(.horizontal)").count - 1, 1,
            "expected exactly one ScrollView(.horizontal)"
        )
        XCTAssertEqual(
            region.components(separatedBy: "HStack").count - 1, 1,
            "expected exactly one HStack"
        )
    }

    func testSourceUsesHermesSpacingS8ForItemSpacing() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(region.contains("HermesSpacing.s8"), "expected HermesSpacing.s8 item spacing")
    }

    func testSourceAppliesHorizontalPaddingWithHermesSpacingS16() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(
            region.contains(".padding(.horizontal, HermesSpacing.s16)"),
            "expected .padding(.horizontal, HermesSpacing.s16)"
        )
    }

    func testSourceEnforcesA44ptMinimumRowHeight() throws {
        let region = try hermexComposerToolbarRegion()
        let hasNamedMetric = region.range(
            of: #"minimumRowHeight[^\n]*=\s*44"#,
            options: .regularExpression
        ) != nil
        let hasExactValue = region.contains("minHeight: 44")
        XCTAssertTrue(
            hasNamedMetric || hasExactValue,
            "expected a 44pt minimum row height via a named metric or exact value"
        )
    }

    // MARK: - Source contract: scroll behavior

    func testSourceHidesScrollIndicators() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(region.contains(".scrollIndicators(.hidden)"))
    }

    func testSourceUsesSizeBasedHorizontalBounce() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(region.contains(".scrollBounceBehavior(.basedOnSize, axes: .horizontal)"))
    }

    func testSourceNeverDismissesTheKeyboardOnScroll() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(region.contains(".scrollDismissesKeyboard(.never)"))
    }

    // MARK: - Source contract: edge fades helper and its RTL-aware epsilon

    func testSourceDefinesEdgeFadesWithAFourPointScrollEpsilonAndRTLHandling() throws {
        let src = try requiredSource()
        XCTAssertTrue(src.contains("struct HermexComposerToolbarEdgeFades"))
        XCTAssertTrue(src.contains("static let scrollEpsilon: CGFloat = 4"))
        XCTAssertTrue(
            src.contains("layoutDirection") && src.contains(".rightToLeft"),
            "expected the edge-fades helper to account for right-to-left layout direction"
        )
    }

    func testSourceOnlyShowsFadesWhenEdgeFadesMarksHiddenContent() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(
            region.contains("fades.leading") && region.contains("fades.trailing"),
            "expected the fade mask to be driven by the edge-fades helper, not always shown"
        )
    }

    // MARK: - Source contract: Reduce Motion

    func testSourceReadsReduceMotionAndDisablesFadeAnimationUnderIt() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(
            region.contains("@Environment(\\.accessibilityReduceMotion)"),
            "expected the toolbar to read accessibilityReduceMotion"
        )
        XCTAssertNotNil(
            region.range(of: #"reduceMotion\s*\?\s*nil\s*:"#, options: .regularExpression),
            "expected the fade animation to become nil under Reduce Motion"
        )
    }

    // MARK: - Source contract: appearance-specific rendering

    func testElevatedAppearanceUsesSystemBackgroundCardRadiusAndControlElevatedShadow() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(region.contains("Color(.systemBackground)"), "expected adaptive Color(.systemBackground)")
        XCTAssertTrue(region.contains("HermesRadius.card"), "expected HermesRadius.card")
        XCTAssertTrue(region.contains(".hermesShadow(.controlElevatedResting)"), "expected the controlElevatedResting shadow token")
    }

    func testTransparentAppearanceAppliesNoToolbarOwnedBackgroundBorderOrShadow() throws {
        let region = try hermexComposerToolbarRegion()
        XCTAssertTrue(
            region.contains("case .elevated") || region.contains("appearance == .elevated"),
            "expected the background/border/shadow branch to be conditioned on .elevated so .transparent renders none of it"
        )
    }

    // MARK: - Source contract: no composer-domain API leaks into the shared foundation

    func testDoesNotIntroduceAnyComposerDomainAPI() throws {
        let src = try requiredSource()
        let forbiddenTokens = [
            "Send", "Stop", "TextEditor", "Draft", "Attachment",
            "Menu(", "sheet(", "Selection", "Workspace", "Profile",
            "Branch", "Voice", "pinned", "Pinned"
        ]
        for token in forbiddenTokens {
            XCTAssertFalse(src.contains(token), "must not introduce composer-domain API: \(token)")
        }
    }

    // MARK: - Production preservation: ComposerToolbarScroller keeps its current behavior

    func testProductionScrollerStillDefinesItsPublicStructAndKeyBehaviors() throws {
        let src = try requiredExistingSource(Self.productionScrollerPath)
        XCTAssertTrue(src.contains("struct ComposerToolbarScroller<Content: View>: View"))
        XCTAssertTrue(src.contains(".scrollDismissesKeyboard(.never)"))
        XCTAssertTrue(src.contains(".scrollBounceBehavior(.basedOnSize, axes: .horizontal)"))
        XCTAssertTrue(src.contains(".scrollIndicators(.hidden)"))
        XCTAssertTrue(src.contains("mask"), "expected the scroller to keep its fade mask")
        XCTAssertTrue(src.contains("layoutDirection"), "expected the scroller to keep reading layout direction")
        XCTAssertTrue(src.contains("accessibilityReduceMotion"), "expected the scroller to keep reading Reduce Motion")
        XCTAssertTrue(
            src.contains("minimumRowHeight: CGFloat = 44") || src.contains("minHeight: 44"),
            "expected the scroller to keep its 44pt minimum row height"
        )
        XCTAssertTrue(
            src.contains("itemSpacing: CGFloat = 8") || src.contains("spacing: 8"),
            "expected the scroller to keep its 8pt item spacing"
        )
    }

    // MARK: - Production preservation: the production edge-fades name survives as a typealias

    func testFutureSharedSourceKeepsTheProductionEdgeFadesNameAsATypealias() throws {
        let src = try requiredSource()
        XCTAssertTrue(
            src.contains("typealias ComposerToolbarEdgeFades = HermexComposerToolbarEdgeFades"),
            "expected the production-facing name to be preserved as a typealias onto the new shared type"
        )
    }

    // MARK: - Production preservation: not yet adopted anywhere

    func testHermexComposerToolbarIsNotYetAdoptedInChatComposerView() throws {
        let src = try requiredExistingSource(Self.chatComposerViewPath)
        XCTAssertFalse(src.contains("HermexComposerToolbar("))
    }

    func testHermexComposerToolbarIsNotYetAdoptedInBotChatComposerView() throws {
        let src = try requiredExistingSource(Self.botChatComposerViewPath)
        XCTAssertFalse(src.contains("HermexComposerToolbar("))
    }

    func testHermexComposerToolbarIsNotYetAdoptedInBotRoomComposerView() throws {
        let src = try requiredExistingSource(Self.botRoomComposerViewPath)
        XCTAssertFalse(src.contains("HermexComposerToolbar("))
    }

    // MARK: - DEBUG lab reachability (DSR2-09): real elevated fitting/overflowing and transparent
    // specimens, stably identified, with no Send/Stop control anywhere in the fixture section — the
    // overlay lab is the one permitted non-foundation-file caller of HermexComposerToolbar(.

    private static let overlayLabPath = "HermesMobile/Features/Shared/HermexOverlayLab.swift"

    func testRemainsReachableFromTheDebugOverlayLabWithADedicatedComposerToolbarSection() throws {
        let src = try requiredExistingSource(Self.overlayLabPath)
        XCTAssertTrue(
            src.contains("--hermex-overlay-lab-composer-toolbar"),
            "expected a deterministic launch flag scrolling straight to the Composer Toolbar fixtures"
        )
        XCTAssertTrue(
            src.contains("overlay-lab-composer-toolbar-section"),
            "expected a deterministic scroll anchor for the Composer Toolbar section"
        )
    }

    func testDebugLabExposesRealElevatedFittingOverflowingAndTransparentSpecimens() throws {
        let src = try requiredExistingSource(Self.overlayLabPath)
        for identifier in [
            "overlay-lab-composer-toolbar-elevated-fitting",
            "overlay-lab-composer-toolbar-elevated-overflow",
            "overlay-lab-composer-toolbar-transparent",
        ] {
            XCTAssertTrue(src.contains(identifier), "expected a stable identifier for \(identifier)")
        }
        XCTAssertTrue(
            src.components(separatedBy: "HermexComposerToolbar(").count - 1 >= 3,
            "expected at least three real HermexComposerToolbar( specimens (elevated fitting, elevated overflowing, transparent)"
        )
    }

    func testDebugLabComposerToolbarFixturesContainNoSendOrStopControl() throws {
        let src = try requiredExistingSource(Self.overlayLabPath)
        guard let sectionStart = src.range(of: "overlay-lab-composer-toolbar-section") else {
            XCTFail("expected an overlay-lab-composer-toolbar-section anchor to scope this contract to")
            return
        }
        let remainder = src[sectionStart.upperBound...]
        let sectionEnd = remainder.range(of: "\n}") ?? remainder.range(of: "\nprivate struct")
        let section = sectionEnd.map { String(remainder[remainder.startIndex..<$0.lowerBound]) } ?? String(remainder)
        XCTAssertFalse(section.contains("\"Send\""), "must not demonstrate a Send control in the Composer Toolbar fixture section")
        XCTAssertFalse(section.contains("\"Stop\""), "must not demonstrate a Stop control in the Composer Toolbar fixture section")
    }
}
