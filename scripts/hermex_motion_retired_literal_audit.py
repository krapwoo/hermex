#!/usr/bin/env python3
"""Structural, duration-context-scoped check that no retired pre-migration motion duration
literal (0.12, 0.16, 0.18, 0.22, 0.24, 0.28) remains inside any of MO-2's actual duration-bearing
declarations. Deliberately narrower than a whole-file text search: ChatTactileButtonStyle.swift and
SessionListComponents.swift both also contain unrelated opacity/color/shadow literals that legitimately
equal these same numbers (e.g. Color.accentColor.opacity(0.12), Color.red.opacity(0.16)) outside any
duration context — a plain grep for these six values against the whole file is therefore unsatisfiable,
which is exactly why this script exists in place of one.
"""
import argparse
import re

RETIRED = re.compile(r"\b0\.(?:12|16|18|22|24|28)\b")


def extract_body(source, header_pattern, start=0):
    """Find header_pattern (which must end in a literal '{') at/after `start`, then track brace
    depth from that '{' to its matching '}'. Returns the body text (exclusive of the braces), or
    None if the header or its closing brace cannot be found."""
    match = header_pattern.search(source, start)
    if not match:
        return None
    depth = 0
    open_idx = match.end() - 1
    for i in range(open_idx, len(source)):
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
            if depth == 0:
                return source[open_idx + 1:i]
    return None


def audit_chat_motion(source):
    # ChatMotion.swift contains nothing but ChatMotion's own duration/easing declarations and
    # transition builders (including freshRowTransition's transition-attached animation duration) —
    # no unrelated numeric literal exists anywhere in this file, so a whole-file scan is already
    # safe and correct here, unlike the other two files below.
    return [f"retired literal '{m.group(0)}' remains in ChatMotion.swift" for m in RETIRED.finditer(source)]


def audit_session_list_motion(source):
    body = extract_body(source, re.compile(r"enum\s+SessionListMotion\s*\{"))
    if body is None:
        return ["could not locate enum SessionListMotion { ... } in SessionListComponents.swift"]
    return [f"retired literal '{m.group(0)}' remains in SessionListMotion" for m in RETIRED.finditer(body)]


def audit_chat_tactile_button_style(source):
    failures = []

    variant_duration = extract_body(source, re.compile(r"var\s+duration:\s*TimeInterval\s*\{"))
    if variant_duration is None:
        failures.append("could not locate Variant.duration: TimeInterval { ... } in ChatTactileButtonStyle.swift")
    else:
        failures += [
            f"retired literal '{m.group(0)}' remains in Variant.duration"
            for m in RETIRED.finditer(variant_duration)
        ]

    decision_style_body = extract_body(source, re.compile(r"struct\s+ChatDecisionButtonStyle\b[^{]*\{"))
    if decision_style_body is None:
        failures.append("could not locate struct ChatDecisionButtonStyle { ... } in ChatTactileButtonStyle.swift")
    else:
        animation_body = extract_body(decision_style_body, re.compile(r"var\s+animation:\s*Animation\?\s*\{"))
        if animation_body is None:
            failures.append("could not locate ChatDecisionButtonStyle.animation { ... }")
        else:
            failures += [
                f"retired literal '{m.group(0)}' remains in ChatDecisionButtonStyle.animation"
                for m in RETIRED.finditer(animation_body)
            ]

    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--chat-motion-file", required=True)
    parser.add_argument("--session-list-components-file", required=True)
    parser.add_argument("--chat-tactile-button-style-file", required=True)
    args = parser.parse_args()

    failures = []
    with open(args.chat_motion_file, "r", encoding="utf-8") as f:
        failures += audit_chat_motion(f.read())
    with open(args.session_list_components_file, "r", encoding="utf-8") as f:
        failures += audit_session_list_motion(f.read())
    with open(args.chat_tactile_button_style_file, "r", encoding="utf-8") as f:
        failures += audit_chat_tactile_button_style(f.read())

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)
    print("hermex-motion-retired-literal-audit: PASS")


if __name__ == "__main__":
    main()
