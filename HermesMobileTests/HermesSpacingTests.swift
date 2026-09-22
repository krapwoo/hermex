import XCTest
@testable import HermesMobile

final class HermesSpacingTests: XCTestCase {
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
    }
}
