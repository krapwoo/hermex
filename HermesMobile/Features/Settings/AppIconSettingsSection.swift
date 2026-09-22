import SwiftUI
import UIKit

struct AppIconSettingsSection: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var selectedAppIcon = AppIconChoice.system
    @State private var updatingAppIcon: AppIconChoice?
    @State private var appIconErrorMessage: String?
    @State private var isAppIconPickerExpanded = false

    var body: some View {
        if UIApplication.shared.supportsAlternateIcons {
            VStack(alignment: .leading, spacing: HermesSpacing.s12) {
                DisclosureGroup(isExpanded: $isAppIconPickerExpanded) {
                    appIconChoices
                        .padding(.top, HermesSpacing.s12)
                } label: {
                    AppIconDisclosureLabel(selectedAppIcon: selectedAppIcon)
                }
                .tint(.secondary)

                if let appIconErrorMessage {
                    Text(appIconErrorMessage)
                        .appFont(.caption)
                        .foregroundStyle(.red)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .onAppear {
                refreshSelectedAppIcon()
            }
            .onChange(of: scenePhase) { _, newPhase in
                guard newPhase == .active else { return }
                refreshSelectedAppIcon()
            }
        }
    }

    private var appIconChoices: some View {
        VStack(alignment: .leading, spacing: HermesSpacing.s12) {
            ForEach(Array(AppIconChoice.allCases.enumerated()), id: \.element.id) { index, icon in
                if index > 0 {
                    appIconDivider
                }

                HapticButton(feedbackStyle: .light) {
                    updateAppIcon(to: icon)
                } label: {
                    AppIconChoiceRow(
                        icon: icon,
                        isSelected: selectedAppIcon == icon,
                        isUpdating: updatingAppIcon == icon
                    )
                }
                .buttonStyle(.plain)
                .disabled(updatingAppIcon != nil)
            }
        }
    }

    private var appIconDivider: some View {
        Divider()
            .padding(.leading, HermesSpacing.s2)
            .opacity(0.72)
    }

    private func refreshSelectedAppIcon() {
        selectedAppIcon = AppIconChoice.current
    }

    private func updateAppIcon(to appIcon: AppIconChoice) {
        guard selectedAppIcon != appIcon, updatingAppIcon == nil else {
            return
        }

        appIconErrorMessage = nil
        updatingAppIcon = appIcon

        UIApplication.shared.setAlternateIconName(appIcon.alternateIconName) { error in
            Task { @MainActor in
                withAnimation {
                    updatingAppIcon = nil

                    if let error {
                        appIconErrorMessage = error.localizedDescription
                        selectedAppIcon = AppIconChoice.current
                        isAppIconPickerExpanded = true
                    } else {
                        selectedAppIcon = appIcon
                        isAppIconPickerExpanded = false
                    }
                }
            }
        }
    }
}

private struct AppIconDisclosureLabel: View {
    let selectedAppIcon: AppIconChoice

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            AppIconChoicePreview(icon: selectedAppIcon)

            VStack(alignment: .leading, spacing: HermesSpacing.s2) {
                Text("App Icon")
                    .appFont(.body, weight: .semibold)
                    .foregroundStyle(.primary)

                Text(selectedAppIcon.title)
                    .appFont(.footnote)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 8)
        }
        .frame(minHeight: 44)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

private struct AppIconChoiceRow: View {
    let icon: AppIconChoice
    let isSelected: Bool
    let isUpdating: Bool

    var body: some View {
        HStack(spacing: HermesSpacing.s12) {
            AppIconChoicePreview(icon: icon)

            VStack(alignment: .leading, spacing: HermesSpacing.s2) {
                Text(icon.title)
                    .appFont(.body, weight: .semibold)
                    .foregroundStyle(.primary)

                Text(icon.subtitle)
                    .appFont(.footnote)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 8)

            if isUpdating {
                ProgressView()
                    .controlSize(.small)
                    .accessibilityLabel("Updating app icon")
            } else if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.green)
                    .accessibilityHidden(true)
            }
        }
        .frame(minHeight: 58)
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue(isSelected ? "Selected" : "")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var accessibilityLabel: String {
        "\(icon.title). \(icon.subtitle)"
    }
}

private struct AppIconChoicePreview: View {
    @Environment(\.colorScheme) private var colorScheme

    let icon: AppIconChoice

    @ViewBuilder
    var body: some View {
        switch icon {
        case .system:
            AppIconPreviewImage(
                name: colorScheme == .dark ? "AppIconDarkPreview" : "AppIconLightPreview",
                size: 44
            )
        case .light, .dark, .disco, .monochromeLight, .monochromeDark, .gradientLight, .gradientDark:
            if let previewImageName = icon.previewImageName {
                AppIconPreviewImage(name: previewImageName, size: 44)
            }
        }
    }
}

private struct AppIconPreviewImage: View {
    let name: String
    let size: CGFloat

    var body: some View {
        Image(name)
            .resizable()
            .renderingMode(.original)
            .scaledToFit()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                    .strokeBorder(Color.primary.opacity(0.08), lineWidth: 1)
            )
            .hermesShadow(.controlElevatedPressed)
            .accessibilityHidden(true)
    }
}
