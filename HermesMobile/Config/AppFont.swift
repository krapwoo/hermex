import SwiftUI
import UIKit

enum AppFont {
    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func body(weight: Font.Weight? = nil) -> Font {
        system(.body, weight: weight)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func subheadline(weight: Font.Weight? = nil) -> Font {
        system(.subheadline, weight: weight)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func footnote(weight: Font.Weight? = nil) -> Font {
        system(.caption, weight: weight ?? .regular)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func caption(weight: Font.Weight? = nil) -> Font {
        system(.caption, weight: weight ?? .regular)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func caption2(weight: Font.Weight? = nil) -> Font {
        system(.caption, weight: weight ?? .regular)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func headline(weight: Font.Weight? = nil) -> Font {
        system(.headline, weight: weight)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func title(weight: Font.Weight? = nil) -> Font {
        system(.title, weight: weight)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func title3(weight: Font.Weight? = nil) -> Font {
        system(.title3, weight: weight)
    }

    static func title2(weight: Font.Weight? = nil) -> Font {
        system(.title2, weight: weight ?? .bold)
    }

    @available(*, deprecated, message: "Use .appFont(role:) instead")
    static func mono(style: Font.TextStyle = .body, weight: Font.Weight? = nil) -> Font {
        system(style, design: .monospaced, weight: weight)
    }

    private static func system(
        _ style: Font.TextStyle,
        design: Font.Design = .default,
        weight: Font.Weight? = nil
    ) -> Font {
        .system(style, design: design, weight: weight)
    }
}

extension AppFont {
    enum Role: CaseIterable {
        case caption, footnote, caption2, subheadline, body, headline, title3, title2, title

        var baseSize: CGFloat {
            switch self {
            case .caption, .footnote, .caption2: return 12
            case .subheadline: return 14
            case .body: return 16
            case .headline: return 18
            case .title3: return 20
            case .title2: return 22
            case .title: return 28
            }
        }

        var swiftUIAnchor: Font.TextStyle {
            switch self {
            case .caption, .footnote, .caption2: return .caption
            case .subheadline: return .subheadline
            case .body: return .body
            case .headline: return .headline
            case .title3: return .title3
            case .title2: return .title2
            case .title: return .title
            }
        }

        var uiKitAnchor: UIFont.TextStyle {
            switch self {
            case .caption, .footnote, .caption2: return .caption1
            case .subheadline: return .subheadline
            case .body: return .body
            case .headline: return .headline
            case .title3: return .title3
            case .title2: return .title2
            case .title: return .title1
            }
        }

        var defaultWeight: Font.Weight {
            switch self {
            case .caption, .footnote, .caption2, .subheadline, .body, .headline: return .regular
            case .title3, .title2, .title: return .bold
            }
        }

        var defaultUIKitWeight: UIFont.Weight {
            switch self {
            case .caption, .footnote, .caption2, .subheadline, .body, .headline: return .regular
            case .title3, .title2, .title: return .bold
            }
        }
    }
}

extension AppFont {
    static func scaledFont(role: Role, weight: UIFont.Weight? = nil, traitCollection: UITraitCollection = .current) -> UIFont {
        let base = UIFont.systemFont(ofSize: role.baseSize, weight: weight ?? role.defaultUIKitWeight)
        return UIFontMetrics(forTextStyle: role.uiKitAnchor).scaledFont(for: base, compatibleWith: traitCollection)
    }
}

private struct AppFontModifier: ViewModifier {
    let role: AppFont.Role
    let weight: Font.Weight?
    let design: Font.Design
    @ScaledMetric private var scaledSize: CGFloat

    init(role: AppFont.Role, weight: Font.Weight?, design: Font.Design) {
        self.role = role
        self.weight = weight
        self.design = design
        _scaledSize = ScaledMetric(wrappedValue: role.baseSize, relativeTo: role.swiftUIAnchor)
    }

    func body(content: Content) -> some View {
        content.font(.system(size: scaledSize, weight: weight ?? role.defaultWeight, design: design))
    }
}

extension View {
    func appFont(_ role: AppFont.Role, weight: Font.Weight? = nil, design: Font.Design = .default) -> some View {
        modifier(AppFontModifier(role: role, weight: weight, design: design))
    }
}

extension DynamicTypeSize {
    /// Explicit, exhaustive map from SwiftUI's `DynamicTypeSize` to UIKit's
    /// `UIContentSizeCategory`, so `Text.appFont(...)` can drive TY-2's
    /// UIFontMetrics resolver off a caller-supplied environment value instead
    /// of the ambient (and, for SwiftUI's own `\.dynamicTypeSize` environment,
    /// unreliable) `UITraitCollection.current`. Every case is named on
    /// purpose — a future case Apple adds must be mapped here deliberately,
    /// never silently absorbed by a catch-all default.
    var appFontContentSizeCategory: UIContentSizeCategory {
        switch self {
        case .xSmall: return .extraSmall
        case .small: return .small
        case .medium: return .medium
        case .large: return .large
        case .xLarge: return .extraLarge
        case .xxLarge: return .extraExtraLarge
        case .xxxLarge: return .extraExtraExtraLarge
        case .accessibility1: return .accessibilityMedium
        case .accessibility2: return .accessibilityLarge
        case .accessibility3: return .accessibilityExtraLarge
        case .accessibility4: return .accessibilityExtraExtraLarge
        case .accessibility5: return .accessibilityExtraExtraExtraLarge
        @unknown default:
            // A DynamicTypeSize case newer than this SDK build. SwiftUI has
            // only ever grown DynamicTypeSize at the top of the accessibility
            // range, so clamping to the largest known category is the
            // conservative choice (never under-scales), not a silent no-op —
            // this branch is a real, reachable, intentionally-visible gap:
            // add the new case above the moment this SDK is updated.
            return .accessibilityExtraExtraExtraLarge
        }
    }
}

extension Text {
    /// `Text`-returning sibling of `View.appFont(_:weight:design:)`, needed
    /// because concatenated fragments (`text1 + text2`) require the `+`
    /// operator's `Text`-typed operands and reject `some View`.
    ///
    /// Takes `dynamicTypeSize` explicitly rather than reading
    /// `\.dynamicTypeSize` from the environment: `@ScaledMetric` (the View
    /// modifier's mechanism) only works as a stored property of a `View`,
    /// injected from that view's own environment, and a free function
    /// returning `Text` has no such storage to attach it to. Reading
    /// `UITraitCollection.current` instead does not work either — it does
    /// not reflect SwiftUI's `.environment(\.dynamicTypeSize, ...)` overrides
    /// (proven by `AppFontDynamicTypeRenderTests`, which measured identical
    /// rendered widths at `.large` and `.accessibility3` under that
    /// approach). Callers pass their own `@Environment(\.dynamicTypeSize)`
    /// value explicitly, exactly as `DisclosureRow` does.
    func appFont(
        _ role: AppFont.Role,
        dynamicTypeSize: DynamicTypeSize,
        weight: Font.Weight? = nil,
        design: Font.Design = .default
    ) -> Text {
        let traitCollection = UITraitCollection(preferredContentSizeCategory: dynamicTypeSize.appFontContentSizeCategory)
        let scaledSize = AppFont.scaledFont(role: role, traitCollection: traitCollection).pointSize
        return font(.system(size: scaledSize, weight: weight ?? role.defaultWeight, design: design))
    }
}
