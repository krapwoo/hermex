import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_typography_delegation_audit import audit_source  # noqa: E402

BEFORE_FIXTURE = """
enum AppFont {
    static func footnote(weight: Font.Weight? = nil) -> Font {
        system(.footnote, weight: weight)
    }
    static func caption2(weight: Font.Weight? = nil) -> Font {
        system(.caption2, weight: weight)
    }
}
"""

AFTER_FIXTURE = """
enum AppFont {
    static func footnote(weight: Font.Weight? = nil) -> Font {
        system(.caption, weight: weight ?? .regular)
    }
    static func caption2(weight: Font.Weight? = nil) -> Font {
        system(.caption, weight: weight ?? .regular)
    }
}
"""


class DelegationAuditFixtureTests(unittest.TestCase):
    def test_before_fixture_fails(self):
        failures = audit_source(BEFORE_FIXTURE)
        self.assertTrue(len(failures) > 0)

    def test_after_fixture_passes(self):
        failures = audit_source(AFTER_FIXTURE)
        self.assertEqual(failures, [])


if __name__ == "__main__":
    unittest.main()
