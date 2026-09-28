import SwiftUI

/// Shared radio metrics, mirroring `HermesCheckboxMetrics`: a compact visual control inside the
/// platform minimum hit target.
enum HermesRadioMetrics {
    static let circleSize: CGFloat = HermesCheckboxMetrics.boxSize
    static let innerDotSize: CGFloat = 10
    static let borderWidth: CGFloat = HermesCheckboxMetrics.borderWidth
    static let minimumHitTarget: CGFloat = HermesCheckboxMetrics.minimumHitTarget
}

/// A reusable one-of-many selection control — the circular counterpart to `HermesCheckbox`'s
/// boolean square. Pass an `action` when the radio owns interaction; a containing row that owns the
/// tap instead gets the same visual as an accessibility-hidden indicator.
struct HermesRadio: View {
    let isSelected: Bool
    var isEnabled = true
    var label: String?
    var action: (() -> Void)?

    var body: some View {
        if let action {
            Button(action: action) {
                content
                    .frame(minWidth: HermesRadioMetrics.minimumHitTarget, minHeight: HermesRadioMetrics.minimumHitTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.hermesPressOnly(.icon))
            .disabled(!isEnabled)
            .accessibilityLabel(label ?? String(localized: "Option"))
            .accessibilityAddTraits(isSelected ? .isSelected : [])
        } else {
            content
                .accessibilityHidden(true)
        }
    }

    private var content: some View {
        HStack(spacing: HermesSpacing.s8) {
            ZStack {
                Circle()
                    .stroke(
                        isSelected ? Color.primary : Color(.separator),
                        lineWidth: HermesRadioMetrics.borderWidth
                    )

                if isSelected {
                    Circle()
                        .fill(Color.primary)
                        .frame(width: HermesRadioMetrics.innerDotSize, height: HermesRadioMetrics.innerDotSize)
                }
            }
            .frame(width: HermesRadioMetrics.circleSize, height: HermesRadioMetrics.circleSize)

            if let label {
                Text(label)
                    .appFont(.body)
                    .foregroundStyle(.primary)
            }
        }
        .opacity(isEnabled ? 1 : 0.45)
    }
}
