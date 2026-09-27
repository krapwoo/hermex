import XCTest
@testable import HermesMobile

final class DisclosureRowBodyWindowTests: XCTestCase {
    private let cap = DisclosureRowMetrics.bodyWindowHeight

    private func disclosureRowSource() throws -> String {
        let repositoryRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        return try String(
            contentsOf: repositoryRoot.appendingPathComponent("HermesMobile/Features/Chat/DisclosureRow.swift"),
            encoding: .utf8
        )
    }

    func testUnmeasuredContentStartsClosed() {
        let layout = DisclosureRowBodyWindowLayout.resolve(contentHeight: nil, cap: cap)

        XCTAssertEqual(layout.frameHeight, 0)
        XCTAssertFalse(layout.scrolls)
    }

    func testContentBelowTheCapTakesItsNaturalHeightWithoutScrolling() {
        let layout = DisclosureRowBodyWindowLayout.resolve(contentHeight: 96, cap: cap)

        XCTAssertEqual(layout.frameHeight, 96)
        XCTAssertFalse(layout.scrolls)
    }

    func testContentAtTheCapFillsTheWindowWithoutScrolling() {
        let layout = DisclosureRowBodyWindowLayout.resolve(contentHeight: cap, cap: cap)

        XCTAssertEqual(layout.frameHeight, cap)
        XCTAssertFalse(layout.scrolls)
    }

    func testContentAboveTheCapClipsToTheWindowAndScrolls() {
        let layout = DisclosureRowBodyWindowLayout.resolve(contentHeight: 1_800, cap: cap)

        XCTAssertEqual(layout.frameHeight, cap)
        XCTAssertTrue(layout.scrolls)
    }

    func testTheCapIsTwoHundredFortyPoints() {
        XCTAssertEqual(cap, 240)
    }

    func testDisclosureIndicatorRotatesFromCollapsedToExpandedAndUsesIconTokens() throws {
        let source = try disclosureRowSource()

        XCTAssertTrue(source.contains("Image(systemName: \"chevron.down\")"))
        XCTAssertFalse(source.contains("chevron.up"))
        XCTAssertTrue(source.contains("HermesIconSize.xs"))
        XCTAssertTrue(source.contains("HermesIconSize.small"))
        XCTAssertTrue(source.contains(".rotationEffect(.degrees(isExpanded ? 180 : 0))"))
        XCTAssertTrue(source.contains("accessibilityReduceMotion"))
        XCTAssertTrue(source.contains("accessibilityValue(isExpanded ? Text(\"Expanded\") : Text(\"Collapsed\"))"))
    }
}

final class DesignSystemAdoptionCompletionTests: XCTestCase {
    private var repositoryRoot: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }

    private func source(_ relativePath: String) throws -> String {
        try String(
            contentsOf: repositoryRoot.appendingPathComponent(relativePath),
            encoding: .utf8
        )
    }

    func testSegmentedControlOwnsFixedAndScrollingVariantsWithoutHermexPrefix() throws {
        let component = try source("HermesMobile/Features/Shared/SegmentedControl.swift")

        XCTAssertTrue(component.contains("struct SegmentedControl"))
        XCTAssertTrue(component.contains("case fixed"))
        XCTAssertTrue(component.contains("case scrolling"))
        XCTAssertTrue(component.contains(".pickerStyle(.segmented)"))
        XCTAssertTrue(component.contains("ScrollView(.horizontal"))
        XCTAssertFalse(component.contains("HermesSegmentedControl"))
    }

    func testApprovedScreensUseTheSharedSegmentedControl() throws {
        let tasks = try source("HermesMobile/Features/Tasks/TasksView.swift")
        let insights = try source("HermesMobile/Features/Insights/InsightsView.swift")
        let chart = try source("HermesMobile/Features/Insights/UsageChartCard.swift")
        let kanban = try source("HermesMobile/Features/Kanban/KanbanLabView.swift")

        for screen in [tasks, insights, chart, kanban] {
            XCTAssertTrue(screen.contains("SegmentedControl("))
        }
        XCTAssertFalse(tasks.contains(".pickerStyle(.segmented)"))
        XCTAssertFalse(insights.contains(".pickerStyle(.segmented)"))
        XCTAssertFalse(chart.contains(".pickerStyle(.segmented)"))
        XCTAssertFalse(kanban.contains("KanbanStatusSelector"))
    }

    func testTasksUseTheSharedListContainer() throws {
        let component = try source("HermesMobile/Features/Shared/HermesList.swift")
        let tasks = try source("HermesMobile/Features/Tasks/TasksView.swift")

        XCTAssertTrue(component.contains("struct HermesList"))
        XCTAssertTrue(tasks.contains("HermesList"))
    }

    func testConversationLoadingUsesNeutralReusableSkeletonShapes() throws {
        let skeleton = try source("HermesMobile/Features/Shared/SkeletonPlaceholder.swift")
        let transcript = try source("HermesMobile/Features/Chat/ChatTranscriptSupportingViews.swift")
        let userRowStart = try XCTUnwrap(transcript.range(of: "private var userRow"))
        let userRowEnd = try XCTUnwrap(transcript.range(of: "private func skeletonLine", range: userRowStart.upperBound..<transcript.endIndex))
        let userRow = String(transcript[userRowStart.lowerBound..<userRowEnd.lowerBound])

        XCTAssertTrue(skeleton.contains("struct Skeleton"))
        XCTAssertTrue(skeleton.contains("case textLine"))
        XCTAssertTrue(skeleton.contains("case block"))
        XCTAssertTrue(skeleton.contains("case circle"))
        XCTAssertTrue(skeleton.contains("case roundedRectangle"))
        XCTAssertTrue(transcript.contains("Skeleton(shape: .textLine"))
        XCTAssertFalse(userRow.contains("secondarySystemFill"))
        XCTAssertFalse(userRow.contains("RoundedRectangle"))
    }

    func testApprovedAdoptionUsesSharedSurfaceFamilies() throws {
        let kanban = try source("HermesMobile/Features/Kanban/KanbanLabView.swift")
        let skills = try source("HermesMobile/Features/Skills/SkillsView.swift")
        let memory = try source("HermesMobile/Features/Memory/MemoryView.swift")
        let tipJar = try source("HermesMobile/Features/SessionList/TipJarCard.swift")

        XCTAssertTrue(kanban.contains("Banner("))
        XCTAssertTrue(kanban.contains("HermesDivider()"))
        XCTAssertTrue(skills.contains("Tag("))
        XCTAssertTrue(skills.contains("HermesDivider()"))
        XCTAssertTrue(memory.contains(".buttonStyle(.hermesPressOnly(.icon))"))
        XCTAssertTrue(tipJar.contains("SectionCard"))
        XCTAssertTrue(tipJar.contains(".buttonStyle(.hermes("))
        XCTAssertTrue(tipJar.contains("HermesColorRamp.Gold.s400"))
        XCTAssertFalse(tipJar.contains("Color(red:"))
        XCTAssertFalse(tipJar.lowercased().contains("#ffe000"))
    }
}
