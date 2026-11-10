# The Good Side — premium iOS integration handoff

## Current implementation
- Branch: `feature/premium-notification-foundation`, PR #1. Production `main` remains unchanged until the companion Apps Script deployment is synchronized.
- Mobile: advanced push preferences, IANA timezone, multiple times, weekday and weekend controls, quiet hours, categories, food/recipe opt-in, next-delivery preview, stable device IDs, floating Home/Discover/Food/Saved/You navigation, saved recipe details.
- API: validation, per-slot idempotent digest scheduling, recipe news distinct from structured recipes, recipe admin and user endpoints, optional custom notification sound. Manual broadcasts are restricted to users who explicitly opted into breaking alerts and their current quiet-hours/weekdays.
- Google Sheet has already been migrated append-only: ten new preference columns, RECIPES and SAVED_RECIPES. Existing news and preferences were not overwritten.
- Apps Script: the updated source is in `google-apps-script/Code.gs`, but **committing it does not redeploy your installed Apps Script web app.**

## Deployment order (required)
1. Review PR #1 and verify that CI is green. Back up the Google Sheet / deployed Apps Script project.
2. In the existing Apps Script project, replace `Code.gs` with the current branch version, then deploy a **new version of the existing web app** using its current execution/permissions settings. Do not publish `BACKEND_SHARED_SECRET` or change its Script Properties.
3. Confirm the app script shared secret and HTTPS deployment URL remain configured in the Node API environment. Verify `/health`, Google OAuth login, `/me/preferences`, `/recipes`, and an authorized settings update before restarting the production scheduler.
4. Deploy the API changes from the same branch, then enable exactly one scheduler process (`ENABLE_PUSH_SCHEDULER=true`). Running two scheduler instances adds unnecessary contention; idempotency still protects delivery slots. Keep news importers and Ollama untouched.
5. Put the downloaded audio WAV at **`apps/mobile/assets/ding.wav`** (original MP3 may be retained separately). The conditional `app.config.js` registers it in native builds only when the file exists. Set `PUSH_SOUND_NAME=ding.wav` on the API **only after** installing and validating a new iOS build with that asset; otherwise use the default sound.
6. Set the real `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_EXPO_PROJECT_ID`, Google OAuth client configuration and EAS project/Apple signing credentials locally. Never commit secrets.
7. In `apps/mobile`: `npm install`, `npx eas build --profile development --platform ios`. Test with a real iPhone; Expo Go cannot validate custom remote notification sounds.
8. Check actual iPhone delivery for: foreground, background, terminated app, notifications disabled, quiet hours, two times/day, DST, device token rotation, recipe route, and Focus/silent mode.
9. When test results pass, merge PR #1 and prepare an internal preview/TestFlight distribution.

## Still requires live/native validation
- Automatic remote push delivery while the home PC is asleep or offline cannot be guaranteed. Move the scheduler to an always-on service for a strict daily reliability commitment.
- Expo's push ticket `accepted` is not proof the handset displayed it; use Expo push receipts for final delivery diagnostics.
- The owner-supplied WAV is available as a ChatGPT download; its **binary has not yet been committed into GitHub**. Place it at the asset path before EAS build.
- Settings now offers a local notification sound preview. It plays the default sound until the signature WAV is bundled in an EAS build; real-device playback still needs verification.
- Dark-mode contrast, Dynamic Type/reduced-motion coverage and native-device Liquid Glass polish need physical-iPhone accessibility and visual QA.
- Structured recipes require licensed/attributed content and explicit admin approval. An empty RECIPES sheet is intentional, not fabricated seed content.
- No live Apps Script deployment, production API restart, or TestFlight installation was performed from ChatGPT.

## Notification model
- `USER_PREFERENCES` columns I:R are appended after existing A:H; arrays stored as JSON strings by the Apps Script data service.
- Frequency `daily`, `twice_daily`, `three_daily`, `selected_weekdays`, `breaking_only`, `digest_plus_alerts`.
- Users select max three `HH:MM` times. Server always computes local date/time using the configured IANA timezone.
- Recipes use `recipe:<recipe_id>` as a typed record in notification history. Recipe pushes only occupy selected existing digest slots; no extra messages during quiet hours.
- Claim keys include user ID, local date, delivery time, type, and device ID. No automatic retries are attempted after an ambiguous push acceptance, preventing accidental duplicates.
- An opt-out is checked in the backend each tick and in manual-broadcast recipient selection.

## Development commands
```powershell
cd "C:\Users\nobody\Desktop\the-good-Side"
git fetch origin
git checkout feature/premium-notification-foundation
npm install
npm run check
npm test
cd apps/mobile
npx eas build --profile development --platform ios
```
