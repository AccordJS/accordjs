/**
 * AccordJS Configuration Schema and Validation
 *
 * Uses @axm-internal/config-schema for automatic environment variable
 * parsing with Zod validation for type safety and runtime validation.
 *
 * Configuration is loaded from environment variables and validated on startup.
 * See .env.example for required environment variables.
 */

import { autoEnv, defineConfig, env } from '@axm-internal/config-schema';
import { z } from 'zod';

/**
 * Valid Node.js environment values
 */
export const NodeEnvEnumSchema = z.enum(['development', 'production', 'test']);

/**
 * Valid Pino log levels from most severe to least severe
 */
export const LogLevelEnumSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);

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
});

/**
 * Inferred TypeScript type from the configuration schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Creates a validated configuration object from environment variables
 *
 * This will throw an error if required environment variables
 * are missing or invalid according to the schema.
 */
export const createConfig = (): Config => defineConfig(ConfigSchema);
