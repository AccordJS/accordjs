import {
    type MessageCreateEvent,
    MessageCreateEventSchema,
    type MessageDeleteEvent,
    MessageDeleteEventSchema,
} from '@app/types';
import type { Message, PartialMessage } from 'discord.js';

/**
 * Normalizes a Discord.js Message object into an AccordJS MessageCreateEvent.
 *
 * @param message - Raw Discord.js Message object.
 * @returns Validated, normalized MessageCreateEvent.
 */
export const normalizeMessage = (message: Message): MessageCreateEvent => {
    const rawEvent = {
        type: 'MESSAGE_CREATE',
        timestamp: message.createdTimestamp,
        messageId: message.id,
        channelId: message.channelId,
        userId: message.author.id,
        serverId: message.guildId ?? undefined,
        content: message.content,
        authorName: message.author.username,
        authorTag: message.author.tag,
        isBot: message.author.bot,
    };

    return MessageCreateEventSchema.parse(rawEvent);
};

/**
 * Normalizes a Discord.js message-delete payload into an AccordJS MessageDeleteEvent.
 *
 * @param message - Raw Discord.js message or partial message payload.
 * @returns Validated, normalized MessageDeleteEvent.
 */
export const normalizeMessageDelete = (message: Message | PartialMessage): MessageDeleteEvent => {
    const rawEvent = {
        type: 'MESSAGE_DELETE',
        timestamp: Date.now(),
        messageId: message.id,
        channelId: message.channelId,
        userId: message.author?.id,
        serverId: message.guildId ?? undefined,
        authorId: message.author?.id,
        deletedAt: Date.now(),
    };

    return MessageDeleteEventSchema.parse(rawEvent);
};
