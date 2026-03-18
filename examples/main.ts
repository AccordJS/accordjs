/**
 * AccordJS - Main entry point with initialization logic
 * This file handles the framework startup and Discord connection
 */

import { createDiscordClient } from '@app/bot/client';
import { GatewayAdapter } from '@app/bot/gateway';
import { InMemoryEventBus } from '@app/bus/in-memory-event-bus';
import { createConfig } from '@app/config';
import { loadGlobalMiddleware } from '@app/middleware/config-loader';
import { PluginManager } from '@app/plugins/plugin-manager';
import { createLogger } from '@app/utils/create-logger';

const logger = createLogger('AccordJS');

try {
    logger.info('Initializing AccordJS framework...');

    // 1. Load and validate configuration
    const config = createConfig();
    logger.info('Configuration loaded successfully.');

    // 2. Initialize Event Bus
    const eventBus = new InMemoryEventBus();
    logger.info('Event bus initialized.');

    // 2.5 Load global middleware from configuration
    const globalMiddleware = loadGlobalMiddleware(config);
    if (globalMiddleware.length > 0) {
        eventBus.addMiddleware(globalMiddleware);
    }
    logger.info({ count: globalMiddleware.length }, 'Global middleware configured.');

    // 3. Initialize Plugin Manager
    const _pluginManager = new PluginManager(eventBus, config);
    logger.info('Plugin manager initialized.');

    // 4. Initialize Discord Client
    const client = createDiscordClient();
    logger.info('Discord client created.');

    // 5. Initialize Gateway Adapter
    const gateway = new GatewayAdapter(client, eventBus);
    gateway.registerListeners();
    logger.info('Gateway listeners registered.');

    // 6. Example subscription (for demonstration)
    eventBus.subscribe('MESSAGE_CREATE', (event) => {
        logger.debug(
            { messageId: event.messageId, userId: event.userId },
            `Message from ${event.authorName}: [CONTENT_REDACTED]`
        );
    });

    // 7. Login to Discord
    if (config.env !== 'test') {
        client
            .login(config.discord.token)
            .then(() => {
                logger.info('Successfully logged into Discord.');
            })
            .catch((error) => {
                logger.fatal(error, 'Failed to login to Discord');
                process.exit(1);
            });
    }
} catch (error) {
    logger.fatal(error, 'Failed to initialize AccordJS framework');
    process.exit(1);
}
