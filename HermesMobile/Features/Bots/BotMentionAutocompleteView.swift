import SwiftUI

/// The slash panel's dense rows and glass surface, with connection-local bots.
/// The Bot Chat's combined `@` panel draws the same `BotMentionRow`; rooms keep
/// this members-only panel and never see files.
struct BotMentionAutocompleteView: View {
    let completions: [BotMentions.Completion]
    let avatars: [String: UIImage]
    var room: BotGroupRoom? = nil
    var roster: [BotProfile] = []
    let onSelect: (BotMentions.Completion) -> Void
    @ScaledMetric(relativeTo: .subheadline) private var rowHeight: CGFloat = 48

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: HermesSpacing.s0) {
                ForEach(Array(completions.enumerated()), id: \.element.id) { index, item in
                    BotMentionRow(item: item, avatars: avatars, room: room, roster: roster, onSelect: onSelect)
                    if index < completions.count - 1 { Divider().padding(.horizontal, HermesSpacing.s16) }
                }
            }
        }
        .adaptiveGlass(.regular, fallbackMaterial: .ultraThinMaterial,
                       in: RoundedRectangle(cornerRadius: ChatComposerMetrics.cardCornerRadius, style: .continuous))
        .clipShape(RoundedRectangle(cornerRadius: ChatComposerMetrics.cardCornerRadius, style: .continuous))
        .hermesShadow(.popover)
        .frame(height: min(280, CGFloat(completions.count) * rowHeight))
    }
}

/// One roster row: avatar, `@tag`, display name. The Bot Chat and a group room
/// draw the same row.
struct BotMentionRow: View {
    let item: BotMentions.Completion
    let avatars: [String: UIImage]
    var room: BotGroupRoom? = nil
    var roster: [BotProfile] = []
    let onSelect: (BotMentions.Completion) -> Void

    @ScaledMetric(relativeTo: .subheadline) private var avatarSize: CGFloat = 24

    var body: some View {
        Button { onSelect(item) } label: {
            HStack(spacing: HermesSpacing.s12) {
                avatar
                    .accessibilityHidden(true)
                Text(verbatim: "@" + item.tag)
                    .appFont(.subheadline, weight: .semibold, design: .monospaced)
                    .foregroundStyle(.primary).lineLimit(1).layoutPriority(2)
                Spacer(minLength: 8)
                Text(verbatim: item.profile.name)
                    .appFont(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
            .padding(.horizontal, HermesSpacing.s16).padding(.vertical, HermesSpacing.s12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private var avatar: some View {
        if let room {
            if let member = room.members.first(where: { $0.id == item.id }) {
                BotRoomMemberAvatar(member: member, roster: roster, avatars: avatars, size: avatarSize)
            } else {
                BotRoomAvatars(room: room, roster: roster, avatars: avatars, size: avatarSize)
            }
        } else {
            BotAvatarView(profile: item.profile, avatar: avatars[item.id], size: avatarSize, motion: .still)
        }
    }
}
