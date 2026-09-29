#if DEBUG
import SwiftUI

/// DEBUG-only lab (`--hermex-overlay-lab`) exercising the unadopted custom same-window overlay
/// components — `HermexDialog` and `HermexPopoverMenu` — in a signed simulator build, so their
/// rendered behavior (motion, accessibility, Reduce Motion/Transparency, exactly-once dismissal) can
/// be verified without any production call site. Not reachable in Release builds and not a
/// production adoption surface (see `HermesMobileApp`). `--hermex-overlay-lab-popover` scrolls
/// straight to the Popover section on launch — a deterministic seam so a fresh relaunch always
/// brings those fixtures into view without manual scrolling.
struct HermexOverlayLab: View {
    @State private var forceReduceMotion = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-reduce-motion")
    @State private var forceReduceTransparency = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-reduce-transparency")
    private let jumpsToPopoverSection = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-popover")

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    controls
                    Divider()
                    dialogSection
                    Divider()
                    popoverSection
                        .id(HermexOverlayLabPopoverSection.scrollAnchorID)
                }
                .padding(20)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(Text(verbatim: "Overlay Lab"))
            .navigationBarTitleDisplayMode(.inline)
            .task {
                guard jumpsToPopoverSection else { return }
                proxy.scrollTo(HermexOverlayLabPopoverSection.scrollAnchorID, anchor: .top)
            }
        }
        // SwiftUI exposes no public writable override for these two accessibility settings; the
        // same underscored keys are already used from `HermesMobileTests` on a live hosted window,
        // not only from `#Preview`, so they are safe to force here for a rendered manual pass.
        .environment(\._accessibilityReduceMotion, forceReduceMotion)
        .environment(\._accessibilityReduceTransparency, forceReduceTransparency)
    }

    private var controls: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(verbatim: "Overlay Lab").font(.title3.weight(.semibold))
            Toggle(isOn: $forceReduceMotion) { Text(verbatim: "Force Reduce Motion") }
                .accessibilityIdentifier("overlay-lab-force-reduce-motion")
            Toggle(isOn: $forceReduceTransparency) { Text(verbatim: "Force Reduce Transparency") }
                .accessibilityIdentifier("overlay-lab-force-reduce-transparency")
        }
        .font(.subheadline)
    }

    private var dialogSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(verbatim: "Dialog").font(.headline)
            HermexOverlayLabHorizontalConfirmation()
            HermexOverlayLabVerticalExplanation()
            HermexOverlayLabLongBody()
            HermexOverlayLabAccessibilitySize()
            HermexOverlayLabRepeatedPresentDismiss()
            HermexOverlayLabDismissThenRun()
            HermexOverlayLabBackdropBlocksInput()
            HermexOverlayLabAccessibilityOrder()
        }
    }

    private var popoverSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(verbatim: "Popover Menu").font(.headline)
            HermexOverlayLabPopoverBelowFit()
            HermexOverlayLabPopoverAboveFlip()
            HStack(spacing: 12) {
                HermexOverlayLabPopoverLeadingClamp()
                Spacer()
                HermexOverlayLabPopoverTrailingClamp()
            }
            HermexOverlayLabPopoverLongScroll()
            HermexOverlayLabPopoverDisabledFirstRow()
            HermexOverlayLabPopoverDestructiveRow()
            HermexOverlayLabPopoverOutsideTapDismiss()
            HermexOverlayLabPopoverDismissThenRun()
            HermexOverlayLabPopoverAccessibilitySize()
        }
    }
}

/// Namespaces the scroll-anchor identifier `--hermex-overlay-lab-popover` jumps to on launch.
private enum HermexOverlayLabPopoverSection {
    static let scrollAnchorID = "overlay-lab-popover-section"
}

// ─── 1. Short confirmation, horizontal footer ──────────────────────────────────
private struct HermexOverlayLabHorizontalConfirmation: View {
    // The extra DEBUG-only argument makes one deterministic rendered screenshot possible in
    // headless simulator sessions where no pointer-driving tool is available. The ordinary lab
    // route remains interactive and starts closed.
    @State private var isPresented = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-auto-dialog")

    var body: some View {
        Button("Short confirmation (horizontal)") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-dialog-horizontal-trigger")
            .hermexDialog(isPresented: $isPresented, footerAxis: .horizontal) {
                Text(verbatim: "Delete this draft?").font(.headline)
            } content: {
                Text(verbatim: "This removes the unsent draft from this device. It cannot be undone.")
                    .font(.body)
            } footer: { context in
                Button("Cancel") { context.dismiss() }
                    .buttonStyle(.hermex(.medium, emphasis: .secondary))
                Button("Delete") { context.dismissAfter {} }
                    .buttonStyle(.hermex(.medium, emphasis: .destructive))
            }
    }
}

// ─── 2. Explanatory dialog, vertical footer ────────────────────────────────────
private struct HermexOverlayLabVerticalExplanation: View {
    @State private var isPresented = false

    var body: some View {
        Button("Explanatory dialog (vertical)") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-dialog-vertical-trigger")
            .hermexDialog(isPresented: $isPresented, footerAxis: .vertical) {
                Text(verbatim: "Turn on notifications?").font(.headline)
            } content: {
                Text(verbatim: "Hermex can notify you when a session needs your attention, even while the app is closed.")
                    .font(.body)
            } footer: { context in
                Button("Turn On") { context.dismissAfter {} }
                    .buttonStyle(.hermex(.medium, emphasis: .primary))
                Button("Not Now") { context.dismiss() }
                    .buttonStyle(.hermex(.medium, emphasis: .neutral))
            }
    }
}

// ─── 3. Long-but-contract-valid body at small phone height ────────────────────
private struct HermexOverlayLabLongBody: View {
    @State private var isPresented = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-auto-long-dialog")

    var body: some View {
        Button("Long-but-valid body") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-dialog-long-body-trigger")
            .hermexDialog(isPresented: $isPresented) {
                Text(verbatim: "Server certificate changed").font(.headline)
            } content: {
                Text(verbatim: "The certificate this server presents no longer matches the one Hermex trusted before. This can happen after a routine renewal, or it can mean the connection is no longer private. Only continue if you recognize this change.")
                    .font(.body)
            } footer: { context in
                Button("Cancel") { context.dismiss() }
                    .buttonStyle(.hermex(.medium, emphasis: .secondary))
                Button("Continue") { context.dismissAfter {} }
                    .buttonStyle(.hermex(.medium, emphasis: .primary))
            }
    }
}

// ─── 4. Largest supported accessibility Dynamic Type size ─────────────────────
private struct HermexOverlayLabAccessibilitySize: View {
    @State private var isPresented = ProcessInfo.processInfo.arguments.contains("--hermex-overlay-lab-auto-accessibility-dialog")

    var body: some View {
        Button("Largest accessibility text size") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-dialog-accessibility-size-trigger")
            .hermexDialog(isPresented: $isPresented, footerAxis: .vertical) {
                Text(verbatim: "Stop this session?").font(.headline)
            } content: {
                Text(verbatim: "The agent stops after finishing its current step.")
                    .font(.body)
            } footer: { context in
                Button("Keep Going") { context.dismiss() }
                    .buttonStyle(.hermex(.medium, emphasis: .secondary))
                Button("Stop") { context.dismissAfter {} }
                    .buttonStyle(.hermex(.medium, emphasis: .destructive))
            }
            .dynamicTypeSize(.accessibility5)
    }
}

// ─── 5/6. Reduce Motion and Reduce Transparency are forced globally by the
// lab's own toggles above (`controls`), so every specimen exercises both. ──────

// ─── 7. Repeated present/dismiss ───────────────────────────────────────────────
private struct HermexOverlayLabRepeatedPresentDismiss: View {
    @State private var isPresented = false
    @State private var closeCount = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Repeated present/dismiss") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-dialog-repeated-trigger")
            Text(verbatim: "Closed \(closeCount) times")
                .font(.caption)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("overlay-lab-repeated-close-count")
        }
        .hermexDialog(isPresented: $isPresented) {
            Text(verbatim: "Repeat me").font(.headline)
        } content: {
            Text(verbatim: "Close this and reopen it a few times to confirm nothing leaks or double-fires.")
                .font(.body)
        } footer: { context in
            Button("Close") { context.dismissAfter { closeCount += 1 } }
                .buttonStyle(.hermex(.medium, emphasis: .primary))
        }
    }
}

// ─── 8. Dismiss-then-run counter: the action only changes after exit ──────────
private struct HermexOverlayLabDismissThenRun: View {
    @State private var isPresented = false
    @State private var actionCount = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Dismiss-then-run counter") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-dialog-dismiss-then-run-trigger")
            Text(verbatim: "Action ran \(actionCount) times")
                .font(.caption)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("overlay-lab-dismiss-then-run-count")
        }
        .hermexDialog(isPresented: $isPresented) {
            Text(verbatim: "Archive session?").font(.headline)
        } content: {
            Text(verbatim: "The counter below only advances after this dialog has fully closed.")
                .font(.body)
        } footer: { context in
            Button("Cancel") { context.dismiss() }
                .buttonStyle(.hermex(.medium, emphasis: .secondary))
            Button("Archive") { context.dismissAfter { actionCount += 1 } }
                .buttonStyle(.hermex(.medium, emphasis: .primary))
        }
    }
}

// ─── 9. Background counter proving backdrop taps never pass through ───────────
private struct HermexOverlayLabBackdropBlocksInput: View {
    @State private var isPresented = false
    @State private var backgroundTapCount = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Backdrop-blocks-input") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-dialog-backdrop-trigger")
            Button("Background counter: \(backgroundTapCount)") { backgroundTapCount += 1 }
                .accessibilityIdentifier("overlay-lab-background-tap-counter")
        }
        .hermexDialog(isPresented: $isPresented) {
            Text(verbatim: "Backdrop is inert").font(.headline)
        } content: {
            Text(verbatim: "Tapping the dimmed area behind this dialog must never change the counter behind it.")
                .font(.body)
        } footer: { context in
            Button("Close") { context.dismiss() }
                .buttonStyle(.hermex(.medium, emphasis: .primary))
        }
    }
}

// ─── 10. Heading/body/footer/close accessibility order + trigger focus restore ─
private struct HermexOverlayLabAccessibilityOrder: View {
    @State private var isPresented = false

    var body: some View {
        Button("Accessibility order + focus return") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-a11y-order-trigger")
            .hermexDialog(isPresented: $isPresented) {
                Text(verbatim: "Heading reads first")
                    .font(.headline)
                    .accessibilityIdentifier("overlay-lab-a11y-heading")
            } content: {
                Text(verbatim: "Body reads second.")
                    .font(.body)
                    .accessibilityIdentifier("overlay-lab-a11y-body")
            } footer: { context in
                Button("Footer reads third") { context.dismiss() }
                    .buttonStyle(.hermex(.medium, emphasis: .secondary))
                    .accessibilityIdentifier("overlay-lab-a11y-footer")
            }
    }
}

// ─── Popover Menu fixtures ──────────────────────────────────────────────────────

// ─── 1/2. Anchor near the top: prefers below; near the bottom: flips above ─────
private struct HermexOverlayLabPopoverBelowFit: View {
    @State private var isPresented = false

    var body: some View {
        Button("Below fit (top anchor)") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-below-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "share", title: "Share", systemImage: "square.and.arrow.up") {},
                    HermexPopoverMenuAction(id: "duplicate", title: "Duplicate", systemImage: "plus.square.on.square") {},
                    HermexPopoverMenuAction(id: "rename", title: "Rename", systemImage: "pencil") {}
                ]
            )
    }
}

private struct HermexOverlayLabPopoverAboveFlip: View {
    @State private var isPresented = false

    var body: some View {
        VStack {
            Spacer(minLength: 320)
            Button("Above flip (bottom anchor)") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-popover-above-trigger")
                .hermexPopoverMenu(
                    isPresented: $isPresented,
                    accessibilityLabel: Text("Row actions"),
                    actions: [
                        HermexPopoverMenuAction(id: "share", title: "Share", systemImage: "square.and.arrow.up") {},
                        HermexPopoverMenuAction(id: "duplicate", title: "Duplicate", systemImage: "plus.square.on.square") {},
                        HermexPopoverMenuAction(id: "rename", title: "Rename", systemImage: "pencil") {}
                    ]
                )
        }
    }
}

// ─── 3. Horizontal clamp near each side edge ───────────────────────────────────
private struct HermexOverlayLabPopoverLeadingClamp: View {
    @State private var isPresented = false

    var body: some View {
        Button("Leading clamp") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-leading-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "pin", title: "Pin", systemImage: "pin") {},
                    HermexPopoverMenuAction(id: "archive", title: "Archive", systemImage: "archivebox") {}
                ]
            )
    }
}

private struct HermexOverlayLabPopoverTrailingClamp: View {
    @State private var isPresented = false

    var body: some View {
        Button("Trailing clamp") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-trailing-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "pin", title: "Pin", systemImage: "pin") {},
                    HermexPopoverMenuAction(id: "archive", title: "Archive", systemImage: "archivebox") {}
                ]
            )
    }
}

// ─── 4. Long action list: internal scroll keeps the last action reachable ─────
private struct HermexOverlayLabPopoverLongScroll: View {
    @State private var isPresented = false
    @State private var lastActionRunCount = 0

    private var actions: [HermexPopoverMenuAction] {
        (1...12).map { index in
            index == 12
                ? HermexPopoverMenuAction(id: "last", title: "Last action") { lastActionRunCount += 1 }
                : HermexPopoverMenuAction(id: index, title: "Action \(index)") {}
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Long list (internal scroll)") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-popover-long-scroll-trigger")
                .hermexPopoverMenu(isPresented: $isPresented, accessibilityLabel: Text("Row actions"), actions: actions)
            Text(verbatim: "Last action ran \(lastActionRunCount) times")
                .font(.caption)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("overlay-lab-popover-long-scroll-count")
        }
    }
}

// ─── 5. Disabled first row: initial focus moves to the next enabled row ───────
private struct HermexOverlayLabPopoverDisabledFirstRow: View {
    @State private var isPresented = false

    var body: some View {
        Button("Disabled first row") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-disabled-first-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "unavailable", title: "Unavailable", isEnabled: false) {},
                    HermexPopoverMenuAction(id: "available", title: "Available") {}
                ]
            )
    }
}

// ─── 6. Destructive row semantics ──────────────────────────────────────────────
private struct HermexOverlayLabPopoverDestructiveRow: View {
    @State private var isPresented = false

    var body: some View {
        Button("Destructive row") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-destructive-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "duplicate", title: "Duplicate", systemImage: "plus.square.on.square") {},
                    HermexPopoverMenuAction(id: "delete", title: "Delete", systemImage: "trash", role: .destructive) {}
                ]
            )
    }
}

// ─── 7. Outside-tap dismissal: the action counter never advances ──────────────
private struct HermexOverlayLabPopoverOutsideTapDismiss: View {
    @State private var isPresented = false
    @State private var actionRunCount = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Outside-tap dismissal") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-popover-outside-tap-trigger")
                .hermexPopoverMenu(
                    isPresented: $isPresented,
                    accessibilityLabel: Text("Row actions"),
                    actions: [HermexPopoverMenuAction(id: "run", title: "Run") { actionRunCount += 1 }]
                )
            Text(verbatim: "Action ran \(actionRunCount) times")
                .font(.caption)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("overlay-lab-popover-outside-tap-count")
        }
    }
}

// ─── 8. Dismiss-then-run counter: the action only changes after exit ──────────
private struct HermexOverlayLabPopoverDismissThenRun: View {
    @State private var isPresented = false
    @State private var actionRunCount = 0

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Button("Dismiss-then-run counter") { isPresented = true }
                .accessibilityIdentifier("overlay-lab-popover-dismiss-then-run-trigger")
                .hermexPopoverMenu(
                    isPresented: $isPresented,
                    accessibilityLabel: Text("Row actions"),
                    actions: [HermexPopoverMenuAction(id: "archive", title: "Archive") { actionRunCount += 1 }]
                )
            Text(verbatim: "Action ran \(actionRunCount) times")
                .font(.caption)
                .foregroundStyle(.secondary)
                .accessibilityIdentifier("overlay-lab-popover-dismiss-then-run-count")
        }
    }
}

// ─── 9. Largest supported accessibility Dynamic Type size ─────────────────────
private struct HermexOverlayLabPopoverAccessibilitySize: View {
    @State private var isPresented = false

    var body: some View {
        Button("Largest accessibility text size") { isPresented = true }
            .accessibilityIdentifier("overlay-lab-popover-accessibility-size-trigger")
            .hermexPopoverMenu(
                isPresented: $isPresented,
                accessibilityLabel: Text("Row actions"),
                actions: [
                    HermexPopoverMenuAction(id: "share", title: "Share", systemImage: "square.and.arrow.up") {},
                    HermexPopoverMenuAction(id: "delete", title: "Delete", systemImage: "trash", role: .destructive) {}
                ]
            )
            .dynamicTypeSize(.accessibility5)
    }
}

// ─── 10. Rotation while visible and Reduce Motion/Transparency ─────────────────
// Rotate the simulator while any fixture above is open to exercise
// `HermexPopoverPlacement`'s live recompute; Reduce Motion/Transparency are forced
// globally by the lab's own toggles (`controls`), so every fixture above exercises both.
#endif
