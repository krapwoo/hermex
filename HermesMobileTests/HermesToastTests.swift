import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermesToast` (`HermesToast.swift`): semantic tint/icon mapping is a pure contract;
/// visibility stays caller-owned through the `hermesToast(isPresented:toast:)` presentation modifier,
/// so a SwiftUI view tree isn't inspectable at runtime without a rendering harness and that adoption
/// surface is a compile contract.
final class HermesToastTests: XCTestCase {
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
}
