# Premium notification + Food implementation plan

Status: **foundation only — not deployed**. Existing news pipeline, Google OAuth, AIHOT, Ollama, Docker and Apps Script were not modified by this branch.

## Findings (November 8, 2026)
- Mobile app: Expo SDK 54, expo-router, expo-notifications, Expo Blur; existing preferences screen is single-time.
- Database: USER_PREFERENCES, PUSH_DEVICES and NOTIFICATION_LOGS are already present.
- Backend has a 1-minute scheduler but currently only supports one daily time.
- The Google Sheet columns and Code.gs TAB_NAMES are coupled. New columns must be migrated together with the Apps Script header map and Node validation.
- Current code has a potential opt-out bug: string `"false"` is truthy in JavaScript. Always normalize string booleans.

## Phase 1 migration (must be coordinated)
Extend USER_PREFERENCES append-only with notification_timezone, notification_frequency, notification_times (JSON array), notification_weekdays (JSON array, Sunday=0), quiet_hours_start, quiet_hours_end, weekend_enabled, food_notifications_enabled, breaking_alerts_enabled, notification_sound_enabled. Keep notification_local_time for backward compatibility. Add server validation, including max daily sends and fallback for invalid timezones. Do not write to the live Sheet until backend and migration can be deployed together.

## Delivery invariants
1. All notifications require the master opt-in; food and breaking additionally require their own opt-ins.
2. Quiet hours and weekdays apply to *every* notification type, including admin broadcasts.
3. Only a server-side scheduler can initiate remote pushes. Never rely on a mobile JS timer.
4. Use user's IANA timezone. Local dates and time are recomputed each tick, including DST.
5. Claim an idempotency key keyed by user, local date, scheduled time, kind and device **before** sending. Log ticket acceptance vs actual delivery honestly.
6. A disabled user or device must be excluded from the recipient query on each send, not from a stale cache.
7. Retry transient push failures with a lease/expiry state to prevent permanent suppression; don't blindly resend accepted tickets.
8. A scheduler on the home PC cannot guarantee delivery during home-PC downtime. For strong reliability, run a small always-on scheduler or gracefully defer until restoration.

## Food & Recipes
Use `food` as a category for sourced news, and a separate RECIPES table for recipe records (title, timings, servings, ingredients JSON, steps JSON, diet tags, credited source URL, image license and publication status). Recipes should not enter the verified news feed until content licensing and moderation are confirmed. Ingredient/diet claims require evidence.

## Signature sound
Owner supplied ding MP3 (5.18 s, stereo, 48 kHz). A PCM WAV copy is available in the ChatGPT deliverables. For native iOS pushes, bundle a supported short CAF/WAV/AIFF sound via Expo Notifications plugin config, verify correct asset filename in APNs payload, then rebuild via EAS. Do not claim success based on Expo Go.

## UI rollout
Keep existing routes, then add five-tab navigation (Home, Discover, Food, Saved, You). Use accessible translucent surfaces, reduced-motion handling, light/dark palettes and fallback solid colors. Verify each feature on a physical iPhone, then deploy.
