# The Good Side — Hybrid hosting (Render + Netlify + local Ollama/AIHOT)

The API is hosted on Render and remains usable while the Windows PC is off.
The Netlify Admin saves manual stories and recipes to the existing Google Sheets
through that API. When the PC is online, its *existing* Windows Scheduled Task
runs the local AIHOT-to-Ollama importer every 30 minutes and sends selected,
screened articles to the same Render API.

## 0. Safety / status

- New feature branch: `feature/hybrid-render-local-ai`. Do **not** switch the live iPhone app or production Netlify environment until the Render API is tested.
- No new paid RSS provider or paid AI model is required. The legacy AIHOT bridge currently only automatically publishes verified Positive News items; the other 31 news websites remain inactive until permission and feed review. It does not magically crawl all 31 sites.
- Render `render.yaml` is a proposed new *free* test service with push scheduler disabled. Free instances can spin down and cannot reliably send scheduled notifications. Before public launch, consider upgrading to an always-on plan, then enable `ENABLE_PUSH_SCHEDULER=true` **on only one API instance**.
- Never upload `.env`, `PUSH_TOKEN_ENCRYPTION_KEY_BASE64`, `RESEARCH_WORKER_KEY` or `APPS_SCRIPT_SHARED_SECRET` to GitHub, Netlify public env variables or app bundles.

## 1. Set up Render API (when at your PC)

1. Confirm the desired Render **workspace** and that your account can access the GitHub repository.
2. In Render, create a Blueprint from this repo's `render.yaml` on `feature/hybrid-render-local-ai`, **or** manually create one Node Web Service:
   - Repository: `ValdemirJunior2020/the-good-Side`
   - Branch: `feature/hybrid-render-local-ai`
   - Root directory: leave as repository root (this is an npm workspaces monorepo)
   - Build: `npm ci --include=dev --no-audit --no-fund`
   - Start: `npm run start -w @goodside/api`
   - Node: 22
   - Health-check: `/health`
   - Test plan: Free; enable auto deploy only after branch checks pass.
3. Enter these secrets and settings in Render's Environment tab, *not* in code:
   - `GOOGLE_CLIENT_IDS` — same comma-separated web/iOS/Android Google OAuth client IDs accepted by the existing Node API
   - `ADMIN_GOOGLE_EMAILS` — the admin Google account email(s)
   - `APPS_SCRIPT_URL` — **existing** deployed Google Apps Script Web App URL
   - `APPS_SCRIPT_SHARED_SECRET` — must match the **existing** Script Properties `BACKEND_SHARED_SECRET`
   - `RESEARCH_WORKER_KEY` — same long random value used by the local Research Worker
   - `PUSH_TOKEN_ENCRYPTION_KEY_BASE64` — keep exactly the same base64 AES key used to encrypt existing device tokens; changing it invalidates those tokens
   - `ALLOWED_ORIGIN` — e.g. `https://the-good-side-command-center.netlify.app,http://localhost:5173`
   - `ENABLE_PUSH_SCHEDULER=false` for Free/testing; paid always-on only and a single scheduler instance for reliable digest delivery
   - `NODE_VERSION=22`
4. Render supplies `PORT`; do not force local `8788` unless configuring Render to the same port.
5. On your new Render URL check `/health`, `/news?limit=3`, and `/recipes`. A health check alone does not prove Apps Script connectivity.
6. To test authenticated Admin workflows, first confirm Render CORS and Google OAuth; only then point Netlify at Render.

## 2. Netlify Admin (no PC needed after Render is online)

In the **existing** Netlify site `the-good-side-command-center`, keep
`VITE_GOOGLE_WEB_CLIENT_ID` as the approved Google web client ID. Set
`VITE_API_URL=https://YOUR-SERVICE.onrender.com` in the build environment
and redeploy the Admin. Because Vite public variables are embedded at build
time, changing the variable requires a rebuild. Do not store secrets in
`VITE_*` variables.

Test Google login, Approved News, Publish & Send, Food & recipes. The manual
Send button publishes a sourced article to the Google Sheet and iPhone feed;
it only sends an immediate push to registered, opted-in users eligible for
breaking alerts and outside quiet hours (existing 75-device beta limit).
Publishing a recipe makes it visible in Food, but does not broadcast it.

## 3. Mobile iPhone app

For your Expo/EAS app, update the build-time
`EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com` and rebuild or
restart your development bundle as appropriate. Keep your original Cloudflare
API URL operational until you've verified the new one, and only then switch
production release configuration. OAuth iOS redirect/client settings remain
separate from the Netlify web OAuth origin.

## 4. Windows local 30-minute AI worker (PC can be off)

Keep AIHOT available on `http://127.0.0.1:3000` and Ollama on
`http://127.0.0.1:11434`. In `services/research-worker/.env` configure:

```dotenv
API_URL=https://YOUR-SERVICE.onrender.com
AIHOT_URL=http://127.0.0.1:3000
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
RESEARCH_WORKER_KEY=YOUR_EXISTING_PRIVATE_WORKER_KEY
AIHOT_ALLOW_REMOTE=false
AIHOT_MIN_SCORE=60
AIHOT_MAX_ITEMS=50
```

The Render key and local key MUST match. The AI worker POSTs to the protected
Render `/worker/candidates` route with its secret header. AIHOT and Ollama
are **not hosted in Render**, and should not be exposed publicly.

Your previously installed Task Scheduler entry `TheGoodSide-AutoNews`
already runs `scripts/run-goodside-import.ps1` every 30 minutes. This branch
hardens that script with a single-run mutex and portable project paths.
The task only executes when the PC is on and Windows permits scheduled tasks.
Use Task Scheduler to verify its trigger, account, and power/sleep behavior.
If you want a run immediately after login, add an **At log on** trigger
after reviewing it; don't create a duplicate 30-minute task.

Health check (read-only):

```powershell
cd "C:\Users\nobody\Desktop\the-good-Side"
.\scripts\check-hybrid.ps1 -RenderApiUrl "https://YOUR-SERVICE.onrender.com"
Get-ScheduledTaskInfo -TaskName "TheGoodSide-AutoNews"
Get-Content .\goodside-import.log -Tail 40
```

The PC being off doesn't affect Render, Netlify or Google Sheets, but the
local AI will not import anything. This is intentional. Auto-import may also
be unavailable when Docker/AIHOT/Ollama are not running, even if the PC is on.

## 5. Rollout order / rollback

1. Test Render independently without changing any existing URLs.
2. Test local AIHOT import to Render from a terminal once, check for
   `failed:0` and verify new approved records or a legitimate duplicate.
3. Switch **Netlify** to Render and test manual publishing; leave iPhone on
   the old URL until validated.
4. Switch Expo/mobile API URL; check guest feed, Google sign in, Food,
   saved articles, preferences, and notification registration.
5. Only after production device testing enable the paid always-on scheduler.
6. If a feature fails, restore the previous API URL in the affected
   frontend and redeploy/rebuild it. Don't delete the existing Cloudflare
   gateway or rotate shared secrets during cutover.

## Render access

A Render user-profile URL `dashboard.render.com/u/...` is **not** a
workspace identifier. Always explicitly confirm the intended workspace before
creating a hosted service. The code/Blueprint can be prepared independently.
