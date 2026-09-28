import SwiftUI

/// Shared mutually-exclusive selection control. Both variants use Hermex-owned presentation and
/// native Button semantics: fixed divides the available width equally, while scrolling preserves
/// each option's intrinsic width when the set no longer fits.
enum SegmentedControlStyle {
    case fixed
    case scrolling
}

private enum SegmentedControlMetrics {
    /// Compact visible pill height. The surrounding Button retains the full minimum touch target.
    static let visualHeight: CGFloat = 36
    static let minimumTouchHeight: CGFloat = 44
    static let trackInset: CGFloat = HermesSpacing.s4
}

struct SegmentedControlOption<Value: Hashable>: Identifiable {
    let value: Value
    let title: String
    var count: Int?
    var tint: Color?

    var id: Value { value }
}

struct SegmentedControl<Value: Hashable>: View {
    let title: String
    @Binding var selection: Value
    let options: [SegmentedControlOption<Value>]
    var style: SegmentedControlStyle = .fixed

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var selectionNamespace

    init(
        _ title: String,
        selection: Binding<Value>,
        options: [SegmentedControlOption<Value>],
        style: SegmentedControlStyle = .fixed
    ) {
        self.title = title
        _selection = selection
        self.options = options
        self.style = style
    }

    @ViewBuilder
    var body: some View {
        switch style {
        case .fixed:
            HStack(spacing: HermesSpacing.s4) {
                ForEach(options) { option in
                    optionButton(option, expandsToFill: true)
                }
            }
            .padding(.horizontal, SegmentedControlMetrics.trackInset)
            .background(Color(.secondarySystemFill), in: Capsule(style: .continuous))
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(title))
        case .scrolling:
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: HermesSpacing.s8) {
                    ForEach(options) { option in
                        optionButton(option, expandsToFill: false)
                    }
                }
                .padding(.horizontal, HermesSpacing.screenHorizontal)
                .padding(.vertical, HermesSpacing.s4)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(title))
        }
    }

    private func optionButton(
        _ option: SegmentedControlOption<Value>,
        expandsToFill: Bool
    ) -> some View {
        let isSelected = selection == option.value

        return Button {
            withAnimation(selectionAnimation) {
                selection = option.value
            }
        } label: {
            ZStack {
                if isSelected {
                    Capsule(style: .continuous)
                        .fill(Color(.systemBackground))
                        .hermesShadow(.controlElevatedResting)
                        .matchedGeometryEffect(id: "segmented-control-selection", in: selectionNamespace)
                        .frame(height: SegmentedControlMetrics.visualHeight)
                        .allowsHitTesting(false)
                }

                optionLabel(option, isSelected: isSelected)

                .padding(.horizontal, HermesSpacing.s12)
                .frame(
                    maxWidth: expandsToFill ? .infinity : nil,
                    minHeight: SegmentedControlMetrics.minimumTouchHeight
                )
                .contentShape(Rectangle())
            }
        }
        .buttonStyle(.hermesPressOnly(.capsule))
        .accessibilityLabel(accessibilityLabel(for: option))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func optionLabel(
        _ option: SegmentedControlOption<Value>,
        isSelected: Bool
    ) -> some View {
        HStack(spacing: HermesSpacing.s8) {
            if let tint = option.tint {
                Circle()
                    .fill(tint)
                    .frame(width: HermesIconSize.xs, height: HermesIconSize.xs)
                    .accessibilityHidden(true)
            }

            Text(option.title)
                .appFont(isSelected ? .subheadlineSemibold : .subheadline)

            if let count = option.count {
                Text(verbatim: "\(count)")
                    .appFont(.mono12)
                    .foregroundStyle(.secondary)
            }
        }
        .foregroundStyle(isSelected ? .primary : .secondary)
    }

    private var selectionAnimation: Animation? {
        guard !reduceMotion else { return nil }
        return HermesMotion.animation(for: HermesMotion.Bundle.contentReposition)
    }

    private func accessibilityLabel(for option: SegmentedControlOption<Value>) -> Text {
        if let count = option.count {
            return Text("\(option.title), \(count)")
        }
        return Text(option.title)
    }
}
