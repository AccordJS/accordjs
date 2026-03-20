import { type MessageCreateEvent, MessageCreateEventSchema } from '@app/types';
import type { Message } from 'discord.js';

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
