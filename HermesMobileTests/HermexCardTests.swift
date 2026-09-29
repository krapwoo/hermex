import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the Card family's shared defaults (`HermexCard.swift`): the exact 16-point content
/// padding available for Card-composing surfaces, the Compact Card surface's compile contract, and
/// the Request Card surface factory. A SwiftUI view tree isn't inspectable at runtime without a
/// rendering harness, so the factory's presence is a source contract read from `HermexCard.swift`
/// itself; the padding value is a pure contract.
final class HermexCardTests: XCTestCase {
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
        XCTAssertEqual(HermexCardMetrics.contentPadding, HermesSpacing.s16)
        XCTAssertEqual(HermexCardMetrics.contentPadding, 16)
    }

    // MARK: - Compile contract

    func testCompactCardSurfaceCompilesWithDefaultAndClearFill() {
        let filled = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16)
        let bordered = Color.clear.frame(width: 1, height: 1).compactCardSurface(cornerRadius: HermesRadius.r16, fill: .clear)
        XCTAssertFalse(String(describing: type(of: filled)).isEmpty)
        XCTAssertFalse(String(describing: type(of: bordered)).isEmpty)
    }

    // MARK: - Request Card lives in the Card family

    func testRequestCardSurfaceIsDefinedInTheCardFamilyFile() throws {
        let src = try source("HermesMobile/Features/Shared/HermexCard.swift")
        XCTAssertTrue(src.contains("func requestCardSurface(cornerRadius:"))
    }
}
