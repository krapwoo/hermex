import SwiftUI

/// Horizontal scroller for the composer toolbar row (add, model, reasoning,
/// workspace, profile, git branch, mic, context meter). The Stop/Send circle
/// stays outside it, pinned to the row's trailing edge.
struct ComposerToolbarScroller<Content: View>: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.layoutDirection) private var layoutDirection

    private let content: Content

    @State private var fades = ComposerToolbarEdgeFades()

    private let fadeWidth: CGFloat = 18
    private let itemSpacing: CGFloat = 8
    private let minimumRowHeight: CGFloat = 44

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: itemSpacing) {
                content
            }
            .frame(minHeight: minimumRowHeight, alignment: .leading)
        }
        .scrollIndicators(.hidden)
        // Horizontal only, and inert when everything fits, so the row never
        // feels draggable for no reason.
        .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
        // Taps on toolbar controls must never dismiss the keyboard first.
        .scrollDismissesKeyboard(.never)
        .onScrollGeometryChange(for: ComposerToolbarEdgeFades.self) { geometry in
            ComposerToolbarEdgeFades(
                offset: geometry.contentOffset.x,
                contentWidth: geometry.contentSize.width,
                viewportWidth: geometry.containerSize.width,
                layoutDirection: layoutDirection
            )
        } action: { _, newFades in
            fades = newFades
        }
        .mask { fadeMask }
        .animation(reduceMotion ? nil : .easeOut(duration: 0.15), value: fades)
    }

    /// Alpha mask: opaque everywhere except an edge that hides content, which
    /// fades over `fadeWidth` so the glass surface shows through.
    private var fadeMask: some View {
        HStack(spacing: 0) {
            LinearGradient(
                colors: [fades.leading ? .clear : .black, .black],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(width: fadeWidth)

            Color.black

            LinearGradient(
                colors: [.black, fades.trailing ? .clear : .black],
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(width: fadeWidth)
        }
    }
}
