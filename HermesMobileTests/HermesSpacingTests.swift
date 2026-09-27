import XCTest
@testable import HermesMobile

final class HermesSpacingTests: XCTestCase {
    private func source(_ relativePath: String) throws -> String {
        let repositoryRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        return try String(contentsOf: repositoryRoot.appendingPathComponent(relativePath), encoding: .utf8)
    }

    func testScaleMatchesApprovedValues() {
        XCTAssertEqual(HermesSpacing.s0, 0)
        XCTAssertEqual(HermesSpacing.s2, 2)
        XCTAssertEqual(HermesSpacing.s4, 4)
        XCTAssertEqual(HermesSpacing.s8, 8)
        XCTAssertEqual(HermesSpacing.s12, 12)
        XCTAssertEqual(HermesSpacing.s16, 16)
        XCTAssertEqual(HermesSpacing.s20, 20)
        XCTAssertEqual(HermesSpacing.s24, 24)
        XCTAssertEqual(HermesSpacing.s32, 32)
        XCTAssertEqual(HermesSpacing.s40, 40)
        XCTAssertEqual(HermesSpacing.s48, 48)
        XCTAssertEqual(HermesSpacing.s64, 64)
        XCTAssertEqual(HermesSpacing.screenHorizontal, 16)
    }

    func testIconSizeScaleMatchesApprovedValues() {
        XCTAssertEqual(HermesIconSize.xs, 12)
        XCTAssertEqual(HermesIconSize.small, 16)
        XCTAssertEqual(HermesIconSize.medium, 20)
        XCTAssertEqual(HermesIconSize.large, 24)
        XCTAssertEqual(HermesIconSize.extraLarge, 32)
    }

    func testAttachmentSizeScaleMatchesApprovedValues() {
        XCTAssertEqual(HermesAttachmentSize.compactPreview, 30)
        XCTAssertEqual(HermesAttachmentSize.messageGridCell, 118)
        XCTAssertEqual(HermesAttachmentSize.composerImage, 96)
        XCTAssertEqual(HermesAttachmentSize.composerImageAccessibility, 108)
        XCTAssertEqual(HermesAttachmentSize.fileIconPanelWidth, 58)
        XCTAssertEqual(HermesAttachmentSize.fileIconPanelHeight, 68)
        XCTAssertEqual(HermesAttachmentSize.fileIconPanelWidthAccessibility, 76)
        XCTAssertEqual(HermesAttachmentSize.fileIconPanelHeightAccessibility, 84)
        XCTAssertEqual(HermesAttachmentSize.composerFileTextWidth, 128)
        XCTAssertEqual(HermesAttachmentSize.composerFileTextWidthAccessibility, 160)
        XCTAssertEqual(HermesAttachmentSize.composerFileTileWidth, 222)
        XCTAssertEqual(HermesAttachmentSize.composerFileTileWidthAccessibility, 280)
        XCTAssertEqual(HermesAttachmentSize.composerFileTileMinHeight, 92)
        XCTAssertEqual(HermesAttachmentSize.composerFileTileMinHeightAccessibility, 112)
        XCTAssertEqual(HermesAttachmentSize.composerStripHeight, 108)
        XCTAssertEqual(HermesAttachmentSize.composerStripHeightAccessibility, 132)
        XCTAssertEqual(HermesAttachmentSize.messageFileTextInset, 18)
        XCTAssertEqual(HermesAttachmentSize.removeControl, 24)
        XCTAssertEqual(HermesAttachmentSize.removeOverlap, 6)
        XCTAssertEqual(HermesAttachmentSize.accessibilityVerticalPadding, 10)
    }

    func testCustomScreenFamiliesUseSemanticHorizontalInset() throws {
        let screenSources = [
            "HermesMobile/Features/Onboarding/OnboardingWelcomePage.swift",
            "HermesMobile/Features/Chat/ChatTranscriptView.swift",
            "HermesMobile/Features/Bots/BotSearchView.swift",
            "HermesMobile/Features/SessionList/SessionListComponents.swift",
            "HermesMobile/Features/Skills/SkillsView.swift",
            "HermesMobile/Features/Tasks/TasksView.swift",
            "HermesMobile/Features/Workspace/FileBrowserView.swift",
            "HermesMobile/Features/Kanban/KanbanLabView.swift"
        ]

        for path in screenSources {
            XCTAssertTrue(
                try source(path).contains("HermesSpacing.screenHorizontal"),
                "Expected semantic 16 pt screen-edge spacing in \(path)"
            )
        }
    }
}
