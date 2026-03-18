# Getting Started

This guide shows how to bootstrap AccordJS with your own entrypoint.

`src/main.ts` in this repository is an internal example bootstrap. If you consume AccordJS as a module, you should define your own startup file and register your own plugins there.

## Prerequisites

- Bun 1.x
- Node-compatible runtime environment
- A Discord bot token and client ID

## Install

```bash
bun add accordjs
```

If you are working in this repository directly:

```bash
bun install
```

## Configure Environment

Create `.env` from `.env.example` and set at least:

```bash
NODE_ENV=development
LOG_LEVEL=info
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

Optional middleware environment variables are documented in `.env.example`.

## Create a Plugin

```typescript
import { BasePlugin, type MessageCreateEvent } from 'accordjs';

export class PingPlugin extends BasePlugin {
    public readonly name = 'PingPlugin';

    protected override readonly eventMap = {
        onPingMessage: 'MESSAGE_CREATE',
    } as const;

    public async onPingMessage(event: MessageCreateEvent): Promise<void> {
        if (event.content.trim() === '!ping') {
            this.context?.logger.info(`Ping command from ${event.userId}`);
        }
    }
}
```

## Bootstrap Your App

```typescript
import { createDiscordClient, GatewayAdapter, InMemoryEventBus } from 'accordjs';
import { createConfig } from 'accordjs';
import { PluginManager } from 'accordjs';
import { PingPlugin } from './plugins/ping-plugin';

const config = createConfig();
const eventBus = new InMemoryEventBus();

const pluginManager = new PluginManager(eventBus, config);
await pluginManager.register(new PingPlugin());

const client = createDiscordClient();
const gateway = new GatewayAdapter(client, eventBus);
gateway.registerListeners();

await client.login(config.discord.token);
```

## Use Command Router

```typescript
import { CommandRouterPlugin, InMemoryCommandRegistry, type Command } from 'accordjs';

const registry = new InMemoryCommandRegistry();

const pingCommand: Command = {
    name: 'ping',
    description: 'Simple ping command',
    async execute(context) {
        context.logger.info(`Ping from ${context.userId}`);
    },
};

registry.register(pingCommand);
await pluginManager.register(new CommandRouterPlugin(registry, '!'));
```

## Verify Setup

```bash
bun test
bun run check
```

## Next Steps

- Read `docs/plugin-development.md` for eventMap and middleware patterns.
- See `examples/eventmap-middleware-plugin.ts` for a focused plugin example.
- Use `docs/api-reference.md` for exported symbols and signatures.
