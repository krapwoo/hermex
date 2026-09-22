import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_typography_weight_exception_audit import (  # noqa: E402
    audit_line,
    audit_repo,
    find_real_weight_override_sites,
)
import hermex_typography_weight_exception_audit as weight_exception_audit_module  # noqa: E402

BEFORE_FIXTURE = '                    .font(AppFont.caption(weight: .semibold))\n'
AFTER_FIXTURE_DROPPED = '                    .font(.appFont(.caption))\n'

# (R3 correction) A real line from one of the 42 newly-added sites (UsageTotalsGrid.swift:38),
# proving this fixture's coverage is not limited to the original 13-site population.
NEW_SITE_BEFORE_FIXTURE = '                .font(AppFont.title3(weight: .semibold))\n'
NEW_SITE_AFTER_FIXTURE_DROPPED = '                .font(.appFont(.title3))\n'

# (Family 06 correction) Two approved TranscriptLogRowView.swift sites moved the preserved
# `.semibold` argument off the pinned statement's own physical line and onto its immediately
# following, more-indented chained-modifier line. The pinned statement is still intact; `audit_line`
# must follow the statement's own continuation lines, not just its first physical line.
STATEMENT_CONTINUATION_FIXTURE = (
    '                    Text("Copied")\n'
    '                        .appFont(.caption2, weight: .semibold)\n'
    '                        .foregroundStyle(.green)\n'
)

# A same- or less-indented line below the pinned statement belongs to a different statement
# entirely (here, a sibling `Text` after the pinned statement's block closes). Its weight token
# must never be read as satisfying the pinned statement above it.
SIBLING_STATEMENT_FIXTURE = (
    '                Text("Copied")\n'
    '                    .foregroundStyle(.green)\n'
    '            }\n'
    '            Text("Other")\n'
    '                .appFont(.caption2, weight: .semibold)\n'
)


class WeightExceptionAuditFixtureTests(unittest.TestCase):
    def test_line_with_weight_present_passes(self):
        self.assertEqual(audit_line(BEFORE_FIXTURE, "Fixture.swift", 1, "semibold"), [])

    def test_line_with_weight_dropped_fails(self):
        failures = audit_line(AFTER_FIXTURE_DROPPED, "Fixture.swift", 1, "semibold")
        self.assertTrue(len(failures) > 0)

    def test_new_site_line_with_weight_present_passes(self):
        self.assertEqual(audit_line(NEW_SITE_BEFORE_FIXTURE, "UsageTotalsGrid.swift", 1, "semibold"), [])

    def test_new_site_line_with_weight_dropped_fails(self):
        failures = audit_line(NEW_SITE_AFTER_FIXTURE_DROPPED, "UsageTotalsGrid.swift", 1, "semibold")
        self.assertTrue(len(failures) > 0)

    def test_weight_on_more_indented_continuation_line_passes(self):
        self.assertEqual(
            audit_line(STATEMENT_CONTINUATION_FIXTURE, "TranscriptLogRowView.swift", 1, "semibold"),
            [],
        )

    def test_weight_on_same_or_less_indented_sibling_statement_does_not_satisfy_pinned_line(self):
        failures = audit_line(SIBLING_STATEMENT_FIXTURE, "TranscriptLogRowView.swift", 1, "semibold")
        self.assertTrue(len(failures) > 0)


class ZeroUnclassifiedCrossCheckFixtureTests(unittest.TestCase):
    """(R3 correction) A repo whose real weight-override sites exactly match the pinned EXCEPTIONS
    list must find them correctly; a repo with one extra, un-pinned site must be reported as
    UNCLASSIFIED, not silently ignored."""

    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.repo_root = self.tmp_dir.name
        for root in ("HermesMobile", "HermesShareExtension", "HermesLiveActivityWidget"):
            os.makedirs(os.path.join(self.repo_root, root), exist_ok=True)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def _write(self, rel_path, content):
        full_path = os.path.join(self.repo_root, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

    def test_find_real_weight_override_sites_matches_line_accounting(self):
        # 21 filler lines then the real site on line 22 — proves line-number accounting matches
        # audit_line's own 1-indexed convention exactly, using a real pinned EXCEPTIONS entry's own
        # file/line/weight (ChatComposerView.swift:22, .bold).
        self._write(
            "HermesMobile/Features/Chat/ChatComposerView.swift",
            "line\n" * 21 + '                        .font(AppFont.caption(weight: .bold))\n',
        )
        sites = find_real_weight_override_sites(self.repo_root)
        self.assertIn(("HermesMobile/Features/Chat/ChatComposerView.swift", 22, "bold"), sites)

    def test_unclassified_new_site_is_reported(self):
        self._write(
            "HermesMobile/Features/Chat/BrandNewView.swift",
            '                .font(AppFont.headline(weight: .medium))\n',
        )
        original_exceptions = weight_exception_audit_module.EXCEPTIONS
        weight_exception_audit_module.EXCEPTIONS = []  # this fixture repo has no other real sites
        try:
            failures = audit_repo(self.repo_root)
        finally:
            weight_exception_audit_module.EXCEPTIONS = original_exceptions
        self.assertTrue(any("UNCLASSIFIED" in f and "BrandNewView.swift:1" in f for f in failures))

    def test_repo_matching_pinned_exceptions_exactly_has_zero_unclassified(self):
        self._write(
            "HermesMobile/Features/Chat/ChatComposerView.swift",
            "line\n" * 21 + '                        .font(AppFont.caption(weight: .bold))\n',
        )
        original_exceptions = weight_exception_audit_module.EXCEPTIONS
        weight_exception_audit_module.EXCEPTIONS = [
            ("HermesMobile/Features/Chat/ChatComposerView.swift", 22, "bold"),
        ]
        try:
            failures = audit_repo(self.repo_root)
        finally:
            weight_exception_audit_module.EXCEPTIONS = original_exceptions
        self.assertEqual(failures, [])

    def test_audit_line_accepts_migrated_appfont_form_at_its_pinned_line(self):
        # (TY-7 migration) A pinned EXCEPTIONS row's own line still passes once TY-7 migrates that
        # exact call from the deprecated `AppFont.<role>(weight:)` factory shape to the approved
        # `.appFont(<role>, weight:)` destination shape — `audit_line` checks the literal weight
        # token on the pinned line number, not the surrounding call syntax.
        migrated_line = '                .appFont(.caption, weight: .medium)\n'
        self.assertEqual(audit_line(migrated_line, "ChatMessageMeta.swift", 1, "medium"), [])

    def test_find_real_weight_override_sites_ignores_migrated_appfont_form(self):
        # (Kept scoped, deliberately — see WEIGHT_OVERRIDE_PATTERN's own comment.) A `.appFont(role,
        # weight:)` call is TY-6's own destination shape for hundreds of unrelated raw-semantic sites
        # never in the pinned 55; the cross-check must not treat every one of them as an unpinned,
        # newly-discovered deprecated-factory site.
        self._write(
            "HermesMobile/Features/Chat/SomeOtherView.swift",
            '                .appFont(.subheadline, weight: .semibold)\n',
        )
        sites = find_real_weight_override_sites(self.repo_root)
        self.assertEqual(sites, [])


if __name__ == "__main__":
    unittest.main()
