import { createDiscordClient } from '@app/bot/client';
import { GatewayAdapter } from '@app/bot/gateway';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { createConfig } from '@app/config';
import { loadGlobalMiddleware } from '@app/middleware/config-loader';
import { type Command, type CommandContext, CommandRouterPlugin, InMemoryCommandRegistry } from '@app/plugins/commands';
import { PluginManager } from '@app/plugins/plugin-manager';

// Load configuration (includes global middleware settings)
const config = createConfig();

// Initialize event bus and global middleware
const eventBus = new InMemoryEventBus();
const globalMiddleware = loadGlobalMiddleware(config);
if (globalMiddleware.length > 0) {
    eventBus.addMiddleware(globalMiddleware);
}

// Register commands
const registry = new InMemoryCommandRegistry();
const pingCommand: Command = {
    name: 'ping',
    description: 'Responds with pong',
    async execute(context: CommandContext) {
        context.logger.info(`Pong from ${context.userId}`);
    },
};
registry.register(pingCommand);

// Register plugins
const pluginManager = new PluginManager(eventBus, config);
await pluginManager.register(new CommandRouterPlugin(registry, '!'));

// Wire Discord gateway (optional for headless testing)
const client = createDiscordClient();
const gateway = new GatewayAdapter(client, eventBus);
gateway.registerListeners();

// In production you would call client.login(config.discord.token);
// For a dry-run / test harness, skip login.
