// Verify the published launch catalog without database credentials.
// Run: node scripts/audit-recipe-catalog.mjs
import { readFile } from "node:fs/promises";
const file=new URL("../data/launch-recipes-2026.json",import.meta.url);
const catalog=JSON.parse(await readFile(file,"utf8")).recipes;
const errors=[];
const groups={"american-":10,"brazilian-":5,"middle-eastern-":5,"pasta-":5,"dessert-":5};
if(catalog.length!==30)errors.push("Catalog has "+catalog.length+" recipes, expected 30");
for(const [prefix,expect] of Object.entries(groups)){
 const count=catalog.filter(r=>r.recipe_id.startsWith(prefix)).length;
 if(count!==expect)errors.push(prefix+" has "+count+" records, expected "+expect);
}
for(const r of catalog){
 if(!Array.isArray(r.ingredients)||r.ingredients.length<3||!Array.isArray(r.instructions)||r.instructions.length<3)
  errors.push(r.recipe_id+": incomplete cooking instructions");
 if(!/^https:\/\//.test(r.image_url||"")||!r.image_license||!r.source_url)
  errors.push(r.recipe_id+": missing image/source/licensing");
}
const headers={"user-agent":"TheGoodSideRecipeAudit/1.0 (https://thegoodsidenews.com; community food catalog; source attribution check)","accept":"application/json"};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function getJson(url){
 let last;
 for(let i=0;i<3;i++){
  try{
   const res=await fetch(url,{headers,signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error("HTTP "+res.status);
   return await res.json();
  }catch(e){last=e;await sleep((i+1)*1200)}
 }
 throw last;
}
let verified=0;
for(let i=0;i<catalog.length;i+=3){
 const batch=catalog.slice(i,i+3);
 const results=await Promise.allSettled(batch.map(async r=>{
  const name=decodeURIComponent(new URL(r.source_url).pathname.split("/File:")[1]||"").replaceAll("_"," ");
  if(!name)throw Error("Missing Wikimedia file");
  const url="https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata&titles="+encodeURIComponent("File:"+name)+"&iiurlwidth=960";
  const json=await getJson(url);
  const page=Object.values(json.query?.pages||{})[0];
  const info=page?.imageinfo?.[0];
  if(!info?.thumburl&&!info?.url)throw Error("Image file missing from Commons");
  const meta=info.extmetadata||{};
  const license=String(meta.LicenseShortName?.value||"");
  const allowed=/^(CC\s|CC0|Public domain|PD|GFDL)/i.test(license);
  if(!allowed)throw Error("Unknown or restricted Commons license: "+license);
  const declared=String(r.image_license||"").toLowerCase();
  if(!declared.includes("cc")&&!declared.includes("public domain"))throw Error("License not recorded in catalog");
  return {recipe:r.recipe_id,license,image:info.thumburl||info.url};
 }));
 for(let j=0;j<batch.length;j++){
  const result=results[j];
  if(result.status==="fulfilled"){verified++;console.log("OK",result.value.recipe,result.value.license)}
  else {errors.push(batch[j].recipe_id+": "+String(result.reason));console.error("FAIL",batch[j].recipe_id,String(result.reason))}
 }
 await sleep(250);
}
const api=process.env.RECIPE_AUDIT_API||"https://the-good-side-api.onrender.com";
try{
 const health=await getJson(api+"/health/recipes");
 if(health.status!=="ok"||health.store!=="supabase"||health.published_recipes<30)
  errors.push("Live recipe API health does not show at least 30 published Supabase recipes: "+JSON.stringify(health));
 else console.log("Live API:",JSON.stringify(health));
}catch(e){errors.push("Live API check failed: "+String(e))}
console.log("Catalog image licenses found:",verified+"/"+catalog.length);
if(errors.length){for(const e of errors)console.error("AUDIT ERROR:",e);process.exitCode=1}
else console.log("PASS: 30 catalog items, 30 Wikimedia images, live Supabase store");
