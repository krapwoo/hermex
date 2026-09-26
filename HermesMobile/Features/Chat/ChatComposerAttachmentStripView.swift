import SwiftUI
import UIKit

struct ComposerAttachmentStripView: View {
    let attachments: [PendingAttachment]
    let onRemove: (UUID) -> Void
    let onPreview: (PendingAttachment) -> Void

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        if !attachments.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: HermesSpacing.s12) {
                    ForEach(attachments) { attachment in
                        ComposerAttachmentThumbnailView(
                            attachment: attachment,
                            onRemove: { onRemove(attachment.id) },
                            onOpen: { onPreview(attachment) }
                        )
                    }
                }
                .padding(.horizontal, HermesSpacing.s16)
                .padding(.top, HermesSpacing.s8)
                .padding(.bottom, HermesSpacing.s4)
            }
            .frame(height: stripHeight)
            .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
        }
    }

    private var stripHeight: CGFloat {
        dynamicTypeSize.isAccessibilitySize ? 132 : 108
    }
}

/// Pill-state summary of pending attachments: up to three 30 pt tiles plus a
/// `+N` chip, so nothing pending is ever out of sight while the editor is idle.
struct ComposerAttachmentPillPreview: View {
    let attachments: [PendingAttachment]
    let onPreview: (PendingAttachment) -> Void

    private let tileSize: CGFloat = 30
    private let visibleLimit = 3

    var body: some View {
        if !attachments.isEmpty {
            HStack(spacing: HermesSpacing.s4) {
                ForEach(attachments.prefix(visibleLimit)) { attachment in
                    Button {
                        onPreview(attachment)
                    } label: {
                        tile(for: attachment)
                    }
                    .buttonStyle(.hermesPressOnly(.thumbnail))
                    .accessibilityLabel("Open attachment \(attachment.name)")
                }

                if attachments.count > visibleLimit {
                    Text("+\(attachments.count - visibleLimit)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Color(.secondaryLabel))
                        .frame(width: tileSize, height: tileSize)
                        .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
                        .accessibilityLabel(Text("\(attachments.count - visibleLimit) more attachments"))
                }
            }
        }
    }

    @ViewBuilder
    private func tile(for attachment: PendingAttachment) -> some View {
        Group {
            if attachment.isImage,
               let thumbnailData = attachment.thumbnailData,
               let uiImage = UIImage(data: thumbnailData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
            } else {
                Image(systemName: attachment.isImage ? "photo" : "doc")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color(.secondaryLabel))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(.tertiarySystemFill))
            }
        }
        .frame(width: tileSize, height: tileSize)
        .clipShape(RoundedRectangle(cornerRadius: HermesRadius.r8, style: .continuous))
    }
}

private struct ComposerAttachmentThumbnailView: View {
    let attachment: PendingAttachment
    let onRemove: () -> Void
    let onOpen: () -> Void

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Environment(\.layoutDirection) private var layoutDirection

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Button(action: onOpen) {
                thumbnailContent
            }
            .buttonStyle(.hermesPressOnly(.thumbnail))
            .accessibilityLabel("Open attachment \(attachment.name)")

            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .bold))
                    .frame(width: 24, height: 24)
                    .background(Circle().fill(Color(.systemBackground)))
                    .foregroundStyle(Color(.label))
                    .overlay(Circle().stroke(Color(.separator).opacity(0.35), lineWidth: 0.5))
            }
            .buttonStyle(.hermesPressOnly(
                .icon,
                shadow: HermesButtonPressOnlyStyle.Shadow(resting: .controlSubtleResting, pressed: .controlSubtlePressed)
            ))
            .offset(x: RTLLayout.horizontalOffset(6, isRightToLeft: layoutDirection == .rightToLeft), y: -6)
            .accessibilityLabel("Remove attachment \(attachment.name)")
        }
    }

    @ViewBuilder
    private var thumbnailContent: some View {
        if attachment.isImage {
            imagePreview
        } else {
            filePreview
        }
    }

    @ViewBuilder
    private var imagePreview: some View {
        Group {
            if let thumbnailData = attachment.thumbnailData,
               let uiImage = UIImage(data: thumbnailData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
            } else {
                RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                    .fill(Color(.systemFill))
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 30, weight: .regular))
                            .foregroundStyle(Color(.tertiaryLabel))
                    )
            }
        }
        .frame(width: imagePreviewSize, height: imagePreviewSize)
        .clipShape(RoundedRectangle(cornerRadius: HermesRadius.r16, style: .continuous))
        .overlay(previewBorder(cornerRadius: HermesRadius.r16))
        .accessibilityLabel("Image attachment \(attachment.name)")
    }

    private var filePreview: some View {
        HStack(alignment: .center, spacing: HermesSpacing.s12) {
            ZStack {
                RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                    .fill(fileBadgeColor.opacity(0.15))

                VStack(spacing: HermesSpacing.s4) {
                    Image(systemName: fileIconName)
                        .font(.system(size: 24, weight: .semibold))
                    Text(fileExtensionLabel)
                        .font(.system(size: 9, weight: .bold))
                        .lineLimit(1)
                }
                .foregroundStyle(fileBadgeColor)
            }
            .frame(width: 58, height: 68)

            VStack(alignment: .leading, spacing: HermesSpacing.s4) {
                Text(attachment.name)
                    .appFont(.subheadline, weight: .medium)
                    .foregroundStyle(Color(.label))
                    .lineLimit(2)
                    .truncationMode(.middle)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Text(fileDetailText)
                    .appFont(.caption)
                    .foregroundStyle(Color(.secondaryLabel))
                    .lineLimit(usesAccessibilityLayout ? 2 : 1)
            }
            .frame(width: usesAccessibilityLayout ? 160 : 128, alignment: .leading)
        }
        .padding(.horizontal, HermesSpacing.s12)
        .padding(.vertical, usesAccessibilityLayout ? 10 : 0)
        .frame(width: usesAccessibilityLayout ? 260 : 222)
        .frame(minHeight: usesAccessibilityLayout ? 112 : 92)
        .compactCardSurface(cornerRadius: HermesRadius.r16)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("File attachment \(attachment.name), \(fileDetailText)")
    }

    private func previewBorder(cornerRadius: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .stroke(Color(.separator).opacity(0.25), lineWidth: 0.5)
    }

    private var fileType: AttachmentFileType {
        AttachmentFileType(fileName: attachment.name)
    }

    private var fileExtensionLabel: String {
        fileType.extensionLabel
    }

    private var fileIconName: String {
        fileType.iconName
    }

    private var fileBadgeColor: Color {
        fileType.tintColor
    }

    private var fileDetailText: String {
        if let size = attachment.size {
            ByteCountFormatter.string(fromByteCount: Int64(size), countStyle: .file)
        } else {
            fileExtensionLabel
        }
    }

    private var usesAccessibilityLayout: Bool {
        dynamicTypeSize.isAccessibilitySize
    }

    private var imagePreviewSize: CGFloat {
        usesAccessibilityLayout ? 108 : 96
    }
}
