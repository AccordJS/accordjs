/**
 * AccordJS - A clean, extensible Discord bot framework in TypeScript
 *
 * Public exports for AccordJS, including the explicit app bootstrap API.
 */

// App Bootstrap
export * from '@app/app/bootstrap';
// Bot Components
export * from '@app/bot/client';
export * from '@app/bot/gateway';
export * from '@app/bot/intents';
// Event Bus System
export * from '@app/bus/index';
// Configuration
export * from '@app/config';
// Middleware (public + advanced)
export * from '@app/middleware/base-middleware';
export * from '@app/middleware/built-in';
// Advanced helpers
export * from '@app/middleware/middleware-runner';
export * from '@app/middleware/types';
// Event Normalization
export * from '@app/normalizers/normalize-guild';
export * from '@app/normalizers/normalize-member';
export * from '@app/normalizers/normalize-message';
export * from '@app/normalizers/normalize-presence';
export * from '@app/pipeline/event-pipeline';
export * from '@app/pipeline/pipeline-context';
// Plugin System
export * from '@app/plugins/base-plugin';
export * from '@app/plugins/commands/index';
export * from '@app/plugins/event-mapper';
export * from '@app/plugins/handler-registry';
export * from '@app/plugins/plugin-manager';
export * from '@app/plugins/plugin-middleware-manager';
// Core Framework Types
export * from '@app/types/index';
// Utilities
export * from '@app/utils/create-logger';
