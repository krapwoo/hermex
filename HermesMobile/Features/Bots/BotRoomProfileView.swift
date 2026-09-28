import SwiftUI

@MainActor struct BotRoomProfileView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Bindable var reader: BotRoomReader
    let roster: [BotProfile]
    let avatars: [String: UIImage]
    @State private var name = ""
    @State private var confirmingDisband = false
    @State private var visible = false
    @State private var owner = UUID()
    @State private var revision = UUID()
    @FocusState private var editingName: Bool

    var body: some View {
        List {
            Section {
                VStack(spacing: HermesSpacing.s24) {
                    BotRoomAvatars(room: reader.room, roster: roster, avatars: avatars, size: 84)
                    if reader.showsRename {
                        TextField("Group name", text: $name)
                            .appFont(.title2).multilineTextAlignment(.center)
                            .focused($editingName).submitLabel(.done)
                            .disabled(!reader.mayRename)
                            .onSubmit { commitName() }
                        if name != reader.room.name {
                            Button("Save name") { commitName() }
                                .disabled(!reader.mayRename || !BotRoomRPC.validName(name))
                        }
                        if !BotRoomRPC.validName(name) {
                            Text("Enter a name of up to 200 characters.").appFont(.caption)
                        }
                    } else { Text(reader.room.name).appFont(.title2) }
                }
                .frame(maxWidth: .infinity).padding(.vertical, HermesSpacing.s24)
            }
            Section {
                ForEach(reader.room.members) { member in
                    if let profile = roster.first(where: { $0.id == member.profile }) {
                        NavigationLink {
                            BotProfileEditorView(server: reader.key.server, connection: reader.connection,
                                                 profile: profile, avatar: avatars[profile.id])
                        } label: { memberRow(member) }
                    } else { memberRow(member) }
                }
            }
            if reader.foreignAuthority { Text("Managed by another Hermes").appFont(.body) }
            if let message = reader.commandMessage { Text(message).appFont(.body) }
            if reader.finishingStop { Text("Finishing stop…").appFont(.body) }
            if reader.link == .stopped {
                if let error = reader.errorMessage { Text(error).appFont(.body) }
                Button("Reconnect") { revision = UUID() }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            TopNav(trailingPrimary: {
                if reader.showsDisband {
                    Menu {
                        Button("Disband Group", role: .destructive) { confirmingDisband = true }
                            .disabled(!reader.mayDisband)
                        if reader.finishingStop { Text("Finishing stop…") }
                    } label: { Label("Group options", systemImage: "ellipsis") }
                }
            })
        }
        .confirmationDialog("Disband this group?", isPresented: $confirmingDisband, titleVisibility: .visible) {
            Button("Disband Group", role: .destructive) { Task { await reader.disband() } }
                .disabled(!reader.mayDisband)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("The room and its history will be removed from every device. All bots in it will stop. The room cannot be restored.")
        }
        .task(id: revision) {
            visible = true; name = reader.room.name
            if scenePhase == .active { await reader.open(owner: owner) }
        }
        .onChange(of: reader.room.name) { if !editingName { name = reader.room.name } }
        .onChange(of: scenePhase) {
            if scenePhase == .active && visible { revision = UUID() }
            else if visible { reader.leave(owner: owner) }
        }
        .onDisappear { visible = false; reader.leave(owner: owner) }
    }
    private func commitName() {
        guard reader.mayRename, BotRoomRPC.validName(name) else { return }
        editingName = false
        let submitted = name
        Task { await reader.rename(submitted) }
    }
    private func memberRow(_ member: BotGroupRoom.Member) -> some View {
        HStack(spacing: HermesSpacing.s16) {
            BotRoomMemberAvatar(member: member, roster: roster, avatars: avatars, size: 36)
            Text(member.name)
        }
    }
}
