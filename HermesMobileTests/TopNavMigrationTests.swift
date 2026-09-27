import XCTest
@testable import HermesMobile

/// Closes the loop on the TopNav migration (issue #607): every production top-navigation toolbar
/// placement — leading, trailing, principal, and Cancel/Save/primary editor roles — must be
/// authored through the shared `TopNav`, never as a raw `ToolbarItem`/`ToolbarItemGroup` at the
/// call site. `.bottomBar`, `.keyboard`, and non-placement toolbar modifiers are deliberately out
/// of scope and are not matched by this pattern.
final class TopNavMigrationTests: XCTestCase {
    private static let topNavImplementationFileName = "TopNav.swift"

    private static let rawTopNavigationPlacementPattern = try! NSRegularExpression(
        pattern: #"Toolbar(Item|ItemGroup)\(placement:\s*\.(topBarLeading|topBarTrailing|principal|cancellationAction|confirmationAction|primaryAction)"#
    )

    private var productionSwiftFiles: [URL] {
        let repositoryRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let root = repositoryRoot.appendingPathComponent("HermesMobile")
        guard let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil) else {
            return []
        }
        return enumerator.compactMap { $0 as? URL }.filter { $0.pathExtension == "swift" }
    }

    func testNoRawTopNavigationToolbarPlacementRemainsOutsideTopNav() throws {
        var offenders: [String] = []

        for file in productionSwiftFiles where file.lastPathComponent != Self.topNavImplementationFileName {
            let text = try String(contentsOf: file, encoding: .utf8)
            let range = NSRange(text.startIndex..<text.endIndex, in: text)
            if Self.rawTopNavigationPlacementPattern.firstMatch(in: text, range: range) != nil {
                offenders.append(file.lastPathComponent)
            }
        }

        XCTAssertTrue(
            offenders.isEmpty,
            "Raw top-navigation ToolbarItem/ToolbarItemGroup placement found outside TopNav in: \(offenders.joined(separator: ", "))"
        )
    }

    /// The one framework-required exception: `ToolbarSpacer` is `ToolbarContent`, not `View`, so it
    /// cannot live inside a `TopNav` leading/trailing `ViewBuilder` slot and must sit alongside
    /// `TopNav` in the same `.toolbar` block. It carries no placement text this suite treats as a
    /// raw top-navigation item, so it never needs to be listed as an offender above.
    func testBottomBarPlacementIsDeliberatelyExcludedFromMigration() throws {
        let kanbanSource = try String(
            contentsOf: URL(fileURLWithPath: #filePath)
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .appendingPathComponent("HermesMobile/Features/Kanban/KanbanLabView.swift"),
            encoding: .utf8
        )

        XCTAssertTrue(kanbanSource.contains("ToolbarItem(placement: .bottomBar)"))
    }
}
