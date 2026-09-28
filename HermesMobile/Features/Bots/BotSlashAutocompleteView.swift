import SwiftUI

/// The slash panel's dense rows and glass surface, with this connection's skills.
///
/// Commands are deliberately absent: the Bot gateway runs those only through
/// `slash.exec`, which Bot Mode does not expose, so a command row would insert
/// text nothing executes. See `BotSlashCatalog`.
struct BotSlashAutocompleteView: View {
    let suggestions: [SkillSlashSuggestion]
    let onSelect: (SkillSlashSuggestion) -> Void
    @ScaledMetric(relativeTo: .subheadline) private var rowHeight: CGFloat = 48

    var body: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: HermesSpacing.s0) {
                ForEach(Array(suggestions.enumerated()), id: \.element.id) { index, skill in
                    Button { onSelect(skill) } label: {
                        HStack(spacing: HermesSpacing.s12) {
                            Image(systemName: "bolt.fill")
                                // Retained icon-sizing exception: typography adoption covers text, not SF Symbol sizing.
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(Color.accentColor)
                                .accessibilityHidden(true)
                            Text(verbatim: "/" + skill.name)
                                .appFont(.mono14)
                                .foregroundStyle(.primary).lineLimit(1).layoutPriority(2)
                            if let category = skill.category {
                                Text(verbatim: category)
                                    .appFont(.footnote).foregroundStyle(.secondary)
                                    .lineLimit(1).layoutPriority(1)
                            }
                            Spacer(minLength: 8)
                            Text(verbatim: skill.description ?? String(localized: "Skill"))
                                .appFont(.caption).foregroundStyle(.secondary)
                                .lineLimit(1).truncationMode(.tail)
                        }
                        .padding(.horizontal, HermesSpacing.s16).padding(.vertical, HermesSpacing.s12)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if index < suggestions.count - 1 { Divider().padding(.horizontal, HermesSpacing.s16) }
                }
            }
        }
        .frame(height: min(280, CGFloat(suggestions.count) * rowHeight))
        // Clip the scrolling content before Liquid Glass composites the surface.
        .clipShape(RoundedRectangle(cornerRadius: ChatComposerMetrics.cardCornerRadius, style: .continuous))
        .adaptiveGlass(.regular, fallbackMaterial: .ultraThinMaterial,
                       in: RoundedRectangle(cornerRadius: ChatComposerMetrics.cardCornerRadius, style: .continuous))
        .hermesShadow(.popover)
        .accessibilityIdentifier("bot-slash-autocomplete")
    }
}
