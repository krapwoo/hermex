import SwiftUI

struct OnboardingAgentPromptPage: View {
    @Binding var hasCopiedAgentPrompt: Bool

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: HermesSpacing.s32) {
                OnboardingStepHeader(
                    stepNumber: 1,
                    icon: "terminal",
                    title: String(localized: "Set up Hermes Web UI"),
                    description: String(localized: "Send this prompt to your Hermes Agent. It audits existing state, keeps Hermes Web UI on localhost, and configures private HTTPS with Tailscale Serve.")
                )

                OnboardingAgentPromptCard(
                    prompt: OnboardingFlowPolicy.agentSetupPrompt,
                    hasCopied: $hasCopiedAgentPrompt
                )
            }
            .padding(.horizontal, HermesSpacing.screenHorizontal)
            .padding(.top, HermesSpacing.s24)
            .padding(.bottom, HermesSpacing.s16)
        }
        .scrollBounceBehavior(.basedOnSize)
    }
}
