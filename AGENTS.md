# Repository Guidelines

## Project Structure & Module Organization
Core framework code lives in `src/`. The event flow is split by responsibility: `src/bot/` owns Discord gateway integration, `src/events/` normalizes Discord payloads into internal event shapes, `src/bus/` distributes typed events, and `src/plugins/` contains plugin infrastructure plus the command system under `src/plugins/commands/`. Cross-cutting middleware lives in `src/middleware/`, pipeline orchestration in `src/pipeline/`, and shared schemas/types in `src/types/`. The vendored config package in `src/vendor/config-schema/` is part of the runtime surface, not generated code. Tests are under `tests/unit/` and `tests/integration/`. Runnable examples live in `examples/`, and deeper design notes live in `docs/`.

## Build, Test, and Development Commands
Use Bun for local work:

- `bun run dev` starts the hot-reload entrypoint from `src/index.ts`.
- `bun run build` runs `tsc`.
- `bun run check-types` performs strict type checking with no emit.
- `bun run lint` runs Biome checks.
- `bun run lint:fix` applies Biome fixes and import organization.
- `bun test` runs the full test suite.
- `bun test tests/unit/config.test.ts` runs a single test file.
- `bun run check` runs type checks, lint, and duplication detection.

## Coding Style & Naming Conventions
Biome is the formatter and linter. The enforced style is 4-space indentation, single quotes, semicolons, trailing commas where valid in ES5, and a 120-column line width. TypeScript is in `strict` mode with `noUncheckedIndexedAccess` and `noImplicitOverride` enabled. Use kebab-case for filenames such as `in-memory-event-bus.ts`; keep classes/types/interfaces in PascalCase, functions and variables in camelCase, and constants in UPPER_CASE. Preserve the existing `@app/*` import alias when it improves clarity.

## Testing Guidelines
Tests use Bun’s built-in test runner. Place fast unit coverage in `tests/unit/` and cross-module behavior in `tests/integration/`. Match existing `*.test.ts` naming. Run `bun test` before opening a PR, and use `bun run test:coverage` when changing framework behavior or event flow.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits, as seen in history: `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`. Commitlint enforces this in the `commit-msg` hook, and Lefthook runs `bun run check-dups`, `bun run lint`, and `bun run check-types` on `pre-commit`. Pull requests should include a clear summary, linked issue when applicable, and notes on testing performed. No PR template was found, so keep the description explicit about behavior changes and doc updates.
