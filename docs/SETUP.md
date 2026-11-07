# Setup — Windows 11

1. Clone the repository and run npm install with Node 22 LTS.
2. Configure Firebase Email/Password Authentication and the Firebase Admin service credentials in the Node environment. Set EXPO_PUBLIC_FIREBASE_* values in the mobile environment.
3. Open the existing spreadsheet and confirm the nine headers/tabs.
4. Create a Google Apps Script project bound to the Sheet; paste google-apps-script/Code.gs and appsscript.json. Configure Script Properties BACKEND_SHARED_SECRET with a long random value.
5. Deploy the Apps Script as a web app (execute as owner; allow Anyone). Put the deployment exec URL in APPS_SCRIPT_URL and set the same shared secret in the API as APPS_SCRIPT_SHARED_SECRET. This script deployment is not performed by a GitHub commit.
6. Configure services/api/.env.example values in services/api/.env. Run npm run api. Expose this API over HTTPS using an authenticated/restricted Cloudflare Tunnel; do not expose Ollama publicly.
7. Configure services/research-worker/.env and ensure Ollama is installed with model qwen3:8b. Edit sources.json to change review_terms to approved ONLY after checking each publisher's feed terms; run npm run research.
8. Configure apps/mobile/.env and run npm run mobile. Push notifications require an EAS project ID and native push credentials. Test on an actual device; Expo Go may not support remote notifications.
9. Grant Firebase custom claim admin:true to your own account with a one-time trusted Firebase Admin script; never provide client-side role escalation. Configure apps/admin/.env and run npm run dev -w @goodside/admin. Netlify base directory is apps/admin; build command npm run build; publish dist.
10. Keep the Node API always online with ENABLE_PUSH_SCHEDULER=true and a 32-byte AES encryption key provided as base64 in PUSH_TOKEN_ENCRYPTION_KEY_BASE64. Do not run multiple independent scheduler replicas.

Test commands: npm run check; npm test; npm run build -w @goodside/admin.

Real Apple TestFlight/App Store publishing requires an Apple Developer account. A publicly available always-on backend, iOS distribution, and publisher licenses may have costs even if the local AI and open-source code are free.
