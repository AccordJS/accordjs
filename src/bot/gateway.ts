import type { EventBus } from '@app/bus';
import type { DiscordClientDebugConfig } from '@app/config';
import { normalizeGuildAvailable, normalizeGuildUnavailable } from '@app/normalizers/normalize-guild';
import { normalizeMemberJoin, normalizeMemberLeave } from '@app/normalizers/normalize-member';
import { normalizeMessage, normalizeMessageDelete } from '@app/normalizers/normalize-message';
import {
    DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS,
    DEFAULT_GATEWAY_EVENTS,
    type DiscordClientDebugEvent,
    type GatewayEvent,
} from '@app/types';
import { createLogger } from '@app/utils/create-logger';
import type {
    Client,
    Guild,
    GuildMember,
    Interaction,
    Message,
    PartialGuildMember,
    PartialMessage,
    Presence,
    VoiceState,
} from 'discord.js';
import type { Logger } from 'pino';

type DebuggableDiscordClientEvent = DiscordClientDebugEvent;

export interface GatewayAdapterOptions {
    debug?: DiscordClientDebugConfig;
    gatewayEvents?: readonly GatewayEvent[];
    logger?: Logger;
}

type DebugEventPayload = {
    discordClientEvent: DebuggableDiscordClientEvent;
    timestamp: number;
    guildId?: string;
    channelId?: string;
    userId?: string;
    messageId?: string;
    metadata: Record<string, unknown>;
};

const DEFAULT_DEBUG_OPTIONS: DiscordClientDebugConfig = {
    enabled: false,
    events: [...DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS],
};

/**
 * Gateway adapter for AccordJS.
 *
 * Connects the Discord client to the internal event bus by normalizing events
 * and publishing them.
 */
export class GatewayAdapter {
    protected client: Client;
    protected eventBus: EventBus;
    protected logger: Logger;
    protected debugConfig: DiscordClientDebugConfig;
    protected gatewayEvents: GatewayEvent[];

    /**
     * @param client - The initialized Discord.js client.
     * @param eventBus - The internal event bus.
     */
    constructor(client: Client, eventBus: EventBus, options: GatewayAdapterOptions = {}) {
        this.client = client;
        this.eventBus = eventBus;
        this.logger = options.logger ?? createLogger('GatewayAdapter');
        this.debugConfig = {
            enabled: options.debug?.enabled ?? DEFAULT_DEBUG_OPTIONS.enabled,
            events: options.debug?.events ?? [...DEFAULT_DEBUG_OPTIONS.events],
        };
        this.gatewayEvents = [...(options.gatewayEvents ?? DEFAULT_GATEWAY_EVENTS)];
    }

    /**
     * Registers all event listeners on the Discord client.
     */
    public registerListeners(): void {
        this.registerDebugListeners();
        this.registerGatewayListeners();
    }

    protected registerGatewayListeners(): void {
        for (const eventName of this.gatewayEvents) {
            switch (eventName) {
                case 'messageCreate':
                    this.client.on('messageCreate', (message: Message) => {
                        try {
                            const event = normalizeMessage(message);
                            this.eventBus.publish('MESSAGE_CREATE', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing messageCreate event');
                        }
                    });
                    break;
                case 'guildMemberAdd':
                    this.client.on('guildMemberAdd', (member: GuildMember) => {
                        try {
                            const event = normalizeMemberJoin(member);
                            this.eventBus.publish('MEMBER_JOIN', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing guildMemberAdd event');
                        }
                    });
                    break;
                case 'guildCreate':
                    this.client.on('guildCreate', (guild: Guild) => {
                        try {
                            const event = normalizeGuildAvailable(guild);
                            this.eventBus.publish('GUILD_AVAILABLE', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing guildCreate event');
                        }
                    });
                    break;
                case 'guildDelete':
                    this.client.on('guildDelete', (guild: Guild) => {
                        try {
                            const event = normalizeGuildUnavailable(guild);
                            this.eventBus.publish('GUILD_UNAVAILABLE', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing guildDelete event');
                        }
                    });
                    break;
                case 'messageDelete':
                    this.client.on('messageDelete', (message: Message | PartialMessage) => {
                        try {
                            const event = normalizeMessageDelete(message);
                            this.eventBus.publish('MESSAGE_DELETE', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing messageDelete event');
                        }
                    });
                    break;
                case 'guildMemberRemove':
                    this.client.on('guildMemberRemove', (member: GuildMember | PartialGuildMember) => {
                        try {
                            const event = normalizeMemberLeave(member);
                            this.eventBus.publish('MEMBER_LEAVE', event);
                        } catch (error) {
                            this.logger.error(error, 'Error normalizing guildMemberRemove event');
                        }
                    });
                    break;
            }
        }
    }

    protected registerDebugListeners(): void {
        if (!this.debugConfig.enabled) {
            return;
        }

        const eventNames =
            this.debugConfig.events.length > 0 ? this.debugConfig.events : DEFAULT_DISCORD_CLIENT_DEBUG_EVENTS;

        for (const eventName of eventNames) {
            this.client.on(eventName, (...args) => {
                try {
                    this.logger.debug(this.createDebugPayload(eventName, args), 'Observed Discord client event');
                } catch (error) {
                    this.logger.error(error, `Error capturing debug payload for ${eventName}`);
                }
            });
        }
    }

    protected createDebugPayload(eventName: DebuggableDiscordClientEvent, args: unknown[]): DebugEventPayload {
        const base: DebugEventPayload = {
            discordClientEvent: eventName,
            timestamp: Date.now(),
            metadata: {
                argumentCount: args.length,
            },
        };

        switch (eventName) {
            case 'guildCreate':
            case 'guildDelete':
            case 'guildUnavailable':
                return this.withGuildPayload(base, args[0] as Guild);
            case 'guildMemberAdd':
            case 'guildMemberRemove':
                return this.withMemberPayload(base, args[0] as GuildMember);
            case 'messageCreate':
            case 'messageDelete':
                return this.withMessagePayload(base, args[0] as Message);
            case 'messageUpdate':
                return this.withMessagePayload(base, args[1] as Message);
            case 'interactionCreate':
                return this.withInteractionPayload(base, args[0] as Interaction);
            case 'presenceUpdate':
                return this.withPresencePayload(base, args[1] as Presence);
            case 'voiceStateUpdate':
                return this.withVoiceStatePayload(base, args[1] as VoiceState);
            case 'clientReady': {
                const readyClient = args[0] as Client<true>;
                return {
                    ...base,
                    userId: readyClient.user.id,
                    metadata: {
                        ...base.metadata,
                        username: readyClient.user.username,
                    },
                };
            }
            case 'error': {
                const error = args[0] as Error;
                return {
                    ...base,
                    metadata: {
                        ...base.metadata,
                        name: error.name,
                        message: error.message,
                    },
                };
            }
            case 'warn':
            case 'debug':
                return {
                    ...base,
                    metadata: {
                        ...base.metadata,
                        message: args[0],
                    },
                };
        }
    }

    protected withGuildPayload(base: DebugEventPayload, guild: Guild): DebugEventPayload {
        return {
            ...base,
            guildId: guild.id,
            metadata: {
                ...base.metadata,
                guildName: guild.name,
                memberCount: guild.memberCount,
            },
        };
    }

    protected withMemberPayload(base: DebugEventPayload, member: GuildMember): DebugEventPayload {
        return {
            ...base,
            guildId: member.guild.id,
            userId: member.user.id,
            metadata: {
                ...base.metadata,
                username: member.user.username,
            },
        };
    }

    protected withMessagePayload(base: DebugEventPayload, message: Message): DebugEventPayload {
        return {
            ...base,
            guildId: message.guild?.id,
            channelId: message.channelId,
            userId: message.author?.id,
            messageId: message.id,
            metadata: {
                ...base.metadata,
                isBot: message.author?.bot,
            },
        };
    }

    protected withInteractionPayload(base: DebugEventPayload, interaction: Interaction): DebugEventPayload {
        return {
            ...base,
            guildId: interaction.guildId ?? undefined,
            channelId: interaction.channelId ?? undefined,
            userId: interaction.user.id,
            metadata: {
                ...base.metadata,
                interactionType: interaction.type,
                commandName: interaction.isChatInputCommand() ? interaction.commandName : undefined,
            },
        };
    }

    protected withPresencePayload(base: DebugEventPayload, presence: Presence): DebugEventPayload {
        return {
            ...base,
            guildId: presence.guild?.id,
            userId: presence.userId,
            metadata: {
                ...base.metadata,
                status: presence.status,
            },
        };
    }

    protected withVoiceStatePayload(base: DebugEventPayload, state: VoiceState): DebugEventPayload {
        return {
            ...base,
            guildId: state.guild.id,
            channelId: state.channelId ?? undefined,
            userId: state.id,
            metadata: {
                ...base.metadata,
                sessionId: state.sessionId ?? undefined,
            },
        };
    }
}
