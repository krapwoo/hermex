import SwiftUI

/// The domain-owned surfaces inside a pending approval or clarification card: the recessed
/// question/command block, the response field, and the choice-button surface. The outer card
/// surface itself is Request Card, in the Card family (`HermesCard.swift`'s `requestCardSurface`).
extension View {
    /// The recessed block a question or a command sits in, inside a card.
    func pendingRequestBlockSurface() -> some View {
        modifier(PendingRequestBlockSurface())
    }

    /// The free-text response field's surface, including its padding.
    func pendingRequestFieldSurface() -> some View {
        modifier(PendingRequestFieldSurface())
    }

    @ViewBuilder
    func pendingRequestChoiceSurface(reduceTransparency: Bool) -> some View {
        if reduceTransparency {
            background(Color(.tertiarySystemBackground), in: RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous)
                        .stroke(Color(.separator), lineWidth: 1)
                )
        } else if #available(iOS 26.0, *) {
            // Fixed corner radius (not .capsule): a capsule's radius grows with the
            // button's height, so on tall multi-line options the curved ends bow
            // inward and clip the text. A fixed radius keeps the outline clear of
            // the label at any line count and matches the fallbacks below.
            glassEffect(.regular.interactive(), in: .rect(cornerRadius: HermesRadius.r16))
        } else {
            background(.regularMaterial, in: RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous)
                        .stroke(.primary.opacity(0.10), lineWidth: 1)
                )
        }
    }
}

/// The round submit control beside a response field: filled while there is
/// something to send, recessed when there is not, and a spinner in flight.
struct PendingRequestSubmitButton: View {
    let isBusy: Bool
    let canSubmit: Bool
    let action: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @ScaledMetric(relativeTo: .body) private var size: CGFloat = 40

    /// Also the response field's caret colour, so the pair reads as one control.
    static func fill(canSubmit: Bool, colorScheme: ColorScheme) -> Color {
        guard canSubmit else {
            return colorScheme == .dark ? Color.white.opacity(0.18) : Color.black.opacity(0.12)
        }
        return colorScheme == .dark ? .white : .black
    }

    var body: some View {
        Button(action: action) {
            label
                .frame(width: size, height: size)
                .background(Self.fill(canSubmit: canSubmit, colorScheme: colorScheme))
                .foregroundStyle(foreground)
                .clipShape(Circle())
        }
        .buttonStyle(.hermesPressOnly(.icon))
        .disabled(isBusy || !canSubmit)
    }

    @ViewBuilder
    private var label: some View {
        if isBusy {
            ProgressView().tint(foreground).scaleEffect(0.82)
        } else {
            Image(systemName: "arrow.up").font(.system(size: 15, weight: .semibold))
        }
    }

    private var foreground: Color {
        guard canSubmit else { return Color(.secondaryLabel) }
        return colorScheme == .dark ? .black : .white
    }
}

private struct PendingRequestFieldSurface: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, HermesSpacing.s12)
            .padding(.vertical, HermesSpacing.s12)
            .background(fill, in: RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous)
                    .stroke(.primary.opacity(colorScheme == .dark ? 0.13 : 0.10), lineWidth: 1)
            )
    }

    private var fill: Color {
        colorScheme == .dark ? Color.white.opacity(0.055) : Color.black.opacity(0.045)
    }
}

private struct PendingRequestBlockSurface: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    func body(content: Content) -> some View {
        content
            .padding(HermesSpacing.s12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(fill, in: RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                    .stroke(.primary.opacity(0.06), lineWidth: 1)
            )
    }

    private var fill: Color {
        colorScheme == .dark ? Color.white.opacity(0.07) : Color.black.opacity(0.04)
    }
}
