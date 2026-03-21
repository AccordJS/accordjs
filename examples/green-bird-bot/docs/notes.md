# Notes

based on implementing Green Bird Bot

## Questions

1. wtf is a DISCORD_TOKEN ? do i need that? how do i get that?
2. why does the framework not require discord oauth client secret?
3. DISCORD_CLIENT_ID is not used anywhere ?
4. i did not see an event for when a guild adds the bot. did we miss that ? what is the name of that?

## Answers

1. `DISCORD_TOKEN` is the bot token used to log the bot into Discord. Yes, the framework needs it for the current
   runtime flow because the Discord client calls `client.login(config.discord.token)`. You get it from the Discord
   Developer Portal: create/open your application, go to the `Bot` tab, add a bot if needed, then view/reset the token.
   Treat it like a password and never commit it.

2. The framework does not require a Discord OAuth client secret because a bot does not use the client secret to connect
   to the gateway. The client secret is for OAuth2 flows such as "Log in with Discord", account linking, or a web
   dashboard that exchanges auth codes for user tokens. For a plain bot runtime, the token is sufficient.

3. `DISCORD_CLIENT_ID` is currently validated in `src/config.ts`, but it is not used by the runtime code that was
   reviewed. That means it is either future-facing or over-required right now. A client ID can still be useful for bot
   install URLs or slash-command registration, but this repo's current login flow does not depend on it.

4. Yes, that appears to be missing from the framework right now. The gateway adapter currently publishes
   `MESSAGE_CREATE` from Discord's `messageCreate` event and `MEMBER_JOIN` from `guildMemberAdd`, but nothing for the
   bot being added to a guild. From Discord's side, the closest event name is `guildCreate`, which fires when the client
   joins or becomes available in a guild. If the framework wants to expose "bot installed into a server," it likely
   needs a normalized event built on top of `guildCreate`.

## observations

1. we have a ticket to create typedoc docs. that is going to be essential

## change requests

1. update the env.sample file because there is stuff there we do not need or use
2. i really hate the "configure these plugins and middleware through the config" because it makes too many assumptions
3. we seem to be missing many event names
4. plugins and middleware should be composable not requirements
5. document the process of creating an app end-2-end
