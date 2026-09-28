import SwiftUI

/// Row geometry and selection chrome shared by every picker row in Settings and the Task editor, so
/// Default Model, Default Profile, and the Task editor's Model/Profile/Skills pickers stay visually
/// identical. Replaces the standalone "Picker Row" component: every caller below composes `ListItem`
/// directly instead of hand-rolling this HStack/frame/pill scaffolding.
enum ListItemMetrics {
    static let minHeight: CGFloat = 48
    static let cornerRadius: CGFloat = HermesRadius.field
}

/// `ListItem`'s selected/pending/disabled state. A free-standing type rather than a nested one, so a
/// caller can build a `ListItemState` without first spelling out `ListItem`'s three content generic
/// parameters.
struct ListItemState: Equatable {
    var isSelected = false
    var isPending = false
    var isDisabled = false
}

extension View {
    /// The selected-row treatment shared by every `ListItem`: a filled `Color.primary` pill with the
    /// inverted foreground that fill needs. The caller owns the row's frame, because the pill can
    /// wrap content that sits outside the row's own button — a trailing accessory does.
    func listItemSelectionPill(isSelected: Bool) -> some View {
        foregroundStyle(isSelected ? Color(.systemBackground) : Color.primary)
            .padding(.horizontal, HermesSpacing.s12)
            .background(
                isSelected ? Color.primary : Color.clear,
                in: RoundedRectangle(cornerRadius: ListItemMetrics.cornerRadius, style: .continuous)
            )
    }
}

/// A reusable list row: optional leading content, a title with an optional title-adjacent accessory
/// (a Tag, for instance), an optional subtitle, and a trailing zone that shows a pending spinner, a
/// selected checkmark, or nothing. `trailingAccessory` sits beside — not inside — the row's own tap
/// target, so it stays independently interactive (a favorite star, for instance) while the whole row
/// still shares one selection pill.
///
/// Navigation, swipe actions, context menus, and the decision to wrap a whole row in another control
/// stay caller-owned; `ListItem` only owns this shared anatomy and its selected/pending/disabled
/// states.
struct ListItem<Leading: View, TitleAccessory: View, Trailing: View>: View {
    var title: Text
    var titleLineLimit: Int = 1
    var subtitle: Text?
    var subtitleLineLimit: Int = 1
    var accessibilityLabel: Text?
    var accessibilityValue: Text?
    var state = ListItemState()
    /// Omit for a plain native `Button`. Set it when a caller needs an explicit tap haptic while
    /// retaining `ListItem`'s shared row anatomy.
    var hapticFeedbackStyle: HapticButtonFeedbackStyle?
    /// The title's semantic weight. Defaults to `.body`; an accordion header requests `.label` to
    /// read stronger than the body rows it discloses.
    var titleRole: AppFont.Role = .body
    /// A decorative, accessibility-hidden system image shown in the trailing indicator slot once
    /// pending/selected precedence is resolved — an accordion header's chevron, for instance.
    var rowIndicatorSystemImage: String? = nil
    /// `rowIndicatorSystemImage`'s rendered size. Defaults to the existing `HermesIconSize.small`
    /// ListItem indicator size; an accordion header opts into `HermesIconSize.medium`.
    var rowIndicatorSize: CGFloat = HermesIconSize.small
    let action: () -> Void
    @ViewBuilder var leading: () -> Leading
    @ViewBuilder var titleAccessory: () -> TitleAccessory
    @ViewBuilder var trailingAccessory: () -> Trailing

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            rowButton
                .buttonStyle(.plain)
                .disabled(state.isDisabled || state.isPending)
                .accessibilityLabel(accessibilityLabel ?? title)
                .modifier(OptionalAccessibilityValue(value: accessibilityValue))
                .accessibilityAddTraits(state.isSelected ? .isSelected : [])

            trailingAccessory()
        }
        .listItemSelectionPill(isSelected: state.isSelected)
    }

    @ViewBuilder
    private var rowButton: some View {
        if let hapticFeedbackStyle {
            HapticButton(feedbackStyle: hapticFeedbackStyle, action: action) { rowContent }
        } else {
            Button(action: action) { rowContent }
        }
    }

    private var rowContent: some View {
        HStack(spacing: HermesSpacing.s12) {
            leading()

            VStack(alignment: .leading, spacing: HermesSpacing.s4) {
                HStack(spacing: HermesSpacing.s8) {
                    title
                        .appFont(titleRole)
                        .lineLimit(titleLineLimit)

                    titleAccessory()
                }

                if let subtitle {
                    subtitle
                        .appFont(.caption)
                        .foregroundStyle(subtitleForeground)
                        .lineLimit(subtitleLineLimit)
                }
            }

            Spacer(minLength: 0)

            trailingIndicator
        }
        .frame(maxWidth: .infinity, minHeight: ListItemMetrics.minHeight, alignment: .leading)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private var trailingIndicator: some View {
        if state.isPending {
            ProgressView()
                .controlSize(.small)
                .tint(state.isSelected ? Color(.systemBackground) : Color.primary)
        } else if state.isSelected {
            Image(systemName: "checkmark")
                .font(.body.weight(.semibold))
                .accessibilityHidden(true)
        } else if let rowIndicatorSystemImage {
            Image(systemName: rowIndicatorSystemImage)
                .font(.system(size: rowIndicatorSize, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(width: HermesIconSize.large, height: HermesIconSize.large)
                .accessibilityHidden(true)
        }
    }

    private var subtitleForeground: Color {
        state.isSelected ? Color(.systemBackground).opacity(0.7) : Color.secondary
    }
}

extension ListItem where Leading == EmptyView {
    init(
        title: Text,
        titleLineLimit: Int = 1,
        subtitle: Text? = nil,
        subtitleLineLimit: Int = 1,
        accessibilityLabel: Text? = nil,
        accessibilityValue: Text? = nil,
        state: ListItemState = ListItemState(),
        titleRole: AppFont.Role = .body,
        rowIndicatorSystemImage: String? = nil,
        rowIndicatorSize: CGFloat = HermesIconSize.small,
        action: @escaping () -> Void,
        @ViewBuilder titleAccessory: @escaping () -> TitleAccessory,
        @ViewBuilder trailingAccessory: @escaping () -> Trailing
    ) {
        self.init(
            title: title,
            titleLineLimit: titleLineLimit,
            subtitle: subtitle,
            subtitleLineLimit: subtitleLineLimit,
            accessibilityLabel: accessibilityLabel,
            accessibilityValue: accessibilityValue,
            state: state,
            titleRole: titleRole,
            rowIndicatorSystemImage: rowIndicatorSystemImage,
            rowIndicatorSize: rowIndicatorSize,
            action: action,
            leading: { EmptyView() },
            titleAccessory: titleAccessory,
            trailingAccessory: trailingAccessory
        )
    }
}

extension ListItem where Leading == EmptyView, TitleAccessory == EmptyView {
    init(
        title: Text,
        titleLineLimit: Int = 1,
        subtitle: Text? = nil,
        subtitleLineLimit: Int = 1,
        accessibilityLabel: Text? = nil,
        accessibilityValue: Text? = nil,
        state: ListItemState = ListItemState(),
        titleRole: AppFont.Role = .body,
        rowIndicatorSystemImage: String? = nil,
        rowIndicatorSize: CGFloat = HermesIconSize.small,
        action: @escaping () -> Void,
        @ViewBuilder trailingAccessory: @escaping () -> Trailing
    ) {
        self.init(
            title: title,
            titleLineLimit: titleLineLimit,
            subtitle: subtitle,
            subtitleLineLimit: subtitleLineLimit,
            accessibilityLabel: accessibilityLabel,
            accessibilityValue: accessibilityValue,
            state: state,
            titleRole: titleRole,
            rowIndicatorSystemImage: rowIndicatorSystemImage,
            rowIndicatorSize: rowIndicatorSize,
            action: action,
            leading: { EmptyView() },
            titleAccessory: { EmptyView() },
            trailingAccessory: trailingAccessory
        )
    }
}

extension ListItem where Leading == EmptyView, TitleAccessory == EmptyView, Trailing == EmptyView {
    init(
        title: Text,
        titleLineLimit: Int = 1,
        subtitle: Text? = nil,
        subtitleLineLimit: Int = 1,
        accessibilityLabel: Text? = nil,
        accessibilityValue: Text? = nil,
        state: ListItemState = ListItemState(),
        titleRole: AppFont.Role = .body,
        rowIndicatorSystemImage: String? = nil,
        rowIndicatorSize: CGFloat = HermesIconSize.small,
        action: @escaping () -> Void
    ) {
        self.init(
            title: title,
            titleLineLimit: titleLineLimit,
            subtitle: subtitle,
            subtitleLineLimit: subtitleLineLimit,
            accessibilityLabel: accessibilityLabel,
            accessibilityValue: accessibilityValue,
            state: state,
            titleRole: titleRole,
            rowIndicatorSystemImage: rowIndicatorSystemImage,
            rowIndicatorSize: rowIndicatorSize,
            action: action,
            leading: { EmptyView() },
            titleAccessory: { EmptyView() },
            trailingAccessory: { EmptyView() }
        )
    }
}

extension ListItem where TitleAccessory == EmptyView, Trailing == EmptyView {
    init(
        title: Text,
        titleLineLimit: Int = 1,
        subtitle: Text? = nil,
        subtitleLineLimit: Int = 1,
        accessibilityLabel: Text? = nil,
        accessibilityValue: Text? = nil,
        state: ListItemState = ListItemState(),
        hapticFeedbackStyle: HapticButtonFeedbackStyle? = nil,
        titleRole: AppFont.Role = .body,
        rowIndicatorSystemImage: String? = nil,
        rowIndicatorSize: CGFloat = HermesIconSize.small,
        action: @escaping () -> Void,
        @ViewBuilder leading: @escaping () -> Leading
    ) {
        self.init(
            title: title,
            titleLineLimit: titleLineLimit,
            subtitle: subtitle,
            subtitleLineLimit: subtitleLineLimit,
            accessibilityLabel: accessibilityLabel,
            accessibilityValue: accessibilityValue,
            state: state,
            hapticFeedbackStyle: hapticFeedbackStyle,
            titleRole: titleRole,
            rowIndicatorSystemImage: rowIndicatorSystemImage,
            rowIndicatorSize: rowIndicatorSize,
            action: action,
            leading: leading,
            titleAccessory: { EmptyView() },
            trailingAccessory: { EmptyView() }
        )
    }
}

extension ListItem where Trailing == EmptyView {
    init(
        title: Text,
        titleLineLimit: Int = 1,
        subtitle: Text? = nil,
        subtitleLineLimit: Int = 1,
        accessibilityLabel: Text? = nil,
        accessibilityValue: Text? = nil,
        state: ListItemState = ListItemState(),
        titleRole: AppFont.Role = .body,
        rowIndicatorSystemImage: String? = nil,
        rowIndicatorSize: CGFloat = HermesIconSize.small,
        action: @escaping () -> Void,
        @ViewBuilder leading: @escaping () -> Leading,
        @ViewBuilder titleAccessory: @escaping () -> TitleAccessory
    ) {
        self.init(
            title: title,
            titleLineLimit: titleLineLimit,
            subtitle: subtitle,
            subtitleLineLimit: subtitleLineLimit,
            accessibilityLabel: accessibilityLabel,
            accessibilityValue: accessibilityValue,
            state: state,
            titleRole: titleRole,
            rowIndicatorSystemImage: rowIndicatorSystemImage,
            rowIndicatorSize: rowIndicatorSize,
            action: action,
            leading: leading,
            titleAccessory: titleAccessory,
            trailingAccessory: { EmptyView() }
        )
    }
}

/// `.accessibilityValue` has no "only if present" overload, so a nil value must skip the modifier
/// entirely rather than pass it an empty `Text`, which would announce a blank value.
private struct OptionalAccessibilityValue: ViewModifier {
    let value: Text?

    @ViewBuilder
    func body(content: Content) -> some View {
        if let value {
            content.accessibilityValue(value)
        } else {
            content
        }
    }
}
