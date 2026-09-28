import SwiftUI

/// A reusable content-unavailable pattern composed from `ContentUnavailableView`, so a loading,
/// error, or empty list state reads the same way everywhere instead of each screen re-composing its
/// own label/description/actions closures. `ContentUnavailableView.search(text:)`'s own no-results
/// treatment is already this exact pattern and stays a direct call at its sites.
struct HermesContentUnavailable: View {
    enum Variant {
        /// A background fetch in progress; no icon, just a spinner and a description.
        case loading
        /// Nothing exists yet — an icon plus a title, and nothing else.
        case empty
        /// Filters or a search narrowed a non-empty list down to nothing.
        case noResults
        /// A request failed; a warning icon, a title, the error message, and an optional retry.
        case error
        /// Any other "this screen has nothing to show" state that isn't loading or an error.
        case unavailable
        /// A fully caller-supplied icon/title; only `description` and the actions are templated.
        case custom
    }

    struct Action {
        let title: String
        let handler: () -> Void
    }

    var variant: Variant
    var title: String = ""
    var systemImage: String = "exclamationmark.triangle"
    var description: Text?
    var primaryAction: Action?
    var secondaryAction: Action?

    var body: some View {
        ContentUnavailableView {
            label
        } description: {
            if let description {
                description
            }
        } actions: {
            if primaryAction != nil, secondaryAction != nil {
                VStack(spacing: HermesSpacing.s8) {
                    actionButtons
                }
            } else {
                actionButtons
            }
        }
    }

    /// Preserved as-is when only one action exists; the primary action only takes the established
    /// primary hierarchy once a secondary action gives it something to stand out from.
    static func primaryActionEmphasis(hasSecondaryAction: Bool) -> HermesButtonEmphasis {
        hasSecondaryAction ? .primary : .secondary
    }

    @ViewBuilder
    private var actionButtons: some View {
        if let primaryAction {
            Button(primaryAction.title, action: primaryAction.handler)
                .buttonStyle(.hermes(.medium, emphasis: Self.primaryActionEmphasis(hasSecondaryAction: secondaryAction != nil)))
        }
        if let secondaryAction {
            Button(secondaryAction.title, action: secondaryAction.handler)
                .buttonStyle(.hermes(.medium, emphasis: .neutral))
        }
    }

    @ViewBuilder
    private var label: some View {
        switch variant {
        case .loading:
            ProgressView()
        case .empty, .noResults, .error, .unavailable, .custom:
            VStack(spacing: HermesSpacing.s12) {
                HermesAvatar(systemImage: systemImage, size: .large, isDecorative: true)
                Text(title)
                    .appFont(.title3)
                    .foregroundStyle(.primary)
            }
            .accessibilityElement(children: .combine)
        }
    }
}
