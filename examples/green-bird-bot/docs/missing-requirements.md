# Missing Requirements Report

This report compares the Green Bird Bot docs in this folder against the current AccordJS framework surface.

## Summary

AccordJS can already support part of the Green Bird Bot MVP:

- `messageCreate` is normalized as `MESSAGE_CREATE`
- `messageDelete` is normalized as `MESSAGE_DELETE`
- `guildMemberAdd` is normalized as `MEMBER_JOIN`
- `guildMemberRemove` is normalized as `MEMBER_LEAVE`
- explicit middleware/plugin composition is in place
- custom intents can be provided by the app bootstrap

The main missing framework requirements are around event coverage and Discord application integration, not basic bot bootstrapping.

## Missing Framework Requirements

### 1. Message Edit Event Support

Green Bird Bot requires `messageUpdate` for audit trails and edit history. AccordJS does not currently normalize or publish a message-edit event.

Missing pieces:

- typed `MESSAGE_UPDATE` event schema and payload contract
- `messageUpdate` in the supported gateway event list
- a normalizer for Discord.js update payloads, including partial-message cases
- gateway wiring from `messageUpdate` to the new AccordJS event

This is a direct blocker for the message-audit feature as written in `overview.md`.

### 2. Presence Event Support

Green Bird Bot requires `presenceUpdate` for presence history, online activity, and dashboard analytics. AccordJS can debug-log `presenceUpdate`, but it does not normalize it into an AccordJS event.

Missing pieces:

- typed presence event schema
- `presenceUpdate` in the normalized gateway event surface
- a normalizer that captures old/new presence state safely
- gateway publishing for presence changes

This is a direct blocker for the presence/activity requirements.

### 3. Bot/Guild Install Lifecycle Event

The notes already called this out: there is no normalized event for the bot being added to a guild. `guildCreate` exists only in debug capture today.

Missing pieces:

- an AccordJS event for bot-added / guild-available lifecycle behavior
- clear semantics separating "bot installed" from "guild became available again"
- gateway normalization from `guildCreate`

This is not as critical as message edit or presence support, but it matters for onboarding, setup flows, and future install analytics.

### 4. Slash Command / Interaction Support

The setup guide requires `applications.commands`, but the framework’s built-in command system is still message-prefix based. There is no normalized interaction event surface or built-in slash command abstraction.

Missing pieces:

- normalized interaction events
- slash-command registration helpers
- command-routing support for application commands

This is only a blocker if Green Bird Bot wants real slash commands instead of text-prefix commands, but the setup docs strongly suggest that direction.

### 5. OAuth2 / Dashboard Integration Helpers

The setup guide defines a dashboard login flow and OAuth scopes, but AccordJS currently focuses on bot runtime only. There is no first-class support for OAuth client credentials, install URL generation, or callback helpers.

Missing pieces:

- optional OAuth config surface separate from bot runtime config
- helpers for install/login URL generation
- clear app-level docs for dashboard auth integration

This is not required for the bot runtime itself, but it is missing for the broader Green Bird Bot product described in the docs.

## Not Missing From the Framework

These items are required by the bot, but they are already possible with the current AccordJS surface:

- explicit middleware/plugin composition
- custom gateway intent selection
- normalized create/delete/join/leave event handling
- plugin-owned persistence logic for writing raw events to a database

## Priority Order

Recommended implementation order:

1. `messageUpdate` normalization
2. `presenceUpdate` normalization
3. `guildCreate` normalization for bot/guild lifecycle
4. interaction/slash-command support
5. OAuth/dashboard helpers

## Conclusion

For the Green Bird Bot MVP, the biggest missing AccordJS requirements are normalized `messageUpdate` and `presenceUpdate` support. Without those, two of the bot’s core product features, audit history and presence analytics, cannot be implemented cleanly on top of the framework.
