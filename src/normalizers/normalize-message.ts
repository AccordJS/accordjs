import {
    type MessageCreateEvent,
    MessageCreateEventSchema,
    type MessageDeleteEvent,
    MessageDeleteEventSchema,
    type MessageUpdateEvent,
    MessageUpdateEventSchema,
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
    const deletedAt = Date.now();

    const rawEvent = {
        type: 'MESSAGE_DELETE',
        timestamp: deletedAt,
        messageId: message.id,
        channelId: message.channelId,
        userId: message.author?.id,
        serverId: message.guildId ?? undefined,
        authorId: message.author?.id,
        deletedAt,
    };

    return MessageDeleteEventSchema.parse(rawEvent);
};

/**
 * Normalizes a Discord.js message-update payload into an AccordJS MessageUpdateEvent.
 *
 * @param _oldMessage - Previous Discord.js message payload.
 * @param newMessage - Updated Discord.js message payload.
 * @returns Validated, normalized MessageUpdateEvent.
 */
export const normalizeMessageUpdate = (
    _oldMessage: Message | PartialMessage,
    newMessage: Message | PartialMessage
): MessageUpdateEvent => {
    const timestamp = Date.now();

    return MessageUpdateEventSchema.parse({
        type: 'MESSAGE_UPDATE',
        timestamp,
        messageId: newMessage.id,
        channelId: newMessage.channelId,
        serverId: newMessage.guildId ?? undefined,
        userId: newMessage.author?.id,
        authorId: newMessage.author?.id,
        content: newMessage.content,
        editedAt: newMessage.editedTimestamp ?? undefined,
    });
};
