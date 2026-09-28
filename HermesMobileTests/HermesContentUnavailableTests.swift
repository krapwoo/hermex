import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the Content Unavailable pattern (`HermesContentUnavailable.swift`): its loading,
/// empty, error, unavailable, custom, and no-results variants, and the two-action vertical stack
/// ordering. A SwiftUI view tree isn't inspectable at runtime without a rendering harness, so the
/// stack ordering is a source contract read from `HermesContentUnavailable.swift` itself; every
/// variant builds without error as a compile contract.
final class HermesContentUnavailableTests: XCTestCase {
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

    func testEveryVariantCompiles() {
        let loading = HermesContentUnavailable(variant: .loading, description: Text("Loading models..."))
        let empty = HermesContentUnavailable(variant: .empty, title: "No skills available", systemImage: "wand.and.stars")
        let error = HermesContentUnavailable(
            variant: .error,
            title: "Could Not Load Profiles",
            description: Text("network error"),
            primaryAction: .init(title: "Try Again", handler: {})
        )
        let unavailable = HermesContentUnavailable(variant: .unavailable, title: "Unavailable")
        let custom = HermesContentUnavailable(variant: .custom, title: "Custom", description: Text("detail"))
        let noResults = HermesContentUnavailable(
            variant: .noResults,
            title: "No matching Cards",
            systemImage: "line.3.horizontal.decrease.circle",
            description: Text("Change or clear the filters to see more Cards.")
        )

        for view in [
            String(describing: type(of: loading)),
            String(describing: type(of: empty)),
            String(describing: type(of: error)),
            String(describing: type(of: unavailable)),
            String(describing: type(of: custom)),
            String(describing: type(of: noResults))
        ] {
            XCTAssertFalse(view.isEmpty)
        }
    }

    // MARK: - Two-action vertical stack, primary first

    func testOnlyOneActionPreservesTheEstablishedSecondaryEmphasis() {
        XCTAssertEqual(
            HermesContentUnavailable.primaryActionEmphasis(hasSecondaryAction: false),
            .secondary
        )
    }

    func testBothActionsGiveThePrimaryActionTheEstablishedPrimaryHierarchy() {
        XCTAssertEqual(
            HermesContentUnavailable.primaryActionEmphasis(hasSecondaryAction: true),
            .primary
        )
    }

    func testBothActionsCompile() {
        let view = HermesContentUnavailable(
            variant: .error,
            title: "Could Not Load",
            description: Text("network error"),
            primaryAction: .init(title: "Try Again", handler: {}),
            secondaryAction: .init(title: "Cancel", handler: {})
        )
        XCTAssertFalse(String(describing: type(of: view)).isEmpty)
    }

    func testBothActionsRenderAsAVerticalStackWithThePrimaryActionFirst() throws {
        let src = try source("HermesMobile/Features/Shared/HermesContentUnavailable.swift")
        guard let vstackRange = src.range(of: "VStack"),
              let primaryRange = src.range(of: "primaryAction.title, action: primaryAction.handler"),
              let secondaryRange = src.range(of: "secondaryAction.title, action: secondaryAction.handler") else {
            return XCTFail("Expected a VStack wrapping the primary action ahead of the secondary action")
        }
        XCTAssertTrue(vstackRange.lowerBound < primaryRange.lowerBound)
        XCTAssertTrue(primaryRange.lowerBound < secondaryRange.lowerBound)
    }
}
