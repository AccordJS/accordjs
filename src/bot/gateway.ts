import type { EventBus } from '@app/bus';
import { normalizeMember } from '@app/events/normalize-member';
import { normalizeMessage } from '@app/events/normalize-message';
import { createLogger } from '@app/utils/create-logger';
import type { Client, GuildMember, Message } from 'discord.js';

/**
 * Gateway adapter for AccordJS.
 *
 * Connects the Discord client to the internal event bus by normalizing events
 * and publishing them.
 */
export class GatewayAdapter {
    protected client: Client;
    protected eventBus: EventBus;
    protected logger = createLogger('GatewayAdapter');

    /**
     * @param client - The initialized Discord.js client.
     * @param eventBus - The internal event bus.
     */
    constructor(client: Client, eventBus: EventBus) {
        this.client = client;
        this.eventBus = eventBus;
    }

    /**
     * Registers all event listeners on the Discord client.
     */
    public registerListeners(): void {
        this.client.on('messageCreate', (message: Message) => {
            try {
                const event = normalizeMessage(message);
                this.eventBus.publish('MESSAGE_CREATE', event);
            } catch (error) {
                this.logger.error(error, 'Error normalizing messageCreate event');
            }
        });

        this.client.on('guildMemberAdd', (member: GuildMember) => {
            try {
                const event = normalizeMember(member);
                this.eventBus.publish('MEMBER_JOIN', event);
            } catch (error) {
                this.logger.error(error, 'Error normalizing guildMemberAdd event');
            }
        });
    }
}
