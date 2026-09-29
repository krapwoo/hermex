import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexList` (`HermexList.swift`): a default 12pt vertical scroll-content margin
/// using the existing `HermesSpacing.s12` token, while native SwiftUI List semantics (selection,
/// refresh, row insets, separators, swipe/context menus, keyboard/accessibility) stay untouched. A
/// SwiftUI view tree isn't inspectable at runtime without a rendering harness, so this is a
/// source-contract suite, matching the convention used by ListItemTests/HermexContentUnavailableTests.
final class HermexListTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    func testDefaultVerticalContentMarginUsesTheExistingS12Token() throws {
        let src = try source("HermesMobile/Features/Shared/HermexList.swift")
        XCTAssertTrue(
            src.contains(".contentMargins(.vertical, HermesSpacing.s12, for: .scrollContent)"),
            "expected HermexList to apply a default 12pt vertical scroll-content margin using HermesSpacing.s12"
        )
    }

    func testHermesSpacingS12Is12Points() {
        XCTAssertEqual(HermesSpacing.s12, 12)
    }

    func testCompiles() {
        let list = HermexList {
            Text("Row")
        }
        XCTAssertFalse(String(describing: type(of: list)).isEmpty)
    }
}
