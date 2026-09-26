import SwiftUI

/// Maps an attachment's file name to the icon, tint, and extension label its tile shows — shared by
/// a sent message's file cell (`MessageBubbleView`) and the composer's pending-attachment preview
/// (`ChatComposerAttachmentStripView`), which independently implemented the exact same switch.
struct AttachmentFileType {
    let iconName: String
    let tintColor: Color
    let extensionLabel: String

    init(fileName: String) {
        let ext = URL(fileURLWithPath: fileName).pathExtension.lowercased()

        switch ext {
        case "csv", "tsv", "xls", "xlsx":
            iconName = "tablecells"
            tintColor = .green
        case "json", "md", "txt", "log", "xml", "yaml", "yml":
            iconName = "doc.text"
            tintColor = .blue
        case "pdf":
            iconName = "doc.richtext"
            tintColor = .red
        case "zip", "tar", "gz", "tgz":
            iconName = "archivebox"
            tintColor = .accentColor
        default:
            iconName = "doc"
            tintColor = .accentColor
        }

        let uppercased = ext.uppercased()
        extensionLabel = uppercased.isEmpty ? String(localized: "FILE") : String(uppercased.prefix(5))
    }
}
