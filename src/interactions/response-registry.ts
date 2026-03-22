import type {
    AccordDeferOptions,
    AccordInteractionResponse,
    AccordReplyOptions,
    InteractionResponseRegistry,
} from '@app/types';
import type {
    ApplicationCommandOptionChoiceData,
    Interaction,
    InteractionDeferReplyOptions,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
    RepliableInteraction,
} from 'discord.js';
import { MessageFlags } from 'discord.js';

const INTERACTION_RESPONSE_TTL_MS = 15 * 60 * 1000;

class InteractionResponseHandle implements AccordInteractionResponse {
    constructor(private readonly interaction: Interaction) {}

    public async reply(options: string | AccordReplyOptions): Promise<void> {
        const interaction = this.requireRepliable();

        if (typeof options === 'string') {
            await interaction.reply(options);
            return;
        }

        const { ephemeral, ...rest } = options;
        const replyOptions: InteractionReplyOptions = ephemeral
            ? {
                  ...rest,
                  flags: rest.flags ? [rest.flags, MessageFlags.Ephemeral] : MessageFlags.Ephemeral,
              }
            : rest;

        await interaction.reply(replyOptions);
    }

    public async defer(options: AccordDeferOptions = {}): Promise<void> {
        const interaction = this.requireRepliable();
        const { ephemeral, ...rest } = options;
        const deferOptions: InteractionDeferReplyOptions = ephemeral
            ? {
                  ...rest,
                  flags: rest.flags ? [rest.flags, MessageFlags.Ephemeral] : MessageFlags.Ephemeral,
              }
            : rest;

        await interaction.deferReply(deferOptions);
    }

    public async editReply(options: string | InteractionEditReplyOptions): Promise<Message> {
        return this.requireRepliable().editReply(options);
    }

    public async followUp(options: string | AccordReplyOptions): Promise<Message> {
        const interaction = this.requireRepliable();

        if (typeof options === 'string') {
            return interaction.followUp(options);
        }

        const { ephemeral, ...rest } = options;
        const replyOptions: InteractionReplyOptions = ephemeral
            ? {
                  ...rest,
                  flags: rest.flags ? [rest.flags, MessageFlags.Ephemeral] : MessageFlags.Ephemeral,
              }
            : rest;

        return interaction.followUp(replyOptions);
    }

    public async update(options: string | InteractionUpdateOptions): Promise<InteractionResponse | Message> {
        if (!this.interaction.isMessageComponent()) {
            throw new Error('Interaction does not support message updates');
        }

        return this.interaction.update(options);
    }

    public async respondChoices(options: readonly ApplicationCommandOptionChoiceData[]): Promise<void> {
        if (!this.interaction.isAutocomplete()) {
            throw new Error('Interaction does not support autocomplete responses');
        }

        await this.interaction.respond(options);
    }

    private requireRepliable(): RepliableInteraction {
        if (!this.interaction.isRepliable()) {
            throw new Error('Interaction does not support replies');
        }

        return this.interaction;
    }
}

export class InMemoryInteractionResponseRegistry implements InteractionResponseRegistry {
    private readonly responses = new Map<string, AccordInteractionResponse>();
    private readonly cleanupTimers = new Map<string, NodeJS.Timeout>();

    public register(interaction: Interaction): void {
        this.responses.set(interaction.id, new InteractionResponseHandle(interaction));

        const existingTimer = this.cleanupTimers.get(interaction.id);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            this.responses.delete(interaction.id);
            this.cleanupTimers.delete(interaction.id);
        }, INTERACTION_RESPONSE_TTL_MS);

        this.cleanupTimers.set(interaction.id, timer);
    }

    public get(interactionId: string): AccordInteractionResponse | undefined {
        return this.responses.get(interactionId);
    }

    public require(interactionId: string): AccordInteractionResponse {
        const response = this.get(interactionId);
        if (!response) {
            throw new Error(`No response context found for interaction '${interactionId}'`);
        }

        return response;
    }
}
