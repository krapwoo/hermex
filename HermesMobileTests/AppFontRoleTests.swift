import XCTest
import SwiftUI
import UIKit
@testable import HermesMobile

final class AppFontRoleTests: XCTestCase {
    func testRoleMetadataMatchesApprovedTable() {
        let expectations: [(AppFont.Role, CGFloat, Font.TextStyle, UIFont.TextStyle, Font.Weight)] = [
            (.caption, 12, .caption, .caption1, .regular),
            (.footnote, 12, .caption, .caption1, .regular),
            (.caption2, 12, .caption, .caption1, .regular),
            (.subheadline, 14, .subheadline, .subheadline, .regular),
            (.body, 16, .body, .body, .regular),
            (.headline, 18, .headline, .headline, .regular),
            (.title3, 20, .title3, .title3, .bold),
            (.title2, 22, .title2, .title2, .bold),
            (.title, 28, .title, .title1, .bold),
        ]
        for (role, size, swiftUIAnchor, uiKitAnchor, weight) in expectations {
            XCTAssertEqual(role.baseSize, size, "\(role)")
            XCTAssertEqual(role.swiftUIAnchor, swiftUIAnchor, "\(role)")
            XCTAssertEqual(role.uiKitAnchor, uiKitAnchor, "\(role)")
            XCTAssertEqual(role.defaultWeight, weight, "\(role)")
        }
    }

    func testAllCasesCovered() {
        XCTAssertEqual(AppFont.Role.allCases.count, 9)
    }

    func testTitle2FactoryExistsAndCompiles() {
        let font: Font = AppFont.title2()
        XCTAssertNotNil(font)
    }

    private func trait(for category: UIContentSizeCategory) -> UITraitCollection {
        UITraitCollection(preferredContentSizeCategory: category)
    }

    private static let approvedDynamicTypeCategories: [UIContentSizeCategory] = [
        .extraSmall, .large, .extraExtraExtraLarge, .accessibilityMedium, .accessibilityExtraExtraExtraLarge,
    ]

    func testDefaultCategoryPointSizeMatchesBaseSize() {
        for role in AppFont.Role.allCases {
            let font = AppFont.scaledFont(role: role, traitCollection: trait(for: .large))
            XCTAssertEqual(font.pointSize, role.baseSize, accuracy: 0.5, "\(role)")
        }
    }

    func testResolverMatchesDocumentedUIFontMetricsMechanism() {
        for role in AppFont.Role.allCases {
            for category in Self.approvedDynamicTypeCategories {
                let traits = trait(for: category)
                let actual = AppFont.scaledFont(role: role, traitCollection: traits)
                let expectedBase = UIFont.systemFont(ofSize: role.baseSize, weight: role.defaultUIKitWeight)
                let expected = UIFontMetrics(forTextStyle: role.uiKitAnchor).scaledFont(for: expectedBase, compatibleWith: traits)
                XCTAssertEqual(actual.pointSize, expected.pointSize, accuracy: 0.01, "\(role) @ \(category)")
            }
        }
    }

    func testCaptionFootnoteCaption2AreIdenticalAcrossAllFiveApprovedCategories() {
        for category in Self.approvedDynamicTypeCategories {
            let traits = trait(for: category)
            let caption = AppFont.scaledFont(role: .caption, traitCollection: traits)
            let footnote = AppFont.scaledFont(role: .footnote, traitCollection: traits)
            let caption2 = AppFont.scaledFont(role: .caption2, traitCollection: traits)
            XCTAssertEqual(caption.pointSize, footnote.pointSize, accuracy: 0.01, "@ \(category)")
            XCTAssertEqual(caption.pointSize, caption2.pointSize, accuracy: 0.01, "@ \(category)")
        }
    }
}
