# API Reference

This reference covers the current module API surface exported by the AccordJS root entrypoint (`accordjs`).

## Import Style

```typescript
import {
    BasePlugin,
    BotFilterMiddleware,
    CommandRouterPlugin,
    createAccordApp,
    createConfig,
} from 'accordjs';
```

## App Bootstrap

### `createAccordApp(options?: AccordAppOptions): Promise<AccordApp>`
Creates the Discord client, event bus, gateway, plugin manager, registers middleware/plugins, wires selected gateway events, and returns runtime handles.

### `startAccordApp(options?: AccordAppOptions): Promise<AccordApp>`
Equivalent to `createAccordApp()` followed by `await app.start()`.

`AccordAppOptions` supports:
- `config?: Config`
- `intents?: readonly number[]`
- `gatewayEvents?: readonly GatewayEvent[]`
- `debug?: DiscordClientDebugConfig`
- `middleware?: AnyEventMiddleware[]`
- `plugins?: PluginRegistration[]`

`AccordApp` returns:
- `client`
- `config`
- `eventBus`
- `gateway`
- `pluginManager`
- `start(): Promise<string>`
- `stop(): Promise<void>`

## Configuration

### `createConfig(): Config`
Creates a validated runtime configuration from environment variables.

### `ConfigSchema`
Zod schema for framework config.

### `NodeEnvEnumSchema`
Allowed values: `'development' | 'production' | 'test'`.

### `LogLevelEnumSchema`
Allowed values: `'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'`.

### `RateLimitKeySchema`
Allowed values: `'userId' | 'channelId' | 'serverId' | 'eventType' | 'global'`.

### `DEFAULT_MIDDLEWARE_CONFIG`
Legacy default global middleware configuration object for the config-loader helper.

### `Config`, `MiddlewareConfig`, `DebugConfig`
Inferred TypeScript types from the configuration schema.

## Discord Gateway Layer

### `createDiscordClient(intents?: readonly number[]): Client`
Creates a Discord.js client using `DEFAULT_INTENTS` when no intents are provided.

### `DEFAULT_INTENTS`
Readonly list of default `GatewayIntentBits` values.

### `GatewayAdapter`
Bridges Discord.js gateway events to the internal event bus.

Constructor:
```typescript
new GatewayAdapter(client: Client, eventBus: EventBus, options?: GatewayAdapterOptions)
```

Methods:
- `registerListeners(): void`

### `GatewayEventSchema`, `GatewayEvent`, `DEFAULT_GATEWAY_EVENTS`
Typed gateway event names supported by AccordJS normalization today.

## Event Bus

### `EventBus` (interface)
Core event bus contract.

Methods:
- `publish<K extends keyof EventMap>(type: K, event: EventMap[K]): void`
- `subscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void`
- `unsubscribe<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void`
- `addMiddleware(middleware: AnyEventMiddleware | AnyEventMiddleware[]): void`
- `removeMiddleware(middleware: AnyEventMiddleware | string): void`
- `clearMiddleware(): void`
- `listMiddleware(): AnyEventMiddleware[]`

### `InMemoryEventBus`
Default in-memory implementation of `EventBus`.

## Plugin System

### `Plugin` (interface)
A plugin implements:
- `name: string`
- `description?: string`
- `version?: string`
- `register(ctx: PluginContext): void | Promise<void>`

### `PluginContext` (interface)
Provided to plugins during registration.

Properties:
- `eventBus: EventBus`
- `config: Config`
- `logger: Logger`
- `handlerBindings?: EventHandlerMap`

### `BasePlugin`
Base class for plugins with event mapping support.

Key members:
- `protected readonly eventMap: EventHandlerMap`
- `protected context?: PluginContext`
- `protected async onRegister(): Promise<void>`
- `protected addMiddleware(middleware: EventMiddleware | EventMiddleware[]): void`

### `PluginManager`
Registers and manages plugins.

Constructor:
```typescript
new PluginManager(eventBus: EventBus, config: Config)
```

Methods:
- `register(plugin: Plugin, options?: PluginRegistrationOptions): Promise<void>`
- `registerAll(plugins: Array<Plugin | { plugin: Plugin; options?: PluginRegistrationOptions }>): Promise<void>`
- `getPlugins(): string[]`

## Command Plugin APIs

### `CommandRouterPlugin`
Built-in command handling plugin.

Constructor:
```typescript
new CommandRouterPlugin(registry?: CommandRegistry, prefix?: string)
```

Methods:
- `registerCommand(command: Command): void`
- `cleanup(): void`

### `InMemoryCommandRegistry`
In-memory command registry.

Methods:
- `register(command: Command): void`
- `find(name: string): Command | undefined`
- `getAll(): Command[]`

### `CommandParser`
Parses command strings with a prefix.

Constructor:
```typescript
new CommandParser(prefix?: string)
```

Methods:
- `parse(content: string): ParseResult`

### Command Types
- `Command`
- `CommandContext`
- `CommandRegistry`
- `ParseResult`

## Event Normalization

### `normalizeMessage(message: Message): MessageCreateEvent`
Converts Discord.js `Message` objects into validated internal events.

### `normalizeMember(member: GuildMember): MemberJoinEvent`
Alias for `normalizeMemberJoin()`.

### `normalizeMemberJoin(member: GuildMember): MemberJoinEvent`
Converts Discord.js `guildMemberAdd` payloads into validated internal member join events.

### `normalizeMemberLeave(member: GuildMember | PartialGuildMember): MemberLeaveEvent`
Converts Discord.js `guildMemberRemove` payloads into validated internal member leave events.

## Event Schemas and Types

Exported event schemas/types include:
- `EventTypeSchema`, `EventType`
- `EventHandlerMap`
- `GatewayEventSchema`, `GatewayEvent`
- `BaseEventSchema`, `BaseEvent`
- `DiscordEventSchema`, `DiscordEvent`
- `ChannelEventSchema`, `ChannelEvent`
- `MessageCreateEventSchema`, `MessageCreateEvent`
- `MemberJoinEventSchema`, `MemberJoinEvent`
- `MessageDeleteEventSchema`, `MessageDeleteEvent`
- `MemberLeaveEventSchema`, `MemberLeaveEvent`
- `CommandDispatchEventSchema`, `CommandDispatchEvent`
- `CommandExecuteEventSchema`, `CommandExecuteEvent`
- `CommandErrorEventSchema`, `CommandErrorEvent`
- `CommandPermissionDeniedEventSchema`, `CommandPermissionDeniedEvent`
- `BotEventSchema`, `BotEvent`
- `EventMapSchemas`, `EventMap`

## Utility APIs

### `createLogger(name: string)`
Creates a Pino logger namespaced with the provided component name.

## Advanced/Lower-Level APIs

These symbols are exported from the package barrel for advanced use (no `@app/` paths needed):
- Middleware primitives: `BaseMiddleware`, `EventMiddleware`, `MiddlewareNext`, `MiddlewareHandler`, `MiddlewareLogger`, `runMiddlewareChain`
- Built-in middleware classes: `BotFilterMiddleware`, `RateLimiterMiddleware`, `ProfanityFilterMiddleware`, `LoggerMiddleware`, `MetricsMiddleware`
- Pipeline helpers: `runEventPipeline`, `PipelineContext`, `PipelineTraceEntry`, `PipelineStage`
- Plugin wiring helpers: `registerMappedHandlers`, `HandlerRegistry`, `PluginMiddlewareManager`

`loadGlobalMiddleware` remains available by direct module path for advanced or legacy use, but explicit app composition via `createAccordApp()` is now the primary path.
