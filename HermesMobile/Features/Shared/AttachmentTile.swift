import SwiftUI

/// Shared Attachment file-tile anatomy: the icon (`AttachmentFileGlyph`), the extension label
/// (`AttachmentExtensionLabel`), and composer's boxed icon badge that composes both over the file
/// type's token-tinted fill (`AttachmentFileBadge`). `MessageBubbleView`'s grid cell and
/// `ChatComposerAttachmentStripView`'s pending-attachment preview keep their own square-grid vs.
/// horizontal-card layouts as focused variants over this shared anatomy, not a single god component.

/// A file type's icon glyph in its token tint, at the caller's icon size.
struct AttachmentFileGlyph: View {
    let fileType: AttachmentFileType
    let size: CGFloat

    var body: some View {
        Image(systemName: fileType.iconName)
            .font(.system(size: size, weight: .semibold))
            .foregroundStyle(fileType.tintColor)
    }
}

/// A file type's extension label ("PDF", "ZIP"), in its token tint.
struct AttachmentExtensionLabel: View {
    let fileType: AttachmentFileType

    var body: some View {
        Text(fileType.extensionLabel)
            .appFont(.caption2, weight: .bold)
            .foregroundStyle(fileType.tintColor)
            .lineLimit(1)
    }
}

/// The composer's boxed icon+extension badge: `AttachmentFileGlyph` and `AttachmentExtensionLabel`
/// over the file type's subtle token-tinted fill.
struct AttachmentFileBadge: View {
    let fileType: AttachmentFileType
    let width: CGFloat
    let height: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: HermesRadius.r12, style: .continuous)
                .fill(fileType.badgeFill)

            VStack(spacing: HermesSpacing.s4) {
                AttachmentFileGlyph(fileType: fileType, size: HermesIconSize.large)
                AttachmentExtensionLabel(fileType: fileType)
            }
        }
        .frame(width: width, height: height)
    }
}

/// The full-box loading placeholder an attachment image tile shows before its first load attempt
/// resolves: a redacted skeleton fill grouped with the loading announcement, so only this state —
/// never the loaded image or the failure fallback that follows it — carries loading semantics.
struct AttachmentLoadingTile: View {
    var body: some View {
        Rectangle()
            .fill(Color(.systemFill))
            .skeletonPlaceholder()
            .skeletonAnnouncement(label: Text("Loading image attachment"), disablesHitTesting: false)
    }
}

/// The image-tile outer surface both the chat grid cell and the composer's pending-attachment
/// preview clip their thumbnail content into: a fixed frame, rounded clip, and Compact Card's
/// hairline border with no fill, since the image content beneath already covers the surface.
struct AttachmentImageTileSurface<Content: View>: View {
    let width: CGFloat
    let height: CGFloat
    let cornerRadius: CGFloat
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .frame(width: width, height: height)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .compactCardSurface(cornerRadius: cornerRadius, fill: .clear)
    }
}
