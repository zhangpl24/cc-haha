# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

| Task | Command |
|---|---|
| Run CLI (TUI) | `./bin/claude-haha` or `bun run start` |
| Run CLI (headless) | `./bin/claude-haha -p "prompt"` |
| Install deps | `bun install` |
| Start API server | `SERVER_PORT=3456 bun run src/server/index.ts` |
| Desktop dev | `cd desktop && bun run dev` |
| Desktop lint | `cd desktop && bun run lint` |
| Desktop tests | `cd desktop && bun run test -- --run` |
| Desktop build | `cd desktop && bun run build` |
| Docs dev | `bun run docs:dev` |
| Docs build | `bun run docs:build` |

## Architecture

This is a Bun-based TypeScript project. It is a local fork of Claude Code (Anthropic's coding agent) with support for any Anthropic-compatible API, a React/Ink terminal UI, a Tauri 2 + React desktop app, and IM adapters for Telegram/Feishu/WeChat/DingTalk.

**Root (`src/`)**: CLI agent with React/Ink TUI (`src/screens/REPL.tsx`). Main entry: `src/entrypoints/cli.tsx` → `bin/claude-haha` (bash wrapper that preps env and execs bun). Recovery CLI: `src/localRecoveryCli.ts` (plain readline, no Ink).

**Server (`src/server/`)**: Bun HTTP + WebSocket server that backs the desktop UI. Entry: `src/server/index.ts`. Routes: `/api/*` (REST), `/ws/*` (WebSocket for desktop client ↔ CLI session), `/sdk/*` (SDK WebSocket for spawned child CLI processes), `/proxy/*` (protocol-translating proxy for OpenAI-compatible APIs), `/callback` and `/callback/openai` (OAuth callbacks). Defaults to port 3456, host 127.0.0.1.

**Tools (`src/tools/`)**: Agent tool implementations — Bash, FileEdit, FileRead, FileWrite, Grep, Glob, WebFetch, WebSearch, Task (CRUD), Agent, Skill, LSP, MCP, and many more. Each tool is in its own subdirectory.

**Commands (`src/commands/`)**: Slash commands available in the REPL (e.g., `/init`, `/commit`, `/review`, `/mcp`, `/doctor`).

**Services (`src/services/`)**: API clients, MCP server management, OAuth flows, LSP integration, analytics, voice, rate limiting, session memory, skill search, and compact/context collapse.

**Desktop (`desktop/`)**: React 18 + Vite frontend (`desktop/src/`) backed by a Tauri 2 shell (`desktop/src-tauri/`). Uses zustand for state, Tailwind CSS 4 for styling, Vitest + Testing Library for tests (jsdom environment). Communicates with the Bun server via REST + WebSocket.

**Adapters (`adapters/`)**: IM gateway implementations (Telegram, Feishu, WeChat, DingTalk) that bridge chat messages to the CLI. Use `cd adapters && bun install` before working there.

**Docs: VitePress (`docs/`)**, built with `npm ci` (not Bun). Docs workflow runs on Node 22.

**Skills (`src/skills/`)**: Bundled skills loaded via `src/skills/bundledSkills.ts` plus MCP-loaded skills.

**Bridge (`src/bridge/`)**: Desktop CLI launcher that spawned CLI processes use to communicate back to the server.

## Pre-PR Quality Gates

Run these before claiming a change is ready. Quality reports land in `artifacts/quality-runs/<timestamp>/`.

| Scope | Command |
|---|---|
| Everything (no live model) | `bun run quality:pr` |
| Server, tools, MCP, OAuth | `bun run check:server` |
| Desktop UI, stores, API clients | `bun run check:desktop` |
| Tauri, sidecars, native packaging | `bun run check:native` |
| IM adapters | `bun run check:adapters` |
| Docs, README, VitePress | `bun run check:docs` |
| Live model baseline | `bun run quality:providers` then `bun run quality:gate --mode baseline --allow-live --provider-model <selector>` |
| Release gate | `bun run quality:gate --mode release --allow-live --provider-model <selector>` |

Note: `check:docs` runs `npm ci` which can rebuild `node_modules`. Run it sequentially, not in parallel with other checks.

## Desktop Release

Releases are built by GitHub Actions (`.github/workflows/release-desktop.yml`) on `v*.*.*` tag push. Use `bun run scripts/release.ts <version>` to cut a release — it updates versions, refreshes `Cargo.lock`, requires `release-notes/vX.Y.Z.md`, commits, and creates the tag. Push with `git push origin main --tags`. Release body comes from the release-notes file in the tagged commit.

macOS Apple Silicon local packaging: `desktop/scripts/build-macos-arm64.sh`.

## Coding Style

TypeScript, ESM imports, 2-space indent, no semicolons, `PascalCase` for React components, `camelCase` for functions/hooks/stores. Avoid adding new dependencies unless existing utilities can't cover the change.

## Commit Style

Conventional Commits (`feat:`, `fix:`, `docs:`, etc.). Branches: `fix/xxx`, `feat/xxx`, `docs/xxx`.

## Env & Configuration

Copy `.env.example` → `.env` and edit API keys. Key env vars: `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`.

Recovery mode: `CLAUDE_CODE_FORCE_RECOVERY_CLI=1 ./bin/claude-haha`.

Path alias: `src/*` maps to `./src/*` (see `tsconfig.json`). Stubs for native modules in `stubs/`.
