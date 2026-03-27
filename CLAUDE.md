# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

GitHub Action that creates Vercel deployments (preview or production) from GitHub workflows. Supports `pull_request`, `pull_request_review`, `push`, and `release` events. Optionally posts deployment URLs as GitHub comments.

## Commands

- `yarn lint` — ESLint with zero warnings tolerance
- `yarn type-check` — TypeScript type checking (no emit)
- `yarn format` — Prettier formatting
- `yarn package` — Bundle with `@vercel/ncc` into `dist/index.js` (must be run and committed after any source change)

No test suite exists yet (`yarn test` is a no-op).

## Build & Release

The action entry point is `dist/index.js`, built by ncc from `src/index.ts`. The `dist/` directory is checked into the repo — after changing source files, run `yarn package` and commit the updated `dist/`.

Releases use semantic-release with conventional commits (`commitlint` + `commitizen` enforced via husky pre-commit hooks). Lint-staged runs Prettier and ESLint on staged files.

## Architecture

Five source files in `src/`:

- **`index.ts`** — Entry point. Orchestrates the flow: pull env → build → deploy → alias (preview only) → comment.
- **`vercel.ts`** (`Vercel` class) — Wraps the Vercel CLI (`npx vercel@<version>`) for pull/build/deploy/alias commands. Handles branch alias calculation with Vercel's 63-char limit and SHA-based truncation.
- **`vercel-client.ts`** (`VercelClient` class) — HTTP client for the Vercel REST API (teams, projects, deployments, aliases). Used for alias calculation and building comment bodies.
- **`github.ts`** (`GitHub` class) — Determines event type, resolves the git ref name, and manages deployment comments (create or update existing).
- **`github-client.ts`** (`GitHubClient` class) — Thin wrapper around `@actions/github` Octokit for commit and issue comment CRUD.

The `app/` directory is a minimal Next.js test fixture used by the CI workflow to validate the action against a real Vercel deployment.
