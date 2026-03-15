import { z } from 'zod';

/**
 * Core event schemas and type definitions for AccordJS
 */

/**
 * Valid event names in the system
 */
export const EventTypeSchema = z.enum([
    'MESSAGE_CREATE',
    'MEMBER_JOIN',
    'MESSAGE_DELETE',
    'MEMBER_LEAVE',
    'COMMAND_DISPATCH',
    'COMMAND_EXECUTE',
    'COMMAND_ERROR',
]);

export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Base properties shared by all events
 */
export const BaseEventSchema = z.object({
    type: EventTypeSchema,
    timestamp: z.number().int().positive(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Common properties for events involving a user and an optional server
 */
export const DiscordEventSchema = BaseEventSchema.extend({
    userId: z.string(),
    serverId: z.string().optional(),
});

export type DiscordEvent = z.infer<typeof DiscordEventSchema>;

/**
 * Common properties for events occurring within a specific channel
 */
export const ChannelEventSchema = DiscordEventSchema.extend({
    channelId: z.string(),
});

export type ChannelEvent = z.infer<typeof ChannelEventSchema>;

/**
 * Normalized message creation event schema
 */
export const MessageCreateEventSchema = ChannelEventSchema.extend({
    type: z.literal('MESSAGE_CREATE'),
    messageId: z.string(),
    content: z.string(),
    authorName: z.string(),
    authorTag: z.string(),
    isBot: z.boolean(),
});

export type MessageCreateEvent = z.infer<typeof MessageCreateEventSchema>;

/**
 * Normalized member join event schema
 */
export const MemberJoinEventSchema = DiscordEventSchema.extend({
    type: z.literal('MEMBER_JOIN'),
    serverId: z.string(), // Required for member joins
    username: z.string(),
    joinedAt: z.number().int().positive(),
});

export type MemberJoinEvent = z.infer<typeof MemberJoinEventSchema>;

/**
 * Normalized command dispatch event schema
 */
export const CommandDispatchEventSchema = ChannelEventSchema.extend({
    type: z.literal('COMMAND_DISPATCH'),
    commandName: z.string(),
    arguments: z.array(z.string()),
    rawContent: z.string(),
});

export type CommandDispatchEvent = z.infer<typeof CommandDispatchEventSchema>;

/**
 * Normalized command execution event schema
 */
export const CommandExecuteEventSchema = ChannelEventSchema.extend({
    type: z.literal('COMMAND_EXECUTE'),
    commandName: z.string(),
    durationMs: z.number(),
});

export type CommandExecuteEvent = z.infer<typeof CommandExecuteEventSchema>;

/**
 * Normalized command error event schema
 */
export const CommandErrorEventSchema = ChannelEventSchema.extend({
    type: z.literal('COMMAND_ERROR'),
    commandName: z.string(),
    error: z.string(),
});

export type CommandErrorEvent = z.infer<typeof CommandErrorEventSchema>;

/**
 * Discriminated union of all supported bot event schemas
 */
export const BotEventSchema = z.discriminatedUnion('type', [
    MessageCreateEventSchema,
    MemberJoinEventSchema,
    CommandDispatchEventSchema,
    CommandExecuteEventSchema,
    CommandErrorEventSchema,
]);

export type BotEvent = z.infer<typeof BotEventSchema>;

/**
 * Map of event names to their respective event schemas
 */
export const EventMapSchemas = {
    MESSAGE_CREATE: MessageCreateEventSchema,
    MEMBER_JOIN: MemberJoinEventSchema,
    COMMAND_DISPATCH: CommandDispatchEventSchema,
    COMMAND_EXECUTE: CommandExecuteEventSchema,
    COMMAND_ERROR: CommandErrorEventSchema,
} as const;

/**
 * Map of event names to their respective event types
 */
export type EventMap = {
    [K in keyof typeof EventMapSchemas]: z.infer<(typeof EventMapSchemas)[K]>;
};
