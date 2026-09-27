import os
import subprocess
import unittest

REPO_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))

REQUIRED_CATALOG_PATHS = [
    "design-system-catalog/README.md",
    "design-system-catalog/WHEN_TO_USE.md",
    "design-system-catalog/tokens/index.ts",
    "design-system-catalog/tokens/semantic.ts",
    "design-system-catalog/icons/index.ts",
    "design-system-catalog/icons/Icon.native.tsx",
    "design-system-catalog/native/index.ts",
    "design-system-catalog/native/catalog/hermes/hermesSections.tsx",
    "design-system-catalog/test/hermes-catalog.test.mjs",
    "design-system-catalog/native-preview/App.tsx",
    "design-system-catalog/native-preview/index.ts",
    "design-system-catalog/native-preview/app.json",
    "design-system-catalog/native-preview/package.json",
    "design-system-catalog/native-preview/package-lock.json",
    "design-system-catalog/native-preview/tsconfig.json",
    "design-system-catalog/native-preview/metro.config.js",
    "design-system-catalog/native-preview/.gitignore",
    "design-system-catalog/native-preview/LICENSE",
    "design-system-catalog/native-preview/assets/icon.png",
    "design-system-catalog/native-preview/dist/index.html",
]

# Dependency, generated, evidence, planning, and agent-runtime artifacts that must never land
# in the in-repository copy, even though they exist in the standalone source catalog.
FORBIDDEN_CATALOG_PATHS = [
    "design-system-catalog/node_modules",
    "design-system-catalog/.expo",
    "design-system-catalog/.claude",
    "design-system-catalog/.superpowers",
    "design-system-catalog/.DS_Store",
    "design-system-catalog/evidence",
    "design-system-catalog/docs/evidence",
    "design-system-catalog/docs/superpowers",
    "design-system-catalog/AGENTS.md",
    "design-system-catalog/CLAUDE.md",
    "design-system-catalog/native/.DS_Store",
    "design-system-catalog/native/components/.DS_Store",
    "design-system-catalog/native-preview/node_modules",
    "design-system-catalog/native-preview/.expo",
    "design-system-catalog/native-preview/.claude",
    "design-system-catalog/native-preview/AGENTS.md",
    "design-system-catalog/native-preview/CLAUDE.md",
    "design-system-catalog/native-preview/dist/bundle.js",
]


def read(rel_path):
    with open(os.path.join(REPO_ROOT, rel_path), "r", encoding="utf-8") as handle:
        return handle.read()


def publishable_paths():
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return {path for path in result.stdout.split("\0") if path}


class DesignSystemCatalogRepositoryTests(unittest.TestCase):
    def test_required_catalog_source_files_exist_in_repository(self):
        for rel_path in REQUIRED_CATALOG_PATHS:
            with self.subTest(rel_path=rel_path):
                self.assertTrue(
                    os.path.exists(os.path.join(REPO_ROOT, rel_path)),
                    f"expected canonical in-repository catalog file: {rel_path}",
                )

    def test_forbidden_generated_dependency_and_agent_artifact_paths_are_not_publishable(self):
        paths = publishable_paths()
        for rel_path in FORBIDDEN_CATALOG_PATHS:
            with self.subTest(rel_path=rel_path):
                self.assertFalse(
                    any(path == rel_path or path.startswith(f"{rel_path}/") for path in paths),
                    f"forbidden path must not be tracked or publishable from the catalog: {rel_path}",
                )

    def test_pr_ci_runs_catalog_node_contract_and_typescript_from_the_in_repository_path(self):
        workflow = read(".github/workflows/pr-ci.yml")
        self.assertIn(
            "python3 -m unittest scripts.tests.test_design_system_catalog_repository -v",
            workflow,
            "PR CI must run the repository-location contract that protects the canonical catalog",
        )
        self.assertIn(
            "node --test design-system-catalog/test/hermes-catalog.test.mjs",
            workflow,
            "PR CI must run the catalog's Node contract test from the in-repository path",
        )
        self.assertIn(
            "design-system-catalog/native-preview/package-lock.json",
            workflow,
            "PR CI must install catalog dependencies from the in-repository lockfile",
        )
        self.assertRegex(
            workflow,
            r"design-system-catalog/native-preview[\s\S]{0,400}npx tsc --noEmit",
            "PR CI must typecheck the in-repository native-preview package",
        )

    def test_pr_ci_treats_catalog_only_changes_as_skipping_the_macos_suite_while_keeping_the_contract_job(self):
        workflow = read(".github/workflows/pr-ci.yml")
        self.assertRegex(
            workflow,
            r"design-system-catalog/\.\*",
            "changed-path classification must treat design-system-catalog/** like docs/scripts-only changes",
        )
        self.assertIn("design_system:", workflow)
        self.assertIn("needs: [changes, design_system, test]", workflow)

    def test_contributing_requires_updating_the_in_repository_catalog_in_the_same_pr(self):
        contributing = read("CONTRIBUTING.md")
        self.assertIn("design-system-catalog/", contributing)
        self.assertNotRegex(
            contributing,
            r"catalog source is maintained separately",
            "CONTRIBUTING.md must no longer describe the catalog as maintained separately",
        )
        self.assertRegex(
            contributing,
            r"[Uu]pdate[^.\n]*design-system-catalog/[^.\n]*in the same PR",
            "CONTRIBUTING.md must require updating design-system-catalog/ in the same PR",
        )

    def test_catalog_implementation_status_no_longer_says_it_is_maintained_outside_the_git_worktree(self):
        sections = read("design-system-catalog/native/catalog/hermes/hermesSections.tsx")
        self.assertNotRegex(
            sections,
            r"maintained outside the Git worktree",
            "catalog implementation-status copy must not claim it is maintained outside the Git worktree",
        )
        self.assertRegex(
            sections,
            r"design-system-catalog/",
            "catalog implementation-status copy must name its versioned in-repository path",
        )

    def test_catalog_readme_identifies_the_catalog_and_swiftui_source_as_one_repository(self):
        readme = read("design-system-catalog/README.md")
        self.assertTrue(
            readme.startswith("# Hermex Design System Catalog\n"),
            "the canonical catalog README must lead with the Hermex catalog identity",
        )
        self.assertNotIn(
            "read-only at `hermex/repo`",
            readme,
            "the in-repository catalog must not describe the SwiftUI source as an external read-only tree",
        )
        self.assertIn(
            "`HermesMobile/`",
            readme,
            "the catalog README must point at the SwiftUI source in this repository",
        )


if __name__ == "__main__":
    unittest.main()
