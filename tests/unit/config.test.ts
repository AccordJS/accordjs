import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ConfigSchema, createConfig, LogLevelEnumSchema, NodeEnvEnumSchema } from '@app/config';

const defaultMiddleware = {
    global: {
        botFilter: { enabled: true },
        rateLimiter: {
            enabled: false,
            windowMs: 60000,
            maxEvents: 10,
            block: true,
            key: 'userId',
            pruneIntervalMs: undefined,
        },
        profanityFilter: {
            enabled: false,
            bannedWords: [],
            action: 'flag',
            replacement: '***',
            caseSensitive: false,
            matchWholeWord: true,
        },
        logger: {
            enabled: false,
            logLevel: 'info',
            includeContent: false,
            sensitiveFields: [],
        },
        metrics: {
            enabled: false,
            trackCounts: true,
            trackPerformance: false,
        },
    },
};

describe('Configuration Schema Validation', () => {
    let originalEnv: Record<string, string | undefined>;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('NodeEnvEnumSchema', () => {
        it('validates valid environment values', () => {
            const validValues = ['development', 'production', 'test'] as const;

            validValues.forEach((value) => {
                const result = NodeEnvEnumSchema.safeParse(value);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(value);
                }
            });
        });

        it('rejects invalid environment values', () => {
            const invalidValues = ['dev', 'prod', 'staging', 'local', ''];

            invalidValues.forEach((value) => {
                const result = NodeEnvEnumSchema.safeParse(value);
                expect(result.success).toBe(false);
            });
        });

        it('uses default value when not provided', () => {
            const schema = NodeEnvEnumSchema.default('development');
            const result = schema.safeParse(undefined);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('development');
            }
        });
    });

    describe('LogLevelEnumSchema', () => {
        it('validates all Pino log levels', () => {
            const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

            validLevels.forEach((level) => {
                const result = LogLevelEnumSchema.safeParse(level);
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(level);
                }
            });
        });

        it('rejects invalid log levels', () => {
            const invalidLevels = ['verbose', 'silly', 'emergency', 'critical', ''];

            invalidLevels.forEach((level) => {
                const result = LogLevelEnumSchema.safeParse(level);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('ConfigSchema', () => {
        it('validates a complete valid configuration', () => {
            // Set up environment variables
            process.env.NODE_ENV = 'development';
            process.env.LOG_LEVEL = 'info';
            process.env.DISCORD_TOKEN = 'valid_discord_token';
            process.env.DISCORD_CLIENT_ID = 'valid_client_id';
            process.env.DISCORD_GUILD_ID = 'optional_guild_id';

            const mockConfig = {
                env: 'development',
                log: {
                    level: 'info',
                },
                discord: {
                    token: 'valid_discord_token',
                    clientId: 'valid_client_id',
                    guildId: 'optional_guild_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.env).toBe('development');
                expect(result.data.log.level).toBe('info');
                expect(result.data.discord.token).toBe('valid_discord_token');
                expect(result.data.discord.clientId).toBe('valid_client_id');
                expect(result.data.discord.guildId).toBe('optional_guild_id');
            }
        });

        it('validates configuration without optional guild ID', () => {
            const mockConfig = {
                env: 'production',
                log: {
                    level: 'error',
                },
                discord: {
                    token: 'valid_discord_token',
                    clientId: 'valid_client_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.discord.guildId).toBeUndefined();
            }
        });

        it('fails validation when Discord token is missing', () => {
            const mockConfig = {
                env: 'development',
                log: {
                    level: 'info',
                },
                discord: {
                    token: '',
                    clientId: 'valid_client_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(false);

            if (!result.success) {
                expect(result.error.issues).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Discord token is required',
                            path: ['discord', 'token'],
                        }),
                    ])
                );
            }
        });

        it('fails validation when Discord client ID is missing', () => {
            const mockConfig = {
                env: 'development',
                log: {
                    level: 'info',
                },
                discord: {
                    token: 'valid_discord_token',
                    clientId: '',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(false);

            if (!result.success) {
                expect(result.error.issues).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            message: 'Discord client ID is required',
                            path: ['discord', 'clientId'],
                        }),
                    ])
                );
            }
        });

        it('fails validation with invalid environment', () => {
            const mockConfig = {
                env: 'staging', // Invalid environment
                log: {
                    level: 'info',
                },
                discord: {
                    token: 'valid_discord_token',
                    clientId: 'valid_client_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(false);
        });

        it('fails validation with invalid log level', () => {
            const mockConfig = {
                env: 'development',
                log: {
                    level: 'verbose', // Invalid log level
                },
                discord: {
                    token: 'valid_discord_token',
                    clientId: 'valid_client_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(false);
        });

        it('handles multiple validation errors', () => {
            const mockConfig = {
                env: 'invalid_env',
                log: {
                    level: 'invalid_level',
                },
                discord: {
                    token: '', // Missing required field
                    clientId: '', // Missing required field
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(false);

            if (!result.success) {
                // Should have multiple validation errors
                expect(result.error.issues.length).toBeGreaterThan(1);

                // Check for specific validation errors
                const errorMessages = result.error.issues.map((issue) => issue.message);
                expect(errorMessages).toContain('Discord token is required');
                expect(errorMessages).toContain('Discord client ID is required');
            }
        });
    });

    describe('createConfig() Function', () => {
        it('creates valid configuration with required environment variables', () => {
            // Set up required environment variables
            process.env.NODE_ENV = 'development';
            process.env.DISCORD_TOKEN = 'test_discord_token';
            process.env.DISCORD_CLIENT_ID = 'test_client_id';

            const config = createConfig();

            expect(config.env).toBe('development');
            expect(config.log.level).toBeDefined(); // Uses schema default
            expect(config.discord.token).toBe('test_discord_token');
            expect(config.discord.clientId).toBe('test_client_id');
            // guildId is optional, so it may or may not be defined
        });

        it('throws error when required environment variables are missing', () => {
            // Clear required environment variables
            delete process.env.DISCORD_TOKEN;
            delete process.env.DISCORD_CLIENT_ID;

            expect(() => createConfig()).toThrow();
        });

        it('uses defaults when optional environment variables are missing', () => {
            // Set required variables but omit optionals
            process.env.DISCORD_TOKEN = 'test_token';
            process.env.DISCORD_CLIENT_ID = 'test_client_id';
            delete process.env.NODE_ENV;
            delete process.env.LOG_LEVEL;
            delete process.env.DISCORD_GUILD_ID;

            const config = createConfig();

            expect(config.env).toBe('development'); // default
            expect(config.log.level).toBe('debug'); // default
            expect(config.discord.token).toBe('test_token');
            expect(config.discord.clientId).toBe('test_client_id');
            expect(config.discord.guildId).toBeUndefined();
        });
    });

    describe('Configuration Type Safety', () => {
        it('ensures TypeScript type inference works correctly', () => {
            const mockConfig = {
                env: 'development' as const,
                log: {
                    level: 'info' as const,
                },
                discord: {
                    token: 'test_token',
                    clientId: 'test_client_id',
                    guildId: 'test_guild_id',
                },
                middleware: defaultMiddleware,
            };

            const result = ConfigSchema.safeParse(mockConfig);
            expect(result.success).toBe(true);

            if (result.success) {
                // These should pass TypeScript compilation
                const env: 'development' | 'production' | 'test' = result.data.env;
                const logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' = result.data.log.level;
                const token: string = result.data.discord.token;
                const clientId: string = result.data.discord.clientId;
                const guildId: string | undefined = result.data.discord.guildId;

                expect(env).toBe('development');
                expect(logLevel).toBe('info');
                expect(token).toBe('test_token');
                expect(clientId).toBe('test_client_id');
                expect(guildId).toBe('test_guild_id');
            }
        });
    });
});
