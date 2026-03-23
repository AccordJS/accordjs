# AccordJS Roadmap

This document records the current feature order for AccordJS so implementation branches and GitHub issues stay aligned.

## Current State

Completed foundation work:

- generic interaction routing
- framework-shaped response API

These shipped on the interaction foundation branch and are the base for the next Discord-native workflow features.

## Next Feature Sequence

### 1. Slash Command Registration And Sync

Issue: `#25`

Scope:

- framework-owned slash command definitions
- command registration through AccordJS
- explicit sync strategy for `guild` vs `global`

Recommended branch:

- `feat/slash-command-registration-and-sync`

Reason:

Registration and sync belong together. Command definitions are not useful without a clear sync model.

### 2. Slash Command Routing

Issue: `#25`

Scope:

- route registered slash commands through AccordJS
- support command execution and autocomplete handling

Recommended branch:

- `feat/slash-command-routing`

Reason:

Routing should come after commands can actually be defined and synchronized.

### 3. Presentation Builders

Issue: `#25`

Scope:

- framework helpers for embeds
- framework helpers for Components V2 layouts

Recommended branch:

- `feat/presentation-builders`

Reason:

Presentation builders are more valuable once slash-command handlers and interaction-driven workflows are in place.

## Maintainer Sequence After Feature Work

### 4. Project Conventions

Issue: `#20`

Add `docs/conventions.md` so file layout, naming, and type placement stop being decided ad hoc.

### 5. Reduce Event Integration Duplication

Issue: `#21`

Reorganize event integration so adding a new framework event touches fewer places.

### 6. Document How To Add New Events

Issue: `#24`

This depends on `#21` and should only happen after the event integration flow is simplified.

### 7. Typedoc API Docs

Issue: `#15`

Generate API docs from the curated public surface.

### 8. Remove Private Registry Dependency

Issue: `#4`

Finish removing contributor friction around the vendored/private config package history.

## Notes

- `#25` is the umbrella tracker for the remaining interaction and presentation work.
- Each feature step under `#25` should stay in its own branch.
- This roadmap is the planning source of truth; GitHub issues remain the execution trackers.
