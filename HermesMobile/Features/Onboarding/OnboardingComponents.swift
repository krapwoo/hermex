import SwiftUI
import UIKit

struct HeroBadge: View {
    let systemImage: String
    let title: String

    var body: some View {
        Label(title, systemImage: systemImage)
            .appFont(.caption, weight: .medium)
            .foregroundStyle(.white.opacity(0.68))
            .padding(.horizontal, HermesSpacing.s12)
            .padding(.vertical, HermesSpacing.s8)
            .background(Color.white.opacity(0.06), in: Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.08), lineWidth: 1))
    }
}

struct SetupStepRow: View {
    let number: String
    let title: String
    let subtitle: String
    var command: String?
    var commandPrefix: String? = "$"
    var copyValue: String?

    var body: some View {
        HStack(alignment: .top, spacing: HermesSpacing.s12) {
            Text(number)
                .appFont(.caption, weight: .bold)
                .foregroundStyle(.black)
                .frame(width: 23, height: 23)
                .background(Color(red: 1.0, green: 0.74, blue: 0.10), in: Circle())
                .padding(.top, HermesSpacing.s2)

            VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                Text(title)
                    .appFont(.subheadline, weight: .semibold)
                    .foregroundStyle(.white)

                Text(subtitle)
                    .appFont(.footnote)
                    .foregroundStyle(.white.opacity(0.5))
                    .fixedSize(horizontal: false, vertical: true)

                if let command {
                    OnboardingCommandPill(text: command, prefix: commandPrefix, copyValue: copyValue)
                }
            }
        }
    }
}

struct OnboardingCommandPill: View {
    let text: String
    var prefix: String? = "$"
    var copyValue: String?
    @State private var didCopy = false
    @AppStorage(AppHaptics.isEnabledKey) private var isHapticsEnabled = true

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            HStack(spacing: HermesSpacing.s0) {
                if let prefix {
                    Text("\(prefix) ")
                        .foregroundStyle(.white.opacity(0.28))
                }

                Text(text)
                    .foregroundStyle(.white.opacity(0.78))
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let copyValue {
                Button {
                    UIPasteboard.general.string = copyValue
                    didCopy = true
                    ChatHaptics.copied(isEnabled: isHapticsEnabled)
                } label: {
                    Image(systemName: didCopy ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(didCopy ? Color(red: 0.45, green: 0.92, blue: 0.56) : .white.opacity(0.76))
                        .frame(width: 28, height: 28)
                        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityLabel(didCopy ? String(localized: "Copied Web UI repository link") : String(localized: "Copy Web UI repository link"))
            }
        }
        .appFont(.caption, weight: .medium, design: .monospaced)
        .padding(.horizontal, HermesSpacing.s12)
        .padding(.vertical, HermesSpacing.s8)
        .background(
            RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                .fill(Color.white.opacity(0.055))
        )
        .overlay(
            RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct OnboardingField<Content: View>: View {
    let systemImage: String
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            Image(systemName: systemImage)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color(red: 1.0, green: 0.74, blue: 0.10))
                .frame(width: 24)

            VStack(alignment: .leading, spacing: HermesSpacing.s4) {
                Text(title)
                    .appFont(.caption, weight: .semibold)
                    .foregroundStyle(.white.opacity(0.5))

                content
                    .appFont(.body, weight: .medium)
                    .foregroundStyle(.white)
            }
        }
        .padding(.horizontal, HermesSpacing.s12)
        .padding(.vertical, HermesSpacing.s12)
        .background(Color.black.opacity(0.24), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }
}

struct OnboardingStatusBanner: View {
    let text: String
    let systemImage: String
    let tint: Color
    var showsProgress = false

    var body: some View {
        HStack(alignment: .top, spacing: HermesSpacing.s12) {
            if showsProgress {
                ProgressView()
                    .tint(tint)
                    .padding(.top, HermesSpacing.s2)
            } else {
                Image(systemName: systemImage)
                    .foregroundStyle(tint)
                    .padding(.top, HermesSpacing.s2)
            }

            Text(text)
                .appFont(.footnote, weight: .medium)
                .foregroundStyle(.white.opacity(0.76))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, HermesSpacing.s12)
        .padding(.vertical, HermesSpacing.s12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                .stroke(tint.opacity(0.18), lineWidth: 1)
        )
    }
}

struct OnboardingPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .appFont(.subheadline, weight: .semibold)
            .foregroundStyle(.black)
            .lineLimit(1)
            .minimumScaleFactor(0.78)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, HermesSpacing.s12)
            .padding(.vertical, HermesSpacing.s16)
            .background(Color(red: 1.0, green: 0.74, blue: 0.10), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
            .opacity(configuration.isPressed ? 0.78 : 1)
    }
}

struct OnboardingStepHeader: View {
    let stepNumber: Int
    let icon: String
    let title: String
    let description: String

    private let accent = Color(red: 1.0, green: 0.74, blue: 0.10)

    var body: some View {
        VStack(spacing: HermesSpacing.s20) {
            Image(systemName: icon)
                .font(.system(size: 30, weight: .light))
                .foregroundStyle(.white)
                .frame(width: 80, height: 80)
                .background(
                    RoundedRectangle(cornerRadius: HermesRadius.r24, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: HermesRadius.r24, style: .continuous)
                        .stroke(accent.opacity(0.35), lineWidth: 1)
                )
                .accessibilityHidden(true)

            VStack(spacing: HermesSpacing.s12) {
                Text("STEP \(stepNumber)")
                    .appFont(.caption2, weight: .bold)
                    .foregroundStyle(accent.opacity(0.8))
                    .kerning(1.5)

                Text(title)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                Text(description)
                    .appFont(.subheadline)
                    .foregroundStyle(.white.opacity(0.45))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
        }
    }
}

struct OnboardingAgentPromptCard: View {
    let prompt: String
    @Binding var hasCopied: Bool
    @State private var didCopyRecently = false
    @AppStorage(AppHaptics.isEnabledKey) private var isHapticsEnabled = true

    var body: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s12) {
            ScrollView(.vertical, showsIndicators: true) {
                Text(prompt)
                    .appFont(.footnote, design: .monospaced)
                    .foregroundStyle(.white.opacity(0.82))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .textSelection(.enabled)
            }
            .frame(maxHeight: 220)

            Button {
                UIPasteboard.general.string = prompt
                hasCopied = true
                ChatHaptics.copied(isEnabled: isHapticsEnabled)
                withAnimation(.easeInOut(duration: HermesMotion.Duration.d200)) {
                    didCopyRecently = true
                }
            } label: {
                Label(didCopyRecently ? String(localized: "Copied") : String(localized: "Copy prompt"), systemImage: didCopyRecently ? "checkmark" : "doc.on.doc")
                    .appFont(.subheadline, weight: .semibold)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(OnboardingPrimaryButtonStyle())
            .accessibilityLabel(didCopyRecently ? String(localized: "Agent setup prompt copied") : String(localized: "Copy agent setup prompt"))
        }
        .padding(HermesSpacing.s16)
        .background(
            RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                .fill(Color.white.opacity(0.055))
        )
        .overlay(
            RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

struct OnboardingPageIndicator: View {
    let pageCount: Int
    let currentPage: Int

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: HermesSpacing.s8) {
            ForEach(0..<pageCount, id: \.self) { index in
                Capsule()
                    .fill(index == currentPage ? Color.white : Color.white.opacity(0.18))
                    .frame(width: index == currentPage ? 24 : 8, height: 8)
            }
        }
        .animation(reduceMotion ? nil : .spring(response: 0.35, dampingFraction: 0.8), value: currentPage)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(String(localized: "Page \(currentPage + 1) of \(pageCount)"))
    }
}

struct OnboardingSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .appFont(.subheadline, weight: .semibold)
            .foregroundStyle(.white.opacity(0.84))
            .lineLimit(1)
            .minimumScaleFactor(0.78)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, HermesSpacing.s12)
            .padding(.vertical, HermesSpacing.s16)
            .background(Color.white.opacity(0.065), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .opacity(configuration.isPressed ? 0.72 : 1)
    }
}
