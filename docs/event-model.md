# Event Model

AccordJS has two event layers:

- `gateway events`: raw Discord.js client events such as `messageCreate` or `guildMemberRemove`
- `AccordJS events`: normalized framework events such as `MESSAGE_CREATE` or `MEMBER_LEAVE`

These are not interchangeable. A gateway event is a Discord-facing transport detail. An AccordJS event is the framework's typed internal contract.

## Runtime Behavior

Current flow:

```text
Discord gateway event -> GatewayAdapter -> AccordJS event normalization -> EventBus.publish()
```

Important current behavior:

- The gateway only publishes AccordJS events for gateway events it is explicitly configured to listen to.
- The in-memory event bus only runs middleware when a handler is subscribed for that AccordJS event.
- If no handler is subscribed, `publish()` returns early and the middleware pipeline does not run for that event.

## Canonical Mapping

| Gateway Event | Meaning | AccordJS Event | Status |
| --- | --- | --- | --- |
| `messageCreate` | A Discord message was created | `MESSAGE_CREATE` | Supported |
| `messageDelete` | A message was deleted | `MESSAGE_DELETE` | Supported |
| `guildMemberAdd` | A member joined a guild | `MEMBER_JOIN` | Supported |
| `guildMemberRemove` | A member left or was removed from a guild | `MEMBER_LEAVE` | Supported |
| `guildDelete` | The client lost access to a guild or the guild became unavailable to it | None | Not normalized |
| `guildCreate` | The client joined or became available in a guild | None | Debug-only today |

## Debug-Capture Event Names

The current debug capture layer can log these Discord.js client event names without normalizing them into AccordJS events:

- `clientReady`
- `guildCreate`
- `guildDelete`
- `guildUnavailable`
- `guildMemberAdd`
- `guildMemberRemove`
- `messageCreate`
- `messageDelete`
- `messageUpdate`
- `interactionCreate`
- `presenceUpdate`
- `voiceStateUpdate`
- `error`
- `warn`
- `debug`

## Semantic Traps

- `guildDelete` does **not** mean "a member left the guild". For member departures, look at `guildMemberRemove` -> `MEMBER_LEAVE`.
- `guildCreate` is about the bot client and a guild relationship, not a member joining.
- `MEMBER_JOIN` and `MEMBER_LEAVE` are AccordJS event names. They are framework-facing, not Discord.js event names.

## Gateway Event Selection

The explicit bootstrap API accepts a `gatewayEvents` array so apps only attach the Discord.js listeners they actually need. This reduces unnecessary work in the gateway and keeps runtime behavior obvious in application code.

## Debug Capture vs Normalization

`debug.discordClientEvents` can log selected Discord.js client events without normalizing them into AccordJS events. This is useful for debugging unsupported or not-yet-normalized gateway events.
