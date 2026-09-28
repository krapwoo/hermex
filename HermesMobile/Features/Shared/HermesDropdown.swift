import SwiftUI

/// One option in a `HermesDropdown`.
struct HermesDropdownOption<Value: Hashable>: Identifiable {
    let value: Value
    let label: String
    var id: Value { value }

    init(_ value: Value, label: String) {
        self.value = value
        self.label = label
    }
}

/// A caller-controlled selection control over the native `.menu`-style `Picker` — the same
/// checked-option and disclosure chrome `SettingsView`'s row pickers already use, generalized for
/// reuse. Never a custom floating sheet: native `Picker`/`Menu` semantics already satisfy label,
/// value, placeholder, and the checked selected option.
struct HermesDropdown<Value: Hashable>: View {
    let title: String
    @Binding var selection: Value?
    let options: [HermesDropdownOption<Value>]
    var isEnabled = true
    var placeholder: String = String(localized: "Select")

    var body: some View {
        Picker(title, selection: $selection) {
            Text(placeholder).tag(Value?.none)
            ForEach(options) { option in
                Text(option.label).tag(Value?.some(option.value))
            }
        }
        .pickerStyle(.menu)
        .disabled(!isEnabled)
        .accessibilityLabel(Text(title))
    }
}
