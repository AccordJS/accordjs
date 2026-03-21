import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ConfigSchema, createConfig, DEFAULT_DEBUG_CONFIG, LogLevelEnumSchema, NodeEnvEnumSchema } from '@app/config';
import { DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS } from '@app/types';

describe('Configuration Schema Validation', () => {
    let originalEnv: Record<string, string | undefined>;

    beforeEach(() => {
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('NodeEnvEnumSchema', () => {
        it('validates valid environment values', () => {
            for (const value of ['development', 'production', 'test'] as const) {
                expect(NodeEnvEnumSchema.safeParse(value).success).toBe(true);
            }
        });

        it('rejects invalid environment values', () => {
            for (const value of ['dev', 'prod', 'staging', 'local', '']) {
                expect(NodeEnvEnumSchema.safeParse(value).success).toBe(false);
            }
        });
    });

    describe('LogLevelEnumSchema', () => {
        it('validates all supported log levels', () => {
            for (const level of ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const) {
                expect(LogLevelEnumSchema.safeParse(level).success).toBe(true);
            }
        });
    });

    describe('ConfigSchema', () => {
        it('validates a complete valid runtime config', () => {
            const result = ConfigSchema.safeParse({
                env: 'development',
                log: { level: 'info' },
                discord: { token: 'valid_discord_token' },
                debug: DEFAULT_DEBUG_CONFIG,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.discord.token).toBe('valid_discord_token');
                expect(result.data.debug.discordClientEvents.enabled).toBe(false);
            }
        });

        it('fails validation when Discord token is missing', () => {
            const result = ConfigSchema.safeParse({
                env: 'development',
                log: { level: 'info' },
                discord: { token: '' },
                debug: DEFAULT_DEBUG_CONFIG,
            });

            expect(result.success).toBe(false);
        });

        it('validates debug configuration with known Discord client events', () => {
            const result = ConfigSchema.safeParse({
                env: 'development',
                log: { level: 'info' },
                discord: { token: 'valid_discord_token' },
                debug: {
                    discordClientEvents: {
                        enabled: true,
                        events: ['guildCreate', 'messageCreate', 'debug'],
                    },
                },
            });

            expect(result.success).toBe(true);
        });

        it('fails validation when debug configuration includes unsupported Discord client events', () => {
            const result = ConfigSchema.safeParse({
                env: 'development',
                log: { level: 'info' },
                discord: { token: 'valid_discord_token' },
                debug: {
                    discordClientEvents: {
                        enabled: true,
                        events: ['guildCreate', 'notARealEvent'],
                    },
                },
            });

            expect(result.success).toBe(false);
        });
    });

    describe('createConfig()', () => {
        it('creates valid configuration with required environment variables', () => {
            process.env.NODE_ENV = 'development';
            process.env.DISCORD_TOKEN = 'test_discord_token';

            const config = createConfig();

            expect(config.env).toBe('development');
            expect(config.log.level).toBeDefined();
            expect(config.discord.token).toBe('test_discord_token');
            expect(config.debug.discordClientEvents.events).toEqual([...DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS]);
        });

        it('throws error when required environment variables are missing', () => {
            delete process.env.DISCORD_TOKEN;
            expect(() => createConfig()).toThrow();
        });

        it('uses defaults when optional runtime environment variables are missing', () => {
            process.env.DISCORD_TOKEN = 'test_token';
            delete process.env.NODE_ENV;
            delete process.env.LOG_LEVEL;

            const config = createConfig();

            expect(config.env).toBe('development');
            expect(config.log.level).toBe('debug');
            expect(config.discord.token).toBe('test_token');
        });

        it('reads debug configuration from environment variables', () => {
            process.env.DISCORD_TOKEN = 'test_token';
            process.env.DEBUG_DISCORD_CLIENT_EVENTS_ENABLED = 'true';
            process.env.DEBUG_DISCORD_CLIENT_EVENTS_EVENTS = 'guildCreate,messageCreate,debug';

            const config = createConfig();

            expect(config.debug.discordClientEvents.enabled).toBe(true);
            expect(config.debug.discordClientEvents.events).toEqual(['guildCreate', 'messageCreate', 'debug']);
        });
    });
});
