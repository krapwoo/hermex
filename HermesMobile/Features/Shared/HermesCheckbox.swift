import SwiftUI

/// Shared checkbox metrics. The visual control stays compact while the interactive
/// wrapper expands to the platform minimum hit target.
enum HermesCheckboxMetrics {
    static let boxSize: CGFloat = 20
    static let borderWidth: CGFloat = 2
    static let minimumHitTarget: CGFloat = 44
}

/// A reusable square multi-selection control.
///
/// Pass an `action` when the checkbox owns interaction. When a containing row
/// owns the tap, omit `action`; the same visual is rendered as an
/// accessibility-hidden indicator so controls are never nested.
struct HermesCheckbox: View {
    let isChecked: Bool
    var isEnabled = true
    var label: String?
    var action: (() -> Void)?

    var body: some View {
        if let action {
            Button(action: action) {
                content
                    .frame(minWidth: HermesCheckboxMetrics.minimumHitTarget, minHeight: HermesCheckboxMetrics.minimumHitTarget)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.hermesPressOnly(.icon))
            .disabled(!isEnabled)
            .accessibilityRepresentation {
                Toggle(
                    label ?? String(localized: "Checkbox"),
                    isOn: Binding(
                        get: { isChecked },
                        set: { _ in action() }
                    )
                )
                .disabled(!isEnabled)
            }
        } else {
            content
                .accessibilityHidden(true)
        }
    }

    private var content: some View {
        HStack(spacing: HermesSpacing.s8) {
            ZStack {
                RoundedRectangle(cornerRadius: HermesRadius.r4, style: .continuous)
                    .fill(isChecked ? Color.primary : Color.clear)
                    .overlay {
                        RoundedRectangle(cornerRadius: HermesRadius.r4, style: .continuous)
                            .stroke(
                                isChecked ? Color.primary : Color(.separator),
                                lineWidth: HermesCheckboxMetrics.borderWidth
                            )
                    }

                if isChecked {
                    Image(systemName: "checkmark")
                        .font(.system(size: HermesIconSize.xs, weight: .bold))
                        .foregroundStyle(Color(.systemBackground))
                }
            }
            .frame(width: HermesCheckboxMetrics.boxSize, height: HermesCheckboxMetrics.boxSize)

            if let label {
                Text(label)
                    .appFont(.body)
                    .foregroundStyle(.primary)
            }
        }
        .opacity(isEnabled ? 1 : 0.45)
    }
}
