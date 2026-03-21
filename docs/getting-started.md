# Getting Started

This guide assumes you already created a Discord bot application in the Discord Developer Portal and have a bot token for local development.

## Prerequisites

- Bun 1.x
- A local `.env` file with at least:

```bash
NODE_ENV=development
LOG_LEVEL=info
DISCORD_TOKEN=your_bot_token
```

## Install

```bash
bun add accordjs
```

If you are working in this repository directly:

```bash
bun install
```

## Compose Your App Explicitly

AccordJS now prefers explicit bootstrap code over config-driven middleware loading. You choose:

- which `gateway events` to listen to from Discord.js
- which global middleware to attach
- which plugins to register
- which AccordJS events each plugin handler should receive

```typescript
import { BotFilterMiddleware, CommandRouterPlugin, createAccordJsApp, createConfig, InMemoryCommandRegistry } from 'accordjs';

const config = createConfig();
const registry = new InMemoryCommandRegistry();

const app = await createAccordJsApp({
    config,
    middleware: [new BotFilterMiddleware()],
    gatewayEvents: ['messageCreate', 'guildMemberAdd', 'guildMemberRemove'],
    plugins: [
        {
            plugin: new CommandRouterPlugin(registry, '!'),
            handlerBindings: {
                onMessageCreate: 'MESSAGE_CREATE',
            },
        },
    ],
});

await app.start();
```

## Gateway Events vs AccordJS Events

- `gateway events` are Discord.js client events such as `guildMemberRemove`
- `AccordJS events` are normalized framework events such as `MEMBER_LEAVE`

See `docs/event-model.md` for the canonical mapping table and the currently unsupported gaps.

## Middleware and Plugins

- Global middleware is app-owned and passed directly to `createAccordJsApp()`
- Plugin-scoped middleware stays plugin-owned via `BasePlugin.addMiddleware()`
- Handler bindings can be supplied by app bootstrap code when you do not want plugins to own the event map

## Verify Setup

```bash
bun test
bun run check
```

## Next Steps

- Read `docs/event-model.md` to understand current gateway coverage
- Read `docs/plugin-development.md` for plugin and middleware patterns
- Read `docs/community-bot-tutorial-spec.md` for the planned end-to-end tutorial direction
