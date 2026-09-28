#if DEBUG
import SwiftUI

/// Debug-only Streaming Lab (issue #234): replays a canned markdown fixture
/// through the real display pipeline (`MarkdownRenderer(content:isStreaming:)`
/// → chunked streaming view → fade window) while the fade knobs are tuned
/// live via `StreamingTextFadeLab`. No server, deterministic content.
struct StreamingLabView: View {
    @State private var displayedContent = ""
    @State private var isStreaming = false
    @State private var replayID = 0
    @State private var followsTail = true
    // Surfaced here because the user setting silently disables every fade
    // knob below — invisible state the lab must make visible (see the #232
    // textSelection dead-cascade hunt).
    @AppStorage(StreamedTextAnimationSettings.isEnabledKey) private var isStreamedTextAnimationEnabled = true

    @State private var wordsPerSecond = StreamingLabReplay.defaultWordsPerSecond
    @State private var fadeDuration = StreamingTextFadeLab.shared.fadeDuration
    @State private var glyphStagger = StreamingTextFadeLab.shared.glyphStagger
    @State private var maxStampLead = StreamingTextFadeLab.shared.maxStampLead

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: HermesSpacing.s16) {
                    controls
                    Divider()
                    transcript
                    Color.clear
                        .frame(height: 1)
                        .id(Self.tailAnchorID)
                }
                .padding(HermesSpacing.s16)
            }
            .onChange(of: displayedContent) { _, _ in
                guard followsTail else { return }
                proxy.scrollTo(Self.tailAnchorID, anchor: .bottom)
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle(Text(verbatim: "Streaming Lab"))
        .navigationBarTitleDisplayMode(.inline)
        .task(id: replayID) {
            await replayFixture()
        }
    }

    private static let tailAnchorID = "streaming-lab-tail"

    private var controls: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s16) {
            HStack(spacing: HermesSpacing.s12) {
                Button {
                    replayID += 1
                } label: {
                    Label { Text(verbatim: "Restart") } icon: { Image(systemName: "arrow.counterclockwise") }
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)

                Button {
                    StreamingTextFadeLab.shared.reset()
                    fadeDuration = StreamingTextFadeDefaults.Baseline.fadeDuration
                    glyphStagger = StreamingTextFadeDefaults.Baseline.glyphStagger
                    maxStampLead = StreamingTextFadeDefaults.Baseline.maxStampLead
                } label: {
                    Label { Text(verbatim: "Reset Knobs") } icon: { Image(systemName: "slider.horizontal.2.arrow.trianglehead.counterclockwise") }
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }

            Toggle(isOn: $followsTail) { Text(verbatim: "Follow tail while streaming") }
                .appFont(.subheadline)

            Toggle(isOn: $isStreamedTextAnimationEnabled) { Text(verbatim: "Streamed text animation (user setting)") }
                .appFont(.subheadline)

            if !isStreamedTextAnimationEnabled {
                Text(verbatim: "Animation is off — the knobs below have no visible effect until it's re-enabled.")
                    .appFont(.caption)
                    .foregroundStyle(.orange)
            }

            knobSlider(
                title: "Stream speed",
                value: $wordsPerSecond,
                range: StreamingLabReplay.minWordsPerSecond...StreamingLabReplay.maxWordsPerSecond,
                display: String(format: "%.0f words/s", wordsPerSecond)
            )

            knobSlider(
                title: "fadeDuration",
                value: $fadeDuration,
                range: 0.05...1.0,
                display: String(format: "%.2f s", fadeDuration)
            )
            .onChange(of: fadeDuration) { _, newValue in
                StreamingTextFadeLab.shared.fadeDuration = newValue
            }

            knobSlider(
                title: "glyphStagger",
                value: $glyphStagger,
                range: 0...0.06,
                display: String(format: "%.0f ms", glyphStagger * 1000)
            )
            .onChange(of: glyphStagger) { _, newValue in
                StreamingTextFadeLab.shared.glyphStagger = newValue
            }

            knobSlider(
                title: "maxStampLead",
                value: $maxStampLead,
                range: 0...1.5,
                display: String(format: "%.2f s", maxStampLead)
            )
            .onChange(of: maxStampLead) { _, newValue in
                StreamingTextFadeLab.shared.maxStampLead = newValue
            }

            knobReadout
        }
    }

    private func knobSlider(
        title: String,
        value: Binding<Double>,
        range: ClosedRange<Double>,
        display: String
    ) -> some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s2) {
            HStack {
                Text(title)
                    .appFont(.subheadlineSemibold)

                Spacer()

                Text(display)
                    .appFont(.caption)
                    .foregroundStyle(.secondary)
            }

            Slider(value: value, in: range)
        }
    }

    /// Paste-ready values for `StreamingTextFadeDefaults` once a feel is
    /// chosen (the lab never persists anything across launches).
    private var knobReadout: some View {
        Text(
            verbatim: """
            static let fadeDuration: TimeInterval = \(String(format: "%.3f", fadeDuration))
            static let glyphStagger: TimeInterval = \(String(format: "%.3f", glyphStagger))
            static let maxStampLead: TimeInterval = \(String(format: "%.3f", maxStampLead))
            """
        )
        .appFont(.mono12)
        .foregroundStyle(.secondary)
        .textSelection(.enabled)
        .padding(HermesSpacing.s12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }

    private var transcript: some View {
        MarkdownRenderer(content: displayedContent, isStreaming: isStreaming)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Local word-cadence appender standing in for the server stream: reveals
    /// the fixture unit-by-unit at the production tick interval, with the
    /// speed slider scaling how many units each tick deposits.
    private func replayFixture() async {
        displayedContent = ""
        isStreaming = true

        let fixture = StreamingLabReplay.fixture
        let totalUnits = StreamingLabReplay.fixtureUnitCount
        var revealed = 0
        var carry = 0.0

        while revealed < totalUnits {
            try? await Task.sleep(for: .seconds(StreamingLabReplay.tickInterval))
            guard !Task.isCancelled else { return }

            (revealed, carry) = StreamingLabReplay.advance(
                revealed: revealed,
                carry: carry,
                wordsPerSecond: wordsPerSecond
            )
            revealed = min(revealed, totalUnits)
            displayedContent = StreamingLabReplay.prefix(of: fixture, unitCount: revealed)
        }

        // A cancelled replay must not flip the flag: on restart the new task
        // has already set `isStreaming = true` and this would end its fade.
        guard !Task.isCancelled else { return }
        isStreaming = false
    }
}

#Preview {
    NavigationStack {
        StreamingLabView()
    }
}

/// Debug-only visual fixture (token-adoption evidence capture): renders the
/// complete `AppFont.Role` matrix, a privacy-safe copy of the session list's
/// elevated Chat control, and the production Attachment family so they can be
/// screenshotted without an authenticated server or real session data.
struct ProductionTokenEvidenceLabView: View {
    private static let chatControlID = "production-token-evidence-chat-control"
    private static let attachmentID = "production-token-evidence-attachments"

    /// Visual order only (largest role first); `AppFontModifierBuildProofTests`
    /// proves this set matches `AppFont.Role.allCases` with no omissions or
    /// duplicates.
    static let fontRoleSamples: [(role: AppFont.Role, label: String)] = [
        (.title, "title"),
        (.title2, "title2"),
        (.title3, "title3"),
        (.headlineSemibold, "headlineSemibold"),
        (.headline, "headline"),
        (.label, "label"),
        (.body, "body"),
        (.mono14, "mono14"),
        (.subheadlineSemibold, "subheadlineSemibold"),
        (.subheadline, "subheadline"),
        (.mono12, "mono12"),
        (.captionSemibold, "captionSemibold"),
        (.footnote, "footnote"),
        (.caption, "caption"),
        (.caption2, "caption2"),
    ]

    static var fontRoleOrder: [AppFont.Role] { fontRoleSamples.map(\.role) }

    @Environment(\.colorScheme) private var colorScheme
    private let scrollsToShadowOnLaunch: Bool
    private let scrollsToAttachmentsOnLaunch: Bool

    init(
        scrollsToShadowOnLaunch: Bool = false,
        scrollsToAttachmentsOnLaunch: Bool = false
    ) {
        self.scrollsToShadowOnLaunch = scrollsToShadowOnLaunch
        self.scrollsToAttachmentsOnLaunch = scrollsToAttachmentsOnLaunch
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: HermesSpacing.s24) {
                    fontRoleMatrix
                    Divider()
                    chatControlSpecimen
                        .id(Self.chatControlID)
                    Divider()
                    attachmentSpecimen
                        .id(Self.attachmentID)
                }
                .padding(HermesSpacing.s16)
            }
            .task {
                guard scrollsToShadowOnLaunch || scrollsToAttachmentsOnLaunch else { return }
                await Task.yield()
                proxy.scrollTo(
                    scrollsToAttachmentsOnLaunch ? Self.attachmentID : Self.chatControlID,
                    anchor: .bottom
                )
            }
        }
        .background(Color(.systemBackground))
        .navigationTitle("Token Evidence")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var fontRoleMatrix: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s12) {
            Text("AppFont.Role matrix")
                .appFont(.headlineSemibold)

            ForEach(Self.fontRoleSamples, id: \.role) { sample in
                Text(sample.label)
                    .appFont(sample.role)
            }
        }
    }

    /// Same visible structure and modifiers as `SessionListView.newSessionButton`
    /// (square-and-pencil icon, "Chat" headline, `sessionsChromeGlass`,
    /// `SessionListFloatingChatButtonStyle`), with a neutral tint instead of
    /// the server-configured theme color and generous non-black surrounding
    /// space so the resting shadow penumbra is observable.
    private var chatControlSpecimen: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s12) {
            Text("Elevated Chat control (resting shadow)")
                .appFont(.headlineSemibold)

            HapticButton(feedbackStyle: .medium) {} label: {
                HStack(spacing: HermesSpacing.s12) {
                    Image(systemName: "square.and.pencil")
                        .font(.title3.weight(.semibold))

                    Text("Chat")
                        .appFont(.headlineSemibold)
                }
                .foregroundStyle(colorScheme == .dark ? .black : .white)
                .padding(.horizontal, HermesSpacing.s24)
                .frame(height: 58)
                .contentShape(Capsule())
                .sessionsChromeGlass(
                    isInteractive: true,
                    tint: colorScheme == .dark ? .white : .black,
                    fallbackMaterial: .regularMaterial,
                    in: Capsule()
                )
            }
            .buttonStyle(SessionListFloatingChatButtonStyle())
            .padding(HermesSpacing.s48)
            .frame(maxWidth: .infinity, alignment: .center)
            .background(
                RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                    .fill(Color(.secondarySystemBackground))
            )
        }
    }

    private var attachmentSpecimen: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s16) {
            Text("Attachment family")
                .appFont(.headlineSemibold)

            HStack(alignment: .top, spacing: HermesSpacing.s24) {
                VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                    Text("Message file")
                        .appFont(.caption)
                        .foregroundStyle(Color(.secondaryLabel))
                    AttachmentMessageTileEvidenceView()
                }

                VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                    Text("Loading image")
                        .appFont(.caption)
                        .foregroundStyle(Color(.secondaryLabel))
                    AttachmentImageTileSurface(
                        width: HermesAttachmentSize.messageGridCell,
                        height: HermesAttachmentSize.messageGridCell,
                        cornerRadius: HermesRadius.r16
                    ) {
                        AttachmentLoadingTile()
                    }
                }
            }

            Text("Composer previews")
                .appFont(.caption)
                .foregroundStyle(Color(.secondaryLabel))

            ComposerAttachmentStripView(
                attachments: Self.attachmentSamples,
                onRemove: { _ in },
                onPreview: { _ in }
            )
        }
    }

    private static let attachmentSamples: [PendingAttachment] = [
        PendingAttachment(
            id: UUID(uuidString: "A7C38F5A-1257-46B3-8D1A-405E285B3188")!,
            name: "quarterly-report.pdf",
            path: "fixture/quarterly-report.pdf",
            mime: "application/pdf",
            size: 2_100_000,
            isImage: false
        ),
        PendingAttachment(
            id: UUID(uuidString: "EEC3040D-9324-44AA-8908-20291964BD0E")!,
            name: "workspace-preview.png",
            path: "fixture/workspace-preview.png",
            mime: "image/png",
            size: 480_000,
            isImage: true
        ),
    ]
}

#Preview {
    NavigationStack {
        ProductionTokenEvidenceLabView()
    }
}
#endif
