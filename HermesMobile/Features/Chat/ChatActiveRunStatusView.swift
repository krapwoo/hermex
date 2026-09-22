import SwiftUI

struct ChatActiveRunStatusView: View {
    let presentation: ChatActiveRunStatusPresentation

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        HStack(spacing: HermesSpacing.s8) {
            progressIndicator

            Text(presentation.label)
                .appFont(.caption, weight: .semibold)
                .foregroundStyle(.secondary)
                .lineLimit(dynamicTypeSize.isAccessibilitySize ? 2 : 1)
                .minimumScaleFactor(0.88)
        }
        .padding(.horizontal, HermesSpacing.s12)
        .padding(.vertical, HermesSpacing.s8)
        .chatTimelineAccessorySurface(
            fallbackMaterial: .regularMaterial,
            in: Capsule(style: .continuous)
        )
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(presentation.accessibilityLabel)
    }

    @ViewBuilder
    private var progressIndicator: some View {
        if reduceMotion {
            Circle()
                .fill(.secondary)
                .frame(width: 7, height: 7)
                .accessibilityHidden(true)
        } else {
            ProgressView()
                .controlSize(.mini)
                .accessibilityHidden(true)
        }
    }
}

#Preview("Active Run Status") {
    VStack(spacing: HermesSpacing.s12) {
        ChatActiveRunStatusView(
            presentation: ChatActiveRunStatusPresentation(kind: .active)
        )

        ChatActiveRunStatusView(
            presentation: ChatActiveRunStatusPresentation(kind: .reconnecting)
        )
    }
    .padding()
    .background(Color(.systemBackground))
}
