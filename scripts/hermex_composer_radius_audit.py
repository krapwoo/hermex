#!/usr/bin/env python3
import argparse
import re

DECLARATION = re.compile(r"(?:static\s+)?(?:let|var)\s+cardCornerRadius\s*(?::\s*CGFloat)?\s*=\s*([^\n]+)")


def audit_source(source):
    match = DECLARATION.search(source)
    if not match:
        return ["could not locate cardCornerRadius declaration"]
    value = match.group(1).strip().rstrip(",")
    if value != "HermesRadius.chrome":
        return [f"cardCornerRadius reads '{value}', expected 'HermesRadius.chrome'"]
    return []


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
    print("hermex-composer-radius-audit: PASS")


if __name__ == "__main__":
    main()
