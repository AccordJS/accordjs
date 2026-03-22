import { describe, expect, it } from 'bun:test';
import { normalizeInteraction } from '@app/normalizers/normalize-interaction';
import type { Interaction } from 'discord.js';

describe('Interaction Normalization', () => {
    it('normalizes a chat input command interaction', () => {
        const interaction = {
            id: 'interaction-1',
            user: { id: 'user-1' },
            channelId: 'channel-1',
            guildId: 'guild-1',
            isChatInputCommand: () => true,
            isAutocomplete: () => false,
            isButton: () => false,
            isStringSelectMenu: () => false,
            isUserSelectMenu: () => false,
            isRoleSelectMenu: () => false,
            isChannelSelectMenu: () => false,
            isMentionableSelectMenu: () => false,
            isModalSubmit: () => false,
            commandName: 'stats',
            options: {
                data: [
                    { name: 'scope', value: 'server' },
                    { name: 'window', value: '7d' },
                ],
                getSubcommand: () => null,
                getSubcommandGroup: () => null,
            },
        } as unknown as Interaction;

        const normalized = normalizeInteraction(interaction);

        expect(normalized).toEqual({
            type: 'INTERACTION_COMMAND',
            interactionId: 'interaction-1',
            timestamp: expect.any(Number),
            userId: 'user-1',
            channelId: 'channel-1',
            serverId: 'guild-1',
            commandName: 'stats',
            subcommand: undefined,
            subcommandGroup: undefined,
            options: {
                scope: 'server',
                window: '7d',
            },
        });
    });

    it('normalizes a modal submit interaction', () => {
        const interaction = {
            id: 'interaction-2',
            user: { id: 'user-2' },
            channelId: 'channel-2',
            guildId: 'guild-2',
            isChatInputCommand: () => false,
            isAutocomplete: () => false,
            isButton: () => false,
            isStringSelectMenu: () => false,
            isUserSelectMenu: () => false,
            isRoleSelectMenu: () => false,
            isChannelSelectMenu: () => false,
            isMentionableSelectMenu: () => false,
            isModalSubmit: () => true,
            customId: 'mood-note',
            message: { id: 'message-2' },
            fields: {
                fields: new Map([['note', { value: 'hello world' }]]),
            },
        } as unknown as Interaction;

        const normalized = normalizeInteraction(interaction);

        expect(normalized).toEqual({
            type: 'INTERACTION_MODAL_SUBMIT',
            interactionId: 'interaction-2',
            timestamp: expect.any(Number),
            userId: 'user-2',
            channelId: 'channel-2',
            serverId: 'guild-2',
            customId: 'mood-note',
            messageId: 'message-2',
            fields: {
                note: 'hello world',
            },
        });
    });

    it('returns undefined for unsupported interactions', () => {
        const interaction = {
            id: 'interaction-3',
            user: { id: 'user-3' },
            isChatInputCommand: () => false,
            isAutocomplete: () => false,
            isButton: () => false,
            isStringSelectMenu: () => false,
            isUserSelectMenu: () => false,
            isRoleSelectMenu: () => false,
            isChannelSelectMenu: () => false,
            isMentionableSelectMenu: () => false,
            isModalSubmit: () => false,
        } as unknown as Interaction;

        expect(normalizeInteraction(interaction)).toBeUndefined();
    });
});
