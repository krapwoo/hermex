import SwiftUI

/// The Card family's shared defaults. `SectionCard` (adaptive-glass grouped content) and Request
/// Card (`requestCardSurface`, used by `ClarificationRequestCard`, `ApprovalRequestOverlay`,
/// and `BotPendingRequestCard`) both wrap their content in exactly this padding on every edge —
/// this is the one place that default lives, instead of each surface repeating the literal.
enum HermesCardMetrics {
    static let contentPadding: CGFloat = HermesSpacing.s16
}

/// Compact Card: the explicit, documented compact-density surface for component compositions —
/// today, the composer and message Attachment file tiles' outer surface. It is not Card's 16-point
/// default; a component owns its own compact geometry, and this only unifies the fill-plus-hairline
/// chrome those tiles each drew by hand into one named, shared treatment.
enum HermesCompactCardMetrics {
    static let borderOpacity: Double = 0.25
    static let borderWidth: CGFloat = 0.5
}

extension View {
    /// Compact Card's opaque surface: a tinted fill plus the hairline border every normal (non-mini)
    /// Attachment tile already drew by hand. `fill` defaults to the shared file-badge tint; pass
    /// `.clear` for a tile whose own image content already covers the surface and only wants the
    /// border.
    func compactCardSurface(cornerRadius: CGFloat, fill: Color = Color(.secondarySystemBackground)) -> some View {
        background(fill, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        Color(.separator).opacity(HermesCompactCardMetrics.borderOpacity),
                        lineWidth: HermesCompactCardMetrics.borderWidth
                    )
            )
    }
}

/// Request Card's material: `.opaque` by default, since these cards float over live transcript
/// text and a translucent surface would render the request on top of whatever message happens to
/// sit underneath. `.translucentOverScrim` is the one documented exception — a card that instead
/// sits over its own dimmed scrim, where translucency reads correctly.
enum RequestCardMaterial {
    case opaque
    case translucentOverScrim
}

extension View {
    /// Request Card: the shared approval/clarification surface used by the Sessions clarification
    /// card, the Sessions approval overlay, and the Bot pending-request card. Placement differs per
    /// caller — the Sessions clarification pins above the composer, the Bot card sits in the
    /// transcript, the approval overlay floats over a scrim — but the surface itself does not.
    func requestCardSurface(cornerRadius: CGFloat, material: RequestCardMaterial = .opaque) -> some View {
        modifier(RequestCardSurfaceModifier(cornerRadius: cornerRadius, material: material))
    }
}

private struct RequestCardSurfaceModifier: ViewModifier {
    let cornerRadius: CGFloat
    let material: RequestCardMaterial

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

        switch material {
        case .opaque:
            content
                .background(Color(.secondarySystemBackground), in: shape)
                .overlay(shape.stroke(.primary.opacity(0.10), lineWidth: 1))
        case .translucentOverScrim:
            content
                .background(.regularMaterial, in: shape)
                .overlay(shape.stroke(.primary.opacity(0.10), lineWidth: 1))
        }
    }
}
