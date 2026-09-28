import SwiftUI

struct OnboardingTailscalePage: View {
    @Environment(\.openURL) private var openURL

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: HermesSpacing.s32) {
                OnboardingStepHeader(
                    stepNumber: 2,
                    icon: "iphone.and.arrow.forward",
                    title: String(localized: "Install Tailscale on iPhone"),
                    description: String(localized: "Install Tailscale on your iPhone and sign into the same tailnet as your server. Your agent will reply with the exact URL to use on the next screen.")
                )

                VStack(alignment: .leading, spacing: HermesSpacing.s16) {
                    tailscaleStep(number: "1", text: String(localized: "Install Tailscale from the App Store."))
                    tailscaleStep(number: "2", text: String(localized: "Sign in with the same account you used on your server."))
                    tailscaleStep(number: "3", text: String(localized: "Keep Tailscale connected while using Hermex."))

                    Button(action: openTailscaleInAppStore) {
                        Label("Get Tailscale on the App Store", systemImage: "arrow.up.forward.square")
                            .appFont(.subheadlineSemibold)
                            .foregroundStyle(Color(red: 1.0, green: 0.74, blue: 0.10))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, HermesSpacing.s16)
                            .padding(.vertical, HermesSpacing.s12)
                            .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous)
                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint("Opens the Tailscale page in the App Store.")
                }
            }
            .padding(.horizontal, HermesSpacing.screenHorizontal)
            .padding(.top, HermesSpacing.s24)
            .padding(.bottom, HermesSpacing.s16)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    private func openTailscaleInAppStore() {
        openURL(OnboardingFlowPolicy.tailscaleAppStoreURL, completion: { accepted in
            guard !accepted else { return }
            openURL(OnboardingFlowPolicy.tailscaleAppStoreFallbackURL)
        })
    }

    private func tailscaleStep(number: String, text: String) -> some View {
        HStack(alignment: .top, spacing: HermesSpacing.s12) {
            Text(number)
                .appFont(.captionSemibold)
                .foregroundStyle(.black)
                .frame(width: 23, height: 23)
                .background(Color(red: 1.0, green: 0.74, blue: 0.10), in: Circle())

            Text(text)
                .appFont(.subheadline)
                .foregroundStyle(.white.opacity(0.72))
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }
}
