#!/usr/bin/env python3
import argparse
import re

ENUM_HEADER = re.compile(r"enum\s+HermesRadius\s*\{")
FORBIDDEN_MEMBER = re.compile(r"\b(?:case|static\s+(?:let|var))\s+(full|pill)\b")


def extract_enum_body(source):
    match = ENUM_HEADER.search(source)
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
    body = extract_enum_body(source)
    if body is None:
        return ["could not locate enum HermesRadius { ... }"]
    failures = []
    for match in FORBIDDEN_MEMBER.finditer(body):
        failures.append(f"HermesRadius must not declare a '{match.group(1)}' member")
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    with open(args.file, "r", encoding="utf-8") as f:
        source = f.read()
    failures = audit_source(source)
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        raise SystemExit(1)
    print("hermex-radius-full-pill-audit: PASS")


if __name__ == "__main__":
    main()
