# AccordJS Implementation Plan (Current State)

This document replaces the older roadmap with an accurate status of what is implemented today and what remains.

## Scope and Baseline

- Architecture baseline: explicit plugin `eventMap` + class-based middleware + typed event pipeline.
- Backward compatibility and migration path are not required for this architecture because it was not released before these changes.
- File naming convention remains `kebab-case`.

## Runtime Flow

```text
Discord Gateway -> Event Normalization -> Event Bus
-> Global Middleware -> Plugin Middleware -> Mapped Plugin Handlers
```

## Status Legend

- `Completed`: implemented in source and covered by tests.
- `Partial`: implemented but has known follow-up work.
- `Not Started`: not implemented.
- `Deprecated`: removed from active plan.

## Phase Status

### Phase 1: Project Foundation and Dependencies
Status: `Completed`

Implemented:
- Zod-based event schemas and inferred types in `src/types/events.ts`.
- Core type exports in `src/types/index.ts`.
- Foundation tests in `tests/unit/types.test.ts`.

### Phase 2: Configuration and Environment Setup
Status: `Completed`

Implemented:
- Consolidated config schema in `src/config.ts`.
- Vendored config-schema integration in `src/vendor/config-schema/`.
- Environment template in `.env.example`.
- Config tests in `tests/unit/config.test.ts`.

Notes:
- Global middleware configuration is now part of config and loaded at startup.

### Phase 3: Typed Event Bus System
Status: `Completed`

Implemented:
- Event bus interface and in-memory implementation in `src/bus/types.ts` and `src/bus/in-memory-event-bus.ts`.
- Global middleware registration/removal/listing on the event bus.
- Unit and integration coverage in `tests/unit/bus/in-memory-event-bus.test.ts` and `tests/integration/middleware.integration.test.ts`.

### Phase 4: Discord Gateway Integration
Status: `Completed`

Implemented:
- Discord client and intents in `src/bot/client.ts` and `src/bot/intents.ts`.
- Gateway adapter in `src/bot/gateway.ts`.
- Normalizers in `src/events/normalize-message.ts` and `src/events/normalize-member.ts`.
- Tests in `tests/unit/bot/client.test.ts`, `tests/unit/events/normalize-message.test.ts`, and `tests/unit/events/normalize-member.test.ts`.

### Phase 5: Plugin Architecture Foundation
Status: `Completed`

Implemented:
- Base plugin, plugin manager, and plugin context in `src/plugins/base-plugin.ts`, `src/plugins/plugin-manager.ts`, and `src/types/plugin-context.ts`.
- Explicit event mapping and handler validation in `src/plugins/event-mapper.ts` and `src/plugins/handler-registry.ts`.
- Plugin middleware manager in `src/plugins/plugin-middleware-manager.ts`.
- Tests in `tests/unit/plugins/base-plugin.test.ts`, `tests/unit/plugins/plugin-manager.test.ts`, `tests/unit/plugins/event-mapper.test.ts`, `tests/unit/plugins/explicit-mapping.test.ts`, and `tests/unit/plugins/plugin-middleware.test.ts`.

### Phase 6: Command Router Plugin
Status: `Completed`

Implemented:
- Command router, parser, registry, and types in `src/plugins/commands/`.
- Command lifecycle event support in `src/types/events.ts`.
- Tests in `tests/unit/plugins/commands/command-router.test.ts`, `tests/unit/plugins/commands/parser.test.ts`, and `tests/unit/plugins/commands/command-registry.test.ts`.

### Phase 7: Middleware and Pipeline Architecture
Status: `Completed`

Implemented:
- Middleware primitives in `src/middleware/types.ts`, `src/middleware/base-middleware.ts`, and `src/middleware/middleware-runner.ts`.
- Pipeline context/execution in `src/pipeline/pipeline-context.ts` and `src/pipeline/event-pipeline.ts`.
- Built-in middleware in `src/middleware/built-in/`.
- Config-driven global middleware loading in `src/middleware/config-loader.ts` (consumer bootstrap chooses whether to wire it).
- Coverage in `tests/unit/middleware/`, `tests/unit/pipeline/event-pipeline.test.ts`, and `tests/integration/pipeline/full-pipeline.test.ts`.

### Phase 8: Documentation and Examples
Status: `Partial`

Implemented:
- Plugin architecture plan in `docs/new-plugin-architecture.md`.
- Plugin development guide in `docs/plugin-development.md`.
- Example plugin in `examples/eventmap-middleware-plugin.ts`.

Remaining:
- Add `docs/getting-started.md`.
- Add `docs/api-reference.md`.
- Expand example catalog beyond a single plugin example.

### Phase 9: Logging Plugin (Old Plan)
Status: `Deprecated`

Reason:
- Logging is now handled through `createLogger` and `LoggerMiddleware` in the middleware layer.
- A separate logging plugin is no longer part of the target architecture.

### Phase 10: Framework Wrapper Class and Lifecycle Files (Old Plan)
Status: `Deprecated`

Reason:
- Consumers provide their own bootstrap using `PluginManager` + `InMemoryEventBus`.
- `src/framework.ts`, `src/lifecycle.ts`, and `src/main.ts` are not required by the current design (an example bootstrap now lives under `examples/`).

### Phase 11: Analytics Plugin
Status: `Not Started`

Notes:
- Basic metrics exist via `MetricsMiddleware`.
- A dedicated analytics plugin remains optional backlog work.

## Current Gaps (Priority Ordered)

1. Add focused tests for config-driven middleware loading behavior (`src/middleware/config-loader.ts`).
2. Add startup integration coverage for global middleware wiring in `src/main.ts`.
3. Publish missing docs (`docs/getting-started.md`, `docs/api-reference.md`).
4. Expand examples to include command router + global middleware configuration together.

## Out of Scope

- Legacy plugin migration tooling.
- Backward compatibility support for pre-eventMap plugin styles.

## Quality Gates

- `bun check` must pass before merge.
- `bun test` must pass before merge.
- New framework behavior must include unit and/or integration coverage in `tests/unit/` or `tests/integration/`.
