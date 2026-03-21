import { z } from 'zod';

export const RateLimitKeySchema = z.enum(['userId', 'channelId', 'serverId', 'eventType', 'global']);
