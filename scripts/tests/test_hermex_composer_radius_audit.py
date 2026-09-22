import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_composer_radius_audit import audit_source  # noqa: E402

BEFORE_FIXTURE = "enum ChatComposerMetrics {\n    static let cardCornerRadius: CGFloat = 26\n}\n"
AFTER_FIXTURE = "enum ChatComposerMetrics {\n    static let cardCornerRadius: CGFloat = HermesRadius.chrome\n}\n"


class ComposerRadiusAuditFixtureTests(unittest.TestCase):
    def test_before_fixture_fails(self):
        self.assertTrue(len(audit_source(BEFORE_FIXTURE)) > 0)

    def test_after_fixture_passes(self):
        self.assertEqual(audit_source(AFTER_FIXTURE), [])


if __name__ == "__main__":
    unittest.main()
