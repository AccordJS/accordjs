# 🟢 Green Bird Bot — MVP Technical & Product Document

---

## Overview of the Bot

Green Bird Bot is a lightweight Discord bot focused on **server observability and insights**.

Instead of moderation or entertainment, it provides:

* Message audit trails
* Server activity analytics
* AI-powered sentiment ("mood") tracking
* Member growth and churn tracking
* Presence and online activity tracking

The goal is to deliver a **fast-to-build, high-value MVP** that helps server owners understand what is happening inside their communities.

---

## Goals and Non-Goals

### ✅ Goals

* Capture and store key Discord events reliably
* Provide useful insights with minimal setup
* Keep architecture simple and scalable
* Ship quickly (days, not weeks)

### ❌ Non-Goals (MVP)

* Full moderation system
* Advanced role/permission UI
* Cross-server analytics
* Real-time streaming analytics
* Complex workflow automation
* Highly customizable dashboards

---

## Feature Summary

### 1. Message Logging & Audit Trails

Track message creation, edits, and deletions for accountability and debugging.

### 2. Server Analytics Dashboard

Provide insights into activity such as message volume, active users, and channel engagement.

### 3. Mood / Sentiment Tracking

Analyze message sentiment over time to understand the emotional state of channels and the server.

### 4. Member Growth Tracking

Track joins and leaves over time to measure server growth and churn.

### 5. Presence / Online Activity

Track presence changes and online status history to power real-time dashboards and activity insights.

---

## Architecture Overview

### Core Components

* Discord Bot (event ingestion)
* Database (event storage)
* Background Jobs (aggregation + sentiment)
* API Layer (for dashboard)

### Suggested Stack

* Runtime: Bun
* Bot Framework: Experimental TS Discord framework
* DB: SQLite (MVP) → Postgres (future, likely sooner if raw presence ingestion grows quickly)
* Queue/Jobs: Simple cron or Bun workers
* AI: Ollama (local) or lightweight classifier

### Flow

1. Discord event received
2. Normalize and store in DB
3. Background jobs process data
4. API exposes aggregated insights

---

## Data Collection Strategy

### Events to Capture

* messageCreate
* messageUpdate
* messageDelete

### Storage Strategy

* Store raw events immediately
* Message, membership, and presence events are written directly to the database
* Avoid expensive derived calculations in event handlers when possible
* Use background jobs for:

    * aggregation
    * sentiment analysis
    * rollups for charts and dashboard queries

### Sync vs Async

* Sync: write raw message, member, and presence event data
* Async: sentiment, analytics, and rollups

### Important Considerations

* Some events may not include full message content
* Bot downtime may cause missed events
* Presence and member intents are privileged and required from day 1
* Presence data is high-frequency and will materially increase write volume and storage requirements
* Always store timestamps in UTC

---

## Shared Schema / Unified Data Model

### messages

* id
* guild_id
* channel_id
* user_id
* content
* created_at
* edited_at (nullable)
* deleted_at (nullable)

### message_edits (optional future)

* id
* message_id
* old_content
* new_content
* edited_at

### member_events

* id
* guild_id
* user_id
* event_type (join | leave)
* occurred_at

### presence_events

* id
* guild_id
* user_id
* old_status (nullable)
* new_status (online | idle | dnd | offline)
* occurred_at

### daily_stats

* id
* guild_id
* date
* message_count
* active_users
* joins_count
* leaves_count
* net_member_growth
* average_online_count (nullable)
* peak_online_count (nullable)

### sentiments

* id
* message_id
* score (-1 to 1)
* label (positive | neutral | negative)
* created_at

---

## Feature 1: Message Logging & Audit Trails

### Problem It Solves

Server owners lack visibility into deleted or edited messages.

### User-Facing Behavior

* View recently deleted messages
* View message edit history (basic)
* Query logs by user or channel

### How It Works Technically

* Capture messageCreate → insert
* Capture messageUpdate → update edited_at
* Capture messageDelete → update deleted_at

### Required Discord Events

* messageCreate
* guildMemberAdd
* guildMemberRemove
* presenceUpdate
* messageUpdate
* messageDelete

### DB Schema / Tables Involved

* messages
* (optional) message_edits

### Jobs / Aggregation Needs

* None required for MVP

### Gotchas and Technical Advice

* messageDelete may not include content
* messageUpdate may not include full old content
* Consider caching messages in memory briefly if needed

### Future Improvements

* Full version history
* Searchable logs
* Export functionality

---

## Feature 2: Server Analytics Dashboard

### Problem It Solves

Server owners cannot easily understand engagement trends.

### User-Facing Behavior

* View daily message counts
* View active users
* Identify most active channels
* View joins, leaves, and net member growth
* View online activity trends and peak activity periods

### How It Works Technically

* Aggregate messages into daily_stats
* Count distinct users per day
* Aggregate member_events into join/leave/growth metrics
* Aggregate presence_events into online activity trend data

### Required Discord Events

* messageCreate

### DB Schema / Tables Involved

* messages
* member_events
* presence_events
* daily_stats

### Jobs / Aggregation Needs

* Daily aggregation job

### Example Aggregation

```sql
INSERT INTO daily_stats (
  guild_id,
  date,
  message_count,
  active_users,
  joins_count,
  leaves_count,
  net_member_growth,
  average_online_count,
  peak_online_count
)
WITH activity_dates AS (
  SELECT guild_id, DATE(created_at) AS date
  FROM messages
  UNION
  SELECT guild_id, DATE(occurred_at) AS date
  FROM member_events
  UNION
  SELECT guild_id, DATE(recorded_at) AS date
  FROM presence_events
),
message_stats AS (
  SELECT
    guild_id,
    DATE(created_at) AS date,
    COUNT(*) AS message_count,
    COUNT(DISTINCT user_id) AS active_users
  FROM messages
  GROUP BY guild_id, DATE(created_at)
),
join_stats AS (
  SELECT guild_id, DATE(occurred_at) AS date, COUNT(*) AS joins_count
  FROM member_events
  WHERE event_type = 'join'
  GROUP BY guild_id, DATE(occurred_at)
),
leave_stats AS (
  SELECT guild_id, DATE(occurred_at) AS date, COUNT(*) AS leaves_count
  FROM member_events
  WHERE event_type = 'leave'
  GROUP BY guild_id, DATE(occurred_at)
),
presence_stats AS (
  SELECT
    guild_id,
    DATE(recorded_at) AS date,
    AVG(online_count) AS average_online_count,
    MAX(online_count) AS peak_online_count
  FROM presence_events
  GROUP BY guild_id, DATE(recorded_at)
)
SELECT
  d.guild_id,
  d.date,
  COALESCE(m.message_count, 0) AS message_count,
  COALESCE(m.active_users, 0) AS active_users,
  COALESCE(j.joins_count, 0) AS joins_count,
  COALESCE(l.leaves_count, 0) AS leaves_count,
  COALESCE(j.joins_count, 0) - COALESCE(l.leaves_count, 0) AS net_member_growth,
  p.average_online_count,
  p.peak_online_count
FROM activity_dates d
LEFT JOIN message_stats m ON m.guild_id = d.guild_id AND m.date = d.date
LEFT JOIN join_stats j ON j.guild_id = d.guild_id AND j.date = d.date
LEFT JOIN leave_stats l ON l.guild_id = d.guild_id AND l.date = d.date
LEFT JOIN presence_stats p ON p.guild_id = d.guild_id AND p.date = d.date;
```

### Gotchas and Technical Advice

* Timezones can skew daily stats
* Large servers → heavy aggregation queries
* Raw presence ingestion can make analytics tables and rollups much more important
* Precompute instead of querying raw data
* Index by guild_id, user_id, and timestamp fields early

### Future Improvements

* Hourly stats
* Growth trends
* Channel-level analytics
* Retention and churn visualizations
* Presence heatmaps and online-time distributions

---

## Feature 3: Mood / Sentiment Tracking

### Problem It Solves

Server owners lack visibility into community sentiment.

### User-Facing Behavior

* View overall server mood
* View channel-specific sentiment
* Detect spikes in negativity

### How It Works Technically

* Batch process messages
* Run sentiment classification
* Store results in sentiments table

### Required Discord Events

* messageCreate

### DB Schema / Tables Involved

* messages
* sentiments

### Jobs / Aggregation Needs

* Background sentiment processing job

### Gotchas and Technical Advice

* Running AI per message can be expensive
* Use batching
* Consider fallback rule-based system

### Future Improvements

* Trend graphs
* Alerts for negative spikes
* Context-aware sentiment

---

## Retention and Storage Policy

### MVP Strategy

* Store all messages indefinitely (initially)
* Store all member join/leave events indefinitely (initially)
* Store all presence events indefinitely (initially)
* Store sentiment results
* Store daily aggregates

### Future Considerations

* Tiered retention (free vs paid)
* Archive old data
* Prune or compress high-volume presence history
* Prune raw messages after aggregation

---

## Global Gotchas and Assumptions

* Discord events may be incomplete
* Bots may miss events during downtime
* Large servers generate high write volume
* Privacy considerations when storing messages
* Need to handle rate limits
* Presence and member intents are privileged and may require approval at scale
* Raw presence ingestion can grow the database very quickly
* SQLite may be sufficient for MVP, but presence-heavy servers may force an earlier move to Postgres
* Presence analytics should rely on rollups for dashboard reads, not raw event scans

---

## Implementation Order

1. Setup DB and shared schema
2. Capture message events (create/edit/delete)
3. Capture member events (join/leave)
4. Capture raw presence events
5. Implement audit log queries
6. Add daily aggregation and rollup jobs
7. Add sentiment processing job
8. Build minimal API for data access
9. (Optional) Build dashboard UI

---

## Feature 4: Member Growth Tracking

### Problem It Solves

Server owners cannot easily measure growth or churn over time.

### User-Facing Behavior

* View daily joins and leaves
* View net server growth
* Review historical growth trends

### How It Works Technically

* Capture guildMemberAdd as a join event
* Capture guildMemberRemove as a leave event
* Store all membership lifecycle events in an append-only history table
* Aggregate event history into chart-friendly daily metrics

### Required Discord Events

* guildMemberAdd
* guildMemberRemove

### DB Schema / Tables Involved

* member_events
* daily_stats

### Jobs / Aggregation Needs

* Daily aggregation job

### Gotchas and Technical Advice

* Rejoins should create new join events, not overwrite history
* If downtime occurs, membership history may have gaps unless you reconcile with guild state later
* Index guild_id, user_id, event_type, and occurred_at

### Future Improvements

* Cohort retention charts
* Churn analytics
* First-join vs rejoin breakdowns

---

## Feature 5: Presence / Online Activity

### Problem It Solves

Server owners lack visibility into real-time and historical online activity.

### User-Facing Behavior

* View who is currently online
* View online trends over time
* View peak activity windows

### How It Works Technically

* Capture every presenceUpdate event
* Store presence changes as append-only history
* Derive current online users from the latest known status per user
* Aggregate raw presence events into rollups for charts and dashboards

### Required Discord Events

* presenceUpdate

### DB Schema / Tables Involved

* presence_events
* daily_stats

### Jobs / Aggregation Needs

* Frequent rollup job for online counts and trend metrics

### Gotchas and Technical Advice

* High event volume
* Presence changes frequently
* Requires privileged intent
* Raw presence ingestion will grow storage quickly
* Dashboard reads should prefer rollups and latest-known-state queries rather than scanning the full event table

### Future Improvements

* Online heatmaps
* Per-role online trends
* Server activity correlation with sentiment and message volume

---

## Future Ideas / Post-MVP Expansion

* Web dashboard with charts
* Alerts and notifications
* Multi-server analytics
* AI-generated insights
* Monetization features

---

🚀 End of Document
