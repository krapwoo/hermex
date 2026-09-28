import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `.hermesSearch(text:placement:prompt:)` (`HermesSearch.swift`): a thin Hermex-owned
/// wrapper over SwiftUI's native `.searchable`, not custom field chrome. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a compile contract plus a source
/// contract that pins the forwarding call and the native-preserving default placement.
final class HermesSearchTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Compile contracts

    @MainActor
    func testCompilesWithOnlyAQueryBindingUsingTheNativeAutomaticPlacementAndNoPrompt() {
        struct Host: View {
            @State var query = ""
            var body: some View {
                List {}
                    .hermesSearch(text: $query)
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithAnExplicitNavigationBarDrawerPlacementAndAStringPrompt() {
        struct Host: View {
            @State var query = ""
            var body: some View {
                List {}
                    .hermesSearch(
                        text: $query,
                        placement: .navigationBarDrawer(displayMode: .always),
                        prompt: "Search sessions"
                    )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testCompilesWithATextPrompt() {
        struct Host: View {
            @State var query = ""
            var body: some View {
                List {}
                    .hermesSearch(text: $query, prompt: Text("Search Cards"))
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contract: a thin forwarding wrapper, no custom search chrome

    func testForwardsDirectlyToNativeSearchableWithTheAutomaticDefaultPlacement() throws {
        let src = try source("HermesMobile/Features/Shared/HermesSearch.swift")
        XCTAssertTrue(src.contains("func hermesSearch("))
        XCTAssertTrue(src.contains("searchable(text:"), "expected the wrapper to forward to native .searchable")
        XCTAssertTrue(
            src.contains("placement: SearchFieldPlacement = .automatic"),
            "expected the native automatic placement to remain the default"
        )
    }

    func testIntroducesNoCustomSearchFieldChrome() throws {
        let src = try source("HermesMobile/Features/Shared/HermesSearch.swift")
        XCTAssertFalse(src.contains("TextField("), "the wrapper must not draw its own search field")
        XCTAssertFalse(src.contains("struct HermesSearchField"), "the wrapper must not introduce custom search-field chrome")
    }
}
