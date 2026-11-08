# AIHOT integration — The Good Side (no Firebase)

AIHOT is included as a **pinned Git submodule**, NOT copied into the app. Its upstream MIT license and authorship remain intact. Your iOS app, Google Sheets and Netlify Command Center are unchanged.

## 1. Windows 11 prerequisites

Install **Docker Desktop (WSL2 enabled)**, **Node.js 24.22.1+** for AIHOT, **Git**, and **Ollama** with the existing local model \`qwen3:8b\`.

From the root of The Good Side:

\`\`\`powershell
git pull
git submodule update --init --recursive
ollama pull qwen3:8b
cd third_party/AIHOT
node scripts/init-env.ts --llm-key ollama
\`\`\`

The AIHOT \`.env\` is local-only. Set:
\`\`\`dotenv
LLM_BASE_URL=http://host.docker.internal:11434/v1
LLM_API_KEY=ollama
LLM_MODEL=qwen3:8b
LLM_EXTRA_JSON={}
\`\`\`

Ollama must be reachable from Docker. On Windows, configure the Ollama service's bind address if needed, restrict access via Windows Firewall to trusted local/Docker networks, and check connectivity. **Do not expose Ollama publicly.** AIHOT needs PostgreSQL (its Docker Compose includes it), and its service stack is separate from your Node API.

Before opening the worker, tailor AIHOT for *positive news*; its bundled source list contains AI-industry demo sources and Chinese-language scoring. Follow upstream \`docs/customize.md\`, replace \`industry/sources.json\` with sources you have reviewed and are allowed to monitor, and rewrite \`industry/prompts/\` to enforce truthful, evidence-based positive-news selection. The Good Side bridge performs a **second independent positive-only Ollama screening**, but that does not excuse running the default AI-news pipeline.

\`\`\`powershell
docker compose up -d --build
\`\`\`

Visit http://localhost:3000 and http://localhost:3000/admin to inspect AIHOT. The AIHOT admin password is from the generated local \`.env\`. Its public selected-news API is http://localhost:3000/api/v1/items?mode=selected&window=7d&limit=50.

## 2. Connect AIHOT to The Good Side

Start the existing The Good Side Node API, with **its own** \`services/api/.env\`: working Apps Script deployment, \`APPS_SCRIPT_SHARED_SECRET\`, \`GOOGLE_CLIENT_IDS\`, and the same nonempty \`RESEARCH_WORKER_KEY\` in both API and research-worker local env files. Its existing Google Apps Script deployment must be updated with the checked-in Code.gs; GitHub pushes do not automatically deploy Apps Script.

From The Good Side root:
\`\`\`powershell
Copy-Item services/research-worker/.env.example services/research-worker/.env
# Edit services/research-worker/.env to use the shared worker key
npm install
npm run api
\`\`\`

In another PowerShell window:
\`\`\`powershell
npm run aihot:import
\`\`\`

What the bridge does:
1. Fetch the **selected** public AIHOT v1 items (7-day window, up to 50 per invocation).
2. Reject missing original publisher URLs, missing dates, unsupported scores, or malformed payloads.
3. Re-screen every candidate locally using Ollama to ensure *genuinely positive* real-world news, rejecting generic AI product launches and promotional claims.
4. Preserve original publisher and link; create stable SHA-256 IDs and content hashes.
5. POST accepted candidates to The Good Side authenticated \`/worker/candidates\` endpoint.
6. Store candidates in Google Sheets as **pending**. Editorial approval in the existing Command Center remains mandatory. **No push notifications are sent by AIHOT.**

Re-running the import is safe for exact duplicate URLs because Google Sheets \`addNews_\` checks source URL and content hash. This is a one-shot command; schedule it with Windows Task Scheduler once the upstream AIHOT instance is stable. Use \`npm run aihot:import\` as the action and your project root as Start In.

## Upstream, updates and operational notes

Pinned version: \`6fe293def358f3920cccc4a381ead758313bbd78\` (Nov 8, 2026). AIHOT source is at https://github.com/KKKKhazix/AIHOT (MIT). Keep the upstream copyright/license notice; do not use the AIHOT name or logo for The Good Side branding.

AIHOT uses Node >=24, PostgreSQL 17 and Docker Compose; it **cannot run as a static Netlify build**. The AIHOT service remains on the user's trusted Windows/Docker host. Netlify only serves our Command Center frontend. OpenAI-compatible Ollama may require prompt/JSON mode tuning. Import is not a live stream or a guaranteed always-on service. The API URL and Google Sheets deployment are not verified by this repository change.

Security: \`RESEARCH_WORKER_KEY\`, backend secrets and AIHOT admin credentials live in local env files, never in Vite/Expo variables or GitHub. Be careful before exposing AIHOT publicly; its default public API is read-only but its admin is separate.
