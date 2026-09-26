import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the Content Unavailable pattern (`HermesContentUnavailable.swift`), migrated into
/// the four picker sheets' loading/error/empty placeholders. `ContentUnavailableView.search(text:)`
/// stays a direct call at its sites, since it is already this exact pattern. A SwiftUI view tree
/// isn't inspectable at runtime without a rendering harness, so adoption at each site is a source
/// contract; the view builds without error for every variant as a compile contract.
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

        for view in [
            String(describing: type(of: loading)),
            String(describing: type(of: empty)),
            String(describing: type(of: error)),
            String(describing: type(of: unavailable)),
            String(describing: type(of: custom))
        ] {
            XCTAssertFalse(view.isEmpty)
        }
    }

    // MARK: - Source contracts: the four picker sheets adopt the shared pattern

    func testModelPickerSheetAdoptsTheSharedPattern() throws {
        let src = try source("HermesMobile/Features/Shared/ModelPickerSheet.swift")
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .loading"))
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .error"))
    }

    func testCronJobSkillsPickerAdoptsTheSharedPattern() throws {
        let src = try source("HermesMobile/Features/Tasks/CronJobSkillsPicker.swift")
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .loading"))
        XCTAssertTrue(src.contains("variant: .error"))
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .empty"))
    }

    func testCronJobConfigurationPickersAdoptTheSharedPattern() throws {
        let src = try source("HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift")
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .loading"))
        XCTAssertTrue(src.contains("variant: .error"))
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .empty"))
    }

    func testDefaultProfilePickerViewAdoptsTheSharedPattern() throws {
        let src = try source("HermesMobile/Features/Settings/DefaultProfilePickerView.swift")
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .loading"))
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .error"))
        XCTAssertTrue(src.contains("HermesContentUnavailable(variant: .empty"))
    }

    func testSearchEmptyStateStaysTheDirectSystemCall() throws {
        for path in [
            "HermesMobile/Features/Shared/ModelPickerSheet.swift",
            "HermesMobile/Features/Tasks/CronJobSkillsPicker.swift",
            "HermesMobile/Features/Tasks/CronJobConfigurationPickers.swift",
            "HermesMobile/Features/Settings/DefaultProfilePickerView.swift"
        ] {
            let src = try source(path)
            XCTAssertTrue(src.contains("ContentUnavailableView.search(text:"), "\(path) should keep the system search-empty call")
        }
    }
}
