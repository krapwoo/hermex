import SwiftUI

/// Three thin Hermex-owned entry points over native SwiftUI text entry, each forwarding straight to
/// its native counterpart: `HermexTextField` to `TextField`, `HermexSecureField` to `SecureField`,
/// and `HermexNumberField` to the typed `TextField(value:format:)` path. None of the three draw their
/// own chrome, validation, helper/error text, clear button, or own focus, keyboard, autocorrection,
/// capitalization, or content-type policy — callers keep those context-specific modifiers exactly as
/// they would calling the native control directly. `HermexNumberField` takes a caller-supplied
/// `ParseableFormatStyle` rather than a `Binding<String>`, so locale-aware native parsing and
/// formatting stay intact.
struct HermexTextField: View {
    private let titleKey: LocalizedStringKey
    @Binding private var text: String
    private let prompt: Text?

    init(_ titleKey: LocalizedStringKey, text: Binding<String>, prompt: Text? = nil) {
        self.titleKey = titleKey
        self._text = text
        self.prompt = prompt
    }

    var body: some View {
        TextField(titleKey, text: $text, prompt: prompt)
    }
}

struct HermexSecureField: View {
    private let titleKey: LocalizedStringKey
    @Binding private var text: String
    private let prompt: Text?

    init(_ titleKey: LocalizedStringKey, text: Binding<String>, prompt: Text? = nil) {
        self.titleKey = titleKey
        self._text = text
        self.prompt = prompt
    }

    var body: some View {
        SecureField(titleKey, text: $text, prompt: prompt)
    }
}

struct HermexNumberField<Value, Format: ParseableFormatStyle>: View where Format.FormatInput == Value, Format.FormatOutput == String {
    private let titleKey: LocalizedStringKey
    @Binding private var value: Value
    private let format: Format
    private let prompt: Text?

    init(_ titleKey: LocalizedStringKey, value: Binding<Value>, format: Format, prompt: Text? = nil) {
        self.titleKey = titleKey
        self._value = value
        self.format = format
        self.prompt = prompt
    }

    var body: some View {
        TextField(titleKey, value: $value, format: format, prompt: prompt)
    }
}
