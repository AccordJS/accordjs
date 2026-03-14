import pino from 'pino';

/**
 * Creates a configured Pino logger instance
 * @param name - The name of the logger instance
 * @returns A configured Pino logger
 */
export const createLogger = (name: string) => {
    return pino({
        name,
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        },
    });
};
