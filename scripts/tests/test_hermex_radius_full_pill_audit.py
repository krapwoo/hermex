import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_radius_full_pill_audit import audit_source  # noqa: E402

BEFORE_FIXTURE = """
enum HermesRadius {
    static let r0: CGFloat = 0
    static let full: CGFloat = .infinity
}
"""

AFTER_FIXTURE = """
enum HermesRadius {
    static let r0: CGFloat = 0
    static let r4: CGFloat = 4
    static let r8: CGFloat = 8
    static let r12: CGFloat = 12
    static let r16: CGFloat = 16
    static let r20: CGFloat = 20
    static let r24: CGFloat = 24

    static let control: CGFloat = r8
    static let field: CGFloat = r12
    static let card: CGFloat = r16
    static let prominent: CGFloat = r20
    static let chrome: CGFloat = r24
}
"""


class RadiusFullPillAuditFixtureTests(unittest.TestCase):
    def test_before_fixture_fails(self):
        self.assertTrue(len(audit_source(BEFORE_FIXTURE)) > 0)

    def test_after_fixture_passes(self):
        self.assertEqual(audit_source(AFTER_FIXTURE), [])


if __name__ == "__main__":
    unittest.main()
