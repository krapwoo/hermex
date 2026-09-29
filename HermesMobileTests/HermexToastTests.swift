import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexToast` (`HermexToast.swift`): semantic tint/icon mapping is a pure contract;
/// visibility stays caller-owned through the `hermexToast(isPresented:toast:)` presentation modifier,
/// so a SwiftUI view tree isn't inspectable at runtime without a rendering harness and that adoption
/// surface is a compile contract.
final class HermexToastTests: XCTestCase {
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
        XCTAssertEqual(HermexToast.Semantic.information.tint, .blue)
        XCTAssertEqual(HermexToast.Semantic.success.tint, .green)
        XCTAssertEqual(HermexToast.Semantic.warning.tint, .yellow)
        XCTAssertEqual(HermexToast.Semantic.error.tint, .red)

        XCTAssertEqual(HermexToast.Semantic.success.defaultIcon, "checkmark.circle")
    }

    func testExplicitIconOverridesTheSemanticDefault() {
        let toast = HermexToast(.information, message: Text("Synced"), icon: "checkmark.circle")
        XCTAssertEqual(toast.icon, "checkmark.circle")
    }

    // MARK: - Compile contracts: caller-owned visibility, optional icon/action

    func testEverySemanticCompilesWithAndWithoutAnAction() {
        for semantic in [HermexToast.Semantic.information, .success, .warning, .error] {
            let plain = HermexToast(semantic, message: Text("Status"))
            let withAction = HermexToast(semantic, message: Text("Status"), action: .init(title: "Undo", handler: {}))
            XCTAssertFalse(String(describing: type(of: plain)).isEmpty)
            XCTAssertFalse(String(describing: type(of: withAction)).isEmpty)
        }
    }

    @MainActor
    func testHermexToastPresentationModifierCompilesOverAnyView() {
        struct Host: View {
            @State var isPresented = true
            var body: some View {
                Color.clear
                    .hermexToast(isPresented: $isPresented, toast: HermexToast(.success, message: Text("Saved")))
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contract: default top-edge motion, caller-owned lifecycle preserved

    func testDefaultTransitionMovesFromTheTopEdgeReusingTheOverlayEnterAndExitMotionBundles() throws {
        let src = try source("HermesMobile/Features/Shared/HermexToast.swift")
        XCTAssertTrue(src.contains(".move(edge: .top)"))
        XCTAssertTrue(src.contains(".combined(with: .opacity)"))
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayEnter"))
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayExit"))
        XCTAssertTrue(src.contains(".asymmetric("))
    }

    func testReduceMotionFallsBackToAnOpacityOnlyStateChange() throws {
        let src = try source("HermesMobile/Features/Shared/HermexToast.swift")
        XCTAssertTrue(src.contains("reduceMotion"))
        XCTAssertTrue(src.contains("return .opacity"))
    }

    func testPresentationStaysCallerOwnedWithNoInternalTimer() throws {
        let src = try source("HermesMobile/Features/Shared/HermexToast.swift")
        XCTAssertFalse(src.contains("Timer"))
        XCTAssertFalse(src.contains("DispatchQueue.main.asyncAfter"))
        XCTAssertTrue(src.contains("@Binding var isPresented: Bool"))
    }

    // MARK: - Issue #DSF-03: XS neutral trailing action, not a status-tinted plain Button

    /// Isolates the `if let action { ... }` block's own source so an assertion about the trailing
    /// action's chrome never accidentally matches the icon's own, still-status-tinted, foreground
    /// modifier a few lines above it.
    private func trailingActionSource() throws -> String {
        let src = try source("HermesMobile/Features/Shared/HermexToast.swift")
        let after = try XCTUnwrap(src.components(separatedBy: "if let action {").last,
                                   "expected an `if let action` trailing-action block")
        return try XCTUnwrap(after.components(separatedBy: "\n            }").first,
                              "expected the action block to close before the closing HStack brace")
    }

    func testTrailingActionComposesAnExtraSmallNeutralHermexButtonRatherThanAStatusTintedPlainButton() throws {
        let block = try trailingActionSource()
        XCTAssertTrue(block.contains("HermexButton("), "expected the trailing action to compose the shared HermexButton")
        XCTAssertTrue(block.contains("size: .extraSmall"), "expected the trailing action to use HermexButtonSize.extraSmall")
        XCTAssertTrue(block.contains("emphasis: .neutral"), "expected the trailing action to use neutral emphasis")
        XCTAssertFalse(block.contains(".buttonStyle(.plain)"), "the trailing action must no longer be a plain Button")
        XCTAssertFalse(block.contains("semantic.tint"),
                       "the trailing action must not carry the toast's status tint — status tint stays on status content (the icon), not the neutral action")
    }

    func testStatusIconKeepsItsSemanticTintAfterTheTrailingActionBecomesNeutral() throws {
        let src = try source("HermesMobile/Features/Shared/HermexToast.swift")
        let iconBlock = try XCTUnwrap(src.components(separatedBy: "if let icon {").last?
            .components(separatedBy: "\n\n").first,
            "expected an `if let icon` block")
        XCTAssertTrue(iconBlock.contains("semantic.tint"), "the icon must keep the toast's semantic tint even though the action loses it")
    }

    func testOverlayLabIncludesToastFollowupFixturesWithAndWithoutAnAction() throws {
        let src = try source("HermesMobile/Features/Shared/HermexOverlayLab.swift")
        XCTAssertTrue(src.contains("private struct HermexOverlayLabToastFollowup"))
        XCTAssertTrue(src.contains("HermexToast(.success"))
        XCTAssertTrue(src.contains("action: .init(title: \"Undo\""))
        XCTAssertTrue(src.contains("overlay-lab-followup-toast"))
    }
}
