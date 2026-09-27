import CoreGraphics

enum HermesSpacing {
    static let s0: CGFloat = 0
    static let s2: CGFloat = 2
    static let s4: CGFloat = 4
    static let s8: CGFloat = 8
    static let s12: CGFloat = 12
    static let s16: CGFloat = 16
    static let s20: CGFloat = 20
    static let s24: CGFloat = 24
    static let s32: CGFloat = 32
    static let s40: CGFloat = 40
    static let s48: CGFloat = 48
    static let s64: CGFloat = 64

    /// Standard left/right inset owned by app-level screens and surfaces.
    static let screenHorizontal: CGFloat = s16
}

enum HermesIconSize {
    static let xs: CGFloat = 12
    static let small: CGFloat = 16
    static let medium: CGFloat = 20
    static let large: CGFloat = 24
    static let extraLarge: CGFloat = 32
}

/// The Attachment family's fixed geometry: file/image tile frames, the composer's icon-badge panel,
/// and its text and remove-control insets. Shared by `MessageBubbleView`'s message grid and
/// `ChatComposerAttachmentStripView`'s pending-attachment strip.
enum HermesAttachmentSize {
    static let compactPreview: CGFloat = 30
    static let messageGridCell: CGFloat = 118
    static let composerImage: CGFloat = 96
    static let composerImageAccessibility: CGFloat = 108
    static let fileIconPanelWidth: CGFloat = 58
    static let fileIconPanelHeight: CGFloat = 68
    static let fileIconPanelWidthAccessibility: CGFloat = 76
    static let fileIconPanelHeightAccessibility: CGFloat = 84
    static let composerFileTextWidth: CGFloat = 128
    static let composerFileTextWidthAccessibility: CGFloat = 160
    static let composerFileTileWidth: CGFloat = 222
    static let composerFileTileWidthAccessibility: CGFloat = 280
    static let composerFileTileMinHeight: CGFloat = 92
    static let composerFileTileMinHeightAccessibility: CGFloat = 112
    static let composerStripHeight: CGFloat = 108
    static let composerStripHeightAccessibility: CGFloat = 132
    static let messageFileTextInset: CGFloat = 18
    static let removeControl: CGFloat = 24
    static let removeOverlap: CGFloat = 6
    static let accessibilityVerticalPadding: CGFloat = 10
}
