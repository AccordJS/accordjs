# Event Normalization Policy

AccordJS does not try to normalize every Discord gateway event.

That is intentional.

## Core Principle

AccordJS has two event layers:

- `gateway events`: raw Discord.js client events
- `AccordJS events`: normalized, typed framework events

These layers are not meant to have one-to-one coverage.

AccordJS only normalizes a gateway event when the framework is willing to support that event as part of its public contract.

## What Gets Normalized

A gateway event should be normalized into an AccordJS event when it is:

- broadly useful across multiple bots
- stable enough to support as framework API
- improved by a typed framework-level abstraction
- likely to be consumed directly by plugins or app code

Examples today:

- `messageCreate` -> `MESSAGE_CREATE`
- `messageUpdate` -> `MESSAGE_UPDATE`
- `messageDelete` -> `MESSAGE_DELETE`
- `presenceUpdate` -> `PRESENCE_UPDATE`
- `guildCreate` -> `GUILD_AVAILABLE`
- `guildDelete` -> `GUILD_UNAVAILABLE`
- `guildMemberAdd` -> `MEMBER_JOIN`
- `guildMemberRemove` -> `MEMBER_LEAVE`

Examples that may be added incrementally as bots need them:

- `interactionCreate`

## What Does Not Need Normalization

Some Discord events are better left as raw transport-level details or debug-only signals.

Examples:

- low-level lifecycle/debug events such as `debug`, `warn`, and `error`
- Discord-specific events whose semantics do not improve much through a framework wrapper
- niche events that no current community bot needs as part of the public AccordJS API

Those events do not need a matching AccordJS event just because Discord emits them.

## Incremental Policy

AccordJS will not normalize every single event the Discord gateway can emit.

Instead, normalization should grow incrementally based on real needs from bots built on AccordJS. If a community bot needs a gateway event often enough, and the framework can define a stable typed contract for it, that event becomes a good candidate for normalization.

Green Bird Bot is the current example of this policy in action: it is the first bot in this repo that creates a clear need for normalized `presenceUpdate` support.

## Decision Rule

When evaluating a new gateway event, use this rule:

- normalize it if AccordJS is prepared to support it as a stable framework event
- keep it debug-only if it is mainly useful for observability or investigation
- leave it at the raw Discord layer if the framework does not yet have a clear abstraction for it

## Related Docs

- [Event Model](./event-model.md)
- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
