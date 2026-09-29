import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for `HermexDropdown` (`HermexDropdown.swift`): caller-controlled selection over the
/// native `.menu`-style `Picker`, matching the established convention in
/// `SettingsView.swift`'s row pickers rather than a custom floating sheet. A SwiftUI view tree isn't
/// inspectable at runtime without a rendering harness, so this is a compile contract plus a source
/// contract for the native Picker path.
final class HermexDropdownTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    // MARK: - Compile contracts

    @MainActor
    func testCompilesWithASelectionAndAPlaceholder() {
        struct Host: View {
            @State var selection: String?
            var body: some View {
                HermexDropdown(
                    title: "Profile",
                    selection: $selection,
                    options: [
                        HermexDropdownOption("a", label: "Alpha"),
                        HermexDropdownOption("b", label: "Beta")
                    ],
                    placeholder: "Choose a profile"
                )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testDisabledStateCompiles() {
        struct Host: View {
            @State var selection: String? = "a"
            var body: some View {
                HermexDropdown(
                    title: "Profile",
                    selection: $selection,
                    options: [HermexDropdownOption("a", label: "Alpha")],
                    isEnabled: false
                )
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contract: native Menu/Picker semantics, no custom floating sheet

    func testUsesTheNativeMenuStylePickerRatherThanACustomSheet() throws {
        let src = try source("HermesMobile/Features/Shared/HermexDropdown.swift")
        XCTAssertTrue(src.contains("Picker("))
        XCTAssertTrue(src.contains(".pickerStyle(.menu)"))
        XCTAssertFalse(src.contains(".sheet("), "Dropdown should not recreate a custom floating sheet")
    }
}
