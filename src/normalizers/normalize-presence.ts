import { type ClientStatusSnapshot, type PresenceUpdateEvent, PresenceUpdateEventSchema } from '@app/types';
import type { Activity, Presence } from 'discord.js';

const normalizeClientStatus = (presence: Presence | null): ClientStatusSnapshot | undefined => {
    const clientStatus = presence?.clientStatus;
    if (!clientStatus) {
        return undefined;
    }

    return {
        desktop: clientStatus.desktop ?? undefined,
        mobile: clientStatus.mobile ?? undefined,
        web: clientStatus.web ?? undefined,
    };
};

const normalizeActivityNames = (activities: readonly Activity[] | undefined): string[] => {
    return (activities ?? []).map((activity) => activity.name).filter((name): name is string => Boolean(name));
};

const normalizeActivityTypes = (activities: readonly Activity[] | undefined): number[] => {
    return (activities ?? [])
        .map((activity) => activity.type)
        .filter((type): type is number => typeof type === 'number');
};

export const normalizePresenceUpdate = (oldPresence: Presence | null, newPresence: Presence): PresenceUpdateEvent => {
    if (!newPresence.guild?.id) {
        throw new Error('Presence update is missing guild context');
    }

    const occurredAt = Date.now();

    return PresenceUpdateEventSchema.parse({
        type: 'PRESENCE_UPDATE',
        timestamp: occurredAt,
        occurredAt,
        userId: newPresence.userId,
        serverId: newPresence.guild.id,
        oldStatus: oldPresence?.status,
        newStatus: newPresence.status,
        oldClientStatus: normalizeClientStatus(oldPresence),
        newClientStatus: normalizeClientStatus(newPresence) ?? {},
        oldActivityNames: oldPresence ? normalizeActivityNames(oldPresence.activities) : undefined,
        newActivityNames: normalizeActivityNames(newPresence.activities),
        oldActivityTypes: oldPresence ? normalizeActivityTypes(oldPresence.activities) : undefined,
        newActivityTypes: normalizeActivityTypes(newPresence.activities),
    });
};
