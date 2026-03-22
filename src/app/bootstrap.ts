import { createDiscordClient } from '@app/bot/client';
import { GatewayAdapter } from '@app/bot/gateway';
import { InMemoryEventBus } from '@app/bus';
import { createConfig } from '@app/config';
import { InMemoryInteractionResponseRegistry } from '@app/interactions';
import { PluginManager } from '@app/plugins/plugin-manager';
import type { AccordJsApp, AccordJsAppOptions } from '@app/types';

export const createAccordJsApp = async (options: AccordJsAppOptions = {}): Promise<AccordJsApp> => {
    const config = options.config ?? createConfig();
    const eventBus = new InMemoryEventBus();
    const responses = new InMemoryInteractionResponseRegistry();

    for (const middleware of options.middleware ?? []) {
        eventBus.addMiddleware(middleware);
    }

    const pluginManager = new PluginManager(eventBus, config, responses);
    for (const registration of options.plugins ?? []) {
        await pluginManager.register(registration.plugin, {
            handlerBindings: registration.handlerBindings,
        });
    }

    const client = createDiscordClient(options.intents);
    const gateway = new GatewayAdapter(client, eventBus, {
        debug: options.debug ?? config.debug.discordClientEvents,
        gatewayEvents: options.gatewayEvents,
        responses,
    });

    gateway.registerListeners();

    return {
        client,
        config,
        eventBus,
        gateway,
        pluginManager,
        responses,
        start: () => client.login(config.discord.token),
        stop: async () => {
            client.destroy();
        },
    };
};

export const startAccordJsApp = async (options: AccordJsAppOptions = {}): Promise<AccordJsApp> => {
    const app = await createAccordJsApp(options);
    await app.start();
    return app;
};
