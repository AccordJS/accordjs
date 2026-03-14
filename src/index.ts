/**
 * AccordJS - A clean, extensible Discord bot framework in TypeScript
 */

import { createLogger } from './utils/createLogger.ts';

const logger = createLogger('AccordJS');

logger.info('Initializing AccordJS framework...');

export * from './types/index.ts';
