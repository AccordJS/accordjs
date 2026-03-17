import { describe, expect, it } from 'bun:test';
import { BaseMiddleware } from '@app/middleware/base-middleware';

class ExampleMiddleware extends BaseMiddleware {
    public override execute(_event: unknown, next: () => Promise<void>): void | Promise<void> {
        return next();
    }
}

class HighPriorityMiddleware extends BaseMiddleware {
    public override readonly priority = -10;

    public override execute(_event: unknown, next: () => Promise<void>): void | Promise<void> {
        return next();
    }
}

class InvalidName extends BaseMiddleware {
    public override execute(_event: unknown, next: () => Promise<void>): void | Promise<void> {
        return next();
    }
}

describe('BaseMiddleware', () => {
    it('derives a default name from the class and provides a default priority', () => {
        const middleware = new ExampleMiddleware();

        expect(middleware.name).toBe('Example');
        expect(middleware.priority).toBe(0);
    });

    it('allows overriding the default priority', () => {
        const middleware = new HighPriorityMiddleware();

        expect(middleware.priority).toBe(-10);
    });

    it('enforces the Middleware suffix on class names', () => {
        expect(() => new InvalidName()).toThrow('Middleware');
    });
});
