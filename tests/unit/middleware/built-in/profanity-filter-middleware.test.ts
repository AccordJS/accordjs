import { describe, expect, it, mock } from 'bun:test';
import { ProfanityFilterMiddleware } from '@app/middleware/built-in/profanity-filter-middleware';

type TestEvent = { type: 'MESSAGE_CREATE'; content: string; flagged?: boolean; flaggedWords?: string[] };

describe('ProfanityFilterMiddleware', () => {
    it('flags events containing banned words', async () => {
        const middleware = new ProfanityFilterMiddleware<TestEvent>({
            bannedWords: ['spam'],
            action: 'flag',
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', content: 'this is spam' };

        await middleware.execute(event, next);

        expect(event.flagged).toBe(true);
        expect(event.flaggedWords).toEqual(['spam']);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('blocks events when action is block', async () => {
        const middleware = new ProfanityFilterMiddleware<TestEvent>({
            bannedWords: ['spam'],
            action: 'block',
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', content: 'spam here' };

        await middleware.execute(event, next);

        expect(next).toHaveBeenCalledTimes(0);
    });

    it('replaces banned words when action is replace', async () => {
        const middleware = new ProfanityFilterMiddleware<TestEvent>({
            bannedWords: ['spam'],
            action: 'replace',
            replacement: '[censored]',
        });
        const next = mock(async () => {});
        const event: TestEvent = { type: 'MESSAGE_CREATE', content: 'spam here' };

        await middleware.execute(event, next);

        expect(event.content).toBe('[censored] here');
        expect(next).toHaveBeenCalledTimes(1);
    });
});
