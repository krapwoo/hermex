import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `SessionListItem` (`SessionListItem.swift`) — the named composition under the
/// List/ListItem family that replaces the uncomposed `SessionRowView`. It owns streaming
/// indication, search highlighting, session metadata/Tags, attention status, and the accessibility
/// summary. Native Button wrapping, selection background, swipe actions, context menus, and
/// transitions stay caller-owned in `SessionListComponents.swift`. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a source-contract suite;
/// `SessionRowAttentionStateTests`/`SessionIdentityTests` cover the pure attention/formatting logic.
final class SessionListItemCompositionTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    private func allProductionSwiftSources() throws -> [(path: String, contents: String)] {
        let root = resourceURL("HermesMobile")
        guard let enumerator = FileManager.default.enumerator(at: root, includingPropertiesForKeys: nil) else {
            return []
        }
        var results: [(path: String, contents: String)] = []
        for case let url as URL in enumerator where url.pathExtension == "swift" {
            results.append((url.path, try String(contentsOf: url, encoding: .utf8)))
        }
        return results
    }

    // MARK: - The named composition exists and is used

    func testSessionListItemExistsAsTheNamedComposition() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListItem.swift")
        XCTAssertTrue(src.contains("struct SessionListItem: View"))
    }

    func testTheUncomposedSessionRowViewNameIsFullyRetired() throws {
        let retiredName = "SessionRowView"
        for (path, contents) in try allProductionSwiftSources() {
            XCTAssertFalse(contents.contains(retiredName), "\(path) still references the retired \(retiredName) name")
        }
    }

    func testSessionInteractiveRowComposesSessionListItem() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")
        XCTAssertTrue(src.contains("SessionListItem("))
    }

    func testArchivedSessionsViewComposesSessionListItem() throws {
        let src = try source("HermesMobile/Features/Settings/ArchivedSessionsView.swift")
        XCTAssertTrue(src.contains("SessionListItem("))
    }

    // MARK: - Caller-owned controls stay caller-owned

    func testSessionListItemDoesNotOwnNavigationSwipeActionsOrContextMenus() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListItem.swift")
        XCTAssertFalse(src.contains(".swipeActions("))
        XCTAssertFalse(src.contains(".contextMenu"))
        XCTAssertFalse(src.contains("NavigationLink"))
    }

    func testSessionInteractiveRowStillOwnsButtonWrappingSwipeActionsAndContextMenu() throws {
        let src = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")
        XCTAssertTrue(src.contains("Button {"))
        XCTAssertTrue(src.contains(".swipeActions(edge: .leading"))
        XCTAssertTrue(src.contains(".swipeActions(edge: .trailing"))
        XCTAssertTrue(src.contains(".contextMenu {"))
    }

    func testSessionRowsUseOneScreenLevelHorizontalInset() throws {
        let component = try source("HermesMobile/Features/SessionList/SessionListItem.swift")
        let caller = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")

        XCTAssertFalse(component.contains(".padding(.horizontal, HermesSpacing.s12)"))
        XCTAssertFalse(
            caller.contains(
                ".sessionsScreenListRow(insets: EdgeInsets(top: 0, leading: 12, bottom: 0, trailing: 12))"
            )
        )
        XCTAssertTrue(caller.contains(".padding(.horizontal, HermesSpacing.screenHorizontal)"))
    }

    func testSessionHeaderAndTitlesUseTheNamedLabelRole() throws {
        let component = try source("HermesMobile/Features/SessionList/SessionListItem.swift")
        let caller = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")

        XCTAssertTrue(component.contains(".appFont(.label)"))
        XCTAssertFalse(component.contains(".appFont(.headline, weight: .semibold)"))
        XCTAssertTrue(caller.contains(".appFont(.label)"))
        XCTAssertFalse(caller.contains(".appFont(.label, weight:"))
        XCTAssertFalse(caller.contains(".appFont(.title3, weight: .bold)"))
    }

    func testMainMenuAndSessionRowsUseHermexTypography() throws {
        let component = try source("HermesMobile/Features/SessionList/SessionListItem.swift")
        let caller = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")

        XCTAssertTrue(component.contains(".appFont(.captionSemibold)"))
        XCTAssertTrue(component.contains(".appFont(.label)"))
        XCTAssertGreaterThanOrEqual(caller.components(separatedBy: ".appFont(.label)").count - 1, 2)
        XCTAssertTrue(caller.contains(".appFont(.subheadlineSemibold)"))
        XCTAssertTrue(caller.contains(".appFont(.headlineSemibold)"))
    }

    func testMainMenuUsesHermesListWhileNavigationRowsRetainFeatureOwnedSemantics() throws {
        let view = try source("HermesMobile/Features/SessionList/SessionListView.swift")
        let rows = try source("HermesMobile/Features/SessionList/SessionListComponents.swift")

        XCTAssertTrue(view.contains("return HermesList {"))
        XCTAssertFalse(view.contains("return List {"))
        XCTAssertTrue(rows.contains("struct SidebarNavButton"))
        XCTAssertTrue(rows.contains("struct SidebarDisclosureButton"))
    }

    func testTipJarUsesNamedAvatarSizingAndSharedComponents() throws {
        let src = try source("HermesMobile/Features/SessionList/TipJarCard.swift")

        XCTAssertTrue(src.contains("SectionCard(surface: .outlined)"))
        XCTAssertTrue(src.contains("HermesAvatarSize.large.rawValue"))
        XCTAssertTrue(src.contains(".buttonStyle(.hermes("))
        XCTAssertTrue(src.contains("HermesSpacing."))
        XCTAssertTrue(src.contains("HermesColorRamp.Gold.s400"))
        XCTAssertTrue(src.contains("HermesMotion.Duration.d200"))
        XCTAssertFalse(src.contains("size: dynamicTypeSize.isAccessibilitySize ? 36 : 50"))
    }
}
