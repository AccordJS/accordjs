import { describe, expect, it } from 'bun:test';
import { normalizePresenceUpdate } from '@app/normalizers/normalize-presence';
import type { Presence } from 'discord.js';

describe('Presence Normalization', () => {
    it('should correctly normalize a presence update with old and new state', () => {
        const oldPresence = {
            userId: 'user-1',
            status: 'offline',
            guild: {
                id: 'guild-1',
            },
            clientStatus: {
                web: 'offline',
            },
            activities: [{ name: 'Before', type: 0 }],
        } as unknown as Presence;

        const newPresence = {
            userId: 'user-1',
            status: 'online',
            guild: {
                id: 'guild-1',
            },
            clientStatus: {
                desktop: 'online',
                mobile: 'idle',
            },
            activities: [
                { name: 'After One', type: 0 },
                { name: 'After Two', type: 2 },
            ],
        } as unknown as Presence;

        const normalized = normalizePresenceUpdate(oldPresence, newPresence);

        expect(normalized).toEqual({
            type: 'PRESENCE_UPDATE',
            timestamp: expect.any(Number),
            occurredAt: expect.any(Number),
            userId: 'user-1',
            serverId: 'guild-1',
            oldStatus: 'offline',
            newStatus: 'online',
            oldClientStatus: { web: 'offline' },
            newClientStatus: { desktop: 'online', mobile: 'idle', web: undefined },
            oldActivityNames: ['Before'],
            newActivityNames: ['After One', 'After Two'],
            oldActivityTypes: [0],
            newActivityTypes: [0, 2],
        });
    });

    it('should normalize a presence update with no old presence', () => {
        const newPresence = {
            userId: 'user-2',
            status: 'idle',
            guild: {
                id: 'guild-2',
            },
            clientStatus: undefined,
            activities: [],
        } as unknown as Presence;

        const normalized = normalizePresenceUpdate(null, newPresence);

        expect(normalized).toEqual({
            type: 'PRESENCE_UPDATE',
            timestamp: expect.any(Number),
            occurredAt: expect.any(Number),
            userId: 'user-2',
            serverId: 'guild-2',
            oldStatus: undefined,
            newStatus: 'idle',
            oldClientStatus: undefined,
            newClientStatus: {},
            oldActivityNames: undefined,
            newActivityNames: [],
            oldActivityTypes: undefined,
            newActivityTypes: [],
        });
    });

    it('should throw a clear error when new presence lacks required guild context', () => {
        const newPresence = {
            userId: 'user-3',
            status: 'online',
            guild: undefined,
            activities: [],
        } as unknown as Presence;

        expect(() => normalizePresenceUpdate(null, newPresence)).toThrow('Presence update is missing guild context');
    });
});
