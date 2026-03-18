/**
 * AccordJS Configuration Schema and Validation
 *
 * Uses vendored config-schema for automatic environment variable
 * parsing with Zod validation for type safety and runtime validation.
 *
 * Configuration is loaded from environment variables and validated on startup.
 * See .env.example for required environment variables.
 *
 * NOTE: config-schema is temporarily vendored to avoid GitHub Package Registry
 * authentication requirements. Will migrate back to npm when publicly available.
 */

import { z } from 'zod';
import { autoEnv, defineConfig, env } from './vendor/config-schema';

/**
 * Valid Node.js environment values
 */
export const NodeEnvEnumSchema = z.enum(['development', 'production', 'test']);

/**
 * Valid Pino log levels from most severe to least severe
 */
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

const booleanEnv = (defaultValue: boolean) => autoEnv(BooleanSchema.default(defaultValue));
const positiveIntEnv = (defaultValue: number) => autoEnv(z.coerce.number().int().positive().default(defaultValue));
const optionalPositiveIntEnv = autoEnv(z.coerce.number().int().positive().optional());

const stringListSchema = z.preprocess((value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        if (value.trim() === '') {
            return [];
        }
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value;
}, z.array(z.string()).default([]));

const commaListEnv = () => autoEnv(stringListSchema);

export const RateLimitKeySchema = z.enum(['userId', 'channelId', 'serverId', 'eventType', 'global']);

const DefaultMiddlewareConfig = {
    global: {
        botFilter: { enabled: true },
        rateLimiter: {
            enabled: false,
            windowMs: 60000,
            maxEvents: 10,
            block: true,
            key: 'userId' as z.infer<typeof RateLimitKeySchema>,
            pruneIntervalMs: undefined,
        },
        profanityFilter: {
            enabled: false,
            bannedWords: [] as string[],
            action: 'flag' as 'flag' | 'block' | 'replace',
            replacement: '***',
            caseSensitive: false,
            matchWholeWord: true,
        },
        logger: {
            enabled: false,
            logLevel: 'info' as z.infer<typeof LogLevelEnumSchema>,
            includeContent: false,
            sensitiveFields: [] as string[],
        },
        metrics: {
            enabled: false,
            trackCounts: true,
            trackPerformance: false,
        },
    },
} as const;

const MiddlewareConfigSchema = z.object({
    global: z.object({
        botFilter: z.object({
            enabled: booleanEnv(true),
        }),
        rateLimiter: z.object({
            enabled: booleanEnv(false),
            windowMs: positiveIntEnv(60000),
            maxEvents: positiveIntEnv(10),
            block: booleanEnv(true),
            key: autoEnv(RateLimitKeySchema.default('userId')),
            pruneIntervalMs: optionalPositiveIntEnv,
        }),
        profanityFilter: z.object({
            enabled: booleanEnv(false),
            bannedWords: commaListEnv(),
            action: autoEnv(z.enum(['flag', 'block', 'replace']).default('flag')),
            replacement: autoEnv(z.string().default('***')),
            caseSensitive: booleanEnv(false),
            matchWholeWord: booleanEnv(true),
        }),
        logger: z.object({
            enabled: booleanEnv(false),
            logLevel: autoEnv(LogLevelEnumSchema.default('info')),
            includeContent: booleanEnv(false),
            sensitiveFields: commaListEnv(),
        }),
        metrics: z.object({
            enabled: booleanEnv(false),
            trackCounts: booleanEnv(true),
            trackPerformance: booleanEnv(false),
        }),
    }),
});

/**
 * Complete configuration schema for AccordJS framework
 */
export const ConfigSchema = z.object({
    /** Application environment settings */
    env: env('NODE_ENV', NodeEnvEnumSchema.default('development')),

    /** Logging configuration */
    log: z.object({
        /** Minimum log level to output (maps to LOG_LEVEL env var) */
        level: autoEnv(LogLevelEnumSchema.default('debug')),
    }),

    /** Discord bot configuration */
    discord: z.object({
        /** Discord bot token (maps to DISCORD_TOKEN env var) */
        token: autoEnv(z.string().min(1, 'Discord token is required')),
        /** Discord application/client ID (maps to DISCORD_CLIENT_ID env var) */
        clientId: autoEnv(z.string().min(1, 'Discord client ID is required')),
        /** Optional guild ID for development/testing (maps to DISCORD_GUILD_ID env var) */
        guildId: autoEnv(z.string().optional()),
    }),

    /** Global middleware configuration */
    middleware: MiddlewareConfigSchema.default(DefaultMiddlewareConfig),
});

/**
 * Inferred TypeScript type from the configuration schema
 */
export type Config = z.infer<typeof ConfigSchema>;

export type MiddlewareConfig = z.infer<typeof MiddlewareConfigSchema>;
export const DEFAULT_MIDDLEWARE_CONFIG: MiddlewareConfig = DefaultMiddlewareConfig;

/**
 * Creates a validated configuration object from environment variables
 *
 * This will throw an error if required environment variables
 * are missing or invalid according to the schema.
 */
export const createConfig = (): Config => defineConfig(ConfigSchema);
