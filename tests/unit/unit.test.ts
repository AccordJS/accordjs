import { expect, test } from 'bun:test';

test('example test', () => {
    expect(1 + 1).toBe(2);
});

test('async test example', async () => {
    const result = Promise.resolve('hello');
    expect(result).resolves.toBe('hello');
});
