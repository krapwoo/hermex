#!/usr/bin/env python3
"""Deterministic, portable (macOS/BSD- and Linux/GNU-safe) audit of Hermex token call sites
across all three production roots. Python 3 standard library only — re, os, json, argparse.
Regex \\s/\\b shorthand behaves identically on every platform here because Python's `re` module
owns its own engine, unlike shell `grep -E`, whose \\s/\\b support is a non-portable GNU extension.
"""
import argparse
import json
import os
import re

DEFAULT_ROOTS = ["HermesMobile", "HermesShareExtension", "HermesLiveActivityWidget"]

# (R16 correction) `HermesLiveActivityWidget` is platform-owned for font/typography extraction
# and migration (design spec §0) and is excluded from these two buckets' own default-root scan
# only — every other bucket's default-root scan is untouched, including
# `typography_deprecated_appfont` and every `font_role_*` bucket. This is a per-bucket exclusion
# set, never a change to DEFAULT_ROOTS itself, so no non-typography population is ever silently
# dropped for this target.
TYPOGRAPHY_EXCLUDED_ROOTS = {
    "typography_raw_semantic": {"HermesLiveActivityWidget"},
    "typography_raw_system_semantic": {"HermesLiveActivityWidget"},
}

PATTERNS = {
    "typography_raw_semantic": re.compile(
        r"\.font\(\.(caption2?|footnote|body|callout|subheadline|headline|title2?|title3)\b"
    ),
    "typography_raw_system_semantic": re.compile(
        r"\.font\(\.system\(\.(caption2?|footnote|body|subheadline)\b"
    ),
    "typography_deprecated_appfont": re.compile(
        r"AppFont\.(caption2?|footnote|body|subheadline|headline|title2?|title3|mono)\("
    ),
    "font_role_direct_argument": re.compile(r"\b(controlFont|chevronFont)\s*:\s*AppFont\."),
    "font_role_stored_property": re.compile(
        r"\b(?:let|var)\s+(controlFont|chevronFont|metaControlFont|metaChevronFont)\s*:\s*Font\b"
    ),
    "font_role_applied": re.compile(r"\.font\((controlFont|chevronFont|metaControlFont|metaChevronFont)\)"),
    "spacing_param": re.compile(r"\bspacing:\s*(-?[0-9]+(?:\.[0-9]+)?)\b"),
    "padding_call": re.compile(r"\.padding\((?:\.[a-zA-Z]+,\s*)?(-?[0-9]+(?:\.[0-9]+)?)\)"),
    "radius": re.compile(r"cornerRadius:\s*([0-9]+(?:\.[0-9]+)?)\b"),
    "motion_duration": re.compile(r"duration:\s*(0?\.[0-9]+)\b"),
}


def walk_swift_files(root):
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in sorted(filenames):
            if name.endswith(".swift"):
                yield os.path.join(dirpath, name)


def find_matches(text, pattern):
    for m in pattern.finditer(text):
        line = text.count("\n", 0, m.start()) + 1
        yield line, m.group(0)


def audit(repo_root, bucket, path_filter=None):
    pattern = PATTERNS[bucket]
    if path_filter:
        # An explicit --path always scopes to exactly that one directory, for any bucket,
        # bypassing the default-root exclusion below entirely — a direct-inspection override,
        # not a second way to include/exclude HermesLiveActivityWidget from a whole-repo run.
        roots = [os.path.join(repo_root, path_filter)]
    else:
        excluded = TYPOGRAPHY_EXCLUDED_ROOTS.get(bucket, set())
        roots = [os.path.join(repo_root, r) for r in DEFAULT_ROOTS if r not in excluded]
    rows = []
    for root in roots:
        if not os.path.isdir(root):
            continue
        for filepath in walk_swift_files(root):
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
            rel = os.path.relpath(filepath, repo_root)
            for line, matched in find_matches(text, pattern):
                rows.append({"file": rel, "line": line, "match": matched, "bucket": bucket})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("bucket", choices=list(PATTERNS.keys()) + ["all"])
    parser.add_argument(
        "--repo",
        default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    )
    parser.add_argument("--path", default=None)
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    buckets = list(PATTERNS.keys()) if args.bucket == "all" else [args.bucket]
    all_rows = []
    for bucket in buckets:
        all_rows.extend(audit(args.repo, bucket, args.path))

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(all_rows, f, indent=2, sort_keys=True)

    counts = {}
    for row in all_rows:
        counts[row["bucket"]] = counts.get(row["bucket"], 0) + 1
    for bucket in buckets:
        print(f"{bucket}: {counts.get(bucket, 0)}")
    print(f"TOTAL: {len(all_rows)}")


if __name__ == "__main__":
    main()
