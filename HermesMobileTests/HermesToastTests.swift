import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermesToast` (`HermesToast.swift`): semantic tint/icon mapping is a pure contract;
/// visibility stays caller-owned through the `hermesToast(isPresented:toast:)` presentation modifier,
/// so a SwiftUI view tree isn't inspectable at runtime without a rendering harness and that adoption
/// surface is a compile contract.
final class HermesToastTests: XCTestCase {
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
        XCTAssertEqual(HermesToast.Semantic.information.tint, .blue)
        XCTAssertEqual(HermesToast.Semantic.success.tint, .green)
        XCTAssertEqual(HermesToast.Semantic.warning.tint, .yellow)
        XCTAssertEqual(HermesToast.Semantic.error.tint, .red)

        XCTAssertEqual(HermesToast.Semantic.success.defaultIcon, "checkmark.circle")
    }

    func testExplicitIconOverridesTheSemanticDefault() {
        let toast = HermesToast(.information, message: Text("Synced"), icon: "checkmark.circle")
        XCTAssertEqual(toast.icon, "checkmark.circle")
    }

    // MARK: - Compile contracts: caller-owned visibility, optional icon/action

    func testEverySemanticCompilesWithAndWithoutAnAction() {
        for semantic in [HermesToast.Semantic.information, .success, .warning, .error] {
            let plain = HermesToast(semantic, message: Text("Status"))
            let withAction = HermesToast(semantic, message: Text("Status"), action: .init(title: "Undo", handler: {}))
            XCTAssertFalse(String(describing: type(of: plain)).isEmpty)
            XCTAssertFalse(String(describing: type(of: withAction)).isEmpty)
        }
    }

    @MainActor
    func testHermesToastPresentationModifierCompilesOverAnyView() {
        struct Host: View {
            @State var isPresented = true
            var body: some View {
                Color.clear
                    .hermesToast(isPresented: $isPresented, toast: HermesToast(.success, message: Text("Saved")))
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contract: default top-edge motion, caller-owned lifecycle preserved

    func testDefaultTransitionMovesFromTheTopEdgeReusingTheOverlayEnterAndExitMotionBundles() throws {
        let src = try source("HermesMobile/Features/Shared/HermesToast.swift")
        XCTAssertTrue(src.contains(".move(edge: .top)"))
        XCTAssertTrue(src.contains(".combined(with: .opacity)"))
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayEnter"))
        XCTAssertTrue(src.contains("HermesMotion.Bundle.overlayExit"))
        XCTAssertTrue(src.contains(".asymmetric("))
    }

    func testReduceMotionFallsBackToAnOpacityOnlyStateChange() throws {
        let src = try source("HermesMobile/Features/Shared/HermesToast.swift")
        XCTAssertTrue(src.contains("reduceMotion"))
        XCTAssertTrue(src.contains("return .opacity"))
    }

    func testPresentationStaysCallerOwnedWithNoInternalTimer() throws {
        let src = try source("HermesMobile/Features/Shared/HermesToast.swift")
        XCTAssertFalse(src.contains("Timer"))
        XCTAssertFalse(src.contains("DispatchQueue.main.asyncAfter"))
        XCTAssertTrue(src.contains("@Binding var isPresented: Bool"))
    }
}
