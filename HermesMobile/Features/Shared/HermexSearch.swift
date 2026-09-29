import SwiftUI

/// The Search family's component-local adaptive Neutral boundary. Not `HermexCardColors`: Search
/// owns its own resting/focused/increased-contrast pairs rather than borrowing Card's semantic role,
/// since a focused search field needs a third, stronger state Card's two-state border doesn't have.
private enum HermexSearchColors {
    static let surface = HermesColorRamp.Neutral.adaptive(
        light: HermesColorRamp.Neutral.s100,
        dark: HermesColorRamp.Neutral.s900
    )
    static let restingBorder = HermesColorRamp.Neutral.adaptive(
        light: HermesColorRamp.Neutral.s300,
        dark: HermesColorRamp.Neutral.s700
    )
    static let focusedBorder = HermesColorRamp.Neutral.adaptive(
        light: HermesColorRamp.Neutral.s600,
        dark: HermesColorRamp.Neutral.s400
    )
    static let increasedContrastBorder = HermesColorRamp.Neutral.adaptive(
        light: HermesColorRamp.Neutral.s700,
        dark: HermesColorRamp.Neutral.s300
    )
}

/// The Search family's one canonical visual implementation. A noninteractive search icon, the
/// system-backed `TextField`, and a conditional clear control sit in one adaptive Hermex-chrome row;
/// `HermexSearchField` owns local focus, the clear control, keyboard-submit wiring, and the enabled
/// treatment, while the native editor keeps ownership of text entry, selection, dictation,
/// IME/composition, autocorrection, and platform text-entry accessibility. `.hermexSearch(...)` below
/// is the only other entry point, and only composes this same field — there is no second visual
/// implementation, and no native placement contract to imitate.
struct HermexSearchField: View {
    private let titleKey: LocalizedStringKey
    @Binding private var text: String
    private let prompt: Text?
    private let isEnabled: Bool
    private let onSubmit: () -> Void

    @FocusState private var isFocused: Bool
    @Environment(\.colorSchemeContrast) private var colorSchemeContrast
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(
        _ titleKey: LocalizedStringKey,
        text: Binding<String>,
        prompt: Text? = nil,
        isEnabled: Bool = true,
        onSubmit: @escaping () -> Void = {}
    ) {
        self.titleKey = titleKey
        self._text = text
        self.prompt = prompt
        self.isEnabled = isEnabled
        self.onSubmit = onSubmit
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: HermesRadius.field, style: .continuous)

        HStack(spacing: HermesSpacing.s8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: HermesIconSize.small, weight: .semibold))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            TextField(titleKey, text: $text, prompt: prompt)
                .focused($isFocused)
                .submitLabel(.search)
                .onSubmit {
                    guard isEnabled else { return }
                    onSubmit()
                }

            if !text.isEmpty {
                Button {
                    text = ""
                    isFocused = true
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: HermesIconSize.small, weight: .semibold))
                        .frame(minWidth: 44, minHeight: 44)
                }
                .buttonStyle(.hermexPressOnly(.icon))
                .accessibilityLabel(Text("Clear search"))
            }
        }
        .padding(.horizontal, HermesSpacing.s12)
        .frame(minHeight: 44)
        .background {
            shape.fill(HermexSearchColors.surface.opacity(0.6))
        }
        .adaptiveGlass(.regular, fallbackMaterial: .regularMaterial, in: shape)
        .overlay {
            shape
                .stroke(borderColor, lineWidth: borderWidth)
                .allowsHitTesting(false)
        }
        .contentShape(shape)
        .onTapGesture {
            guard isEnabled else { return }
            isFocused = true
        }
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.62)
        .animation(
            reduceMotion ? nil : HermesMotion.animation(for: HermesMotion.Bundle.stateChange),
            value: isFocused
        )
        .onChange(of: isEnabled) { _, newValue in
            if !newValue {
                isFocused = false
            }
        }
    }

    private var borderWidth: CGFloat {
        isFocused || colorSchemeContrast == .increased ? 1.5 : 1
    }

    private var borderColor: Color {
        if colorSchemeContrast == .increased {
            return HermexSearchColors.increasedContrastBorder
        }
        return isFocused ? HermexSearchColors.focusedBorder : HermexSearchColors.restingBorder
    }
}

/// The Search family's convenience composition: `HermexSearchField` inserted as a persistent top
/// content inset for scrolling lists and navigation screens. It delegates every visual and
/// interaction detail to that one field — this modifier only places it and gives it a minimal
/// backing surface so the field stays legible over content scrolling underneath.
extension View {
    func hermexSearch(
        _ titleKey: LocalizedStringKey,
        text: Binding<String>,
        prompt: Text? = nil,
        isEnabled: Bool = true,
        onSubmit: @escaping () -> Void = {}
    ) -> some View {
        safeAreaInset(edge: .top, spacing: 0) {
            HermexSearchField(
                titleKey,
                text: text,
                prompt: prompt,
                isEnabled: isEnabled,
                onSubmit: onSubmit
            )
            .padding(.horizontal, HermesSpacing.s16)
            .padding(.vertical, HermesSpacing.s8)
            .background(.regularMaterial)
        }
    }
}
