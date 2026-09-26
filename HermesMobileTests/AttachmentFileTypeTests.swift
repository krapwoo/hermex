import XCTest
import SwiftUI
@testable import HermesMobile

final class AttachmentFileTypeTests: XCTestCase {
    func testSpreadsheetExtensionsMapToTableIconAndGreenTint() {
        for name in ["report.csv", "data.TSV", "sheet.xls", "sheet.xlsx"] {
            let type = AttachmentFileType(fileName: name)
            XCTAssertEqual(type.iconName, "tablecells", name)
            XCTAssertEqual(type.tintColor, .green, name)
        }
    }

    func testTextLikeExtensionsMapToDocTextIconAndBlueTint() {
        for name in ["notes.md", "log.txt", "trace.log", "config.xml", "data.yaml", "data.yml", "payload.json"] {
            let type = AttachmentFileType(fileName: name)
            XCTAssertEqual(type.iconName, "doc.text", name)
            XCTAssertEqual(type.tintColor, .blue, name)
        }
    }

    func testPDFMapsToDocRichtextIconAndRedTint() {
        let type = AttachmentFileType(fileName: "invoice.pdf")

        XCTAssertEqual(type.iconName, "doc.richtext")
        XCTAssertEqual(type.tintColor, .red)
    }

    func testArchiveExtensionsMapToArchiveboxIconAndAccentTint() {
        for name in ["bundle.zip", "backup.tar", "archive.gz", "archive.tgz"] {
            let type = AttachmentFileType(fileName: name)
            XCTAssertEqual(type.iconName, "archivebox", name)
            XCTAssertEqual(type.tintColor, .accentColor, name)
        }
    }

    func testUnknownExtensionFallsBackToDocIconAndAccentTint() {
        let type = AttachmentFileType(fileName: "notes.rtf")

        XCTAssertEqual(type.iconName, "doc")
        XCTAssertEqual(type.tintColor, .accentColor)
    }

    func testExtensionLabelIsUppercasedAndTruncatedToFiveCharacters() {
        XCTAssertEqual(AttachmentFileType(fileName: "report.csv").extensionLabel, "CSV")
        XCTAssertEqual(AttachmentFileType(fileName: "archive.tgz").extensionLabel, "TGZ")
        XCTAssertEqual(AttachmentFileType(fileName: "data.jsonlines").extensionLabel, "JSONL")
    }

    func testMissingExtensionFallsBackToFileLabel() {
        XCTAssertEqual(AttachmentFileType(fileName: "README").extensionLabel, "FILE")
    }
}
