import SwiftUI

/// A thin Hermex-owned entry point over SwiftUI's native `.searchable(text:placement:prompt:)`.
/// Native iOS keeps ownership of placement, focus, keyboard integration, clear behavior, dictation,
/// VoiceOver, and Dynamic Type — this only gives call sites one shared modifier to reach for instead
/// of calling `.searchable` directly. The default placement stays `.automatic` so omitting it
/// preserves native automatic placement, and `prompt` stays optional so omitting it introduces no
/// synthetic copy. Two overloads mirror the two prompt shapes production's existing `.searchable`
/// call sites already use — a localizable string prompt and an explicit `Text` prompt — rather than
/// forwarding through a single, less specific type.
extension View {
    func hermexSearch(
        text: Binding<String>,
        placement: SearchFieldPlacement = .automatic,
        prompt: Text? = nil
    ) -> some View {
        searchable(text: text, placement: placement, prompt: prompt)
    }

    func hermexSearch(
        text: Binding<String>,
        placement: SearchFieldPlacement = .automatic,
        prompt: LocalizedStringKey
    ) -> some View {
        searchable(text: text, placement: placement, prompt: prompt)
    }
}
