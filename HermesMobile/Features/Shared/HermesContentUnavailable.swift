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
            if let primaryAction {
                Button(primaryAction.title, action: primaryAction.handler)
                    .buttonStyle(.hermes(.medium, emphasis: .secondary))
            }
            if let secondaryAction {
                Button(secondaryAction.title, action: secondaryAction.handler)
                    .buttonStyle(.hermes(.medium, emphasis: .neutral))
            }
        }
    }

    @ViewBuilder
    private var label: some View {
        switch variant {
        case .loading:
            ProgressView()
        case .empty, .error, .unavailable, .custom:
            Label(title, systemImage: systemImage)
        }
    }
}
