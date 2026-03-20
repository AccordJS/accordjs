# Community Bot Tutorial Spec

This document defines the intended end-to-end tutorial for AccordJS. It is a product spec for the tutorial, not the tutorial itself.

## Goal

Teach a developer how AccordJS works by building a realistic local-development bot from scratch. The tutorial should feel like a practical framework walkthrough, not a reference dump.

By the end, the reader should understand:

- local `.env` setup for a bot token they already own
- explicit app bootstrap with `createAccordApp()`
- the distinction between `gateway events` and `Accord events`
- explicit global middleware composition
- plugin registration and external handler bindings
- how command handling and member lifecycle events fit together

## Audience Assumptions

- The developer already created a Discord bot app in the Discord dashboard
- The developer already has a bot token
- The developer is running locally during development
- The developer wants to learn the framework by building something tangible

## Tutorial Track 1: Community Bot

This is the first tutorial track to build.

### Scenario

Create a community bot for a Discord server that:

- logs messages at a high level
- welcomes new members
- reacts to member departures
- exposes a simple command such as `!ping` or `!help`
- uses both global middleware and plugin-scoped middleware

### Concepts the Tutorial Must Teach

- choosing `gatewayEvents` intentionally
- mapping gateway events to Accord events
- composing middleware in app bootstrap code
- adding plugin-scoped middleware inside a plugin
- wiring plugin methods to Accord events explicitly
- understanding when middleware does and does not run

### Milestones

1. Create the local project and env
2. Bootstrap the app with `createAccordApp()`
3. Add global middleware
4. Add a command plugin
5. Add a membership plugin for joins/leaves
6. Enable debug capture for unsupported or investigatory gateway events
7. Verify behavior locally

## Future Tutorial Tracks

- Command-heavy bot tutorial
- Analytics/event-observer bot tutorial

These should build on the Community Bot track rather than replace it.

## Deliverables for the Future Tutorial

- one long-form tutorial doc
- a matching runnable example app
- links to the event model and plugin guide for deeper reference
