import type { GatewayAdapter } from '@app/bot/gateway';
import type { InMemoryEventBus } from '@app/bus';
import type { Config, DiscordClientDebugConfig } from '@app/config';
import type { AnyEventMiddleware } from '@app/middleware/types';
import type { PluginManager, PluginRegistrationOptions } from '@app/plugins/plugin-manager';
import type { Client } from 'discord.js';
import type { GatewayEvent } from './gateway-events';
import type { Plugin } from './plugin';

export interface PluginRegistration {
    plugin: Plugin;
    handlerBindings?: PluginRegistrationOptions['handlerBindings'];
}

export interface AccordJsAppOptions {
    config?: Config;
    intents?: readonly number[];
    gatewayEvents?: readonly GatewayEvent[];
    debug?: DiscordClientDebugConfig;
    middleware?: AnyEventMiddleware[];
    plugins?: PluginRegistration[];
}

export interface AccordJsApp {
    client: Client;
    config: Config;
    eventBus: InMemoryEventBus;
    gateway: GatewayAdapter;
    pluginManager: PluginManager;
    start: () => Promise<string>;
    stop: () => Promise<void>;
}
