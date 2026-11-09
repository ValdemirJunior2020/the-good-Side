#!/usr/bin/env node
/**
 * The Good Side: strip editorial boilerplate from generated news headlines.
 * Preserve publisher names when they are the actual subject of a story.
 *
 * This edits only local AIHOT code; it never touches PostgreSQL.
 * Run after scripts/patch-aihot-ollama.mjs from the parent repository.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const path = resolve(root, "third_party/AIHOT/packages/backend/src/editorial/analyze.ts");
if (!existsSync(path)) {
  console.error("AIHOT analysis source missing; no changes made.");
  process.exitCode = 1;
} else {
  const source = readFileSync(path, "utf8");
  const tag = "GOOD_SIDE_HEADLINE_PREFIX_GUARD_V1";
  const pattern = /^(\s*)const titleZh = collapseWhitespace\(run\.writing\?\.titleZh \?\? ""\);/m;
  if (source.includes(tag)) {
    console.log("Headline prefix guard already installed.");
  } else if (!pattern.test(source)) {
    console.error("Unexpected AIHOT analysis source; no changes made.");
    process.exitCode = 1;
  } else {
    const next = source.replace(pattern, (_match, indent) =>
      indent + "// " + tag + ": never lead with a generic good-news label.\n" +
      indent + "// Preserve a publisher name when it is the story subject (e.g. 'Positive News launches...').\n" +
      indent + 'const titleZh = collapseWhitespace(run.writing?.titleZh ?? "").replace(/^(?:positive news|good news)\\s*[:\\u2013\\u2014-]\\s*/i, "");'
    );
    const backup = path + ".goodside-headline-original.bak";
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, next, "utf8");
    console.log("Installed generic-prefix guard on AIHOT generated headlines.");
    console.log("Backup:", backup);
    console.log("Existing database rows are unchanged; rebuild api/worker to activate.");
  }
}
