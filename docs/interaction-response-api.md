# AccordJS Interaction Response API

AccordJS keeps normalized interaction events framework-shaped, but handlers still need a way to answer Discord for a
specific interaction. The response API is that bridge.

## Why A Registry Exists

When AccordJS normalizes `interactionCreate`, it publishes an AccordJS event such as
`INTERACTION_COMMAND` or `INTERACTION_BUTTON`. That event contains safe framework data like
`interactionId`, `userId`, `channelId`, and `customId`.

It does not contain the raw Discord interaction object.

That is intentional:

- normalized events stay stable and testable
- plugins do not need to depend directly on `discord.js`
- AccordJS keeps Discord-specific reply mechanics inside the framework

To let handlers respond later, the gateway stores a response handle in the interaction response registry under the
interaction's `interactionId`.

## Handler Usage

Use the `responses` registry from plugin context:

```ts
const response = context.responses.require(event.interactionId);
await response.reply({ content: 'Pong', ephemeral: true });
```

`require()` throws if the interaction is missing or expired. `get()` returns `undefined` instead.

## Available Methods

- `reply(options)`: sends the initial interaction response
- `defer(options)`: acknowledges the interaction and replies later
- `editReply(options)`: edits the initial reply
- `followUp(options)`: sends another response after the initial reply
- `update(options)`: updates the source message for component interactions such as buttons or selects
- `respondChoices(options)`: answers an autocomplete interaction with suggestions

## Ephemeral Responses

AccordJS exposes a simple `ephemeral: true` option on `reply`, `defer`, and `followUp`.

Example:

```ts
await response.reply({
    content: 'Saved your note.',
    ephemeral: true,
});
```

Internally, AccordJS translates that into the Discord flags required for an ephemeral interaction response.

## Registry Lifetime

Response handles are short-lived. The in-memory registry automatically evicts old entries after a time limit, so
handlers should use the response handle during the interaction workflow instead of treating it like long-term state.
