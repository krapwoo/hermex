import os
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_token_audit import audit  # noqa: E402


FIXTURE_FILE = """\
import SwiftUI

struct FixtureView: View {
    let controlFont: Font
    let chevronFont: Font

    private var metaControlFont: Font { AppFont.subheadline() }
    private var metaChevronFont: Font { AppFont.caption2() }

    var body: some View {
        VStack(spacing: 12) {
            Text("a").font(.caption)
            Text("b").font(.system(.footnote, design: .rounded))
            Text("c").font(
                AppFont.mono(
                    style: .caption,
                    weight: .semibold
                )
            )
            Text("d")
                .font(controlFont)
            Image(systemName: "chevron.down")
                .font(chevronFont)
        }
        .padding(.horizontal, 16)
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 14)
        )
    }
}

struct FixtureCaller: View {
    var body: some View {
        FixtureRow(controlFont: AppFont.subheadline(), chevronFont: AppFont.caption2())
    }
}

enum FixtureMotion {
    static let bundle = (
        duration: 0.18,
        curve: Animation.easeInOut(
            duration: 0.35
        )
    )
}
"""


# (R16 correction) A Live Activity fixture root, proving the typography exclusion is
# category-specific: this file carries one typography match (`.font(.caption)`) that a
# default-root `typography_raw_semantic` scan must omit, and one non-typography match
# (`cornerRadius: 20`) that a default-root `radius` scan must still count — never a global
# root removal.
WIDGET_FIXTURE_FILE = """\
import SwiftUI

struct FixtureWidgetView: View {
    var body: some View {
        VStack {
            Text("widget").font(.caption)
            Text("widget-system").font(.system(.footnote, design: .rounded))
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
        )
    }
}
"""


class HermexTokenAuditFixtureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.root = os.path.join(self.tmp, "HermesMobile", "Features", "Fixture")
        os.makedirs(self.root)
        self.fixture_path = os.path.join(self.root, "FixtureView.swift")
        with open(self.fixture_path, "w", encoding="utf-8") as f:
            f.write(FIXTURE_FILE)
        # (R16 correction) Live Activity fixture root — see WIDGET_FIXTURE_FILE above.
        self.widget_root = os.path.join(self.tmp, "HermesLiveActivityWidget")
        os.makedirs(self.widget_root)
        self.widget_fixture_path = os.path.join(self.widget_root, "AgentRunFixtureWidget.swift")
        with open(self.widget_fixture_path, "w", encoding="utf-8") as f:
            f.write(WIDGET_FIXTURE_FILE)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_typography_raw_semantic_finds_caption(self):
        rows = audit(self.tmp, "typography_raw_semantic", path_filter="HermesMobile")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["match"], ".font(.caption")

    def test_typography_raw_system_semantic_finds_footnote(self):
        rows = audit(self.tmp, "typography_raw_system_semantic", path_filter="HermesMobile")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["match"], ".font(.system(.footnote")

    def test_deprecated_appfont_finds_five_calls_across_properties_and_a_call_site(self):
        # metaControlFont/metaChevronFont each call AppFont once, and FixtureCaller's call site
        # passes AppFont.subheadline()/AppFont.caption2() directly — 2 + 2 + 1 (mono) = 5.
        rows = audit(self.tmp, "typography_deprecated_appfont", path_filter="HermesMobile")
        matches = sorted(r["match"] for r in rows)
        self.assertEqual(
            matches,
            ["AppFont.caption2(", "AppFont.caption2(", "AppFont.mono(", "AppFont.subheadline(", "AppFont.subheadline("],
        )

    def test_font_role_direct_argument_finds_appfont_call_site_arguments(self):
        rows = audit(self.tmp, "font_role_direct_argument", path_filter="HermesMobile")
        self.assertEqual(len(rows), 2)
        matches = sorted(r["match"] for r in rows)
        self.assertEqual(matches, ["chevronFont: AppFont.", "controlFont: AppFont."])

    def test_font_role_stored_property_finds_font_typed_declarations(self):
        rows = audit(self.tmp, "font_role_stored_property", path_filter="HermesMobile")
        self.assertEqual(len(rows), 4)

    def test_font_role_applied_finds_dot_font_of_variable(self):
        rows = audit(self.tmp, "font_role_applied", path_filter="HermesMobile")
        self.assertEqual(len(rows), 2)
        matches = sorted(r["match"] for r in rows)
        self.assertEqual(matches, [".font(chevronFont)", ".font(controlFont)"])

    def test_spacing_param_finds_vstack_spacing(self):
        rows = audit(self.tmp, "spacing_param", path_filter="HermesMobile")
        self.assertEqual(len(rows), 1)
        self.assertIn("12", rows[0]["match"])

    def test_padding_call_finds_both_calls(self):
        rows = audit(self.tmp, "padding_call", path_filter="HermesMobile")
        self.assertEqual(len(rows), 2)

    def test_radius_finds_corner_radius(self):
        rows = audit(self.tmp, "radius", path_filter="HermesMobile")
        self.assertEqual(len(rows), 1)
        self.assertIn("14", rows[0]["match"])

    def test_motion_duration_finds_multiline_duration_inside_tuple(self):
        rows = audit(self.tmp, "motion_duration", path_filter="HermesMobile")
        matches = sorted(r["match"] for r in rows)
        self.assertEqual(matches, ["duration: 0.18", "duration: 0.35"])

    def test_line_numbers_are_one_indexed_and_correct_for_multiline_matches(self):
        rows = audit(self.tmp, "typography_deprecated_appfont", path_filter="HermesMobile")
        mono_row = next(r for r in rows if r["match"] == "AppFont.mono(")
        with open(self.fixture_path, "r", encoding="utf-8") as f:
            lines = f.read().split("\n")
        self.assertEqual(lines[mono_row["line"] - 1].strip(), "AppFont.mono(")

    def test_typography_raw_semantic_excludes_live_activity_widget_root_by_default(self):
        # (R16 correction) A default-root scan (no path_filter) must omit a genuine typography
        # match that lives under HermesLiveActivityWidget — the exclusion is category-specific
        # (only the two typography buckets), never a global root removal.
        rows = audit(self.tmp, "typography_raw_semantic")
        files = {r["file"] for r in rows}
        self.assertNotIn(os.path.join("HermesLiveActivityWidget", "AgentRunFixtureWidget.swift"), files)
        self.assertEqual(len(rows), 1)  # only FixtureView.swift's .font(.caption) match

    def test_typography_raw_system_semantic_excludes_live_activity_widget_root_by_default(self):
        rows = audit(self.tmp, "typography_raw_system_semantic")
        files = {r["file"] for r in rows}
        self.assertNotIn(os.path.join("HermesLiveActivityWidget", "AgentRunFixtureWidget.swift"), files)
        self.assertEqual(len(rows), 1)  # only FixtureView.swift's .font(.system(.footnote match

    def test_radius_still_scans_live_activity_widget_root_by_default(self):
        # (R16 correction) A non-typography bucket's default-root scan must still include a
        # genuine match under HermesLiveActivityWidget, proving the exclusion above is not a
        # global root removal.
        rows = audit(self.tmp, "radius")
        files = {r["file"] for r in rows}
        self.assertIn(os.path.join("HermesLiveActivityWidget", "AgentRunFixtureWidget.swift"), files)
        self.assertEqual(len(rows), 2)  # FixtureView.swift's cornerRadius: 14 plus the widget's cornerRadius: 20


if __name__ == "__main__":
    unittest.main()
