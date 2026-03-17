import { BaseMiddleware } from '@app/middleware/base-middleware';
import type { BotEvent } from '@app/types';

export type ProfanityAction = 'flag' | 'block' | 'replace';

export interface ProfanityFilterOptions {
    bannedWords: string[];
    action?: ProfanityAction;
    replacement?: string;
    caseSensitive?: boolean;
    matchWholeWord?: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ProfanityFilterMiddleware<TEvent = BotEvent> extends BaseMiddleware<TEvent> {
    private regex: RegExp | null;
    private action: ProfanityAction;
    private replacement: string;

    constructor(options: ProfanityFilterOptions) {
        super();
        const words = options.bannedWords
            .map((word) => word.trim())
            .filter(Boolean)
            .map(escapeRegExp);
        if (words.length === 0) {
            this.regex = null;
        } else {
            const pattern = options.matchWholeWord ? `\\b(${words.join('|')})\\b` : `(${words.join('|')})`;
            const flags = options.caseSensitive ? 'g' : 'gi';
            this.regex = new RegExp(pattern, flags);
        }

        this.action = options.action ?? 'flag';
        this.replacement = options.replacement ?? '***';
    }

    public override async execute(event: TEvent, next: () => Promise<void>): Promise<void> {
        if (!this.regex) {
            await next();
            return;
        }

        const record = event as Record<string, unknown>;
        const content = typeof record.content === 'string' ? record.content : undefined;
        if (!content) {
            await next();
            return;
        }

        const matches = content.match(this.regex);
        if (!matches) {
            await next();
            return;
        }

        record.flagged = true;
        record.flaggedWords = Array.from(new Set(matches.map((match) => match.toLowerCase())));

        if (this.action === 'block') {
            return;
        }

        if (this.action === 'replace') {
            record.content = content.replace(this.regex, this.replacement);
        }

        await next();
    }
}
