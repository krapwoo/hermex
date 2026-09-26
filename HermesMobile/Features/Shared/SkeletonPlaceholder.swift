import SwiftUI

extension View {
    /// The shared static skeleton treatment every "content isn't here yet" placeholder in Hermex
    /// should reach for instead of calling `.redacted(reason: .placeholder)` directly — one name
    /// for the same platform behavior, so a future change to the shared treatment has one call
    /// site to update. Intentionally motion-free; pair with `.skeletonAnnouncement(label:value:)`
    /// to say so once per group of rows instead of once per row.
    func skeletonPlaceholder() -> some View {
        redacted(reason: .placeholder)
    }

    /// Groups one or more `.skeletonPlaceholder()` rows behind a single VoiceOver announcement and,
    /// by default, blocks interaction with the placeholder — the pattern
    /// `ChatTranscriptLoadingSkeletonView` and `ProviderLimitsPlaceholderCard` each built ad hoc
    /// before this extraction.
    func skeletonAnnouncement(label: Text, value: Text? = nil, disablesHitTesting: Bool = true) -> some View {
        modifier(SkeletonAnnouncementModifier(label: label, value: value, disablesHitTesting: disablesHitTesting))
    }
}

private struct SkeletonAnnouncementModifier: ViewModifier {
    let label: Text
    let value: Text?
    let disablesHitTesting: Bool

    func body(content: Content) -> some View {
        Group {
            if let value {
                content
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(label)
                    .accessibilityValue(value)
            } else {
                content
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(label)
            }
        }
        .allowsHitTesting(!disablesHitTesting)
    }
}
