import SwiftUI
import UIKit

@MainActor struct BotDelegatedWorkView: View {
    let work: BotDelegatedWork
    @Environment(\.dismiss) private var dismiss
    @State private var interruptAction: BotDelegatedWork.InterruptAction?

    var body: some View {
        NavigationStack {
            List {
                if let error = work.errorMessage {
                    Section {
                        Label(error, systemImage: "exclamationmark.triangle")
                            .appFont(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                if work.workers.isEmpty {
                    Section {
                        ContentUnavailableView {
                            Label("No active workers", systemImage: "person.2")
                        } description: {
                            Text(work.isRefreshing
                                 ? "Refreshing delegated work…"
                                 : "Workers appear here while this bot has delegated work in progress.")
                        }
                    }
                } else {
                    Section {
                        ForEach(work.workers) { worker in
                            workerRow(worker)
                        }
                    } header: {
                        Text("Active workers")
                    } footer: {
                        if work.omittedWorkerCount > 0 {
                            Text("Showing the first \(BotDelegatedWork.maximumWorkers) workers. \(work.omittedWorkerCount) more are active.")
                        } else {
                            Text("Tails load only when requested and are limited to 16 KB.")
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Delegated work")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                TopNav(
                    leadingPlacement: .cancellationAction,
                    trailingPlacement: .primaryAction,
                    leadingPrimary: { Button("Done") { dismiss() } },
                    trailingPrimary: {
                        Button {
                            Task { await work.refresh() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(work.isRefreshing)
                        .accessibilityLabel("Refresh delegated work")
                    }
                )
            }
            .refreshable { await work.refresh() }
            .confirmationDialog(
                interruptTitle,
                isPresented: Binding(
                    get: { interruptAction != nil },
                    set: { if !$0 { interruptAction = nil } }
                ),
                titleVisibility: .visible
            ) {
                if let action = interruptAction {
                    Button("Interrupt worker", role: .destructive) {
                        interruptAction = nil
                        Task { await work.interrupt(action) }
                    }
                }
            } message: {
                Text("This stops this delegated worker now. Hermex cannot resume it. The parent and sibling workers keep running.")
            }
        }
    }

    private var interruptTitle: String {
        guard let identity = interruptAction?.worker,
              let worker = work.workers.first(where: { $0.identity == identity }) else {
            return String(localized: "Interrupt this worker?")
        }
        return String(localized: "Interrupt “\(worker.goal)”?")
    }

    @ViewBuilder
    private func workerRow(_ worker: BotDelegatedWorker) -> some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s8) {
            HStack(alignment: .firstTextBaseline, spacing: HermesSpacing.s8) {
                Text(worker.goal)
                    .appFont(.body, weight: .semibold)
                    .foregroundStyle(.primary)
                Spacer(minLength: 8)
                Text(worker.status.localizedUppercase)
                    .appFont(.caption2, weight: .bold)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: HermesSpacing.s4) {
                if let model = worker.model {
                    Label(model, systemImage: "cpu")
                }
                if let tool = worker.lastTool {
                    Label(tool, systemImage: "hammer")
                } else if let count = worker.toolCount {
                    Label("\(count) tools", systemImage: "hammer")
                }
            }
            .appFont(.caption)
            .foregroundStyle(.secondary)
            .lineLimit(1)

            if work.loadingTail == worker.identity {
                Text("Loading tail…")
                    .appFont(.caption)
                    .foregroundStyle(.secondary)
            } else if let tail = work.tail, tail.worker == worker.identity {
                tailView(tail)
            }

            HStack(spacing: HermesSpacing.s12) {
                Button(work.tail?.worker == worker.identity ? "Hide tail" : "Show tail") {
                    if work.tail?.worker == worker.identity {
                        work.hideTail()
                    } else {
                        Task { await work.loadTail(for: worker) }
                    }
                }
                .buttonStyle(.bordered)
                .disabled(work.loadingTail != nil || work.interruptingWorker != nil)

                Spacer()

                if work.interruptedWorker == worker.identity {
                    Label("Interrupt sent", systemImage: "stop.circle")
                        .appFont(.caption, weight: .semibold)
                        .foregroundStyle(.secondary)
                } else {
                    Button("Interrupt", role: .destructive) {
                        interruptAction = work.prepareInterrupt(worker)
                    }
                    .buttonStyle(.bordered)
                    .disabled(!worker.canInterrupt || work.interruptingWorker != nil)
                }
            }
        }
        .padding(.leading, CGFloat(min(worker.depth, 4)) * HermesSpacing.s16)
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private func tailView(_ tail: BotDelegatedTail) -> some View {
        if tail.available {
            VStack(alignment: .leading, spacing: HermesSpacing.s4) {
                ScrollView(.vertical) {
                    Text(tail.text.isEmpty ? String(localized: "No output yet.") : tail.text)
                        .appFont(.caption, design: .monospaced)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 180)
                if tail.truncated {
                    Label("Showing the latest 16 KB", systemImage: "scissors")
                        .appFont(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(HermesSpacing.s12)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: HermesRadius.field))
        } else {
            Text("Live output is no longer available for this worker.")
                .appFont(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

/// A durable, non-user-authored timeline row. The compact card is driven only
/// by typed display metadata; the sheet preserves the host's report verbatim.
struct BotDelegationCompletionCard: View {
    let completion: BotDelegationCompletion
    @State private var showingResults = false

    var body: some View {
        Button { showingResults = true } label: {
            VStack(alignment: .leading, spacing: HermesSpacing.s12) {
                HStack(alignment: .top, spacing: HermesSpacing.s12) {
                    Image(systemName: completion.hasFailures ? "exclamationmark.triangle.fill" : "checkmark")
                        // Retained icon-sizing exception: typography adoption covers text, not SF Symbol sizing.
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(iconColor)
                        .frame(width: 28, height: 28)
                        .background(iconColor.opacity(0.14), in: RoundedRectangle(cornerRadius: HermesRadius.control))

                    VStack(alignment: .leading, spacing: HermesSpacing.s2) {
                        Text(title)
                            .appFont(.subheadline, weight: .semibold)
                            .foregroundStyle(.primary)
                        Text(summary)
                            .appFont(.caption)
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Image(systemName: "chevron.forward")
                        // Retained icon-sizing exception: typography adoption covers text, not SF Symbol sizing.
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.tertiary)
                        .padding(.top, HermesSpacing.s4)
                }

                HStack(spacing: HermesSpacing.s8) {
                    if let delegationID = completion.delegationID {
                        Text(delegationID)
                            .appFont(.caption2, design: .monospaced)
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                    Spacer(minLength: 8)
                    Text("View results")
                        .appFont(.caption, weight: .semibold)
                        .foregroundStyle(.tint)
                }
                .padding(.top, HermesSpacing.s8)
                .overlay(alignment: .top) { Divider() }
            }
            .padding(HermesSpacing.s12)
            .contentShape(RoundedRectangle(cornerRadius: HermesRadius.card))
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: HermesRadius.card))
            .overlay {
                RoundedRectangle(cornerRadius: HermesRadius.card)
                    .stroke(.quaternary, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(summary)")
        .accessibilityHint("Opens the complete delegated work report.")
        .sheet(isPresented: $showingResults) {
            BotDelegationResultsSheet(completion: completion)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    private var title: String {
        if completion.taskCount == 1 {
            return completion.hasFailures
                ? String(localized: "1 worker finished")
                : String(localized: "1 worker completed")
        }
        return completion.hasFailures
            ? String(localized: "\(completion.taskCount) workers finished")
            : String(localized: "\(completion.taskCount) workers completed")
    }

    private var summary: String {
        var parts: [String] = []
        if completion.completedCount > 0 {
            parts.append(completion.completedCount == 1
                         ? String(localized: "1 succeeded")
                         : String(localized: "\(completion.completedCount) succeeded"))
        }
        if completion.failedCount > 0 {
            parts.append(completion.failedCount == 1
                         ? String(localized: "1 failed")
                         : String(localized: "\(completion.failedCount) failed"))
        }
        if let duration = completion.durationSeconds {
            parts.append(Duration.seconds(duration).formatted(
                .units(allowed: [.hours, .minutes, .seconds], width: .narrow, maximumUnitCount: 2)
            ))
        }
        return parts.joined(separator: " · ")
    }

    private var iconColor: Color { completion.hasFailures ? .orange : .green }
}

struct BotDelegationResultsSheet: View {
    let completion: BotDelegationCompletion
    @Environment(\.dismiss) private var dismiss
    @AppStorage(AppHaptics.isEnabledKey) private var isHapticsEnabled = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: HermesSpacing.s16) {
                    Label {
                        Text(summary)
                    } icon: {
                        Image(systemName: completion.hasFailures
                              ? "exclamationmark.triangle.fill"
                              : "checkmark.circle.fill")
                            .foregroundStyle(completion.hasFailures ? .orange : .green)
                    }
                    .appFont(.subheadline, weight: .semibold)

                    if let delegationID = completion.delegationID {
                        Text(delegationID)
                            .appFont(.caption, design: .monospaced)
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                    }

                    Divider()

                    if completion.report.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        ContentUnavailableView {
                            Label("No report", systemImage: "doc.text")
                        } description: {
                            Text("Hermes recorded this completion without a result body.")
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        MarkdownRenderer(content: completion.report)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(HermesSpacing.s16)
            }
            .navigationTitle("Delegated work")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                TopNav(
                    leadingPlacement: .cancellationAction,
                    trailingPlacement: .primaryAction,
                    leadingPrimary: { Button("Done") { dismiss() } },
                    trailingPrimary: {
                        Button {
                            UIPasteboard.general.string = completion.report
                            ChatHaptics.copied(isEnabled: isHapticsEnabled)
                        } label: {
                            Label("Copy", systemImage: "doc.on.doc")
                        }
                        .accessibilityLabel("Copy")
                        .disabled(completion.report.isEmpty)
                    }
                )
            }
        }
    }

    private var summary: String {
        var parts: [String] = []
        if completion.completedCount > 0 {
            parts.append(completion.completedCount == 1
                         ? String(localized: "1 succeeded")
                         : String(localized: "\(completion.completedCount) succeeded"))
        }
        if completion.failedCount > 0 {
            parts.append(completion.failedCount == 1
                         ? String(localized: "1 failed")
                         : String(localized: "\(completion.failedCount) failed"))
        }
        if let duration = completion.durationSeconds {
            parts.append(Duration.seconds(duration).formatted(
                .units(allowed: [.hours, .minutes, .seconds], width: .narrow, maximumUnitCount: 2)
            ))
        }
        return parts.joined(separator: " · ")
    }
}
