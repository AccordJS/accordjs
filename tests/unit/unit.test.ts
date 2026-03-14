import { describe, expect, it } from 'bun:test';

describe('Example Tests', () => {
    it('example test', () => {
        expect(1 + 1).toBe(2);
    });

    it('async test example', async () => {
        const result = Promise.resolve('hello');
        expect(result).resolves.toBe('hello');
    });
});
