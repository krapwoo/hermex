import SwiftUI

/// A transient status notice: a semantic tint/icon, a message, and an optional action, presented via
/// `hermexToast(isPresented:toast:)`. Distinct from `Banner` (a persistent in-flow notice) and from
/// `GitActionToastOverlay` (Workspace/Git's own progress/success state machine) — this is the generic
/// version, with lifecycle left entirely to the caller's `isPresented` binding.
struct HermexToast: View {
    enum Semantic: Equatable {
        case information
        case success
        case warning
        case error

        var tint: Color {
            switch self {
            case .information: .blue
            case .success: .green
            case .warning: .yellow
            case .error: .red
            }
        }

        var defaultIcon: String {
            switch self {
            case .information: "info.circle"
            case .success: "checkmark.circle"
            case .warning: "exclamationmark.triangle"
            case .error: "xmark.octagon"
            }
        }
    }

    struct Action {
        let title: String
        let handler: () -> Void
    }

    let semantic: Semantic
    let message: Text
    var icon: String?
    var isIconDecorative = true
    var action: Action?

    init(
        _ semantic: Semantic,
        message: Text,
        icon: String? = nil,
        isIconDecorative: Bool = true,
        action: Action? = nil
    ) {
        self.semantic = semantic
        self.message = message
        self.icon = icon ?? semantic.defaultIcon
        self.isIconDecorative = isIconDecorative
        self.action = action
    }

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: HermesIconSize.medium))
                    .foregroundStyle(semantic.tint)
                    .accessibilityHidden(isIconDecorative)
            }

            message
                .appFont(.subheadlineSemibold)
                .foregroundStyle(.primary)

            Spacer(minLength: HermesSpacing.s8)

            if let action {
                Button(action.title, action: action.handler)
                    .appFont(.subheadlineSemibold)
                    .buttonStyle(.plain)
                    .foregroundStyle(semantic.tint)
            }
        }
        .padding(.horizontal, HermesSpacing.s16)
        .padding(.vertical, HermesSpacing.s12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: HermesRadius.card, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: HermesRadius.card, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        }
        .accessibilityElement(children: action == nil ? .combine : .contain)
    }
}

/// Caller-owned visibility for a `HermexToast`: no internal timer, no auto-dismiss — the caller's
/// `isPresented` binding is the only thing that shows or hides it. Presentation mirrors
/// `GitActionToastOverlay`'s established top-anchored, Reduce-Motion-safe transition: it enters by
/// moving down from the top edge combined with opacity (`HermesMotion.Bundle.overlayEnter`) and
/// exits back toward the top combined with opacity (`HermesMotion.Bundle.overlayExit`). Reduce
/// Motion drops the directional move entirely, falling back to an opacity-only state change.
private struct HermexToastPresentation: ViewModifier {
    @Binding var isPresented: Bool
    let toast: HermexToast

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .top) {
                if isPresented {
                    toast
                        .padding(.horizontal, HermesSpacing.s16)
                        .padding(.top, HermesSpacing.s12)
                        .transition(transition)
                }
            }
            .animation(reduceMotion ? HermesMotion.animation(for: HermesMotion.Bundle.stateChange) : nil, value: isPresented)
    }

    private var transition: AnyTransition {
        guard !reduceMotion else { return .opacity }
        return .asymmetric(
            insertion: .move(edge: .top).combined(with: .opacity)
                .animation(HermesMotion.animation(for: HermesMotion.Bundle.overlayEnter)),
            removal: .move(edge: .top).combined(with: .opacity)
                .animation(HermesMotion.animation(for: HermesMotion.Bundle.overlayExit))
        )
    }
}

extension View {
    /// Overlays `toast` at the top of this view whenever `isPresented` is true. Lifecycle — when it
    /// appears and disappears — stays entirely caller-owned.
    func hermexToast(isPresented: Binding<Bool>, toast: HermexToast) -> some View {
        modifier(HermexToastPresentation(isPresented: isPresented, toast: toast))
    }
}
