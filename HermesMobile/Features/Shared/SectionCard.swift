import SwiftUI

/// A card container: an optional uppercase title over either the default glass panel or the
/// canonical outlined surface. Shared by Usage, Task Detail, and the Sessions tip prompt so grouped
/// content keeps one padding and footer anatomy while choosing the appropriate Card treatment.
///
/// An optional `footer` sits flush against the card's bottom edge, under a
/// full-width divider and outside the content's padding — the shape a row of
/// card actions wants. Passing it here rather than cancelling the padding at
/// the call site keeps the card's insets its own business.
struct SectionCard<Content: View, Footer: View>: View {
    let title: String?
    let surface: HermesCardSurface
    @ViewBuilder let content: Content
    @ViewBuilder let footer: Footer
    /// Set by the initializer rather than inferred from `Footer`, so an empty
    /// footer never leaves a divider hanging under the content.
    private let hasFooter: Bool

    init(
        title: String? = nil,
        surface: HermesCardSurface = .glass,
        @ViewBuilder content: () -> Content,
        @ViewBuilder footer: () -> Footer
    ) {
        self.title = title
        self.surface = surface
        self.content = content()
        self.footer = footer()
        self.hasFooter = true
    }

    var body: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s0) {
            if let title {
                Text(title)
                    .textCase(.uppercase)
                    .appFont(.captionSemibold)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, HermesSpacing.s4)
                    .padding(.bottom, HermesSpacing.s8)
            }

            cardContent
                .hermesCardSurface(surface, cornerRadius: HermesRadius.r20)
        }
    }

    private var cardContent: some View {
        VStack(spacing: HermesSpacing.s0) {
            self.content
                .padding(.horizontal, HermesCardMetrics.contentPadding)
                .padding(.vertical, HermesCardMetrics.contentPadding)
                .frame(maxWidth: .infinity, alignment: .leading)

            if hasFooter {
                HermesDivider()
                footer
            }
        }
    }
}

extension SectionCard where Footer == EmptyView {
    init(
        title: String? = nil,
        surface: HermesCardSurface = .glass,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.surface = surface
        self.content = content()
        self.footer = EmptyView()
        self.hasFooter = false
    }
}
