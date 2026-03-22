import { describe, expect, it, mock } from 'bun:test';
import { InMemoryInteractionResponseRegistry } from '@app/interactions';
import type { Interaction } from 'discord.js';

describe('InMemoryInteractionResponseRegistry', () => {
    it('provides framework-shaped reply methods for repliable interactions', async () => {
        const reply = mock(async () => {});
        const interaction = {
            id: 'interaction-1',
            isRepliable: () => true,
            isMessageComponent: () => false,
            isAutocomplete: () => false,
            reply,
            deferReply: mock(async () => {}),
            editReply: mock(async () => ({ id: 'message-1' })),
            followUp: mock(async () => ({ id: 'message-2' })),
        } as unknown as Interaction;

        const registry = new InMemoryInteractionResponseRegistry();
        registry.register(interaction);

        const response = registry.require('interaction-1');
        await response.reply({ content: 'hello', ephemeral: true });

        expect(reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: 'hello',
                flags: expect.any(Number),
            })
        );
    });

    it('supports message updates for message component interactions', async () => {
        const update = mock(async () => ({ id: 'message-3' }));
        const interaction = {
            id: 'interaction-2',
            isRepliable: () => true,
            isMessageComponent: () => true,
            isAutocomplete: () => false,
            reply: mock(async () => {}),
            deferReply: mock(async () => {}),
            editReply: mock(async () => ({ id: 'message-1' })),
            followUp: mock(async () => ({ id: 'message-2' })),
            update,
        } as unknown as Interaction;

        const registry = new InMemoryInteractionResponseRegistry();
        registry.register(interaction);

        await registry.require('interaction-2').update({ content: 'updated' });
        expect(update).toHaveBeenCalledWith({ content: 'updated' });
    });

    it('supports autocomplete responses for autocomplete interactions', async () => {
        const respond = mock(async () => {});
        const interaction = {
            id: 'interaction-3',
            isRepliable: () => false,
            isMessageComponent: () => false,
            isAutocomplete: () => true,
            respond,
        } as unknown as Interaction;

        const registry = new InMemoryInteractionResponseRegistry();
        registry.register(interaction);

        await registry.require('interaction-3').respondChoices([{ name: 'one', value: 'one' }]);
        expect(respond).toHaveBeenCalledWith([{ name: 'one', value: 'one' }]);
    });
});
