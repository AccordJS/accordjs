/**
 * AccordJS - Main entry point with initialization logic
 * This file handles the framework startup and Discord connection
 */

import { createAccordJsApp } from '@app/app/bootstrap';
import { BotFilterMiddleware } from '@app/middleware/built-in';
import type { PluginManager } from '@app/plugins/plugin-manager';
import { createLogger } from '@app/utils/create-logger';

const logger = createLogger('AccordJS');

try {
    logger.info('Initializing AccordJS framework...');

    const app = await createAccordJsApp({
        middleware: [new BotFilterMiddleware()],
        gatewayEvents: ['messageCreate', 'guildMemberAdd', 'guildMemberRemove'],
    });
    logger.info('Application bootstrap complete.');

    // Example subscription (for demonstration)
    app.eventBus.subscribe('MESSAGE_CREATE', (event) => {
        logger.debug(
            { messageId: event.messageId, userId: event.userId },
            `Message from ${event.authorName}: [CONTENT_REDACTED]`
        );
    });

    const _pluginManager: PluginManager = app.pluginManager;
    logger.info({ plugins: _pluginManager.getPlugins() }, 'Plugin manager ready.');

    if (app.config.env !== 'test') {
        app.start()
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
