/**
 * AccordJS runtime configuration and validation.
 *
 * This file intentionally contains only the minimum configuration needed to
 * start and debug an AccordJS application.
 */

import { DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS, DiscordClientDebugEventSchema } from '@app/types';
import { z } from 'zod';
import { autoEnv, defineConfig, env } from './vendor/config-schema';

export const NodeEnvEnumSchema = z.enum(['development', 'production', 'test']);
export const LogLevelEnumSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);

const BooleanSchema = z.preprocess((value) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
            return true;
        }
        if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
            return false;
        }
    }
    return value;
}, z.boolean());

const discordClientDebugEventsEnv = () =>
    autoEnv(
        z.preprocess((value) => {
            if (value === undefined) {
                return [...DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS];
            }
            if (Array.isArray(value)) {
                return value;
            }
            if (typeof value === 'string') {
                if (value.trim() === '') {
                    return [...DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS];
                }
                return value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
            return value;
        }, z.array(DiscordClientDebugEventSchema))
    );

const DefaultDebugConfig = {
    discordClientEvents: {
        enabled: false,
        events: [...DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS],
    },
};

const DebugConfigSchema = z.object({
    discordClientEvents: z.object({
        enabled: env('DEBUG_DISCORD_CLIENT_EVENTS_ENABLED', BooleanSchema.default(false)),
        events: env('DEBUG_DISCORD_CLIENT_EVENTS_EVENTS', discordClientDebugEventsEnv()),
    }),
});

export const ConfigSchema = z.object({
    env: env('NODE_ENV', NodeEnvEnumSchema.default('development')),
    log: z.object({
        level: autoEnv(LogLevelEnumSchema.default('debug')),
    }),
    discord: z.object({
        token: autoEnv(z.string().min(1, 'Discord token is required')),
    }),
    debug: DebugConfigSchema.default(DefaultDebugConfig),
});

export type Config = z.infer<typeof ConfigSchema>;
export type DebugConfig = z.infer<typeof DebugConfigSchema>;
export type DiscordClientDebugConfig = DebugConfig['discordClientEvents'];
export const DEFAULT_DEBUG_CONFIG: DebugConfig = DefaultDebugConfig;

export const createConfig = (): Config => defineConfig(ConfigSchema);
