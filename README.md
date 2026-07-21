# SecureOne Marketing Website

This repository contains a multi-page static marketing website for **SecureOne**, an application security platform.

## Pages

- `index.html` — Main landing page
- `features.html` — Platform features and scan modes
- `integrations.html` — GitHub and Jenkins integration workflows
- `docs.html` — Installation, startup, and quick operations guide
- `contact.html` — Contact form and enterprise support details
- `styles.css` — Shared design system and responsive styling

## Local Preview

Because this is a static website, you can run it locally with any simple HTTP server.

## Foundation Bot

This site now includes a second AI widget that is separate from the existing Chatbase embed.

- `chatbase-loader.js` keeps the current bot unchanged.
- `foundation-bot-config.js` stores the new widget configuration.
- `foundation-bot.js` renders a bottom-left assistant and sends requests to `POST /api/v1/ai/chat` on the AI Foundation.
- `foundation-proxy/` contains the production reverse proxy that keeps the foundation bearer token on the server side.

### Local wiring

When previewing locally, `foundation-bot-config.js` defaults to:

- endpoint: `http://127.0.0.1:9090/api/v1/ai/chat`
- token: empty by default (proxy handles auth)
- tenant: `public`

Start the foundation API and local proxy first, then serve this site over HTTP.

```bash
cd foundation-proxy
cp .env.example .env
npm install
npm run start
```

### Production wiring

Before publishing, update `window.BOUNTYBREACH_FOUNDATION_BOT_CONFIG` in `foundation-bot-config.js` or define it before the script loads.

- Set `endpoint` to your deployed same-origin proxy path (default `/api/v1/ai/chat`).
- Keep `token` empty when using proxy auth so secrets stay server-side.
- Keep `chatbase-loader.js` in place if you want both bots visible.

See `foundation-proxy/README.md` for deployment and hardening guidance.

AI Foundation
This release introduces the new BB AI Foundation experience.
Highlights include:
* AI Foundation product pages
* AI Foundation deployment
* SecureAI demonstrations
* AI explanation videos
* AI Foundation application and database setup
* Docker deployment support
* Initial authentication improvements

## Recent Updates

### 2026-07-20

- Documentation workflow aligned to repository guide.
- Added `CHANGELOG.md` with an `Unreleased` section for ongoing release notes.
- README updated to keep latest project updates grouped at the bottom.