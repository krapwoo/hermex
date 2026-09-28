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
