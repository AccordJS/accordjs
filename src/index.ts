/**
 * AccordJS - A clean, extensible Discord bot framework in TypeScript
 *
 * This is a pure re-export barrel file. For framework initialization,
 * see src/main.ts which contains the startup logic.
 */

// Bot Components
export * from '@app/bot/client';
export * from '@app/bot/gateway';
export * from '@app/bot/intents';
// Event Bus System
export * from '@app/bus/index';
// Configuration
export * from '@app/config';
export * from '@app/events/normalize-member';
// Event Normalization
export * from '@app/events/normalize-message';
// Plugin System
export * from '@app/plugins/base-plugin';
export * from '@app/plugins/commands/index';
export * from '@app/plugins/plugin-manager';
// Core Framework Types
export * from '@app/types/index';

// Utilities
export * from '@app/utils/create-logger';
