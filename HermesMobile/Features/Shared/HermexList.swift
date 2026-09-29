import SwiftUI

/// The shared native List container. It deliberately keeps SwiftUI List semantics—navigation,
/// swipe actions, refresh, editing, keyboard support, and platform accessibility—while giving
/// production screens one reusable entry point for list-level defaults.
struct HermexList<Content: View>: View {
    @ViewBuilder let content: () -> Content

    init(@ViewBuilder content: @escaping () -> Content) {
        self.content = content
    }

    var body: some View {
        List {
            content()
        }
        .contentMargins(.vertical, HermesSpacing.s12, for: .scrollContent)
    }
}
