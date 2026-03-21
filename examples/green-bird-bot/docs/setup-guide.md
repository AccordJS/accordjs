# 🟢 Green Bird Bot — Discord Developer Portal Setup Guide

This document outlines the exact settings required in the Discord Developer Portal for the Green Bird Bot MVP.

---

# 1. General Information

## Description (Recommended)

```
Green Bird Bot provides audit logs, server analytics, growth tracking, and AI-powered sentiment insights to help you understand your Discord community.
```

## Tags

```
analytics
logging
moderation
ai
insights
```

---

# 2. Installation

## Installation Context

* ✅ Guild Install
* ❌ User Install

## Scopes (IMPORTANT)

```
bot
applications.commands
```

## Bot Permissions

Required:

* View Channels
* Read Message History

Optional:

* Send Messages

DO NOT ENABLE:

* Administrator
* Manage Roles
* Kick Members
* Ban Members

---

# 3. Bot Tab

## Authorization Flow

* ✅ Public Bot → ON
* ❌ Requires OAuth2 Code Grant → OFF

## Privileged Gateway Intents (CRITICAL)

Enable the following:

* ✅ Presence Intent
* ✅ Server Members Intent
* ✅ Message Content Intent

---

# 4. OAuth2 (Dashboard Login — Optional for Now)

## When to Use

Only needed if building a web dashboard with "Login with Discord".

## Redirect URI (Example)

```
http://localhost:3000/auth/discord/callback
```

## Scopes (for login flow)

```
identify
guilds
guilds.members.read
bot
applications.commands
```

⚠️ Note:
This setup supports both dashboard login and bot installation in a single OAuth2 flow, as requested.

Corrections:

* The correct scope is `guilds.members.read`, not `guild.members.read`
* `bot` should be paired with `applications.commands`

---

# 5. OAuth2 URL Generator

## For Dashboard Login + Bot Install Flow

Scopes:

```
identify
guilds
guilds.members.read
bot
applications.commands
```

Permissions:

* View Channels
* Read Message History
* Send Messages

---

# 6. App Verification (IGNORE FOR NOW)

Only required when:

* Bot reaches 100+ servers

Future requirements:

* Terms of Service URL
* Privacy Policy URL
* Verified team
* 2FA enabled

---

# ✅ Final Checklist

## Installation

* [ ] bot scope added
* [ ] applications.commands added

## Bot

* [ ] Presence Intent enabled
* [ ] Server Members Intent enabled
* [ ] Message Content Intent enabled

## Permissions

* [ ] View Channels
* [ ] Read Message History
* [ ] Send Messages (optional)

## General Info

* [ ] Description updated

---

# 🚀 Notes

* Keep permissions minimal for trust and easier approval later
* Presence + Members + Message Content are required for your feature set
* The dashboard needs `identify`, `guilds`, and `guilds.members.read`
* The app uses `bot` + `applications.commands` so users can install the bot and return to the dashboard in one flow
* A redirect URI must be added before Discord can generate the full OAuth2 URL

---

🚀 End of Guide
