import XCTest
import SwiftUI
@testable import HermesMobile

/// Contracts for the three thin Hermex-owned Text Input wrappers (`HermexTextInput.swift`):
/// `HermexTextField` forwards to native `TextField`, `HermexSecureField` forwards to native
/// `SecureField`, and `HermexNumberField` forwards to native SwiftUI's typed
/// `TextField(value:format:)` path. None of the three draw their own chrome. A SwiftUI view tree
/// isn't inspectable at runtime without a rendering harness, so this is a compile contract plus a
/// source contract that pins the forwarding calls and the absence of custom chrome, validation, or
/// manual number parsing.
final class HermexTextInputTests: XCTestCase {
    private func resourceURL(_ relativePath: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent(relativePath)
    }

    private func source(_ relativePath: String) throws -> String {
        try String(contentsOf: resourceURL(relativePath), encoding: .utf8)
    }

    private func hermexTextInputSource() throws -> String {
        try source("HermesMobile/Features/Shared/HermexTextInput.swift")
    }

    // MARK: - Compile contracts

    @MainActor
    func testHermexTextFieldCompilesWithATitleAndATextBinding() {
        struct Host: View {
            @State var value = ""
            var body: some View {
                HermexTextField("Name", text: $value)
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testHermexSecureFieldCompilesWithATitleAndATextBinding() {
        struct Host: View {
            @State var value = ""
            var body: some View {
                HermexSecureField("Password", text: $value)
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testHermexNumberFieldCompilesWithACallerSuppliedParseableFormatStyle() {
        struct Host: View {
            @State var value: Int = 0
            var body: some View {
                HermexNumberField("Quantity", value: $value, format: .number)
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    @MainActor
    func testAllThreeWrappersCompileWithAnExplicitNativeTextPrompt() {
        struct Host: View {
            @State var text = ""
            @State var secret = ""
            @State var number = 0

            var body: some View {
                VStack {
                    HermexTextField("Name", text: $text, prompt: Text("Enter a name"))
                    HermexSecureField("Password", text: $secret, prompt: Text("Enter a password"))
                    HermexNumberField("Quantity", value: $number, format: .number, prompt: Text("Enter a quantity"))
                }
            }
        }
        let host = Host()
        XCTAssertFalse(String(describing: type(of: host)).isEmpty)
    }

    // MARK: - Source contracts: thin forwarding wrappers, no custom chrome

    func testHermexTextFieldForwardsDirectlyToNativeTextField() throws {
        let src = try hermexTextInputSource()
        XCTAssertTrue(src.contains("struct HermexTextField"))
        XCTAssertTrue(src.contains("TextField(titleKey, text: $text, prompt: prompt)"), "expected the wrapper to forward to native TextField")
    }

    func testHermexSecureFieldForwardsDirectlyToNativeSecureField() throws {
        let src = try hermexTextInputSource()
        XCTAssertTrue(src.contains("struct HermexSecureField"))
        XCTAssertTrue(src.contains("SecureField(titleKey, text: $text, prompt: prompt)"), "expected the wrapper to forward to native SecureField")
    }

    func testAllThreeWrappersForwardAnOptionalNativeTextPrompt() throws {
        let src = try hermexTextInputSource()
        XCTAssertTrue(src.contains("prompt: Text? = nil"), "expected callers to be able to omit a native Text prompt")
        XCTAssertTrue(src.contains("TextField(titleKey, text: $text, prompt: prompt)"))
        XCTAssertTrue(src.contains("SecureField(titleKey, text: $text, prompt: prompt)"))
        XCTAssertTrue(src.contains("TextField(titleKey, value: $value, format: format, prompt: prompt)"))
    }

    func testHermexNumberFieldUsesTheTypedFormatStylePathNotAStringBinding() throws {
        let src = try hermexTextInputSource()
        XCTAssertTrue(src.contains("struct HermexNumberField"))
        XCTAssertTrue(src.contains("ParseableFormatStyle"), "expected a caller-supplied native parseable format style")
        XCTAssertTrue(
            src.contains("TextField(titleKey, value: $value, format: format, prompt: prompt)"),
            "expected the wrapper to forward to native TextField(value:format:)"
        )
    }

    func testHermexNumberFieldAvoidsManualStringParsingOrAForcedNumericKeyboard() throws {
        let src = try hermexTextInputSource()
        XCTAssertFalse(src.contains("NumberFormatter()"), "must not manually parse numbers")
        XCTAssertFalse(src.contains("keyboardType(.numberPad)"), "must not force a numeric keyboard")
        XCTAssertFalse(src.contains("keyboardType(.decimalPad)"), "must not force a numeric keyboard")
    }

    func testIntroducesNoCustomFieldChromeValidationOrKeyboardPolicy() throws {
        let src = try hermexTextInputSource()
        XCTAssertFalse(src.contains(".border("), "must not draw custom border chrome")
        XCTAssertFalse(src.contains("keyboardType("), "keyboard configuration stays with the caller")
        XCTAssertFalse(src.contains("textContentType("), "content type stays with the caller")
        XCTAssertFalse(src.contains("autocorrectionDisabled"), "autocorrection policy stays with the caller")
        XCTAssertFalse(src.contains("textInputAutocapitalization"), "capitalization policy stays with the caller")
        XCTAssertFalse(src.contains("onSubmit("), "submit handling stays with the caller")
        XCTAssertFalse(src.contains("focused("), "focus ownership stays with the caller")
        XCTAssertFalse(src.contains("helperText"), "must not introduce helper text chrome")
        XCTAssertFalse(src.contains("errorText"), "must not introduce error text chrome")
    }

    func testDoesNotAddAMultilineComponentOrCollapseIntoOneEnumDrivenComponent() throws {
        let src = try hermexTextInputSource()
        XCTAssertFalse(src.contains("TextEditor("), "must not add a multiline wrapper")
        XCTAssertFalse(src.contains("struct HermexTextInput:"), "must not collapse into one enum-driven mega component")
        XCTAssertFalse(src.contains("struct HermexTextInput "), "must not collapse into one enum-driven mega component")
        XCTAssertFalse(src.contains("enum HermexTextInputVariant"), "must not collapse into one enum-driven mega component")
    }
}
