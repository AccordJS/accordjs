import type { EventMiddleware } from '@app/middleware/types';

export class PluginMiddlewareManager {
    private middleware: EventMiddleware[] = [];

    public add(middleware: EventMiddleware | EventMiddleware[]): void {
        const items = Array.isArray(middleware) ? middleware : [middleware];
        this.middleware = [...this.middleware, ...items];
    }

    public list(): EventMiddleware[] {
        return [...this.middleware];
    }

    public clear(): void {
        this.middleware = [];
    }
}
