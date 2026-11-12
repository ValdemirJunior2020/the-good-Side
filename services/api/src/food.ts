import {z} from "zod";

/** Independent food-preference storage. Google sign-in is verified in the existing Express gateway. */
export const FOOD_CUISINES=[
 "italian","mexican","brazilian","japanese","korean","indian","mediterranean",
 "chinese","thai","american","middle-eastern","french","caribbean"
] as const;
export const FOOD_MEALS=["breakfast","lunch","dinner","snack","dessert","baking"] as const;
export const FOOD_DIETS=["vegetarian","vegan","gluten-free","dairy-free","low-carb","high-protein","halal","kosher"] as const;
const choices=(values:readonly string[])=>z.array(z.enum(values as [string,...string[]])).max(20);
export const foodPreferenceInput=z.object({
 cuisines:choices(FOOD_CUISINES).default([]),
 meal_types:choices(FOOD_MEALS).default([]),
 dietary_styles:choices(FOOD_DIETS).default([]),
 excluded_ingredients:z.array(z.string().trim().min(2).max(60)).max(30).default([]),
 food_news_enabled:z.boolean().default(false),
 recipe_notifications_enabled:z.boolean().default(false)
}).strict();
export type FoodPreferences=z.infer<typeof foodPreferenceInput>;
export const DEFAULT_FOOD:FoodPreferences={
 cuisines:[],meal_types:[],dietary_styles:[],excluded_ingredients:[],
 food_news_enabled:false,recipe_notifications_enabled:false
};
function config(){
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw Error("Food preferences require a configured Supabase server connection");
 const parsed=new URL(url);
 if(parsed.protocol!=="https:"||!parsed.hostname.endsWith(".supabase.co"))throw Error("Invalid Supabase endpoint");
 return {url:parsed.origin,key};
}
async function db(path:string,init:RequestInit={}):Promise<unknown>{
 const {url,key}=config();
 const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),12000);
 try{
  const response=await fetch(url+"/rest/v1/"+path,{
   ...init,signal:ac.signal,
   headers:{"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json",...(init.headers||{})}
  });
  if(!response.ok)throw Error("Food preference storage unavailable ("+response.status+")");
  const body=await response.text();return body?JSON.parse(body):null;
 }finally{clearTimeout(timer)}
}
export async function readFoodPreferences(userId:string):Promise<FoodPreferences>{
 const result=await db("food_preferences?user_id=eq."+encodeURIComponent(userId)+"&select=*");
 const current=Array.isArray(result)?result[0]:undefined;
 return current?foodPreferenceInput.parse(Object.fromEntries(Object.keys(DEFAULT_FOOD).map(key=>[key,current[key]??DEFAULT_FOOD[key as keyof FoodPreferences]]))):DEFAULT_FOOD;
}
export async function writeFoodPreferences(userId:string,payload:unknown):Promise<FoodPreferences>{
 const pref=foodPreferenceInput.parse(payload);
 await db("food_preferences?on_conflict=user_id",{
  method:"POST",headers:{"Prefer":"resolution=merge-duplicates"},
  body:JSON.stringify({user_id:userId,...pref,updated_at:new Date().toISOString()})
 });
 return readFoodPreferences(userId);
}
export function matchRecipe(recipe:{title?:string;description?:string;dietary_tags?:string;ingredients?:unknown},p:FoodPreferences):boolean{
 const searchable=(recipe.title||"")+" "+(recipe.description||"")+" "+(recipe.dietary_tags||"");
 const text=searchable.toLowerCase();
 const tags=String(recipe.dietary_tags||"").toLowerCase().split(/[,;|]/).map(x=>x.trim());
 // Never treat an unknown dietary status as evidence of safety.
 if(p.dietary_styles.length&&!p.dietary_styles.every(x=>tags.includes(x)))return false;
 if(p.cuisines.length&&!p.cuisines.some(x=>text.includes(x)))return false;
 if(p.meal_types.length&&!p.meal_types.some(x=>text.includes(x)))return false;
 if(p.excluded_ingredients.length){
  let ingredients:unknown=recipe.ingredients;
  if(typeof ingredients==="string"){try{ingredients=JSON.parse(ingredients)}catch{return false}}
  if(!Array.isArray(ingredients)||!ingredients.length)return false;
  const all=ingredients.map(x=>typeof x==="string"?x:typeof x==="object"&&x&&"name" in x?String(x.name):"").join(" ").toLowerCase();
  if(!all.trim()||p.excluded_ingredients.some(x=>all.includes(x.toLowerCase())))return false;
 }
 return true;
}
export async function searchApiNinjasRecipe(title:string):Promise<unknown[]>{
 if(process.env.API_NINJAS_COMMERCIAL_LICENSE_APPROVED!=="true")throw Error("API Ninjas commercial recipe license is not enabled");
 const key=process.env.API_NINJAS_KEY;
 if(!key)throw Error("API Ninjas key is not configured");
 const url=new URL("https://api.api-ninjas.com/v3/recipe");
 url.searchParams.set("title",title);
 const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),12000);
 try{
  const r=await fetch(url,{headers:{"X-Api-Key":key},signal:ac.signal});
  if(!r.ok)throw Error("API Ninjas request unavailable ("+r.status+")");
  const data=await r.json();
  return Array.isArray(data)?data.slice(0,10):[];
 }finally{clearTimeout(timer)}
}
