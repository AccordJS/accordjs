import { describe, expect, it } from 'bun:test';
import { createAccordApp } from '@app/app/bootstrap';
import { type Config, DEFAULT_DEBUG_CONFIG, DEFAULT_MIDDLEWARE_CONFIG } from '@app/config';
import { BotFilterMiddleware } from '@app/middleware/built-in';
import { BasePlugin } from '@app/plugins/base-plugin';
import type { EventHandlerMap, MemberLeaveEvent } from '@app/types';

class BoundPlugin extends BasePlugin {
    public override readonly name = 'bound-plugin';
    public leaveEvents: MemberLeaveEvent[] = [];

    public async onMemberLeave(event: MemberLeaveEvent): Promise<void> {
        this.leaveEvents.push(event);
    }
}

const baseConfig: Config = {
    env: 'test',
    log: { level: 'info' },
    discord: { token: 'token' },
    middleware: DEFAULT_MIDDLEWARE_CONFIG,
    debug: DEFAULT_DEBUG_CONFIG,
};

describe('createAccordApp', () => {
    it('builds an app with explicit middleware, gateway events, and handler bindings', async () => {
        const plugin = new BoundPlugin();
        const handlerBindings: EventHandlerMap = {
            onMemberLeave: 'MEMBER_LEAVE',
        };

        const app = await createAccordApp({
            config: baseConfig,
            middleware: [new BotFilterMiddleware()],
            gatewayEvents: ['guildMemberRemove'],
            plugins: [
                {
                    plugin,
                    handlerBindings,
                },
            ],
        });

        expect(app.pluginManager.getPlugins()).toEqual(['bound-plugin']);
        expect(app.eventBus.listMiddleware()).toHaveLength(1);

        const gateway = app.gateway as unknown as { gatewayEvents: string[] };
        expect(gateway.gatewayEvents).toEqual(['guildMemberRemove']);

        app.eventBus.publish('MEMBER_LEAVE', {
            type: 'MEMBER_LEAVE',
            timestamp: Date.now(),
            userId: 'user-1',
            serverId: 'guild-1',
            username: 'Alice',
            leftAt: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(plugin.leaveEvents).toHaveLength(1);
    });
});
