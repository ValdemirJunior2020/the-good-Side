# AIHOT + Ollama: local structured-output repair

The Good Side retains upstream AIHOT as a Git submodule. GitHub cannot modify the running Docker containers on the Windows host; this patch must be applied once on that computer.

## Run after pulling the parent repo

From `C:\Users\nobody\Desktop\the-good-Side` in PowerShell:

```powershell
git pull --ff-only
node scripts/patch-aihot-ollama.mjs
cd third_party/AIHOT
docker compose up -d --build --force-recreate api worker
docker compose ps
```

The script **only** updates `packages/backend/src/providers/llm.ts` in the local AIHOT submodule, makes a backup (`.goodside-original.bak`), and changes Ollama's OpenAI-compatible `response_format` from generic JSON to explicit JSON schemas for `prefilter_article`, `score_article`, and `understand_article`. The patch is safe to run again: it will detect that it is already installed. It does **not** delete/modify PostgreSQL or run any data migrations.

### What it does and does not fix

The recorded failures for receipts 848 and 849 were valid but incorrect JSON shapes. This patch requests constrained response fields and enums, so it should reduce those specific failures with an Ollama build supporting JSON-schema `response_format`. It is **not verified against the user's live model** and could require adjustment for local Ollama versions. It does not guarantee zero failures or process old articles automatically.

The original AIHOT `itemType` enum is still AI-centric. Changing that enum properly requires coordinated taxonomy, prompt, web, and data-contract changes. `titleZh` and `summaryZh` remain legacy field names; English text can be stored in them, but AIHOT's presentation pipeline still contains Chinese-language rules. The new Positive News RSS source was already imported in the user's local database (8 articles, all in `new` state before this fix). The original 18 AI feeds also remain active.

**Important:** Local submodule edits are not saved by pushing the parent repository. Keep the backup and commit changes to a fork of AIHOT if you want reproducible deployment on new machines. Do not run `git submodule update --force` over uncommitted local changes.

### Verify locally

```powershell
docker compose exec db psql -U aihot -d aihot -P pager=off -c "SELECT processing_state, COUNT(*) FROM articles WHERE source_id = 'rss-positive-news' GROUP BY processing_state;"
docker compose exec db psql -U aihot -d aihot -P pager=off -c "SELECT purpose, status, COUNT(*) FROM receipts WHERE purpose IN ('prefilter_article','understand_article','score_article') GROUP BY purpose, status ORDER BY purpose, status;"
```

Inspect **new** receipt IDs and article results after rebuilding; historical failed receipts remain in audit history. Don't publish a story based only on a numerical score: original publication, evidence, language, and category still need verification before the Google Sheets editorial approval step.
