import XCTest
@testable import HermesMobile

final class DisclosureRowBodyWindowTests: XCTestCase {
    private let cap = DisclosureRowMetrics.bodyWindowHeight

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
}
