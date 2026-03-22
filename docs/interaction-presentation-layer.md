# AccordJS Interaction And Presentation Layer

This document defines the next major AccordJS framework initiative after the current event and middleware foundation.

The goal is to let bots build rich, Discord-native admin workflows without dropping to raw `discord.js` for every interaction and response.

## Why This Exists

Green Bird Bot showed that Discord itself can be the admin surface:

- slash commands can start workflows
- buttons and selects can change scope or filters
- modals can capture notes or settings
- rich responses can show analytics without leaving Discord

AccordJS currently supports normalized events and message-prefix commands, but it still lacks a first-class framework layer for interaction-driven bots.

## Initiative Summary

This feature wave should add:

- slash command registration with explicit sync target
- slash command routing
- generic interaction routing for buttons, selects, modals, and autocomplete
- a framework-shaped response API
- presentation builders for embeds and Components V2 messages

These should be designed as one connected interaction/presentation layer, not as unrelated helpers.

## Product Decisions

- AccordJS should favor a framework-shaped response API over a Discord-shaped one.
- AccordJS should treat rich output as a presentation layer, not just an “embed feature”.
- AccordJS should route generic interactions from day one instead of supporting slash commands only.
- Slash command registration should support explicit sync modes:
  - `guild` for fast development iteration
  - `global` for production registration
- `DISCORD_GUILD_ID` should only matter for `guild` sync, not for normal bot runtime.
- Separate dev and prod applications/tokens are a valid and expected workflow.

## Proposed Framework Surface

### 1. Command Registration And Sync

AccordJS should let apps define slash commands in framework-owned structures and sync them intentionally.

Expected capabilities:

- declare slash command definitions in app/plugin code
- sync commands to Discord through AccordJS
- choose sync target explicitly: `guild` or `global`
- support autocomplete definitions as part of command definitions

Suggested shape:

```ts
await app.commands.sync({
    mode: 'guild',
    guildId: process.env.DISCORD_GUILD_ID,
});
```

### 2. Generic Interaction Router

AccordJS should route normalized interactions by type, not only by slash command name.

Expected routed surfaces:

- chat input commands
- autocomplete interactions
- button interactions
- string select interactions
- user select interactions
- role select interactions
- channel select interactions
- mentionable select interactions
- modal submit interactions

This router should be the foundation for future admin UX plugins.

### 3. Framework-Shaped Response API

Current command handlers cannot reply through AccordJS directly. That forces example apps to call raw `discord.js`.

The next layer should expose a response API that covers:

- reply
- defer
- edit reply
- follow up
- update component-originated messages
- send ephemeral responses when supported

The default API should be simple and framework-owned, with Discord mechanics hidden unless an escape hatch is explicitly requested later.

### 4. Presentation Builders

AccordJS should provide presentation helpers that make rich responses easy to assemble without forcing apps to hand-build raw Discord payloads.

The first rendering targets should be:

- standard embeds
- Components V2 message layouts

These builders should help apps define reusable report surfaces such as:

- server snapshot
- channel snapshot
- mood trends
- growth summary
- risk or moderation summary

## Relationship To Existing CommandRouterPlugin

`CommandRouterPlugin` remains useful for prefix-based commands, but it should no longer be treated as the long-term primary command model for admin workflows.

Direction:

- keep `CommandRouterPlugin` working for prefix commands
- add a new interaction-driven command layer beside it
- document prefix commands as one supported mode, not the only or preferred one
- decide later whether prefix commands should become legacy guidance rather than default guidance

## Suggested Implementation Order

1. Add normalized `interactionCreate` routing primitives and framework interaction types.
2. Add the response API so handlers can reply through AccordJS.
3. Add slash command definition + sync support with `guild` and `global` modes.
4. Add slash command routing and autocomplete handling.
5. Add routed component handlers for buttons, selects, and modals.
6. Add presentation builders for embeds and Components V2.

This order avoids building command definitions before the framework can respond to them cleanly.

## Acceptance Criteria For The Future Implementation

- An app can define slash commands without calling raw Discord registration APIs.
- An app can choose `guild` or `global` command sync intentionally.
- A slash command handler can reply, defer, edit, and follow up through AccordJS.
- Buttons, selects, modals, and autocomplete can be handled through AccordJS routing.
- A bot can build rich Discord-native admin flows without writing raw `interactionCreate` handlers.
- AccordJS examples can demonstrate slash commands, component interactions, and rich responses without relying on direct `discord.js` orchestration in app code.

## Non-Goals For The First Pass

- full dashboard or OAuth product flows
- replacing every raw Discord capability with a framework abstraction
- removing prefix-command support immediately
- normalizing every Discord interaction subtype before there is a real bot need

## Notes For The Next Session

- Use this document as the canonical spec for the next implementation branch.
- Keep the framework focus on Discord-native admin UX.
- Design the API so Green Bird Bot can present and navigate analytics entirely inside Discord for common workflows.
