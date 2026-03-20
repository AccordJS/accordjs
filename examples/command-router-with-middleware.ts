import { createAccordJsApp } from '@app/app/bootstrap';
import { createConfig } from '@app/config';
import { BotFilterMiddleware, LoggerMiddleware } from '@app/middleware/built-in';
import { type Command, type CommandContext, CommandRouterPlugin, InMemoryCommandRegistry } from '@app/plugins/commands';

// Load plain runtime configuration.
const config = createConfig();

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

const _app = await createAccordJsApp({
    config,
    middleware: [
        new BotFilterMiddleware(),
        new LoggerMiddleware({
            includeContent: false,
            logLevel: config.log.level,
            sensitiveFields: [],
        }),
    ],
    plugins: [
        {
            plugin: new CommandRouterPlugin(registry, '!'),
        },
    ],
    gatewayEvents: ['messageCreate'],
});

// In production you would call app.start();
// For a dry-run / test harness, skip login.
