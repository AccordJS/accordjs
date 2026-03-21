export type ProfanityAction = 'flag' | 'block' | 'replace';

export interface ProfanityFilterOptions {
    bannedWords: string[];
    action?: ProfanityAction;
    replacement?: string;
    caseSensitive?: boolean;
    matchWholeWord?: boolean;
}
