import SwiftUI

/// A persistent in-flow status notice: an optional icon, a message, and an optional action, either
/// inset or full-width. Distinct from a Tag (a compact display-only label) and from Card (a grouped
/// content container) — a Banner always communicates status about the surface it sits in.
struct Banner: View {
    enum Semantic: Equatable {
        case information
        case warning
        case error
        case success
        case offline

        var tint: Color {
            switch self {
            case .information:
                .blue
            case .warning:
                .yellow
            case .error:
                .red
            case .success:
                .green
            case .offline:
                .orange
            }
        }

        var defaultIcon: String {
            switch self {
            case .information:
                "info.circle"
            case .warning:
                "exclamationmark.triangle"
            case .error:
                "xmark.octagon"
            case .success:
                "checkmark.circle"
            case .offline:
                "wifi.slash"
            }
        }
    }

    enum Presentation: Equatable {
        /// Full-width: horizontal padding is the caller's default page/section inset.
        case fullWidth(horizontalPadding: CGFloat = HermesSpacing.s16)
        /// Inset: the banner is its own rounded surface, for placement inside padded content.
        case inset
    }

    let semantic: Semantic
    let message: Text
    var icon: String?
    var isIconDecorative = true
    var presentation: Presentation = .fullWidth()
    var action: Action?

    struct Action {
        let title: String
        let handler: () -> Void
    }

    init(
        _ semantic: Semantic,
        message: Text,
        icon: String? = nil,
        isIconDecorative: Bool = true,
        presentation: Presentation = .fullWidth(),
        action: Action? = nil
    ) {
        self.semantic = semantic
        self.message = message
        self.icon = icon ?? semantic.defaultIcon
        self.isIconDecorative = isIconDecorative
        self.presentation = presentation
        self.action = action
    }

    var body: some View {
        HStack(spacing: HermesSpacing.s8) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: HermesIconSize.small))
                    .accessibilityHidden(isIconDecorative)
            }

            message
                .appFont(.subheadlineSemibold)

            Spacer(minLength: HermesSpacing.s8)

            if let action {
                Button(action.title, action: action.handler)
                    .appFont(.subheadlineSemibold)
                    .buttonStyle(.plain)
            }
        }
        .foregroundStyle(semantic.tint)
        .padding(.horizontal, horizontalPadding)
        .padding(.vertical, HermesSpacing.s12)
        .background(background)
        .accessibilityElement(children: action == nil ? .combine : .contain)
    }

    private var horizontalPadding: CGFloat {
        switch presentation {
        case .fullWidth(let horizontalPadding):
            horizontalPadding
        case .inset:
            HermesSpacing.s16
        }
    }

    @ViewBuilder
    private var background: some View {
        switch presentation {
        case .fullWidth:
            semantic.tint.opacity(0.12)
        case .inset:
            semantic.tint.opacity(0.12)
                .clipShape(RoundedRectangle(cornerRadius: HermesRadius.card, style: .continuous))
        }
    }
}

extension Banner {
    /// The Session-list and Chat offline-cache notice, unified: both read "Offline — viewing cached
    /// version" over an orange full-width banner with a wifi-slash glyph.
    static func offlineCache(horizontalPadding: CGFloat = HermesSpacing.s16) -> Banner {
        Banner(
            .offline,
            message: Text("Offline — viewing cached version"),
            presentation: .fullWidth(horizontalPadding: horizontalPadding)
        )
    }
}
