# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

GitHub Action (Node 24 runtime) that creates Vercel deployments (preview or production) from GitHub workflows. Supports `pull_request`, `pull_request_review`, `push`, and `release` events. Optionally posts deployment URLs as GitHub comments.

## Commands

- `yarn lint` — ESLint (flat config) with zero warnings tolerance
- `yarn type-check` — TypeScript type checking (no emit)
- `yarn test` — Vitest unit tests
- `yarn format` — Prettier formatting
- `yarn package` — Bundle with `@vercel/ncc` into `dist/index.js` (must be run and committed after any source change)

## Build & Release

The action entry point is `dist/index.js`, built by ncc from `src/index.ts`. The `dist/` directory is checked into the repo — after changing source files, run `yarn package` and commit the updated `dist/`.

The project is ESM (`"type": "module"` in package.json, `nodenext` module resolution). Relative imports use `.js` extensions.

Releases use semantic-release with conventional commits (`commitlint` + `commitizen` enforced via husky pre-commit hooks). Semantic-release uses `GITHUB_TOKEN` (not a PAT) and creates GitHub Releases directly — it does not push `CHANGELOG.md` or `package.json` updates back to `main` due to branch protection. The `v4` major tag must be updated manually via the "Update Main Version" workflow dispatch after each release.

## Architecture

Six source files in `src/`:

- **`index.ts`** — Entry point. Orchestrates the flow: pull env → build → deploy → alias (preview only) → comment.
- **`vercel.ts`** (`Vercel` class) — Wraps the Vercel CLI (`npx vercel@<version>`) for pull/build/deploy/alias commands. Delegates alias calculation to `utils.ts`.
- **`vercel-client.ts`** (`VercelClient` class) — HTTP client for the Vercel REST API (teams, projects, deployments, aliases). Used for alias calculation and building comment bodies.
- **`github.ts`** (`GitHub` class) — Determines event type, resolves the git ref name, and manages deployment comments (create or update existing).
- **`github-client.ts`** (`GitHubClient` class) — Thin wrapper around `@actions/github` Octokit for commit and issue comment CRUD.
- **`utils.ts`** — Pure functions for ref name slugification, truncation (Vercel's 63-char alias limit with SHA hash), and alias URL composition. Tested in `utils.test.ts`.

The `app/` directory is a minimal Next.js test fixture used by the CI workflow to validate the action against a real Vercel deployment.
