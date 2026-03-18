# New Plugin Architecture Implementation Plan

This document outlines the implementation of an enhanced plugin architecture for AccordJS with reduced boilerplate, explicit event mapping, and middleware support.

## Overview

The new architecture introduces three major improvements:

1. **Explicit Event Mapping**: Automatic event subscription based on configurable `eventMap`
2. **Class-Based Middleware System**: Reusable middleware classes for event filtering/transformation
3. **Reduced Boilerplate**: Eliminate manual event subscription code

## Current vs. New Architecture

### Current (Boilerplate Heavy):
```typescript
class WelcomePlugin extends BasePlugin {
    protected async onRegister(): Promise<void> {
        this.context!.eventBus.subscribe('MESSAGE_CREATE', this.handleMessage.bind(this));
        this.context!.eventBus.subscribe('MEMBER_JOIN', this.handleMemberJoin.bind(this));
    }

    private async handleMessage(event: MessageCreateEvent) { /* ... */ }
    private async handleMemberJoin(event: MemberJoinEvent) { /* ... */ }
}
```

### New (Explicit EventMap + Middleware Classes):
```typescript
class WelcomePlugin extends BasePlugin {
    // Explicit method-to-event mapping
    protected readonly eventMap = {
        'handleWelcomeMessage': 'MESSAGE_CREATE',
        'welcomeNewMember': 'MEMBER_JOIN',
    };

    async onRegister() {
        // Optional middleware classes
        this.addMiddleware([
            new BotFilterMiddleware(),
            new RateLimiterMiddleware({ windowMs: 60000, maxEvents: 10 })
        ]);
    }

    // Auto-subscribes to MESSAGE_CREATE
    async handleWelcomeMessage(event: MessageCreateEvent) { /* ... */ }

    // Auto-subscribes to MEMBER_JOIN
    async welcomeNewMember(event: MemberJoinEvent) { /* ... */ }
}
```

---

## Phase 1: Middleware Foundation
**Goal:** Implement the class-based middleware system for both global and plugin-scoped event processing

**Files to Create:**
- `src/middleware/types.ts` - Middleware interfaces and base class
- `src/middleware/base-middleware.ts` - Abstract base middleware class
- `src/middleware/middleware-runner.ts` - Middleware chain execution logic

**Files to Modify:**
- `src/bus/in-memory-event-bus.ts` - Add global middleware support
- `src/bus/types.ts` - Add middleware types to event bus interface

**Tests to Create:**
- `tests/unit/middleware/base-middleware.test.ts` - Base middleware functionality
- `tests/unit/middleware/middleware-runner.test.ts` - Middleware execution tests
- `tests/unit/bus/middleware-integration.test.ts` - Event bus middleware tests

**Implementation Notes:**
- Define `EventMiddleware<T>` interface with `name`, `priority`, and `execute` method
- Create `BaseMiddleware` abstract class for consistent implementation
- Implement middleware chain runner with proper error handling
- Add middleware registration methods to event bus
- All middleware classes must end with `Middleware` suffix (e.g., `RateLimiterMiddleware`)
- Support middleware state management through class instances
- Priority-based execution order (lower numbers = higher priority)

**Commit Message:** `feat: added middleware foundation for event processing`

---

## Phase 2: Explicit Event Mapping
**Goal:** Implement automatic event handler registration based on configurable `eventMap` in plugin classes

**Files to Create:**
- `src/plugins/event-mapper.ts` - Event mapping registration logic
- `src/plugins/handler-registry.ts` - Handler registration and validation

**Files to Modify:**
- `src/plugins/base-plugin.ts` - Add eventMap processing to registration
- `src/types/events.ts` - Add event mapping types

**Tests to Create:**
- `tests/unit/plugins/event-mapper.test.ts` - Event mapping logic tests
- `tests/unit/plugins/explicit-mapping.test.ts` - Integration tests for event mapping

**Implementation Notes:**
- Add protected `eventMap` property to `BasePlugin` with default conventions
- Allow plugins to override `eventMap` with custom method names
- Iterate over `eventMap` during registration to subscribe to events
- Validate that mapped methods exist on the plugin instance
- Support multiple methods mapping to the same event type
- Add error handling for invalid method references
- No reflection needed - explicit mapping only

**Default EventMap Convention:**
```typescript
// Default mapping in BasePlugin
protected readonly eventMap: Record<string, EventType> = {
    'onMessageCreate': 'MESSAGE_CREATE',
    'onMemberJoin': 'MEMBER_JOIN',
    'onMemberLeave': 'MEMBER_LEAVE',
    'onMessageDelete': 'MESSAGE_DELETE',
    'onCommandDispatch': 'COMMAND_DISPATCH',
    'onCommandExecute': 'COMMAND_EXECUTE',
    'onCommandError': 'COMMAND_ERROR',
    'onCommandPermissionDenied': 'COMMAND_PERMISSION_DENIED'
};

// Custom mapping in concrete plugin
protected readonly eventMap = {
    'moderateMessage': 'MESSAGE_CREATE',
    'checkSpamContent': 'MESSAGE_CREATE', // Multiple handlers allowed
    'welcomeNewUser': 'MEMBER_JOIN'
};
```

**Commit Message:** `feat: added explicit event mapping for automatic subscription`

---

## Phase 3: Plugin-Scoped Middleware
**Goal:** Enable plugins to register their own middleware classes that apply only to their event handlers

**Files to Create:**
- `src/plugins/plugin-middleware.ts` - Plugin-specific middleware management

**Files to Modify:**
- `src/plugins/base-plugin.ts` - Add middleware support to base plugin
- `src/plugins/event-mapper.ts` - Integrate middleware with mapped handlers

**Tests to Create:**
- `tests/unit/plugins/plugin-middleware.test.ts` - Plugin middleware functionality
- `tests/integration/plugins/middleware-isolation.test.ts` - Test middleware isolation between plugins

**Implementation Notes:**
- Add `addMiddleware(middleware: EventMiddleware[])` method to BasePlugin
- Ensure plugin middleware only affects that plugin's handlers
- Maintain middleware execution order by priority
- Support middleware chaining with `next()` function
- Allow middleware classes to modify events before handler execution
- Add middleware error handling and logging
- Middleware classes must implement `EventMiddleware` interface

**Plugin Middleware Features:**
- Event filtering (skip processing based on conditions)
- Event transformation (modify event data)
- Logging and metrics collection
- Rate limiting per plugin
- Access control and validation

**Example Plugin Middleware Usage:**
```typescript
class ModerationPlugin extends BasePlugin {
    async onRegister() {
        this.addMiddleware([
            new BotFilterMiddleware(),
            new RateLimiterMiddleware({ windowMs: 60000, maxEvents: 5 }),
            new ProfanityFilterMiddleware(['spam', 'abuse'])
        ]);
    }
}
```

**Commit Message:** `feat: added plugin-scoped middleware system`

---

## Phase 4: Enhanced Event Processing Pipeline
**Goal:** Integrate global middleware, plugin middleware, and magic methods into cohesive event processing

**Files to Create:**
- `src/pipeline/event-pipeline.ts` - Complete event processing pipeline
- `src/pipeline/pipeline-context.ts` - Pipeline execution context

**Files to Modify:**
- `src/bus/in-memory-event-bus.ts` - Integrate with new pipeline
- `src/plugins/base-plugin.ts` - Use pipeline for event processing

**Tests to Create:**
- `tests/unit/pipeline/event-pipeline.test.ts` - Pipeline execution tests
- `tests/integration/pipeline/full-pipeline.test.ts` - End-to-end pipeline tests

**Implementation Notes:**
- Create unified pipeline: Global Middleware → Plugin Middleware → Handler
- Support pipeline short-circuiting (middleware can stop processing)
- Add pipeline performance monitoring and metrics
- Implement proper error isolation (one plugin failure doesn't affect others)
- Add pipeline debugging and tracing capabilities

**Pipeline Flow:**
```
Discord Event → Global Middleware → Plugin Selection → Plugin Middleware → Mapped Handler
```

**Commit Message:** `feat: integrated enhanced event processing pipeline`

---

## Phase 5: Built-in Middleware Classes
**Goal:** Provide common middleware implementations as reusable class components

**Files to Create:**
- `src/middleware/built-in/rate-limiter-middleware.ts` - Rate limiting middleware class
- `src/middleware/built-in/profanity-filter-middleware.ts` - Content filtering middleware class
- `src/middleware/built-in/logger-middleware.ts` - Event logging middleware class
- `src/middleware/built-in/metrics-middleware.ts` - Performance metrics middleware class
- `src/middleware/built-in/bot-filter-middleware.ts` - Bot message filtering middleware class
- `src/middleware/built-in/index.ts` - Built-in middleware exports

**Tests to Create:**
- `tests/unit/middleware/built-in/rate-limiter-middleware.test.ts`
- `tests/unit/middleware/built-in/profanity-filter-middleware.test.ts`
- `tests/unit/middleware/built-in/logger-middleware.test.ts`
- `tests/unit/middleware/built-in/metrics-middleware.test.ts`
- `tests/unit/middleware/built-in/bot-filter-middleware.test.ts`

**Implementation Notes:**
- Create reusable middleware classes that can be used globally or per-plugin
- All middleware classes must extend `BaseMiddleware` and end with `Middleware` suffix
- Implement configurable rate limiting with different strategies
- Add content filtering with customizable word lists
- Create structured logging middleware for audit trails
- Implement performance metrics collection
- All middleware should be opt-in and configurable

**Built-in Middleware Classes:**
```typescript
// Rate limiting
new RateLimiterMiddleware({
    windowMs: 60000,    // 1 minute
    maxEvents: 10,      // 10 events per user
    keyGenerator: (event) => event.userId
})

// Profanity filter
new ProfanityFilterMiddleware({
    bannedWords: ['spam', 'abuse'],
    action: 'flag'      // 'flag', 'block', or 'replace'
})

// Event logger
new LoggerMiddleware({
    logLevel: 'info',
    includeContent: false,
    sensitiveFields: ['token', 'password']
})

// Bot filter
new BotFilterMiddleware()
```

**Commit Message:** `feat: added built-in middleware components for common use cases`

---

## Phase 6: Configuration-Driven Middleware
**Goal:** Enable middleware configuration through the main config system

**Files to Create:**
- `src/middleware/config-loader.ts` - Configuration-based middleware loading

**Files to Modify:**
- `src/config.ts` - Add middleware configuration section
- `src/main.ts` - Load middleware from configuration

**Tests to Create:**
- `tests/unit/middleware/config-loader.test.ts` - Middleware configuration tests
- `tests/integration/middleware/config-loading.test.ts` - Configuration loading tests

**Implementation Notes:**
- Add middleware section to main configuration schema
- Support enabling/disabling middleware via config
- Allow middleware-specific configuration options
- Implement configuration validation with Zod and env overrides
- Load and register global middleware during framework startup
- Support simple rate limit key strategies (`userId`, `channelId`, `serverId`, `eventType`, `global`)

**Configuration Example:**
```typescript
// In config schema
middleware: {
    global: {
        rateLimiter: {
            enabled: true,
            windowMs: 60000,
            maxEvents: 10
        },
        profanityFilter: {
            enabled: false,
            bannedWords: ['spam']
        }
    }
}
```

**Commit Message:** `feat: added configuration-driven middleware system`

---

## Phase 7: Documentation and Examples
**Goal:** Document the new architecture and provide concrete examples (no migration needed)

**Files to Create:**
- `examples/eventmap-middleware-plugin.ts` - Example plugin using eventMap + middleware

**Files to Modify:**
- `docs/plugin-development.md` - Update with new architecture documentation
- `docs/new-plugin-architecture.md` - Reflect completed phases and actual approach

**Tests to Create:**
- `tests/examples/eventmap-middleware-plugin.test.ts` - Optional example verification

**Implementation Notes:**
- Provide step-by-step onboarding for the new plugin lifecycle
- Create comprehensive examples showcasing new features
- Document best practices for middleware development
- Include performance considerations and optimization tips

**Example Topics:**
- Explicit event mapping with semantic method names
- Plugin-scoped middleware chain configuration
- Global middleware configuration via config

**Commit Message:** `docs: added architecture examples and onboarding guidance`

---

## Phase 8: Finalization (No Legacy Support Needed)
**Goal:** Finalize the architecture as the baseline (no migration/backward compatibility required)

**Files to Modify:**
- `docs/new-plugin-architecture.md` - Remove migration/backward compatibility assumptions
- `docs/plugin-development.md` - Reinforce the new architecture as the only path

**Implementation Notes:**
- No legacy plugin support is needed because the architecture was not released previously
- Keep explicit event mapping and middleware as the sole supported plugin API
- Focus on clarity and consistency rather than dual-path support

**Commit Message:** `docs: finalized new plugin architecture without legacy paths`

---

## Implementation Guidelines

### Development Principles
- **Type Safety**: Maintain zero `any` usage throughout
- **Performance**: Minimize overhead of middleware and discovery
- **Error Isolation**: Plugin failures shouldn't affect framework
- **Debugging**: Provide clear error messages and debugging info

### Testing Strategy
- Unit test each component in isolation
- Integration tests for pipeline interaction
- Performance benchmarks for middleware overhead
- Example-based testing for documentation validation

### Code Quality
- Follow existing AccordJS conventions (kebab-case files, PascalCase classes)
- Comprehensive JSDoc documentation
- Error handling with detailed context
- Consistent logging patterns

### Adoption Notes
- No migration or backward compatibility is required (architecture was unreleased)
- Treat the new plugin architecture as the baseline API
- Keep documentation focused on the single, supported path

---

## Benefits of New Architecture

### For Plugin Developers
- **Less Boilerplate**: No manual event subscription needed
- **Better Type Safety**: Explicit event mapping with compile-time checking
- **Powerful Middleware**: Easy event filtering and transformation with class-based middleware
- **Cleaner Code**: Focus on business logic, not plumbing
- **Custom Method Names**: Use semantic method names instead of generic handlers

### For Framework Users
- **Better Performance**: Optimized event processing pipeline
- **More Flexibility**: Global and per-plugin middleware options
- **Easier Debugging**: Clear pipeline with tracing capabilities
- **Rich Ecosystem**: Built-in middleware for common needs

### For Framework Maintainers
- **Extensible Design**: Easy to add new middleware types
- **Clean Architecture**: Separation of concerns throughout
- **Easy Testing**: Each component is independently testable
- **Future-Proof**: Architecture supports future enhancements

---

**Total Phases:** 8
**Estimated Timeline:** Each phase represents 2-4 days of development
**Dependencies:** Phases should be implemented sequentially for best results
**Backward Compatibility:** Not required (architecture unreleased)
