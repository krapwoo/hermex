import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from hermex_motion_retired_literal_audit import (  # noqa: E402
    audit_chat_motion,
    audit_session_list_motion,
    audit_chat_tactile_button_style,
)

CHAT_MOTION_BEFORE = """
enum ChatMotion {
    static func press(duration: Double, reduceMotion: Bool) -> Animation? {
        reduceMotion ? .easeOut(duration: 0.12) : .smooth(duration: duration, extraBounce: 0)
    }
}
"""

CHAT_MOTION_AFTER = """
enum ChatMotion {
    static func press(duration: Double, reduceMotion: Bool) -> Animation? {
        reduceMotion ? .easeOut(duration: HermesMotion.Duration.d100) : .smooth(duration: duration, extraBounce: 0)
    }
}
"""

SESSION_LIST_BEFORE = """
struct Unrelated {
    var body: some View {
        Color.accentColor.opacity(0.12)
    }
}

enum SessionListMotion {
    static func pressAnimation(reduceMotion: Bool) -> Animation? {
        reduceMotion ? .easeOut(duration: 0.12) : .smooth(duration: 0.18, extraBounce: 0)
    }
}
"""

SESSION_LIST_AFTER = """
struct Unrelated {
    var body: some View {
        Color.accentColor.opacity(0.12)
    }
}

enum SessionListMotion {
    static func pressAnimation(reduceMotion: Bool) -> Animation? {
        reduceMotion ? .easeOut(duration: HermesMotion.Duration.d100) : .smooth(duration: HermesMotion.Duration.d200, extraBounce: 0)
    }
}
"""

CHAT_TACTILE_BEFORE = """
struct ChatTactileButtonStyle: ButtonStyle {
    enum Variant {
        case icon
        var duration: TimeInterval {
            switch self {
            case .icon:
                0.16
            }
        }
    }
}

struct ChatDecisionButtonStyle: ButtonStyle {
    private func backgroundColor(isPressed: Bool) -> Color {
        Color.white.opacity(isPressed ? 0.12 : 0.08)
    }

    private var animation: Animation? {
        ChatMotion.press(duration: 0.18, reduceMotion: reduceMotion)
    }
}
"""

CHAT_TACTILE_AFTER = """
struct ChatTactileButtonStyle: ButtonStyle {
    enum Variant {
        case icon
        var duration: TimeInterval {
            switch self {
            case .icon:
                HermesMotion.Duration.d150
            }
        }
    }
}

struct ChatDecisionButtonStyle: ButtonStyle {
    private func backgroundColor(isPressed: Bool) -> Color {
        Color.white.opacity(isPressed ? 0.12 : 0.08)
    }

    private var animation: Animation? {
        ChatMotion.press(duration: HermesMotion.Duration.d200, reduceMotion: reduceMotion)
    }
}
"""


class MotionRetiredLiteralAuditFixtureTests(unittest.TestCase):
    def test_chat_motion_before_fails(self):
        self.assertTrue(len(audit_chat_motion(CHAT_MOTION_BEFORE)) > 0)

    def test_chat_motion_after_passes(self):
        self.assertEqual(audit_chat_motion(CHAT_MOTION_AFTER), [])

    def test_session_list_motion_before_fails_but_ignores_unrelated_opacity(self):
        failures = audit_session_list_motion(SESSION_LIST_BEFORE)
        self.assertTrue(len(failures) > 0)
        self.assertTrue(all("SessionListMotion" in f for f in failures))

    def test_session_list_motion_after_passes_while_unrelated_opacity_remains(self):
        self.assertIn("0.12", SESSION_LIST_AFTER)  # the unrelated Color.accentColor literal stays
        self.assertEqual(audit_session_list_motion(SESSION_LIST_AFTER), [])

    def test_chat_tactile_before_fails_for_both_scoped_declarations(self):
        failures = audit_chat_tactile_button_style(CHAT_TACTILE_BEFORE)
        self.assertTrue(any("Variant.duration" in f for f in failures))
        self.assertTrue(any("ChatDecisionButtonStyle.animation" in f for f in failures))

    def test_chat_tactile_after_passes_while_unrelated_opacity_remains(self):
        self.assertIn("0.12", CHAT_TACTILE_AFTER)  # backgroundColor's own opacity literal stays
        self.assertEqual(audit_chat_tactile_button_style(CHAT_TACTILE_AFTER), [])


if __name__ == "__main__":
    unittest.main()
