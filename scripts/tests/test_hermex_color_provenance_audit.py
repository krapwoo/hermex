import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_color_provenance_audit import audit_declaration  # noqa: E402

BEFORE_FIXTURE = """
enum HeaderLogoColor {
    static let presets: [HeaderLogoColorPreset] = [
        HeaderLogoColorPreset(name: String(localized: "Yellow"), hex: "#FFD700"),
        HeaderLogoColorPreset(name: String(localized: "Blue"), hex: "#5B7CFF"),
    ]
}
"""

AFTER_FIXTURE = """
enum HeaderLogoColor {
    static let presets: [HeaderLogoColorPreset] = [
        HeaderLogoColorPreset(name: String(localized: "Yellow"), hex: HermesProductPalette.headerAccentYellow),
        HeaderLogoColorPreset(name: String(localized: "Blue"), hex: HermesProductPalette.headerAccentBlue),
    ]
}
"""


class ColorProvenanceAuditFixtureTests(unittest.TestCase):
    def test_before_fixture_fails(self):
        self.assertTrue(len(audit_declaration(BEFORE_FIXTURE, "HeaderLogoColor.presets")) > 0)

    def test_after_fixture_passes(self):
        self.assertEqual(audit_declaration(AFTER_FIXTURE, "HeaderLogoColor.presets"), [])


if __name__ == "__main__":
    unittest.main()
