# AccordJS Interaction Flow

This document explains how Discord interactions move through AccordJS today.

## Runtime Flow

1. Discord emits `interactionCreate`.
2. The gateway receives the raw Discord interaction.
3. AccordJS normalizes it into a typed framework event such as:
   - `INTERACTION_COMMAND`
   - `INTERACTION_AUTOCOMPLETE`
   - `INTERACTION_BUTTON`
   - `INTERACTION_STRING_SELECT`
   - `INTERACTION_MODAL_SUBMIT`
4. The gateway stores a response handle in the response registry under `interactionId`.
5. The event bus publishes the normalized AccordJS event.
6. A plugin or app handler looks up the response handle and replies through the framework API.

## Why The Raw Discord Object Stays Internal

AccordJS does not place the raw `discord.js` interaction object on normalized events.

That separation keeps the framework contract cleaner:

- event payloads stay small and predictable
- tests can assert against framework data instead of Discord objects
- plugin code can stay closer to AccordJS than to `discord.js`

The response registry exists so handlers can still answer the interaction without requiring the raw Discord object to
be part of every event payload.

## Minimal Example

```ts
eventBus.subscribe('INTERACTION_BUTTON', async (event) => {
    const response = responses.require(event.interactionId);

    await response.update({
        content: 'Updated from a button interaction',
    });
});
```

## Scope Of This Foundation

This branch only establishes the interaction foundation:

- generic interaction routing
- framework-shaped response handling

It does not yet add:

- slash command registration
- slash command routing
- presentation builders for embeds or Components V2
- command sync strategy for `guild` vs `global`
