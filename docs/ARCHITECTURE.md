# The Good Side security architecture

Web Google Identity Services or native Google OAuth ID token → Node HTTPS API (google-auth-library verifies issuer, audience, signature, expiry and verified email) → protected Apps Script webhook → private Sheets.

No Firebase. Admin authorization checks server-configured ADMIN_GOOGLE_EMAILS. The backend requires APPS_SCRIPT_SHARED_SECRET for the provided Google Apps Script URL, and the identical value must be in Apps Script Script Properties under BACKEND_SHARED_SECRET. Never put it in Netlify's VITE variables or Expo EXPO_PUBLIC variables.

Local Ollama runs independently and publishes draft candidates for human approval. The Node server sends push requests and records Expo acceptance (not guaranteed device delivery).
