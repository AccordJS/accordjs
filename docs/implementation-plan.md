# AccordJS Implementation Plan

Based on the Discord Bot Framework Architecture, here's a phase-by-phase implementation plan for you to follow. Discord.js v14.25.1 (latest stable) will be used.

## Phase 1: Project Foundation & Dependencies
**Goal:** Set up core dependencies, basic TypeScript configuration, and foundational Zod schemas

**Files to Create:**
- `src/types/events.ts` - Core event Zod schemas and type definitions
- `src/types/plugin.ts` - Plugin interface definitions
- `src/types/index.ts` - Schema and type exports

**Files to Modify:**
- `package.json` - Add discord.js@14.25.1, zod@4.x, pino, pino-pretty
- `src/index.ts` - Basic framework entry point

**Tests to Create:**
- `tests/unit/types.test.ts` - Schema validation and type tests

**Implementation Notes:**
- Use Zod schemas for all event definitions, not plain TypeScript types
- Generate TypeScript types using `z.infer<typeof Schema>`
- Enables runtime validation for Discord.js event normalization
- Example: `MessageCreateEventSchema = z.object({ type: z.literal('MESSAGE_CREATE'), ... })`

**Commit Message:** `feat: add core dependencies and foundational Zod schemas`

---

## Phase 2: Configuration & Environment Setup
**Goal:** Environment configuration, bot token management, and configuration validation

**Files to Create:**
- `src/config.ts` - Consolidated configuration schema and validation with Zod
- `.env.example` - Environment template for users

**Files to Modify:**
- `src/index.ts` - Load and validate configuration

**Tests to Create:**
- `tests/unit/config.test.ts` - Configuration validation tests

**Implementation Notes:**
- Uses vendored `config-schema` (originally `@axm-internal/config-schema`) for automatic environment variable parsing
- Package is vendored in `src/vendor/config-schema/` to avoid GitHub Package Registry authentication
- Will migrate back to npm package when publicly available
- Single file approach instead of multiple config files for simplicity
- Comprehensive JSDoc documentation for all configuration options
- Validates Discord token, client ID, and optional guild ID
- Supports all Pino log levels with intelligent defaults

**Commit Message:** `feat: add configuration management and environment validation`

---

## Phase 3: Typed Event Bus System
**Goal:** Implement the core event distribution system with full type safety

**Files to Create:**
- `src/bus/eventBus.ts` - Main event bus implementation
- `src/bus/types.ts` - Event bus specific types

**Files to Modify:**
- `src/types/events.ts` - Add event map schemas and inferred types

**Tests to Create:**
- `tests/unit/bus/eventBus.test.ts` - Event bus functionality tests

**Commit Message:** `feat: implement typed event bus system`

---

## Phase 4: Discord Gateway Integration
**Goal:** Discord client setup, intents configuration, and gateway adapter for event normalization

**Files to Create:**
- `src/bot/client.ts` - Discord client initialization
- `src/bot/intents.ts` - Discord intents configuration
- `src/bot/gateway.ts` - Gateway adapter for event normalization using Zod validation
- `src/events/normalizeMessage.ts` - Message event normalization with schema validation
- `src/events/normalizeMember.ts` - Member event normalization with schema validation
- `src/events/types.ts` - Additional normalized event schemas (if needed)

**Tests to Create:**
- `tests/unit/bot/client.test.ts` - Client initialization tests
- `tests/unit/events/normalizeMessage.test.ts` - Message normalization and schema validation tests
- `tests/unit/events/normalizeMember.test.ts` - Member normalization and schema validation tests

**Commit Message:** `feat: add Discord gateway integration and event normalization`

---

## Phase 5: Plugin Architecture Foundation
**Goal:** Core plugin system allowing registration and lifecycle management

**Files to Create:**
- `src/plugins/pluginManager.ts` - Plugin registration and management
- `src/plugins/basePlugin.ts` - Base plugin abstract class
- `src/types/pluginContext.ts` - Plugin context definitions

**Files to Modify:**
- `src/index.ts` - Integrate plugin manager

**Tests to Create:**
- `tests/unit/plugins/pluginManager.test.ts` - Plugin management tests
- `tests/unit/plugins/basePlugin.test.ts` - Base plugin tests

**Commit Message:** `feat: implement plugin architecture foundation`

---

## Phase 6: Command Router Plugin
**Goal:** Centralized command handling with parsing, permissions, and cooldowns

**Files to Create:**
- `src/plugins/commands/commandRouter.ts` - Main command routing logic
- `src/plugins/commands/commandRegistry.ts` - Command registration system
- `src/plugins/commands/types.ts` - Command-specific types
- `src/plugins/commands/parser.ts` - Command argument parsing
- `src/plugins/commands/index.ts` - Command plugin main export

**Files to Modify:**
- `src/types/events.ts` - Add command-related events

**Tests to Create:**
- `tests/unit/plugins/commands/commandRouter.test.ts`
- `tests/unit/plugins/commands/parser.test.ts`
- `tests/unit/plugins/commands/commandRegistry.test.ts`

**Commit Message:** `feat: add command router plugin with parsing and registration`

---

## Phase 7: Logging Plugin
**Goal:** Structured event logging using Pino with different log levels and formatting

**Files to Create:**
- `src/plugins/logging/logger.ts` - Pino logger setup
- `src/plugins/logging/eventLogger.ts` - Event-specific logging
- `src/plugins/logging/index.ts` - Logging plugin main export
- `src/plugins/logging/types.ts` - Logging configuration types

**Tests to Create:**
- `tests/unit/plugins/logging/eventLogger.test.ts`
- `tests/unit/plugins/logging/logger.test.ts`

**Commit Message:** `feat: add logging plugin with structured event logging`

---

## Phase 8: Framework Integration & Main Entry Point
**Goal:** Tie all components together into a cohesive framework with proper startup/shutdown

**Files to Create:**
- `src/framework.ts` - Main framework class orchestrating all components
- `src/lifecycle.ts` - Startup and shutdown lifecycle management

**Files to Modify:**
- `src/index.ts` - Complete framework initialization and startup

**Tests to Create:**
- `tests/unit/framework.test.ts` - Framework integration tests
- `tests/integration/framework.test.ts` - End-to-end framework tests

**Commit Message:** `feat: integrate all components into cohesive framework`

---

## Phase 9: Analytics Plugin
**Goal:** Event analytics, metrics collection, and basic analytics processing

**Files to Create:**
- `src/plugins/analytics/metricsCollector.ts` - Metrics collection logic
- `src/plugins/analytics/eventAnalyzer.ts` - Event analysis functionality
- `src/plugins/analytics/types.ts` - Analytics types
- `src/plugins/analytics/index.ts` - Analytics plugin export

**Tests to Create:**
- `tests/unit/plugins/analytics/metricsCollector.test.ts`
- `tests/unit/plugins/analytics/eventAnalyzer.test.ts`

**Commit Message:** `feat: add analytics plugin for event metrics and analysis`

---

## Phase 10: Documentation & Examples
**Goal:** Usage examples, plugin development guide, and comprehensive documentation

**Files to Create:**
- `examples/basic-bot/index.ts` - Basic bot example
- `examples/custom-plugin/index.ts` - Custom plugin example
- `docs/plugin-development.md` - Plugin development guide
- `docs/getting-started.md` - Getting started guide
- `docs/api-reference.md` - API documentation

**Files to Modify:**
- `README.md` - Add usage examples and links to documentation

**Commit Message:** `docs: add examples and comprehensive documentation`

---

## Implementation Notes

### Dependencies to Add
```bash
bun add discord.js@^14.25.1 zod@^4.3.6 pino@^10.3.1 pino-pretty@^13.1.3 dotenv@^17.3.1
bun add -d @types/node@^25.5.0
```

### Key Architectural Principles
1. **Discord Client Isolation** - Keep Discord.js objects in gateway layer only
2. **Event Normalization** - Transform Discord events to internal types
3. **Type Safety** - Zero `any` usage, strict TypeScript throughout
4. **Plugin Architecture** - All features as independent, event-driven plugins

### Testing Strategy
- Unit tests for each new file/module
- Schema validation tests using Zod `.safeParse()` and `.parse()`
- Integration tests for phase 8 (framework integration)
- Use Bun's built-in test runner
- Maintain test coverage as you implement

### Zod Schema Testing Examples
```typescript
// Test valid data
const result = MessageCreateEventSchema.safeParse(validEventData);
expect(result.success).toBe(true);

// Test invalid data
const badResult = MessageCreateEventSchema.safeParse(invalidData);
expect(badResult.success).toBe(false);
expect(badResult.error.issues).toHaveLength(1);
```

### Development Tips
- Follow existing code style (4 spaces, single quotes, semicolons)
- Run `bun run check` before each commit
- Use protected visibility over private in classes
- Prefer explicit types over inference where it aids readability

**Total Phases:** 10
**Estimated Timeline:** Each phase represents 1-3 days of focused development
**Dependencies:** Each phase builds on previous ones - implement sequentially