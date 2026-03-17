# Plugin Development Guide

This guide will walk you through developing plugins for the AccordJS Discord bot framework. Plugins use explicit event mapping and class-based middleware for clean, type-safe, and performant event handling.

## Table of Contents

- [Plugin Architecture Overview](#plugin-architecture-overview)
- [Getting Started](#getting-started)
- [Event Mapping System](#event-mapping-system)
- [Creating Your First Plugin](#creating-your-first-plugin)
- [Middleware System](#middleware-system)
- [Advanced Plugin Development](#advanced-plugin-development)
- [Testing Plugins](#testing-plugins)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Plugin Architecture Overview

AccordJS uses a plugin-based architecture where features are implemented as independent plugins that communicate through a typed event bus. The new architecture emphasizes:

- **Explicit Event Mapping**: Clear `eventMap` configuration instead of manual subscriptions
- **Class-Based Middleware**: Reusable middleware classes for event processing
- **Semantic Method Names**: Use meaningful method names like `moderateMessage` instead of generic handlers
- **Type Safety**: Full TypeScript support with zero `any` usage
- **Performance**: No runtime reflection or method discovery

### Core Flow

```
Discord Gateway → Event Normalization → Global Middleware → Plugin Event Mapping → Plugin Middleware → Plugin Handlers
```

1. **Discord Gateway**: Raw Discord.js events are isolated here
2. **Event Normalization**: Discord events are transformed into internal types using Zod schemas
3. **Global Middleware**: Framework-level middleware (rate limiting, logging, etc.)
4. **Plugin Event Mapping**: Plugins declare which methods handle which events
5. **Plugin Middleware**: Plugin-specific middleware classes
6. **Plugin Handlers**: Your business logic methods

**Ordering Notes**
- Global middleware always runs before plugin middleware.
- Middleware priority is applied within each group (global or plugin), not across groups.

## Getting Started

### Prerequisites

- AccordJS development environment set up
- Understanding of TypeScript and async/await
- Basic knowledge of Discord bot concepts
- Familiarity with class-based programming

### Project Structure for Plugins

```
src/plugins/your-plugin/
├── index.ts              # Main plugin export
├── your-plugin.ts        # Plugin implementation
├── types.ts              # Plugin-specific types
├── middleware/           # Custom middleware (optional)
│   └── custom-middleware.ts
└── utils/                # Plugin utilities (if needed)
```

## Event Mapping System

### The EventMap Concept

Instead of manually subscribing to events, plugins declare an `eventMap` that maps method names to event types:

```typescript
protected readonly eventMap = {
    'methodName': 'EVENT_TYPE',
    'anotherMethod': 'ANOTHER_EVENT_TYPE'
};
```

### Available Events

- `MESSAGE_CREATE` - New message posted
- `MEMBER_JOIN` - User joined server
- `MEMBER_LEAVE` - User left server
- `MESSAGE_DELETE` - Message was deleted
- `COMMAND_DISPATCH` - Command was triggered
- `COMMAND_EXECUTE` - Command completed successfully
- `COMMAND_ERROR` - Command execution failed
- `COMMAND_PERMISSION_DENIED` - Command access denied

### Default Event Mapping

The `BasePlugin` provides sensible defaults:

```typescript
// Default mapping in BasePlugin
protected readonly eventMap: EventHandlerMap = {
    'onMessageCreate': 'MESSAGE_CREATE',
    'onMemberJoin': 'MEMBER_JOIN',
    'onMemberLeave': 'MEMBER_LEAVE',
    'onMessageDelete': 'MESSAGE_DELETE',
    'onCommandDispatch': 'COMMAND_DISPATCH',
    'onCommandExecute': 'COMMAND_EXECUTE',
    'onCommandError': 'COMMAND_ERROR',
    'onCommandPermissionDenied': 'COMMAND_PERMISSION_DENIED'
};
```

### Custom Event Mapping

Override the `eventMap` to use semantic method names:

```typescript
class ModerationPlugin extends BasePlugin {
    // Custom mapping with semantic names
    protected readonly eventMap = {
        'moderateNewMessage': 'MESSAGE_CREATE',
        'checkForSpam': 'MESSAGE_CREATE',      // Multiple handlers allowed
        'handleUserLeave': 'MEMBER_LEAVE',
        'welcomeNewUser': 'MEMBER_JOIN'
    } as const;

    async moderateNewMessage(event: MessageCreateEvent) { /* ... */ }
    async checkForSpam(event: MessageCreateEvent) { /* ... */ }
    async handleUserLeave(event: MemberLeaveEvent) { /* ... */ }
    async welcomeNewUser(event: MemberJoinEvent) { /* ... */ }
}
```

## Creating Your First Plugin

Let's create a "Welcome" plugin that greets new members and responds to welcome commands:

### Step 1: Create the Plugin Structure

```bash
mkdir -p src/plugins/welcome
touch src/plugins/welcome/index.ts
touch src/plugins/welcome/welcome-plugin.ts
touch src/plugins/welcome/types.ts
```

### Step 2: Define Types

```typescript
// src/plugins/welcome/types.ts
export interface WelcomeConfig {
    enabled: boolean;
    welcomeMessage: string;
    channelId?: string;
    respondToCommand: boolean;
}
```

### Step 3: Implement the Plugin

```typescript
// src/plugins/welcome/welcome-plugin.ts
import { BasePlugin } from '@app/plugins/base-plugin';
import { BotFilterMiddleware, RateLimiterMiddleware } from '@app/middleware/built-in';
import type { MemberJoinEvent, MessageCreateEvent } from '@app/types/events';
import type { WelcomeConfig } from './types';

export class WelcomePlugin extends BasePlugin {
    public readonly name = 'Welcome';
    public readonly description = 'Welcomes new server members and handles welcome commands';
    public readonly version = '1.0.0';

    // Explicit event mapping with semantic method names
    protected readonly eventMap = {
        'welcomeNewMember': 'MEMBER_JOIN',
        'handleWelcomeCommand': 'MESSAGE_CREATE'
    };

    private config: WelcomeConfig = {
        enabled: true,
        welcomeMessage: 'Welcome to the server, {username}!',
        respondToCommand: true
    };

    protected async onRegister(): Promise<void> {
        // Add middleware classes
        this.addMiddleware([
            new BotFilterMiddleware(),
            new RateLimiterMiddleware({
                windowMs: 60000,
                maxEvents: 5,
                keyGenerator: (event) => event.userId
            })
        ]);

        this.context!.logger.info('Welcome plugin initialized');
    }

    // Automatically called for MEMBER_JOIN events
    async welcomeNewMember(event: MemberJoinEvent): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        try {
            const welcomeMessage = this.config.welcomeMessage.replace(
                '{username}',
                event.username
            );

            this.context!.logger.info(
                `New member joined: ${event.username} (${event.userId})`
            );

            // In a real implementation, you'd send this to Discord
            this.context!.logger.info(`Welcome message: ${welcomeMessage}`);

        } catch (error) {
            this.context!.logger.error(
                error,
                `Failed to welcome user ${event.userId}`
            );
        }
    }

    // Automatically called for MESSAGE_CREATE events
    async handleWelcomeCommand(event: MessageCreateEvent): Promise<void> {
        if (!this.config.respondToCommand || !event.content.startsWith('!welcome')) {
            return;
        }

        try {
            const helpMessage = 'Welcome! Use `!welcome info` for server information.';
            this.context!.logger.info(`Welcome command used by ${event.userId}`);

            // In a real implementation, you'd send this to Discord
            this.context!.logger.info(`Command response: ${helpMessage}`);

        } catch (error) {
            this.context!.logger.error(
                error,
                `Failed to handle welcome command from ${event.userId}`
            );
        }
    }

    public updateConfig(newConfig: Partial<WelcomeConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.context!.logger.info('Welcome plugin configuration updated');
    }
}
```

### Step 4: Export the Plugin

```typescript
// src/plugins/welcome/index.ts
export { WelcomePlugin } from './welcome-plugin';
export type { WelcomeConfig } from './types';
```

## Middleware System

### What is Middleware?

Middleware are reusable classes that process events before they reach your plugin handlers. They can:
- **Filter events** (skip processing based on conditions)
- **Transform events** (modify event data)
- **Add metadata** (rate limiting info, permissions, etc.)
- **Log/monitor** events
- **Implement cross-cutting concerns**

### Built-in Middleware Classes

Built-in middleware classes are planned but not yet shipped in this branch. The examples below
are illustrative of the intended API; for now, create custom middleware and wire it through
`addMiddleware()`.

```typescript
import {
    BotFilterMiddleware,
    RateLimiterMiddleware,
    ProfanityFilterMiddleware,
    LoggerMiddleware,
    MetricsMiddleware
} from '@app/middleware/built-in';

// Bot message filter
new BotFilterMiddleware()

// Rate limiting
new RateLimiterMiddleware({
    windowMs: 60000,
    maxEvents: 10,
    keyGenerator: (event) => event.userId
})

// Content filtering
new ProfanityFilterMiddleware({
    bannedWords: ['spam', 'abuse'],
    action: 'flag'  // 'flag', 'block', or 'replace'
})

// Structured logging
new LoggerMiddleware({
    logLevel: 'info',
    includeContent: false,
    sensitiveFields: ['token', 'password']
})

// Performance metrics
new MetricsMiddleware({
    trackPerformance: true,
    trackCounts: true
})
```

### Using Middleware in Plugins

Add middleware to your plugin in the `onRegister()` method:

```typescript
class ModerationPlugin extends BasePlugin {
    protected async onRegister(): Promise<void> {
        this.addMiddleware([
            new BotFilterMiddleware(),
            new RateLimiterMiddleware({ windowMs: 30000, maxEvents: 3 }),
            new ProfanityFilterMiddleware(['spam', 'toxic', 'abuse']),
            new LoggerMiddleware({ logLevel: 'warn' })
        ]);
    }

    async moderateMessage(event: MessageCreateEvent): Promise<void> {
        // Event has been processed by all middleware
        if (event.flagged) {
            await this.takeModeratorAction(event);
        }
    }
}
```

### Middleware Ordering and Timing

- Global middleware runs before plugin middleware.
- Priorities are applied within the global list and within the plugin list, not across both.
- Plugin middleware is resolved at invocation time, so adding middleware after `register()` applies to future events.

### Creating Custom Middleware

Create your own middleware by extending `BaseMiddleware`:

```typescript
// src/plugins/moderation/middleware/custom-filter-middleware.ts
import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { EventMiddleware } from '@app/middleware/types';
import type { BotEvent } from '@app/types';

export class CustomFilterMiddleware extends BaseMiddleware implements EventMiddleware {
    public readonly name = 'CustomFilter';
    public readonly priority = 10;

    constructor(private config: { allowedChannels: string[] }) {
        super();
    }

    async execute(event: BotEvent, next: () => Promise<void>): Promise<void> {
        // Skip events from non-allowed channels
        if ('channelId' in event && event.channelId && !this.config.allowedChannels.includes(event.channelId)) {
            return; // Skip processing
        }

        // Add custom metadata
        (event as Record<string, unknown>).isFromAllowedChannel = true;

        await next(); // Continue to next middleware or handler
    }
}

// Use in plugin
this.addMiddleware([
    new CustomFilterMiddleware({
        allowedChannels: ['channel-1', 'channel-2']
    })
]);
```

### Pipeline Tracing (Framework Integrators)

The event pipeline supports tracing and completion hooks for diagnostics and metrics. This is
primarily intended for framework integrators, but it is useful to understand what is available:

- `enableTracing`: capture per-stage timings in a `trace` array
- `onComplete`: receive a `PipelineContext` with timing and trace details
- `eventType`, `pluginName`, and stage timings are included in the context

## Advanced Plugin Development

### State Management

Maintain plugin state using class properties:

```typescript
export class AnalyticsPlugin extends BasePlugin {
    private metrics = {
        messagesProcessed: 0,
        commandsExecuted: 0,
        errorsEncountered: 0,
        startTime: Date.now()
    };

    private userActivity = new Map<string, { lastSeen: number; messageCount: number }>();

    protected readonly eventMap = {
        'trackMessage': 'MESSAGE_CREATE',
        'trackCommand': 'COMMAND_EXECUTE',
        'trackError': 'COMMAND_ERROR'
    };

    async trackMessage(event: MessageCreateEvent): Promise<void> {
        this.metrics.messagesProcessed++;

        // Update user activity
        const userStats = this.userActivity.get(event.userId) || {
            lastSeen: 0,
            messageCount: 0
        };

        userStats.lastSeen = event.timestamp;
        userStats.messageCount++;
        this.userActivity.set(event.userId, userStats);
    }

    async trackCommand(event: CommandExecuteEvent): Promise<void> {
        this.metrics.commandsExecuted++;
    }

    async trackError(event: CommandErrorEvent): Promise<void> {
        this.metrics.errorsEncountered++;
    }

    public getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            activeUsers: this.userActivity.size
        };
    }
}
```

### Configuration Management

Handle plugin-specific configuration:

```typescript
export class ConfigurablePlugin extends BasePlugin {
    private pluginConfig: MyPluginConfig;

    protected async onRegister(): Promise<void> {
        // Load configuration
        this.pluginConfig = this.loadPluginConfig();

        // Configure middleware based on config
        const middleware = [];

        if (this.pluginConfig.enableRateLimit) {
            middleware.push(new RateLimiterMiddleware(this.pluginConfig.rateLimitOptions));
        }

        if (this.pluginConfig.enableProfanityFilter) {
            middleware.push(new ProfanityFilterMiddleware(this.pluginConfig.bannedWords));
        }

        this.addMiddleware(middleware);
    }

    private loadPluginConfig(): MyPluginConfig {
        return {
            enableRateLimit: process.env.PLUGIN_RATE_LIMIT === 'true',
            rateLimitOptions: {
                windowMs: parseInt(process.env.PLUGIN_RATE_WINDOW || '60000', 10),
                maxEvents: parseInt(process.env.PLUGIN_RATE_MAX || '10', 10)
            },
            enableProfanityFilter: process.env.PLUGIN_PROFANITY_FILTER === 'true',
            bannedWords: process.env.PLUGIN_BANNED_WORDS?.split(',') || []
        };
    }

    public updateConfig(newConfig: Partial<MyPluginConfig>): void {
        this.pluginConfig = { ...this.pluginConfig, ...newConfig };
        this.context!.logger.info('Plugin configuration updated');
    }
}
```

### Error Handling

Implement comprehensive error handling:

```typescript
import { BasePlugin } from '@app/plugins/base-plugin';
import type { BotEvent, MessageCreateEvent, CommandDispatchEvent } from '@app/types';

export class RobustPlugin extends BasePlugin {
    protected readonly eventMap = {
        'processMessage': 'MESSAGE_CREATE',
        'handleCommand': 'COMMAND_DISPATCH'
    };

    async processMessage(event: MessageCreateEvent): Promise<void> {
        try {
            await this.doComplexProcessing(event);
        } catch (error) {
            await this.handleError('processMessage', error, event);
        }
    }

    async handleCommand(event: CommandDispatchEvent): Promise<void> {
        try {
            await this.executeCommand(event);
        } catch (error) {
            await this.handleError('handleCommand', error, event);
        }
    }

    private async handleError(method: string, error: unknown, event: BotEvent): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.context!.logger.error(
            {
                err: error,
                method,
                eventType: event.type,
                userId: 'userId' in event ? event.userId : undefined,
                messageId: 'messageId' in event ? event.messageId : undefined
            },
            `Plugin error in ${method}: ${errorMessage}`
        );

        // Publish error event for monitoring
        await this.context!.eventBus.publish('PLUGIN_ERROR', {
            type: 'PLUGIN_ERROR',
            timestamp: Date.now(),
            pluginName: this.name,
            method,
            error: errorMessage,
            eventData: {
                type: event.type,
                userId: 'userId' in event ? event.userId : undefined
            }
        });
    }
}
```

## Testing Plugins

### Unit Testing Setup

Test plugins using the new architecture:

```typescript
// tests/unit/plugins/welcome/welcome-plugin.test.ts
import { describe, expect, it, mock } from 'bun:test';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { WelcomePlugin } from '@app/plugins/welcome/welcome-plugin';
import { createLogger } from '@app/utils/create-logger';
import type { Config, PluginContext } from '@app/types';

describe('WelcomePlugin', () => {
    const createMockContext = (): PluginContext => ({
        eventBus: new InMemoryEventBus(),
        config: {
            env: 'test',
            log: { level: 'info' },
            discord: { token: 'test', clientId: 'test' },
        } as Config,
        logger: createLogger('Test'),
    });

    it('should handle member join events via event mapping', async () => {
        const context = createMockContext();
        const plugin = new WelcomePlugin();
        const logSpy = mock(() => {});
        context.logger.info = logSpy;

        await plugin.register(context);

        // Simulate a member join event
        await context.eventBus.publish('MEMBER_JOIN', {
            type: 'MEMBER_JOIN',
            timestamp: Date.now(),
            userId: 'user123',
            serverId: 'server456',
            username: 'TestUser',
            joinedAt: Date.now(),
        });

        // Verify the welcomeNewMember method was called
        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('Welcome message: Welcome to the server, TestUser!')
        );
    });

    it('should handle welcome commands via event mapping', async () => {
        const context = createMockContext();
        const plugin = new WelcomePlugin();
        const logSpy = mock(() => {});
        context.logger.info = logSpy;

        await plugin.register(context);

        // Simulate a welcome command
        await context.eventBus.publish('MESSAGE_CREATE', {
            type: 'MESSAGE_CREATE',
            timestamp: Date.now(),
            userId: 'user123',
            channelId: 'channel456',
            messageId: 'message789',
            content: '!welcome info',
            authorName: 'TestUser',
            authorTag: 'TestUser#0001',
            isBot: false,
        });

        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('Welcome command used by user123')
        );
    });

    it('should not process events when disabled', async () => {
        const context = createMockContext();
        const plugin = new WelcomePlugin();
        const logSpy = mock(() => {});
        context.logger.info = logSpy;

        await plugin.register(context);

        // Disable the plugin
        plugin.updateConfig({ enabled: false });

        await context.eventBus.publish('MEMBER_JOIN', {
            type: 'MEMBER_JOIN',
            timestamp: Date.now(),
            userId: 'user123',
            serverId: 'server456',
            username: 'TestUser',
            joinedAt: Date.now(),
        });

        // Should not process the event
        expect(logSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('Welcome message:')
        );
    });
});
```

### Testing Custom Middleware

```typescript
// tests/unit/middleware/custom-filter-middleware.test.ts
import { describe, expect, it, mock } from 'bun:test';
import { CustomFilterMiddleware } from '@app/plugins/moderation/middleware/custom-filter-middleware';

describe('CustomFilterMiddleware', () => {
    it('should filter events from non-allowed channels', async () => {
        const middleware = new CustomFilterMiddleware({
            allowedChannels: ['channel-1', 'channel-2']
        });

        const nextSpy = mock();
        const event = {
            channelId: 'forbidden-channel',
            content: 'test message'
        };

        await middleware.execute(event, nextSpy);

        // Should not call next() for forbidden channel
        expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should process events from allowed channels', async () => {
        const middleware = new CustomFilterMiddleware({
            allowedChannels: ['channel-1', 'channel-2']
        });

        const nextSpy = mock();
        const event = {
            channelId: 'channel-1',
            content: 'test message'
        };

        await middleware.execute(event, nextSpy);

        // Should call next() and add metadata
        expect(nextSpy).toHaveBeenCalledTimes(1);
        expect(event.isFromAllowedChannel).toBe(true);
    });
});
```

## Best Practices

### 1. Event Mapping

- **Use semantic method names**: `moderateMessage` instead of `onMessageCreate`
- **Group related handlers**: Multiple methods can map to the same event
- **Keep mappings explicit**: Avoid magic or implicit behavior

### 2. Middleware Design

- **Single responsibility**: Each middleware should do one thing well
- **Consistent naming**: Always use `Middleware` suffix
- **Proper priorities**: Lower numbers = higher priority
- **Error handling**: Always handle middleware errors gracefully

### 3. Type Safety

- **Never use `any`**: Define proper interfaces for all data
- **Use event types**: Import specific event types for handlers
- **Generic middleware**: Use generics for reusable middleware

### 4. Performance

- **Lightweight handlers**: Keep event handlers fast
- **Efficient middleware**: Minimize middleware overhead
- **State management**: Use Maps/Sets for efficient lookups

### 5. Configuration

- **Environment variables**: Use env vars for external configuration
- **Sensible defaults**: Always provide good defaults
- **Runtime updates**: Support configuration updates without restart

### 6. Logging

- **Structured logging**: Use consistent log formats
- **Appropriate levels**: Use debug, info, warn, error appropriately
- **Context information**: Include relevant event context

## Examples

### Moderation Plugin

```typescript
export class ModerationPlugin extends BasePlugin {
    public readonly name = 'Moderation';

    protected readonly eventMap = {
        'moderateMessage': 'MESSAGE_CREATE',
        'logMemberJoin': 'MEMBER_JOIN',
        'logMemberLeave': 'MEMBER_LEAVE'
    };

    private bannedWords = new Set(['spam', 'abuse']);
    private warnings = new Map<string, number>();

    protected async onRegister(): Promise<void> {
        this.addMiddleware([
            new BotFilterMiddleware(),
            new RateLimiterMiddleware({ windowMs: 30000, maxEvents: 5 }),
            new ProfanityFilterMiddleware({
                bannedWords: Array.from(this.bannedWords),
                action: 'flag'
            })
        ]);
    }

    async moderateMessage(event: MessageCreateEvent): Promise<void> {
        if (event.flagged) {
            const warnings = this.warnings.get(event.userId) || 0;
            this.warnings.set(event.userId, warnings + 1);

            this.context!.logger.warn(
                `Flagged content from user ${event.userId}. Warning ${warnings + 1}/3`
            );

            if (warnings + 1 >= 3) {
                await this.takeModeratorAction(event.userId, 'timeout');
            }
        }
    }

    async logMemberJoin(event: MemberJoinEvent): Promise<void> {
        this.context!.logger.info(
            `Member joined: ${event.username} (${event.userId})`
        );
    }

    async logMemberLeave(event: MemberLeaveEvent): Promise<void> {
        // Clear warnings when user leaves
        this.warnings.delete(event.userId);

        this.context!.logger.info(
            `Member left: ${event.username} (${event.userId})`
        );
    }

    private async takeModeratorAction(userId: string, action: string): Promise<void> {
        this.context!.logger.warn(
            `Taking moderator action '${action}' against user ${userId}`
        );

        // In real implementation, would use Discord API
    }
}
```

### Analytics Plugin

```typescript
export class AnalyticsPlugin extends BasePlugin {
    public readonly name = 'Analytics';

    protected readonly eventMap = {
        'trackMessage': 'MESSAGE_CREATE',
        'trackCommand': 'COMMAND_EXECUTE',
        'trackError': 'COMMAND_ERROR'
    };

    private metrics = {
        messages: 0,
        commands: 0,
        errors: 0,
        startTime: Date.now()
    };

    private hourlyStats = new Map<string, { messages: number; commands: number }>();

    protected async onRegister(): Promise<void> {
        this.addMiddleware([
            new MetricsMiddleware({ trackPerformance: true })
        ]);

        // Report metrics every 5 minutes
        setInterval(() => {
            this.reportMetrics();
        }, 5 * 60 * 1000);
    }

    async trackMessage(event: MessageCreateEvent): Promise<void> {
        this.metrics.messages++;
        this.updateHourlyStats('messages');
    }

    async trackCommand(event: CommandExecuteEvent): Promise<void> {
        this.metrics.commands++;
        this.updateHourlyStats('commands');
    }

    async trackError(event: CommandErrorEvent): Promise<void> {
        this.metrics.errors++;

        this.context!.logger.warn(
            `Command error tracked: ${event.commandName} - ${event.error}`
        );
    }

    private updateHourlyStats(type: 'messages' | 'commands'): void {
        const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
        const stats = this.hourlyStats.get(hour) || { messages: 0, commands: 0 };
        stats[type]++;
        this.hourlyStats.set(hour, stats);
    }

    private reportMetrics(): void {
        this.context!.logger.info('Analytics Report', {
            totalMetrics: this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            recentHours: Array.from(this.hourlyStats.entries()).slice(-24)
        });
    }

    public getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            hourlyBreakdown: this.hourlyStats
        };
    }
}
```

## Next Steps

1. **Study the Examples**: Review the provided plugin examples
2. **Create Simple Plugins**: Start with basic event mapping
3. **Add Middleware**: Experiment with built-in middleware classes
4. **Build Complex Features**: Combine multiple event types and middleware
5. **Write Tests**: Ensure your plugins are thoroughly tested

## References

- [New Plugin Architecture Plan](./new-plugin-architecture.md) - Implementation roadmap
- [AccordJS Architecture](../README.md#architecture) - Framework overview
- [Contributing Guide](../CONTRIBUTING.md) - Development guidelines
- [Event Types](../src/types/events.ts) - Available event definitions
- [Plugin Interface](../src/types/plugin.ts) - Plugin contracts

---

Happy plugin development!
