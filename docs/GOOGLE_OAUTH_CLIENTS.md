# The Good Side — Google OAuth client configuration

This document tracks public Google OAuth **client IDs only**, never client secrets or downloaded JSON credentials.

## Web Admin (Netlify)

New Web client ID: `1090749452629-uljfcv421km7hg12d32vuiq0o0dml7fm.apps.googleusercontent.com`

- Netlify build variable: `VITE_GOOGLE_WEB_CLIENT_ID`
- Authorized JavaScript origins: `https://the-good-side-command-center.netlify.app` and `http://localhost:5173`
- Existing web-based Google Identity Services flow does not need an authorization-code redirect URI.

## Render backend

The `GOOGLE_CLIENT_IDS` server variable must contain both the original Web client ID and the new Web client ID, comma-separated, during migration. The backend uses `google-auth-library` to verify signed ID tokens against the allowed audience list.

## iOS app

The iPhone app uses bundle identifier `com.thegoodside.app` and needs its own **iOS** OAuth client ID from Google Cloud. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` locally when available. The web client ID may also be supplied as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, but that does not replace a native iOS OAuth client.

The `apps/mobile/.env` file is intentionally local and untracked. A JSON credentials file on a developer's Windows PC is **not** automatically accessible to Netlify, Render or GitHub.

Do not commit Google OAuth client secrets, downloaded JSON credentials, passwords, or shared API keys. Expo Go is not the reliable final test for custom-scheme native OAuth; use an EAS development build.

## Verification

Netlify needs a fresh production build after changing a build-time `VITE_` environment variable. Render needs a successful deployment after changing `GOOGLE_CLIENT_IDS`. Test Google sign-in end to end before declaring authentication complete.
