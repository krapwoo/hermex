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
}
