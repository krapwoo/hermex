import SwiftUI
import UIKit

struct ApprovalRequestOverlay: View {
    let prompt: ApprovalPromptState
    let isResponding: Bool
    let errorMessage: String?
    let onChoice: (ApprovalChoice) -> Void
    let onSkipAll: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.38)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: HermesSpacing.s16) {
                header
                details
                actions
            }
            .padding(HermesCardMetrics.contentPadding)
            .frame(maxWidth: 520, alignment: .leading)
            .requestCardSurface(cornerRadius: HermesRadius.r16, material: .translucentOverScrim)
            .hermesShadow(.overlay)
            .padding(.horizontal, HermesSpacing.s20)
        }
        .accessibilityElement(children: .contain)
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline, spacing: HermesSpacing.s12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.yellow)

            VStack(alignment: .leading, spacing: HermesSpacing.s4) {
                Text("Approval required")
                    .appFont(.headline)

                Text("Pending approvals: \(prompt.pendingCount)")
                    .appFont(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s12) {
            if let description = nonEmpty(prompt.pending.description) {
                Text(description)
                    .appFont(.subheadline)
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let command = nonEmpty(prompt.pending.command) {
                ScrollView(.horizontal, showsIndicators: false) {
                    Text(command)
                        .appFont(.footnote, design: .monospaced)
                        .textSelection(.enabled)
                        .padding(HermesSpacing.s12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(Color(uiColor: .secondarySystemBackground), in: RoundedRectangle(cornerRadius: HermesRadius.r8))
            }

            if !prompt.patternKeys.isEmpty {
                VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                    Text("Pattern keys")
                        .appFont(.caption)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                        ForEach(prompt.patternKeys, id: \.self) { key in
                            Text(key)
                                .appFont(.caption2, design: .monospaced)
                                .padding(.horizontal, HermesSpacing.s8)
                                .padding(.vertical, HermesSpacing.s4)
                                .background(Color(uiColor: .tertiarySystemBackground), in: Capsule())
                        }
                    }
                }
            }

            if prompt.pendingCount > 1 {
                Text("1 of \(prompt.pendingCount) pending")
                    .appFont(.caption)
                    .foregroundStyle(.secondary)
            }

            if let errorMessage = nonEmpty(errorMessage) {
                Text(errorMessage)
                    .appFont(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    private var actions: some View {
        VStack(spacing: HermesSpacing.s8) {
            HStack(spacing: HermesSpacing.s8) {
                approvalButton("Allow once", systemImage: "checkmark.circle.fill", choice: .once, prominent: true)
                approvalButton("Allow session", systemImage: "lock.open", choice: .session, prominent: false)
            }

            HStack(spacing: HermesSpacing.s8) {
                approvalButton("Always allow", systemImage: "star.fill", choice: .always, prominent: false)
                approvalButton("Deny", systemImage: "xmark.circle.fill", choice: .deny, prominent: false, role: .destructive)
            }

            Button {
                onSkipAll()
            } label: {
                Label("Skip all this session", systemImage: "bolt.slash")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.hermes(.medium, emphasis: .secondary))
            .disabled(isResponding)
        }
    }

    @ViewBuilder
    private func approvalButton(
        _ title: String,
        systemImage: String,
        choice: ApprovalChoice,
        prominent: Bool,
        role: ButtonRole? = nil
    ) -> some View {
        if prominent {
            Button(role: role) {
                onChoice(choice)
            } label: {
                Label(title, systemImage: systemImage)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.hermes(.medium, emphasis: .primary))
            .disabled(isResponding)
        } else {
            Button(role: role) {
                onChoice(choice)
            } label: {
                Label(title, systemImage: systemImage)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.hermes(.medium, emphasis: role == .destructive ? .destructive : .secondary))
            .disabled(isResponding)
        }
    }

    private func nonEmpty(_ value: String?) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed?.isEmpty == false ? trimmed : nil
    }
}

struct ApprovalBypassStatusPill: View {
    var body: some View {
        Label("Approval bypass active", systemImage: "bolt.slash.fill")
            .appFont(.caption, weight: .semibold)
            .padding(.horizontal, HermesSpacing.s12)
            .padding(.vertical, HermesSpacing.s8)
            .background(.regularMaterial, in: Capsule())
            .overlay(
                Capsule()
                    .stroke(.primary.opacity(0.10), lineWidth: 1)
            )
            .hermesShadow(.controlElevatedPressed)
    }
}
