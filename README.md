# The Good Side

**The world has good news, too.**

Expo + TypeScript mobile application, Liquid Glass Netlify Command Center, Node backend, Google Apps Script + Google Sheets database, and local Ollama RSS researcher.

**No Firebase.** Google account sign-in uses Google OAuth / Identity Services. Protected Node routes verify signed Google ID tokens and admin access is restricted by a server-side allowlist.

Quick start and Google OAuth configuration: [docs/SETUP.md](docs/SETUP.md).

**Current deployment:** This repository is source code. The provided Apps Script URL must be updated with this repository's Code.gs and configured with the server secret. The Node backend and Netlify app have not been deployed by this commit.

## AIHOT news intelligence engine

AIHOT is now pinned as a Git submodule under `third_party/AIHOT` with a local Ollama-powered positive-news import adapter. Run `git submodule update --init --recursive`; then follow [AIHOT setup instructions](docs/AIHOT.md). To import selected verified candidates into the existing Google Sheets review queue, run `npm run aihot:import`. All candidates require human approval; no automatic push.
