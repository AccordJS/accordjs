# Event Model

AccordJS has two event layers:

- `gateway events`: raw Discord.js client events such as `messageCreate` or `guildMemberRemove`
- `AccordJS events`: normalized framework events such as `MESSAGE_CREATE` or `MEMBER_LEAVE`

These are not interchangeable. A gateway event is a Discord-facing transport detail. An AccordJS event is the framework's typed internal contract.

For the framework policy on when AccordJS should normalize a gateway event, see [event-normalization-policy.md](./event-normalization-policy.md).

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
| `guildCreate` | The guild is now available to the client | `GUILD_AVAILABLE` | Supported |
| `guildDelete` | The guild is no longer available to the client | `GUILD_UNAVAILABLE` | Supported |
| `guildMemberAdd` | A member joined a guild | `MEMBER_JOIN` | Supported |
| `guildMemberRemove` | A member left or was removed from a guild | `MEMBER_LEAVE` | Supported |

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
- `guildCreate` is normalized as `GUILD_AVAILABLE`, which is intentionally generic. Apps should infer "new install" versus reconnect from their own state.
- `guildDelete` is normalized as `GUILD_UNAVAILABLE`, which is also intentionally generic. Apps can use the `unavailable` flag to distinguish outage-style loss from likely removal or loss of access.
- `MEMBER_JOIN` and `MEMBER_LEAVE` are AccordJS event names. They are framework-facing, not Discord.js event names.

## Gateway Event Selection

The explicit bootstrap API accepts a `gatewayEvents` array so apps only attach the Discord.js listeners they actually need. This reduces unnecessary work in the gateway and keeps runtime behavior obvious in application code.

## Debug Capture vs Normalization

`debug.discordClientEvents` can log selected Discord.js client events without normalizing them into AccordJS events. This is useful for debugging unsupported or not-yet-normalized gateway events.

AccordJS does not aim for one-to-one normalization coverage of every Discord gateway event. New normalized events should be added incrementally when community bots need a stable framework abstraction.
