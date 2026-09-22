#!/usr/bin/env python3
import argparse
import os
import re

TARGET_FUNCTIONS = ["footnote", "caption2"]


def extract_function_body(source, function_name):
    header_pattern = re.compile(r"static func " + re.escape(function_name) + r"\([^)]*\)\s*->\s*Font\s*\{")
    match = header_pattern.search(source)
    if not match:
        return None
    depth = 0
    start = match.end() - 1  # index of the opening '{'
    for i in range(start, len(source)):
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
            if depth == 0:
                return source[start + 1:i]
    return None


def audit_source(source):
    failures = []
    for name in TARGET_FUNCTIONS:
        body = extract_function_body(source, name)
        if body is None:
            failures.append(f"could not locate static func {name}(...) -> Font")
            continue
        if "system(.caption," not in body:
            failures.append(f"{name}() body does not delegate to system(.caption, ...)")
        if "system(.footnote," in body or "system(.caption2," in body:
            failures.append(f"{name}() body still calls its own native system(.{name}, ...)")
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--file",
        default=os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "HermesMobile", "Config", "AppFont.swift",
        ),
    )
    args = parser.parse_args()
    with open(args.file, "r", encoding="utf-8") as f:
        source = f.read()
    failures = audit_source(source)
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)
    print("hermex-typography-delegation-audit: PASS")


if __name__ == "__main__":
    main()
