import SwiftUI

@MainActor struct BotRoomCreateView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State var creator: BotRoomCreator
    @State private var naming = false
    @FocusState private var focused: Field?
    private enum Field { case members, name }
    let avatars: [String: UIImage]
    let onCreated: (BotGroupRoom) -> Void

    var body: some View {
        NavigationStack {
            Group {
                if naming { nameStep }
                else { membersStep }
            }
            .navigationTitle("New Group Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                TopNav(
                    leadingPlacement: .cancellationAction,
                    trailingPlacement: .confirmationAction,
                    leadingPrimary: {
                        Button(naming && !creator.locked ? "Back" : "Cancel",
                               systemImage: naming && !creator.locked ? "chevron.backward" : "xmark") {
                            if naming && !creator.locked { naming = false; focused = .members }
                            else { dismiss() }
                        }
                    },
                    trailingPrimary: {
                        if !naming {
                            Button("Next") { naming = true; focused = .name }
                                .disabled(!creator.mayContinue)
                        }
                    }
                )
            }
            .task { focused = .members }
            .onChange(of: creator.created) {
                if let room = creator.created { onCreated(room); dismiss() }
            }
            .onChange(of: scenePhase) { if scenePhase != .active { creator.suspend() } }
            .onDisappear { creator.suspend() }
        }
        .interactiveDismissDisabled(creator.busy)
    }

    private var membersStep: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: HermesSpacing.s12) {
                    Text("To:").foregroundStyle(.secondary)
                    if !creator.selected.isEmpty {
                        ViewThatFits(in: .horizontal) {
                            chips
                            VStack(alignment: .leading, spacing: HermesSpacing.s8) {
                                ForEach(creator.selected) { bot in chip(bot) }
                            }
                        }
                    }
                    TextField("Add another", text: $creator.query)
                        .focused($focused, equals: .members)
                        .autocorrectionDisabled().textInputAutocapitalization(.never)
                        .accessibilityLabel("Find group members")
                }
                .padding(.vertical, HermesSpacing.s8)
            } footer: {
                if creator.selected.count == 6 { Text("Groups can have up to six members.") }
                else { Text("Choose two to six bots.") }
            }
            Section {
                ForEach(creator.remaining) { bot in
                    Button { creator.select(bot) } label: {
                        HStack(spacing: HermesSpacing.s16) {
                            BotAvatarView(profile: bot, avatar: avatars[bot.id], size: 36, motion: .still)
                            Text(bot.name).foregroundStyle(.primary)
                        }
                        .padding(.vertical, HermesSpacing.s8)
                    }
                    .disabled(creator.selected.count >= 6)
                    .accessibilityLabel("Add \(bot.name)")
                }
            }
        }
        .listStyle(.insetGrouped)
    }
    private var chips: some View {
        HStack(spacing: HermesSpacing.s8) { ForEach(creator.selected) { bot in chip(bot) } }
            .fixedSize(horizontal: true, vertical: false)
    }
    private func chip(_ bot: BotProfile) -> some View {
        Button { creator.remove(bot) } label: {
            HStack(spacing: HermesSpacing.s8) {
                BotAvatarView(profile: bot, avatar: avatars[bot.id], size: 24, motion: .still)
                Text(bot.name)
                Image(systemName: "xmark").font(.caption)
            }
            .padding(HermesSpacing.s8).background(.quaternary, in: Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Remove \(bot.name)")
    }
    private var nameStep: some View {
        ScrollView {
            VStack(spacing: HermesSpacing.s24) {
                BotRoomAvatars(room: creator.preview, roster: creator.roster, avatars: avatars, size: 84)
                    .padding(.top, HermesSpacing.s48)
                TextField("Group name", text: $creator.name)
                    .appFont(.title2, weight: .bold).multilineTextAlignment(.center)
                    .padding(HermesSpacing.s20).background(.quaternary, in: RoundedRectangle(cornerRadius: HermesRadius.r20))
                    .focused($focused, equals: .name).disabled(creator.locked)
                    .submitLabel(.done)
                    .onSubmit { if creator.mayCreate { Task { await creator.create() } } }
                if !BotRoomRPC.validName(creator.name) {
                    Text("Enter a name of up to 200 characters.").appFont(.caption).foregroundStyle(.secondary)
                }
                if let message = creator.message { Text(message).appFont(.body) }
                Button(creator.busy ? "Creating…" : creator.locked ? "Try Again" : "Create") {
                    focused = nil
                    Task { await creator.create() }
                }
                .buttonStyle(.borderedProminent).controlSize(.large)
                .disabled(!creator.mayCreate)
            }
            .padding(HermesSpacing.s20)
        }
    }
}
