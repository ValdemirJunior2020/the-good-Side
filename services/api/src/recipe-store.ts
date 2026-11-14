/**
 * Optional server-side Supabase recipe store.
 * Activate with RECIPE_STORE=supabase, SUPABASE_URL and
 * SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) on the API server only.
 * Never place a service role / secret key in Expo or Vite variables.
 *
 * Current public.recipes schema stores ingredients/instructions as JSON text.
 * The compatibility layer preserves the existing mobile and admin API shape.
 */
import {randomUUID} from "node:crypto";

type RecipePayload = Record<string, unknown>;
type RecipeAction = "listRecipes" | "getRecipe" | "upsertRecipe";
const fields = [
  "recipe_id","title","description","prep_minutes","cook_minutes","servings",
  "ingredients","instructions","dietary_tags","source_name","source_url",
  "image_url","image_license","language","approval_status","created_at","updated_at"
] as const;

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const modern = process.env.SUPABASE_SECRET_KEY?.trim();
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  // A publishable or legacy anon key cannot write protected recipe records.
  // Fail closed rather than suggesting unsafe public table grants.
  if (modern && !modern.startsWith("sb_secret_"))
    throw Error("SUPABASE_SECRET_KEY must be a server-side sb_secret_ key, not a publishable/anon key");
  let key = modern || fallback;
  if (!url || !/^https:\/\//.test(url) || !key)
    throw Error("Supabase recipe store requires SUPABASE_URL and a server-only Supabase secret key");
  const legacy=!key.startsWith("sb_secret_");
  if (legacy) {
    try {
      const claims=JSON.parse(Buffer.from(key.split(".")[1],"base64url").toString("utf8"));
      if(claims.role!=="service_role")throw Error("role");
    } catch {throw Error("Legacy Supabase key must be the server-only service_role JWT, never anon");}
  }
  return {url, key, legacy};
}
async function request(path: string, init: RequestInit = {}) {
  const {url,key,legacy}=config();
  const response=await fetch(url+"/rest/v1/recipes"+path,{
    ...init,
    headers:{
      apikey:key,...(legacy?{Authorization:"Bearer "+key}:{}),
      ...(init.body?{"content-type":"application/json"}:{}),
      ...(init.headers||{})
    },
    signal:AbortSignal.timeout(15000)
  });
  if(!response.ok) {
    const detail=(await response.text()).slice(0,250);
    throw Error("Supabase recipe request failed ("+response.status+"): "+detail);
  }
  const body=await response.text();
  return body?JSON.parse(body):null;
}
function decodeRecipe(row:Record<string,unknown>){
  const copy={...row};
  for(const field of ["ingredients","instructions"] as const){
    if(typeof copy[field]==="string"){
      try{copy[field]=JSON.parse(copy[field] as string)}catch{copy[field]=[]}
    }
  }
  return copy;
}
export async function supabaseRecipeAction(action:RecipeAction,payload:RecipePayload={}) {
  if(action==="listRecipes") {
    const rows=await request("?select=*&approval_status=eq.approved&order=created_at.desc&limit=200");
    return (rows as Record<string,unknown>[]).map(decodeRecipe);
  }
  if(action==="getRecipe") {
    const id=String(payload.recipe_id||"");
    if(!id)throw Error("Recipe ID required");
    const rows=await request("?select=*&recipe_id=eq."+encodeURIComponent(id)+"&approval_status=eq.approved&limit=1");
    return rows?.[0]?decodeRecipe(rows[0]):null;
  }
  const now=new Date().toISOString();
  const id=String(payload.recipe_id||"recipe-"+randomUUID());
  const record:Record<string,unknown>={recipe_id:id,updated_at:now};
  for(const field of fields){
    if(field==="recipe_id"||field==="created_at"||field==="updated_at")continue;
    if(payload[field]===undefined)continue;
    record[field]=field==="ingredients"||field==="instructions"
      ?JSON.stringify(payload[field]):payload[field];
  }
  // Preserve original creation timestamps on edits instead of resetting history.
  const existing=await request("?select=created_at&recipe_id=eq."+encodeURIComponent(id)+"&limit=1");
  record.created_at=existing?.[0]?.created_at||now;
  // Reject incomplete/unauthorized publication before touching the database.
  if(record.approval_status==="approved"){
    if(typeof record.image_url!=="string"||!record.image_url.startsWith("https://")
      ||typeof record.image_license!=="string"||!record.image_license.trim()
      ||/unverified|development preview|unknown|not confirmed/i.test(record.image_license))
      throw Error("Cannot publish a recipe without an HTTPS image and documented image usage rights");
    for(const field of ["ingredients","instructions"]){
      const items=JSON.parse(String(record[field]||"[]"));
      if(!Array.isArray(items)||items.length<3)
        throw Error("Published recipes require at least three "+field);
    }
  }
  const rows=await request("?on_conflict=recipe_id",{
    method:"POST",
    headers:{Prefer:"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify(record)
  });
  return {recipe_id:id,status:rows?.[0]?.approval_status||record.approval_status||"pending"};
}
