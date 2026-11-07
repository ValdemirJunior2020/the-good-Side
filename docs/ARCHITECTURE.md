# Architecture

Expo app -> HTTPS Node API -> secret-protected Google Apps Script -> private Google Sheet.

Firebase ID tokens are verified in Node, including admin custom claims. Apps Script is never called by the mobile app directly. A separate Ollama RSS worker sends pending stories to the API, and editorial review is required before publication.

The push scheduler requires an always-on Node instance with one replica. It encrypts push tokens in the Sheet using AES-256-GCM and logs Expo acceptance tickets, not guaranteed delivery receipts.

Google Sheets scans are linear and not suitable for high-volume public production use. For growth, migrate the storage abstraction and scheduler to PostgreSQL and a transactional queue. The home Ollama host should never be exposed without authentication.
