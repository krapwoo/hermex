import SwiftUI

/// Pushed from the editor's Expression row: a large live preview of the draft face
/// above the sixteen named rest expressions. Tapping a tile edits the draft only;
/// Save on the editor persists it.
@MainActor struct BotExpressionPickerView: View {
    let editor: BotProfileEditor

    private let columns = Array(repeating: GridItem(.flexible(), spacing: HermesSpacing.s12), count: 4)
    private var selected: BotAvatarExpression { BotAvatarExpression.resolve(editor.draft.appearance.expression) }

    var body: some View {
        ScrollView {
            VStack(spacing: HermesSpacing.s20) {
                BotAnimatedFaceView(name: editor.profile.id, appearance: editor.draft.appearance, size: 132)
                    .padding(.top, HermesSpacing.s20)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(selected.localizedName)
                LazyVGrid(columns: columns, spacing: HermesSpacing.s12) {
                    ForEach(BotAvatarExpression.allCases) { expression in
                        Button { editor.setExpression(expression) } label: {
                            VStack(spacing: HermesSpacing.s4) {
                                BotAvatarMarkView(name: editor.profile.id, appearance: appearance(expression), size: 52)
                                Text(expression.localizedName).appFont(.caption2).foregroundStyle(.secondary).lineLimit(1)
                                    .minimumScaleFactor(0.8)
                            }
                            .frame(maxWidth: .infinity, minHeight: 78)
                            .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))
                            .overlay {
                                if selected == expression {
                                    RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous).stroke(.secondary, lineWidth: 2)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(expression.localizedName)
                        .accessibilityAddTraits(selected == expression ? .isSelected : [])
                    }
                }
                .padding(.horizontal, HermesSpacing.s16)
            }
            .padding(.bottom, HermesSpacing.s32)
        }
        .background(Color(uiColor: .systemBackground))
        .navigationTitle("Expression")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func appearance(_ expression: BotAvatarExpression) -> BotProfileAppearance {
        var appearance = editor.draft.appearance
        appearance.expression = expression.rawValue
        return appearance
    }
}
