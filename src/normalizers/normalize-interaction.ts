import {
    type InteractionAutocompleteEvent,
    InteractionAutocompleteEventSchema,
    type InteractionButtonEvent,
    InteractionButtonEventSchema,
    type InteractionChannelSelectEvent,
    InteractionChannelSelectEventSchema,
    type InteractionCommandEvent,
    InteractionCommandEventSchema,
    type InteractionMentionableSelectEvent,
    InteractionMentionableSelectEventSchema,
    type InteractionModalSubmitEvent,
    InteractionModalSubmitEventSchema,
    type InteractionRoleSelectEvent,
    InteractionRoleSelectEventSchema,
    type InteractionStringSelectEvent,
    InteractionStringSelectEventSchema,
    type InteractionUserSelectEvent,
    InteractionUserSelectEventSchema,
} from '@app/types';
import type { Interaction } from 'discord.js';

type NormalizedInteractionEvent =
    | InteractionCommandEvent
    | InteractionAutocompleteEvent
    | InteractionButtonEvent
    | InteractionStringSelectEvent
    | InteractionUserSelectEvent
    | InteractionRoleSelectEvent
    | InteractionChannelSelectEvent
    | InteractionMentionableSelectEvent
    | InteractionModalSubmitEvent;

type OptionLike = {
    name?: string;
    value?: unknown;
    options?: readonly OptionLike[];
};

const extractOptionValues = (options: readonly OptionLike[]): Record<string, unknown> => {
    const values: Record<string, unknown> = {};

    for (const option of options) {
        if (typeof option.name === 'string' && option.value !== undefined) {
            values[option.name] = option.value;
        }

        if (option.options) {
            Object.assign(values, extractOptionValues(option.options));
        }
    }

    return values;
};

const getBaseInteractionData = (interaction: Interaction) => ({
    interactionId: interaction.id,
    timestamp: Date.now(),
    userId: interaction.user.id,
    channelId: interaction.channelId ?? undefined,
    serverId: interaction.guildId ?? undefined,
});

const getSubcommand = (interaction: Interaction): string | undefined => {
    if (!interaction.isChatInputCommand()) {
        return undefined;
    }

    return interaction.options.getSubcommand(false) ?? undefined;
};

const getSubcommandGroup = (interaction: Interaction): string | undefined => {
    if (!interaction.isChatInputCommand()) {
        return undefined;
    }

    return interaction.options.getSubcommandGroup(false) ?? undefined;
};

export const normalizeInteraction = (interaction: Interaction): NormalizedInteractionEvent | undefined => {
    const base = getBaseInteractionData(interaction);

    if (interaction.isChatInputCommand()) {
        return InteractionCommandEventSchema.parse({
            type: 'INTERACTION_COMMAND',
            ...base,
            commandName: interaction.commandName,
            subcommand: getSubcommand(interaction),
            subcommandGroup: getSubcommandGroup(interaction),
            options: extractOptionValues(interaction.options.data as unknown as readonly OptionLike[]),
        });
    }

    if (interaction.isAutocomplete()) {
        const focused = interaction.options.getFocused(true);

        return InteractionAutocompleteEventSchema.parse({
            type: 'INTERACTION_AUTOCOMPLETE',
            ...base,
            commandName: interaction.commandName,
            focusedOptionName: focused.name,
            focusedOptionValue: focused.value,
            options: extractOptionValues(interaction.options.data as unknown as readonly OptionLike[]),
        });
    }

    if (interaction.isButton()) {
        return InteractionButtonEventSchema.parse({
            type: 'INTERACTION_BUTTON',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
        });
    }

    if (interaction.isStringSelectMenu()) {
        return InteractionStringSelectEventSchema.parse({
            type: 'INTERACTION_STRING_SELECT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
            values: interaction.values,
        });
    }

    if (interaction.isUserSelectMenu()) {
        return InteractionUserSelectEventSchema.parse({
            type: 'INTERACTION_USER_SELECT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
            values: interaction.values,
        });
    }

    if (interaction.isRoleSelectMenu()) {
        return InteractionRoleSelectEventSchema.parse({
            type: 'INTERACTION_ROLE_SELECT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
            values: interaction.values,
        });
    }

    if (interaction.isChannelSelectMenu()) {
        return InteractionChannelSelectEventSchema.parse({
            type: 'INTERACTION_CHANNEL_SELECT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
            values: interaction.values,
        });
    }

    if (interaction.isMentionableSelectMenu()) {
        return InteractionMentionableSelectEventSchema.parse({
            type: 'INTERACTION_MENTIONABLE_SELECT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message.id,
            values: interaction.values,
        });
    }

    if (interaction.isModalSubmit()) {
        const fields: Record<string, string> = {};
        for (const [key, field] of interaction.fields.fields.entries()) {
            if ('value' in field && typeof field.value === 'string') {
                fields[key] = field.value;
            }
        }

        return InteractionModalSubmitEventSchema.parse({
            type: 'INTERACTION_MODAL_SUBMIT',
            ...base,
            customId: interaction.customId,
            messageId: interaction.message?.id ?? undefined,
            fields,
        });
    }

    return undefined;
};
