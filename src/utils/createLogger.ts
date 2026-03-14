import pino from 'pino';

/**
 * Creates a configured Pino logger instance
 * Uses pretty printing in development, structured JSON in production
 * @param name - The name of the logger instance
 * @returns A configured Pino logger
 */
export const createLogger = (name: string) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return pino({
        name,
        level: process.env.LOG_LEVEL || 'info',
        ...(isDevelopment && {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            },
        }),
    });
};
