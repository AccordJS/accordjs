import { createDiscordClient } from '@app/bot/client';
import { GatewayAdapter } from '@app/bot/gateway';
import { InMemoryEventBus } from '@app/bus';
import { type Config, createConfig, type DiscordClientDebugConfig } from '@app/config';
import type { AnyEventMiddleware } from '@app/middleware/types';
import { PluginManager, type PluginRegistrationOptions } from '@app/plugins/plugin-manager';
import type { GatewayEvent, Plugin } from '@app/types';

export interface PluginRegistration {
    plugin: Plugin;
    handlerBindings?: PluginRegistrationOptions['handlerBindings'];
}

export interface AccordAppOptions {
    config?: Config;
    intents?: readonly number[];
    gatewayEvents?: readonly GatewayEvent[];
    debug?: DiscordClientDebugConfig;
    middleware?: AnyEventMiddleware[];
    plugins?: PluginRegistration[];
}

export interface AccordApp {
    client: ReturnType<typeof createDiscordClient>;
    config: Config;
    eventBus: InMemoryEventBus;
    gateway: GatewayAdapter;
    pluginManager: PluginManager;
    start: () => Promise<string>;
    stop: () => Promise<void>;
}

export const createAccordApp = async (options: AccordAppOptions = {}): Promise<AccordApp> => {
    const config = options.config ?? createConfig();
    const eventBus = new InMemoryEventBus();

    for (const middleware of options.middleware ?? []) {
        eventBus.addMiddleware(middleware);
    }

    const pluginManager = new PluginManager(eventBus, config);
    for (const registration of options.plugins ?? []) {
        await pluginManager.register(registration.plugin, {
            handlerBindings: registration.handlerBindings,
        });
    }

    const client = createDiscordClient(options.intents);
    const gateway = new GatewayAdapter(client, eventBus, {
        debug: options.debug ?? config.debug.discordClientEvents,
        gatewayEvents: options.gatewayEvents,
    });

    gateway.registerListeners();

    return {
        client,
        config,
        eventBus,
        gateway,
        pluginManager,
        start: () => client.login(config.discord.token),
        stop: async () => {
            client.destroy();
        },
    };
};

export const startAccordApp = async (options: AccordAppOptions = {}): Promise<AccordApp> => {
    const app = await createAccordApp(options);
    await app.start();
    return app;
};
