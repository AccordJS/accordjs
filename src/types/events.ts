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
    'COMMAND_PERMISSION_DENIED',
]);

export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Explicit mapping of handler method names to event types
 */
export type EventHandlerMap = Record<string, EventType>;

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
 * Normalized message delete event schema
 */
export const MessageDeleteEventSchema = BaseEventSchema.extend({
    type: z.literal('MESSAGE_DELETE'),
    messageId: z.string(),
    channelId: z.string(),
    userId: z.string().optional(),
    serverId: z.string().optional(),
    authorId: z.string().optional(),
    deletedAt: z.number().int().positive(),
});

export type MessageDeleteEvent = z.infer<typeof MessageDeleteEventSchema>;

/**
 * Normalized member leave event schema
 */
export const MemberLeaveEventSchema = DiscordEventSchema.extend({
    type: z.literal('MEMBER_LEAVE'),
    serverId: z.string(), // Required for member leaves
    username: z.string(),
    leftAt: z.number().int().positive(),
    reason: z.string().optional(), // kick, ban, voluntary leave, etc.
});

export type MemberLeaveEvent = z.infer<typeof MemberLeaveEventSchema>;

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
 * Normalized command permission denied event schema
 */
export const CommandPermissionDeniedEventSchema = ChannelEventSchema.extend({
    type: z.literal('COMMAND_PERMISSION_DENIED'),
    commandName: z.string(),
    requiredPermissions: z.array(z.string()),
    reason: z.string(),
});

export type CommandPermissionDeniedEvent = z.infer<typeof CommandPermissionDeniedEventSchema>;

/**
 * Discriminated union of all supported bot event schemas
 */
export const BotEventSchema = z.discriminatedUnion('type', [
    MessageCreateEventSchema,
    MessageDeleteEventSchema,
    MemberJoinEventSchema,
    MemberLeaveEventSchema,
    CommandDispatchEventSchema,
    CommandExecuteEventSchema,
    CommandErrorEventSchema,
    CommandPermissionDeniedEventSchema,
]);

export type BotEvent = z.infer<typeof BotEventSchema>;

/**
 * Map of event names to their respective event schemas
 */
export const EventMapSchemas = {
    MESSAGE_CREATE: MessageCreateEventSchema,
    MESSAGE_DELETE: MessageDeleteEventSchema,
    MEMBER_JOIN: MemberJoinEventSchema,
    MEMBER_LEAVE: MemberLeaveEventSchema,
    COMMAND_DISPATCH: CommandDispatchEventSchema,
    COMMAND_EXECUTE: CommandExecuteEventSchema,
    COMMAND_ERROR: CommandErrorEventSchema,
    COMMAND_PERMISSION_DENIED: CommandPermissionDeniedEventSchema,
} as const;

/**
 * Map of event names to their respective event types
 */
export type EventMap = {
    [K in keyof typeof EventMapSchemas]: z.infer<(typeof EventMapSchemas)[K]>;
};
