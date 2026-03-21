import type { Logger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerMiddlewareOptions {
    logLevel?: LogLevel;
    includeContent?: boolean;
    sensitiveFields?: string[];
    logger?: Logger;
}
