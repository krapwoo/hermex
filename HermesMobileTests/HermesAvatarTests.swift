import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermesAvatar` (`HermesAvatar.swift`): a system-image identity badge sized to the
/// shared `HermesAvatarSize` diameters, each carrying the accepted `HermesIconSize.Avatar` icon at
/// exactly one-half that diameter. A SwiftUI view tree isn't inspectable at runtime without a
/// rendering harness, so the size pairing is a pure contract and adoption elsewhere is a source
/// contract.
final class HermesAvatarTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Pure contracts: the accepted 32/40/48 <-> 16/20/24 pairing

    func testEveryAvatarSizeCarriesTheAcceptedIconSize() {
        XCTAssertEqual(HermesAvatar.iconSize(for: .small), HermesIconSize.Avatar.small)
        XCTAssertEqual(HermesAvatar.iconSize(for: .medium), HermesIconSize.Avatar.medium)
        XCTAssertEqual(HermesAvatar.iconSize(for: .large), HermesIconSize.Avatar.large)
    }

    func testAvatarDiametersMatchTheSharedHermesAvatarSizeScale() {
        XCTAssertEqual(HermesAvatarSize.small.rawValue, 32)
        XCTAssertEqual(HermesAvatarSize.medium.rawValue, 40)
        XCTAssertEqual(HermesAvatarSize.large.rawValue, 48)
    }

    // MARK: - Compile contract

    func testEveryAvatarSizeCompiles() {
        for size in HermesAvatarSize.allCases {
            let avatar = HermesAvatar(systemImage: "person.fill", size: size)
            XCTAssertFalse(String(describing: type(of: avatar)).isEmpty)
        }
    }

    // MARK: - Source contract: Content Unavailable composes the Avatar instead of a raw Label icon

    func testContentUnavailableComposesHermesAvatarInsteadOfARawLabelIcon() throws {
        let src = try source("HermesMobile/Features/Shared/HermesContentUnavailable.swift")
        XCTAssertTrue(src.contains("HermesAvatar("), "Icon-bearing variants should compose HermesAvatar")
        XCTAssertFalse(src.contains("Label(title, systemImage: systemImage)"), "The raw Label icon treatment should be replaced")
    }

    func testLoadingVariantStaysASpinner() throws {
        let src = try source("HermesMobile/Features/Shared/HermesContentUnavailable.swift")
        XCTAssertTrue(src.contains("case .loading:\n            ProgressView()"))
    }
}
