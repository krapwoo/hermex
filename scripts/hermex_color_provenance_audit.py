#!/usr/bin/env python3
import argparse
import os
import re

HEX_LITERAL = re.compile(r"#[0-9A-Fa-f]{6}\b")
ALLOWED_REFERENCE = re.compile(r"HermesProductPalette\.\w+")

TARGETS = [
    ("HeaderLogoColor.presets", "HermesMobile/Config/AppTheme.swift"),
    ("ProjectCreationPalette.approvedColors", "HermesMobile/Features/SessionList/ProjectCreationSheet.swift"),
]


def extract_declaration_body(source, qualified_name):
    _, member = qualified_name.split(".")
    header = re.compile(r"(?:static\s+)?(?:let|var)\s+" + re.escape(member) + r"\s*(?::[^=]+)?=\s*\[")
    match = header.search(source)
    if not match:
        return None
    depth = 1
    start = match.end() - 1  # index of the opening '['
    for i in range(start + 1, len(source)):
        if source[i] == "[":
            depth += 1
        elif source[i] == "]":
            depth -= 1
            if depth == 0:
                return source[start + 1:i]
    return None


def audit_declaration(source, qualified_name):
    body = extract_declaration_body(source, qualified_name)
    if body is None:
        return [f"could not locate declaration body for {qualified_name}"]
    failures = []
    if HEX_LITERAL.search(body):
        failures.append(f"{qualified_name} contains inline hex literal(s)")
    if not ALLOWED_REFERENCE.search(body):
        failures.append(f"{qualified_name} contains no HermesProductPalette reference")
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = parser.parse_args()
    all_failures = []
    for qualified_name, rel_path in TARGETS:
        path = os.path.join(args.repo, rel_path)
        with open(path, "r", encoding="utf-8") as f:
            source = f.read()
        all_failures.extend(audit_declaration(source, qualified_name))
    if all_failures:
        for failure in all_failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)
    print("hermex-color-provenance-audit: PASS")


if __name__ == "__main__":
    main()
