# The Good Side — Windows 11 (no Firebase)

The project now uses Google Identity Services (web) and Google OAuth (Expo native) instead of Firebase. Passwords are never stored in Sheets.

1. Clone: git clone https://github.com/ValdemirJunior2020/the-good-Side.git
2. cd the-good-Side && npm install
3. Create OAuth client IDs in Google Cloud Console, configure OAuth consent screen and authorized JavaScript origins http://localhost:5173 for local admin. Configure separate platform client IDs for Expo mobile (iOS/Android) and the applicable redirect settings.
4. Copy apps/admin/.env.example to apps/admin/.env, set VITE_GOOGLE_WEB_CLIENT_ID. Run npm run dev -w @goodside/admin.
5. Copy services/api/.env.example to services/api/.env. Set GOOGLE_CLIENT_IDS to comma-separated allowed web/iOS/Android OAuth client IDs, set ADMIN_GOOGLE_EMAILS to your exact trusted Google account address. Create long random APPS_SCRIPT_SHARED_SECRET.
6. In the Apps Script project corresponding to the provided URL, install this repository's google-apps-script/Code.gs and manifest, set Script Property BACKEND_SHARED_SECRET to match the Node server value, deploy a NEW web app version, and check its URL. The user-supplied deployment endpoint is currently prefilled in the backend example, but no claim is made that it runs this version of Code.gs.
7. Run npm run api. The browser calls the Node API, not the Apps Script URL. Keep Apps Script secret server-side.
8. For Expo, copy apps/mobile/.env.example to apps/mobile/.env, set Google OAuth client IDs and EXPO_PUBLIC_API_URL to your HTTPS Node gateway. Run npm run mobile. Native sign-in and push permissions require device tests and OAuth redirect configuration.
9. For manual pushes, configure EAS/Expo credentials and PUSH_TOKEN_ENCRYPTION_KEY_BASE64; the Node server must be reachable and continuously running for scheduled sends.
10. On Netlify set VITE_API_URL and VITE_GOOGLE_WEB_CLIENT_ID as build environment variables. Allow your deployed admin origin in Google Cloud OAuth settings and ALLOWED_ORIGIN on the Node API.

A static Netlify site cannot securely hold the Apps Script secret or function as a privileged backend. Cloudflare Tunnel can expose your protected Node API, not your local Ollama process. Google OAuth client IDs are public identifiers; secrets and tokens are not.

Testing: npm run check && npm test && npm run build -w @goodside/admin

Limitations: Google Identity ID tokens expire and this starter currently prompts users to reauthenticate rather than automatically refreshing; the initial mobile experience uses Google sign-in rather than email/password. Google OAuth requires cloud-project setup but does not require Firebase. The code push does not deploy your Apps Script.
