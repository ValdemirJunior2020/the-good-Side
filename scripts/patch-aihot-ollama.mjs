#!/usr/bin/env node
/**
 * The Good Side: apply a reversible, idempotent Ollama structured-output patch
 * to the pinned AIHOT Git submodule. Does not alter the PostgreSQL database.
 *
 * Usage (from The Good Side root):
 *   node scripts/patch-aihot-ollama.mjs
 *
 * It is intentionally NOT a migration of AIHOT's Chinese taxonomy.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const target = resolve(root, "third_party/AIHOT/packages/backend/src/providers/llm.ts");
if (!existsSync(target)) {
  console.error("AIHOT submodule missing. From project root run: git submodule update --init");
  process.exit(1);
}
const original = readFileSync(target, "utf8");
const marker = "GOOD_SIDE_OLLAMA_STRUCTURED_V1";
if (original.includes(marker)) {
  console.log("Already patched; no change.");
  process.exit(0);
}
const needle = "    ...(spec.extra ?? {}),\n  };";
if (!original.includes(needle)) {
  console.error("AIHOT request builder differs from expected version; no changes made.");
  process.exit(1);
}
const patch = `    ...(spec.extra ?? {}),
    // GOOD_SIDE_OLLAMA_STRUCTURED_V1:
    // For local Qwen, generic json_object did not prevent incorrect keys.
    // Ollama's OpenAI-compatible endpoint supports JSON Schema response_format.
    // Only constrain the three affected stages, preserving upstream behavior elsewhere.
    ...(spec.model.startsWith("qwen3:") && spec.jsonMode && opts.json !== false
      ? (() => {
          const string = { type: "string" };
          const enumString = (values: string[]) => ({ type: "string", enum: values });
          const shape = (properties: Record<string, unknown>) => ({
            type: "object", properties, required: Object.keys(properties), additionalProperties: false,
          });
          const schema = opts.purpose === "prefilter_article"
            ? shape({ label: enumString(["PASS", "BLOCK", "UNKNOWN"]), reason: string })
            : opts.purpose === "score_article"
            ? shape({ attentionScore: { type: "integer", minimum: 0, maximum: 100 } })
            : opts.purpose === "understand_article"
            ? shape({
                itemType: enumString(["model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event", "opinion_analysis", "tutorial_explainer"]),
                authorRole: enumString(["principal", "observer", "relayer"]),
                tags: { type: "array", items: string },
                editorialJudgment: string,
                titleZh: string,
                summaryZh: string,
              })
            : null;
          return schema ? { response_format: { type: "json_schema", json_schema: {
            name: "good_side_" + opts.purpose, strict: true, schema,
          } } } : {};
        })()
      : {}),
  };`;
const result = original.replace(needle, patch);
const backup = target + ".goodside-original.bak";
if (!existsSync(backup)) copyFileSync(target, backup);
writeFileSync(target, result, "utf8");
console.log("Patched AIHOT Ollama prefilter, score, and understand with explicit output schemas.");
console.log("Backup:", backup);
console.log("Database not touched. Review git diff in the AIHOT submodule before building.");
