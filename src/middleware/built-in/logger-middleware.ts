import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { BotEvent } from '@app/types';
import { createLogger } from '@app/utils/create-logger';
import type { Logger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerMiddlewareOptions {
    logLevel?: LogLevel;
    includeContent?: boolean;
    sensitiveFields?: string[];
    logger?: Logger;
}

const redactField = '[REDACTED]';

export class LoggerMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    private logger: Logger;
    private level: LogLevel;
    private includeContent: boolean;
    private sensitiveFields: Set<string>;

    constructor(options: LoggerMiddlewareOptions = {}) {
        super();
        this.logger = options.logger ?? createLogger('LoggerMiddleware');
        this.level = options.logLevel ?? 'info';
        this.includeContent = options.includeContent ?? false;
        this.sensitiveFields = new Set(options.sensitiveFields ?? []);
    }

    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        const record = this.sanitize(event as Record<string, unknown>);
        const logFn = this.logger[this.level] ?? this.logger.info;

        logFn.call(this.logger, { eventType: record.type, event: record }, 'Event received');

        await next();
    }

    private sanitize(event: Record<string, unknown>): Record<string, unknown> {
        const sanitized = { ...event };

        if (!this.includeContent) {
            if (typeof sanitized.content === 'string') {
                sanitized.content = redactField;
            }
            if (typeof sanitized.rawContent === 'string') {
                sanitized.rawContent = redactField;
            }
        }

        for (const key of this.sensitiveFields) {
            if (key in sanitized) {
                sanitized[key] = redactField;
            }
        }

        return sanitized;
    }
}
