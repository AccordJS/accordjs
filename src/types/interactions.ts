import type {
    ApplicationCommandOptionChoiceData,
    InteractionDeferReplyOptions,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    InteractionResponse,
    InteractionUpdateOptions,
    Message,
} from 'discord.js';

export type AccordReplyOptions = Omit<InteractionReplyOptions, 'flags'> & {
    ephemeral?: boolean;
    flags?: InteractionReplyOptions['flags'];
};

export type AccordDeferOptions = Omit<InteractionDeferReplyOptions, 'flags'> & {
    ephemeral?: boolean;
    flags?: InteractionDeferReplyOptions['flags'];
};

export interface AccordInteractionResponse {
    reply(options: string | AccordReplyOptions): Promise<void>;
    defer(options?: AccordDeferOptions): Promise<void>;
    editReply(options: string | InteractionEditReplyOptions): Promise<Message>;
    followUp(options: string | AccordReplyOptions): Promise<Message>;
    update(options: string | InteractionUpdateOptions): Promise<Message | InteractionResponse>;
    respondChoices(options: readonly ApplicationCommandOptionChoiceData[]): Promise<void>;
}

export interface InteractionResponseRegistry {
    get(interactionId: string): AccordInteractionResponse | undefined;
    require(interactionId: string): AccordInteractionResponse;
}
