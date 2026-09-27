import SwiftUI

/// Shared mutually-exclusive selection control. The fixed variant preserves the native iOS
/// segmented Picker; the scrolling variant uses the same selection semantics when the options no
/// longer fit in an equal-width control.
enum SegmentedControlStyle {
    case fixed
    case scrolling
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
            Picker(title, selection: $selection) {
                ForEach(options) { option in
                    Text(option.title).tag(option.value)
                }
            }
            .pickerStyle(.segmented)
        case .scrolling:
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: HermesSpacing.s8) {
                    ForEach(options) { option in
                        scrollingOption(option)
                    }
                }
                .padding(.horizontal, HermesSpacing.screenHorizontal)
                .padding(.vertical, HermesSpacing.s8)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(title))
        }
    }

    private func scrollingOption(_ option: SegmentedControlOption<Value>) -> some View {
        let isSelected = selection == option.value

        return Button {
            withAnimation(reduceMotion ? nil : .easeInOut(duration: HermesMotion.Duration.d150)) {
                selection = option.value
            }
        } label: {
            HStack(spacing: HermesSpacing.s8) {
                if let tint = option.tint {
                    Circle()
                        .fill(tint)
                        .frame(width: HermesIconSize.xs, height: HermesIconSize.xs)
                        .accessibilityHidden(true)
                }

                Text(option.title)
                    .appFont(.subheadline, weight: isSelected ? .semibold : .regular)

                if let count = option.count {
                    Text(verbatim: "\(count)")
                        .appFont(.caption, design: .monospaced)
                        .foregroundStyle(.secondary)
                }
            }
            .foregroundStyle(isSelected ? .primary : .secondary)
            .padding(.horizontal, HermesSpacing.s12)
            .frame(minHeight: 44)
            .background(
                isSelected ? Color(.secondarySystemFill) : Color.clear,
                in: Capsule(style: .continuous)
            )
            .contentShape(Capsule(style: .continuous))
        }
        .buttonStyle(.hermesPressOnly(.capsule))
        .accessibilityLabel(accessibilityLabel(for: option))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func accessibilityLabel(for option: SegmentedControlOption<Value>) -> Text {
        if let count = option.count {
            return Text("\(option.title), \(count)")
        }
        return Text(option.title)
    }
}
