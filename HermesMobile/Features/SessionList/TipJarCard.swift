import SwiftUI

struct TipJarCard: View {

    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var greetingPhase = TipJarGreetingState.Phase.neutral

    @State private var isVisible = false
    @AppStorage(TipJar.dismissedKey) private var dismissed = false

    private var canAnimate: Bool {
        isVisible && scenePhase == .active && !reduceMotion && !dismissed
    }

    var body: some View {
        SectionCard(surface: .outlined) {
            VStack(alignment: .leading, spacing: HermesSpacing.s12) {
                HStack(spacing: HermesSpacing.s12) {
                    companion
                    Text("Enjoying Hermex?")
                        .appFont(.headline)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text("It's free and open source. If it's earned a coffee, that would mean a lot.")
                    .appFont(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                if dynamicTypeSize.isAccessibilitySize {
                    VStack(alignment: .leading, spacing: HermesSpacing.s8) { actions }
                } else {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: HermesSpacing.s16) { actions }
                        VStack(alignment: .leading, spacing: HermesSpacing.s8) { actions }
                    }
                }
            }
        }
        .padding(.vertical, HermesSpacing.s12)
        .onAppear {
            isVisible = true
            RatingPromptState.shared.recordTipCardShown()
        }
        .onDisappear { isVisible = false }
        .task(id: canAnimate) {
            guard isVisible, scenePhase == .active, !dismissed else { return }
            await TipJarGreetingState.shared.play(reduceMotion: reduceMotion) { greetingPhase = $0 }
        }
    }

    private var companion: some View {
        face(canAnimate ? greetingPhase : .neutral)
    }

    private func face(_ phase: TipJarGreetingState.Phase) -> some View {
        let expression: String
        switch phase {
        case .curious: expression = "curious"
        case .happy: expression = "happy"
        default: expression = "neutral"
        }
        let pose: BotFacePose
        switch phase {
        case .blink: pose = .blink
        case .hop: pose = BotFacePose(lift: 0.14, scaleX: 0.96, scaleY: 1.04)
        case .glanceDown: pose = BotFacePose(gazeY: 0.09)
        default: pose = .rest
        }
        let appearance = BotProfileAppearance(
            look: ["shape": .string("circle"), "color": .string(HermesColorRamp.Gold.s400.hex.lowercased()),
                   "expression": .string(expression)],
            fallbackTitle: "Hermex"
        )
        return BotAvatarMarkView(name: "Hermex", appearance: appearance,
                                 size: HermesAvatarSize.large.rawValue,
                                 pose: pose)
            .animation(canAnimate ? .easeInOut(duration: HermesMotion.Duration.d200) : nil, value: phase)
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var actions: some View {
        Link(destination: AppConfig.tipURL) {
            Text("Buy Uzi a coffee")
                .fixedSize(horizontal: false, vertical: true)
        }
        .appFont(.subheadlineSemibold)
        .buttonStyle(.hermes(.medium, emphasis: .brandPrimary))
        .accessibilityLabel("Buy Uzi a coffee, opens in browser")
        .environment(\.openURL, OpenURLAction { url in
            TipJarPromptState(defaults: .standard).recordLinkOpened()
            return .systemAction(url)
        })
        Button("Not now") {
            TipJarPromptState(defaults: .standard).dismiss()
        }
        .buttonStyle(.hermes(.medium, emphasis: .neutral))
    }
}
