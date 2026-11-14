import "dotenv/config";
import {config as loadDotenv} from "dotenv";
import {existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import express,{type Request,type Response,type NextFunction} from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {OAuth2Client} from "google-auth-library";
import {createCipheriv,createDecipheriv,randomBytes,createHash,timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {supabaseRecipeAction} from "./recipe-store.js";
import {recordPushTicket,pollPushReceipts} from "./push-delivery.js";
import {chooseDigest,localClock,isValidTimezone} from "./schedule.js";
import {isOn,scheduleDecision,deliveryKey,nextDigestAt} from "./notification-policy.js";

// Local npm-workspace dev runs can inherit stale root-level env vars.
// Prefer the API's own .env for local development. Render/production remains env-driven.
const localEnvPath=fileURLToPath(new URL("../.env",import.meta.url));
if(process.env.NODE_ENV!=="production"&&existsSync(localEnvPath)){
 loadDotenv({path:localEnvPath,override:true});
}
const required=["GOOGLE_CLIENT_IDS","APPS_SCRIPT_URL","APPS_SCRIPT_SHARED_SECRET"];
for(const key of required) if(!process.env[key]) throw new Error("Missing configuration: "+key);
const oauthClient=new OAuth2Client();
const allowedClients=Array.from(new Set([...(process.env.GOOGLE_CLIENT_IDS||"").split(","),process.env.GOOGLE_ADMIN_WEB_CLIENT_ID||"",process.env.GOOGLE_IOS_CLIENT_ID||""].map(s=>s.trim()).filter(Boolean)));
const adminEmails=new Set((process.env.ADMIN_GOOGLE_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean));
const app=express();app.disable("x-powered-by");app.set("trust proxy","loopback");app.use(express.json({limit:"64kb"}));
const allowedOrigins=Array.from(new Set([...(process.env.ALLOWED_ORIGIN||"").split(","),process.env.GOOGLE_ADMIN_ORIGIN||"",...(process.env.PUBLIC_WEB_ORIGINS||"").split(",")].map(s=>s.trim()).filter(Boolean)));
app.use(cors({origin:allowedOrigins.length?allowedOrigins:false}));
console.log("Good Side API CORS configured for",allowedOrigins.length,"origin(s)");
app.use(rateLimit({windowMs:60000,limit:90,standardHeaders:"draft-7",legacyHeaders:false}));
const configuredSound=String(process.env.PUSH_SOUND_NAME||"");
const pushSound=/^[a-z0-9_-]+\\.(wav|caf|aiff)$/i.test(configuredSound)?configuredSound:"default";
const encryptionKey=process.env.PUSH_TOKEN_ENCRYPTION_KEY_BASE64?Buffer.from(process.env.PUSH_TOKEN_ENCRYPTION_KEY_BASE64,"base64"):null;
type Authed=Request & {uid?:string;email?:string;admin?:boolean};
const asyncRoute=(fn:(req:Authed,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(fn(req as Authed,res)).catch(next);
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
async function identity(req:Authed,res:Response,next:NextFunction){
 const token=req.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return void res.status(401).json({error:"Sign in required"});
 try{
  // Supabase access tokens are verified against the Auth server, never decoded/trusted locally.
  // Admin access is deliberately Google-only regardless of the account email.
  let claimedIssuer="";
  try{claimedIssuer=JSON.parse(Buffer.from(token.split(".")[1]||"","base64url").toString("utf8")).iss||""}catch{}
  if(claimedIssuer===process.env.SUPABASE_AUTH_URL+"/auth/v1"&&process.env.SUPABASE_PUBLISHABLE_KEY){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   try{
    const response=await fetch(process.env.SUPABASE_AUTH_URL+"/auth/v1/user",{
     headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+token},signal:controller.signal
    });
    if(response.ok){
     const user=await response.json() as {id?:string;email?:string;email_confirmed_at?:string;confirmed_at?:string};
     if(user.id&&user.email&&(user.email_confirmed_at||user.confirmed_at)){
      req.uid="supabase:"+user.id;req.email=user.email;req.admin=false;
      return next();
     }
    }
   }finally{clearTimeout(timer)}
  }
  const ticket=await oauthClient.verifyIdToken({idToken:token,audience:allowedClients});
  const user=ticket.getPayload();
  if(!user?.sub||!user.email||!user.email_verified)return void res.status(401).json({error:"Verified Google account required"});
  req.uid="google:"+user.sub;req.email=user.email;
  req.admin=adminEmails.has(user.email.toLowerCase());
  next();
 }catch{res.status(401).json({error:"Sign-in session expired or invalid. Sign in again."});}
}

function encrypt(value:string){if(!encryptionKey||encryptionKey.length!==32)throw Error("Push encryption key not configured");const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",encryptionKey,iv);const result=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),result]).toString("base64");}
function decrypt(value:string){if(!encryptionKey||encryptionKey.length!==32)throw Error("Push encryption key not configured");const buf=Buffer.from(value,"base64");const dec=createDecipheriv("aes-256-gcm",encryptionKey,buf.subarray(0,12));dec.setAuthTag(buf.subarray(12,28));return Buffer.concat([dec.update(buf.subarray(28)),dec.final()]).toString("utf8");}
async function sheet(action:string,payload:Record<string,unknown>={}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{const reply=await fetch(process.env.APPS_SCRIPT_URL!,{method:"POST",headers:{"content-type":"text/plain;charset=utf-8"},body:JSON.stringify({secret:process.env.APPS_SCRIPT_SHARED_SECRET,action,payload}),signal:controller.signal,redirect:"follow"});if(!reply.ok)throw Error("Database unavailable");const out=await reply.json() as {ok:boolean;data?:any;error?:string};if(!out.ok)throw Error(out.error||"Database error");return out.data;}finally{clearTimeout(timer);}
}
// Until RECIPE_STORE=supabase is set on the backend, existing Google Sheets
// recipes remain available. Other app data continues using the existing gateway.
async function recipeStore(action:"listRecipes"|"getRecipe"|"upsertRecipe",payload:Record<string,unknown>={}){
 return process.env.RECIPE_STORE==="supabase"
  ?supabaseRecipeAction(action,payload)
  :sheet(action,payload);
}
const profile=z.object({display_name:z.string().trim().min(1).max(80).optional(),preferred_language:z.enum(["en","pt","es"]).optional(),timezone:z.string().refine(isValidTimezone).optional(),avatar_id:z.string().max(80).optional()});
const hhmm=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const prefs=z.object({
 notification_frequency:z.enum(["daily","twice_daily","three_daily","selected_weekdays","breaking_only","digest_plus_alerts"]).optional(),
 notification_times:z.array(hhmm).min(1).max(3).refine(v=>new Set(v).size===v.length).optional(),
 notification_timezone:z.string().refine(isValidTimezone).optional(),
 notification_weekdays:z.array(z.number().int().min(0).max(6)).max(7).optional(),
 quiet_hours_start:z.union([hhmm,z.literal("")]).optional(),quiet_hours_end:z.union([hhmm,z.literal("")]).optional(),
 weekend_enabled:z.boolean().optional(),food_notifications_enabled:z.boolean().optional(),
 breaking_alerts_enabled:z.boolean().optional(),notification_sound_enabled:z.boolean().optional(),
 selected_categories:z.array(z.string().min(1).max(80)).max(30).optional(),preferred_countries:z.array(z.string().max(2)).max(30).optional(),notification_enabled:z.boolean().optional(),notification_local_time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),daily_digest_enabled:z.boolean().optional(),content_language:z.enum(["en","pt","es"]).optional()});
const newsQuery=z.object({category:z.string().max(80).optional(),q:z.string().max(120).optional(),language:z.string().max(5).optional(),country:z.string().max(2).optional(),page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)});
const send=(res:Response,p:unknown)=>res.json({ok:true,data:p});
app.get("/health",(_req,res)=>res.json({status:"ok"}));
// Read-only connectivity probe. Never exposes Supabase credentials or unpublished recipes.
app.get("/health/recipes",asyncRoute(async(_req,res)=>{
 const items=await recipeStore("listRecipes");
 res.json({status:"ok",store:process.env.RECIPE_STORE==="supabase"?"supabase":"legacy",published_recipes:Array.isArray(items)?items.length:0});
}));
// Read-only deployment readiness signal; does not expose credentials or user records.
app.get("/health/delivery",asyncRoute(async(_req,res)=>{
 const scheduler=process.env.ENABLE_PUSH_SCHEDULER==="true";
 const encryptionReady=Boolean(encryptionKey&&encryptionKey.length===32);
 let approvedNews=0,newsGatewayReady=false;
 try{
  const items=await sheet("listNews",{limit:100,page:1});
  approvedNews=(items?.items||[]).filter((r:any)=>r.approval_status==="approved").length;
  newsGatewayReady=true;
 }catch{}
 res.json({status:scheduler&&encryptionReady&&newsGatewayReady?"configured":"action_required",
  scheduler_enabled:scheduler,token_encryption_ready:encryptionReady,news_gateway_ready:newsGatewayReady,
  approved_news_available:approvedNews,
  device_delivery_verified:false,
  note:"Configuration status is not proof of device delivery; production push tickets and receipts require a signed iOS build."});
}));
app.get("/news",asyncRoute(async(req,res)=>send(res,await sheet("listNews",newsQuery.parse(req.query)))));

/** Live discovery only: RSS links are external Google News results, never automatically approved content. */
const liveNewsCache=new Map<string,{at:number;items:Array<{title:string;url:string;publisher:string;published_at:string}>}>();
const xmlText=(value:string)=>value.replace("<![CDATA[","").replace("]]>","").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();
app.get("/news/search-live",asyncRoute(async(req,res)=>{
 const q=z.string().trim().min(2).max(100).parse(req.query.q);
 const cacheKey=q.toLocaleLowerCase("en");
 const cached=liveNewsCache.get(cacheKey);
 if(cached&&Date.now()-cached.at<600000)return send(res,{items:cached.items,source:"Google News RSS",cached:true});
 const query=q+" (progress OR breakthrough OR positive OR inspiring OR kindness)";
 const rssUrl="https://news.google.com/rss/search?"+new URLSearchParams({q:query,hl:"en-US",gl:"US",ceid:"US:en"}).toString();
 const response=await fetch(rssUrl,{headers:{"user-agent":"TheGoodSideNews/1.0 (news discovery)","accept":"application/rss+xml,application/xml,text/xml"},signal:AbortSignal.timeout(8500)});
 if(!response.ok)throw Error("Live news search unavailable");
 const xml=(await response.text()).slice(0,500000);
 const items=xml.split("<item>").slice(1,21).map(fragment=>{
  const part=fragment.split("</item>")[0];
  const field=(name:string)=>xmlText(part.match(new RegExp("<"+name+"[^>]*>([^]*?)</"+name+">"))?.[1]||"");
  const title=field("title");
  const url=field("link");
  const publisher=field("source")||"External news source";
  const published_at=field("pubDate");
  return {title,url,publisher,published_at};
 }).filter(item=>{
  try{const u=new URL(item.url);return item.title.length>5&&u.protocol==="https:"&&["news.google.com","www.google.com"].includes(u.hostname)}catch{return false}
 });
 liveNewsCache.set(cacheKey,{at:Date.now(),items});
 if(liveNewsCache.size>150)liveNewsCache.delete(liveNewsCache.keys().next().value!);
 send(res,{items,source:"Google News RSS",cached:false,notice:"External results are not editorially approved or hosted by The Good Side"});
}));

app.get("/news/:id",asyncRoute(async(req,res)=>send(res,await sheet("getNews",{news_id:req.params.id}))));
app.get("/avatars",asyncRoute(async(_req,res)=>send(res,await sheet("listAvatars"))));
app.get("/recipes",asyncRoute(async(req,res)=>send(res,await recipeStore("listRecipes"))));
app.get("/recipes/:id",asyncRoute(async(req,res)=>send(res,await recipeStore("getRecipe",{recipe_id:req.params.id}))));
app.use("/me",identity);
app.get("/me",asyncRoute(async(req,res)=>send(res,await sheet("getUser",{user_id:req.uid}))));
app.post("/me",asyncRoute(async(req,res)=>send(res,await sheet("syncUser",{user_id:req.uid,email:req.email||"",...profile.parse(req.body)}))));
app.put("/me",asyncRoute(async(req,res)=>send(res,await sheet("updateUser",{user_id:req.uid,...profile.parse(req.body)}))));
app.get("/me/preferences",asyncRoute(async(req,res)=>send(res,await sheet("getPreferences",{user_id:req.uid}))));
// Personalized feed: never replace a reader's selected topics with unrelated articles.
app.get("/me/news",asyncRoute(async(req,res)=>{
 const pref=await sheet("getPreferences",{user_id:req.uid});
 const raw=pref?.selected_categories;
 const selected=Array.isArray(raw)?raw.map(String):typeof raw==="string"?raw.split(",").map(x=>x.trim()).filter(Boolean):[];
 const interests=new Set(selected.map(x=>x.toLowerCase()));
 const all=await sheet("listNews",{limit:50,page:1});
 const approved=(all?.items||[]) as Array<{news_id:string;category:string;source_published_at:string}>;
 const filtered=interests.size?approved.filter(item=>interests.has(String(item.category||"").toLowerCase())):approved;
 const requested=z.coerce.number().int().min(1).max(50).default(30).parse(req.query.limit);
 send(res,{items:filtered.slice(0,requested),selected_categories:selected,personalized:interests.size>0,matched:filtered.length});
}));

app.get("/me/next-notification",asyncRoute(async(req,res)=>{const pref=await sheet("getPreferences",{user_id:req.uid});const user=await sheet("getUser",{user_id:req.uid});const zone=pref.notification_timezone||user?.timezone||"UTC";const at=nextDigestAt(new Date(),{...pref,timezone:zone});send(res,{next_at:at?at.toISOString():null,timezone:zone});}));
app.put("/me/preferences",asyncRoute(async(req,res)=>send(res,await sheet("setPreferences",{user_id:req.uid,...prefs.parse(req.body)}))));
app.get("/me/saved",asyncRoute(async(req,res)=>send(res,await sheet("listSaved",{user_id:req.uid}))));
app.post("/me/saved/:id",asyncRoute(async(req,res)=>send(res,await sheet("saveNews",{user_id:req.uid,news_id:req.params.id}))));
app.delete("/me/saved/:id",asyncRoute(async(req,res)=>send(res,await sheet("unsaveNews",{user_id:req.uid,news_id:req.params.id}))));
app.get("/me/recipes",asyncRoute(async(req,res)=>send(res,await sheet("listSavedRecipes",{user_id:req.uid}))));
app.post("/me/recipes/:id",asyncRoute(async(req,res)=>send(res,await sheet("saveRecipe",{user_id:req.uid,recipe_id:req.params.id}))));
app.delete("/me/recipes/:id",asyncRoute(async(req,res)=>send(res,await sheet("unsaveRecipe",{user_id:req.uid,recipe_id:req.params.id}))));
app.get("/me/notifications",asyncRoute(async(req,res)=>send(res,await sheet("listNotifications",{user_id:req.uid}))));
app.post("/me/device",asyncRoute(async(req,res)=>{const body=z.object({device_id:z.string().max(128),platform:z.enum(["ios","android"]),token:z.string().startsWith("ExponentPushToken[").max(250)}).parse(req.body);send(res,await sheet("registerDevice",{...body,user_id:req.uid,push_token_reference:encrypt(body.token),token:undefined}));}));
app.delete("/me",asyncRoute(async(req,res)=>{
 const isEmail=req.uid?.startsWith("supabase:");
 const token=req.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(isEmail&&(!process.env.SUPABASE_AUTH_URL||!token))return res.status(503).json({error:"Email account deletion is temporarily unavailable"});
 await sheet("deleteUser",{user_id:req.uid});
 if(isEmail){
  const response=await fetch(process.env.SUPABASE_AUTH_URL+"/functions/v1/goodside-admin?route=my-account",{
   method:"DELETE",headers:{Authorization:"Bearer "+token}
  });
  if(!response.ok)throw Error("The profile was cleared, but the email identity deletion needs support assistance. Please contact support.");
 }
 send(res,{deleted:true,google_account_unchanged:!isEmail});
}));
app.use("/admin",identity,(req:Authed,res,next)=>req.admin?next():res.status(403).json({error:"Admin only"}));
const recipePayload=z.object({
 recipe_id:z.string().max(128).optional(),title:z.string().min(3).max(200),
 description:z.string().max(1200).default(""),prep_minutes:z.number().int().min(0).max(1440),
 cook_minutes:z.number().int().min(0).max(1440),servings:z.number().int().min(1).max(100),
 ingredients:z.array(z.string().min(1).max(500)).min(1).max(80),
 instructions:z.array(z.string().min(1).max(500)).min(1).max(80),
 dietary_tags:z.string().max(200).default(""),source_name:z.string().min(2).max(150),
 source_url:z.string().url().startsWith("https://"),image_url:z.string().url().startsWith("https://"),
 image_license:z.string().max(150).default(""),language:z.enum(["en","pt","es"]).default("en"),
 approval_status:z.enum(["pending","approved"]).default("pending")
});
// Ollama handles editorial accept/reject without manual approval.
// Publishing with third-party recipe artwork requires verified production
// subscription AND image rights. AI quality is NOT an image license.
app.post("/worker/recipe-candidates",asyncRoute(async(req,res)=>{
 const key=req.get("x-worker-key")||"";
 if(!process.env.RESEARCH_WORKER_KEY||!safeEqual(key,process.env.RESEARCH_WORKER_KEY))
  return res.status(403).json({error:"Unauthorized"});
 const item=recipePayload.extend({
  recipe_id:z.string().regex(/^mealdb-\d{3,9}$/),
  source_name:z.literal("TheMealDB"),
  image_url:z.string().url(),
  approval_status:z.literal("approved"),
  quality_score:z.number().int().min(85).max(100)
 }).parse(req.body);
 if(process.env.RECIPE_PROVIDER_RELEASE_AUTHORIZED!=="true"||process.env.RECIPE_IMAGE_RIGHTS_CONFIRMED!=="true")
  return res.status(409).json({error:"Publication blocked until TheMealDB production/supporter and image rights are confirmed"});
 const source=new URL(item.source_url),image=new URL(item.image_url);
 if(source.protocol!=="https:"||source.hostname!=="www.themealdb.com"||
    !source.pathname.endsWith("/"+item.recipe_id.slice(7))||
    image.protocol!=="https:"||!["www.themealdb.com","themealdb.com"].includes(image.hostname)||
    !image.pathname.startsWith("/images/media/meals/")||
    source.username||source.password||image.username||image.password)
  return res.status(422).json({error:"Verified TheMealDB HTTPS recipe source and image URL required"});
 if(item.prep_minutes<1||item.cook_minutes<1||item.ingredients.length<3||item.instructions.length<3||!item.description.trim()||
    item.instructions.some(step=>step.trim().length<12))
  return res.status(422).json({error:"Ollama recipe completeness or quality check failed"});
 const existing=await recipeStore("getRecipe",{recipe_id:item.recipe_id});
 if(existing)return send(res,{status:"already_approved",recipe_id:item.recipe_id});
 const result=await recipeStore("upsertRecipe",{
  ...item,approval_status:"approved",
  image_license:"TheMealDB supporter content; original source attributed",
  actor_id:"ollama-recipe-worker"
 });
 send(res,{status:"approved",recipe_id:result.recipe_id,auto_approved_by:"ollama",human_approval_required:false});
}));
app.post("/admin/recipes",asyncRoute(async(req,res)=>send(res,await recipeStore("upsertRecipe",{...recipePayload.parse(req.body),actor_id:req.uid}))));
app.get("/admin/stats",asyncRoute(async(req,res)=>send(res,await sheet("stats"))));
app.get("/admin/pending",asyncRoute(async(req,res)=>send(res,await sheet("listPending"))));
app.post("/admin/news",asyncRoute(async(req,res)=>send(res,await sheet("addNews",{...req.body,actor_id:req.uid}))));
app.patch("/admin/news/:id",asyncRoute(async(req,res)=>send(res,await sheet("editNews",{...req.body,news_id:req.params.id,actor_id:req.uid}))));
app.post("/admin/news/:id/status",asyncRoute(async(req,res)=>{const body=z.object({status:z.enum(["approved","rejected","pending"])}).parse(req.body);send(res,await sheet("setNewsStatus",{news_id:req.params.id,status:body.status,actor_id:req.uid}));}));
app.get("/admin/broadcast/preview",asyncRoute(async(req,res)=>{
 const body=z.object({news_id:z.string().min(1).max(128),audience:z.enum(["all","matching"]).default("matching")}).parse(req.query);
 const story=await sheet("adminGetNews",{news_id:body.news_id});
 if(!story||story.approval_status!=="approved"||!story.original_url||!/^https:\/\//i.test(story.original_url))return res.status(409).json({error:"Only approved articles with a valid original source can be sent"});
 const preview=await sheet("broadcastPreview",body);send(res,{...preview,story:{news_id:story.news_id,title:story.title,publisher:story.publisher,original_url:story.original_url}});
}));
app.post("/admin/broadcast/send",asyncRoute(async(req,res)=>{
 const body=z.object({news_id:z.string().min(1).max(128),audience:z.enum(["all","matching"]),confirmation:z.literal("SEND"),request_id:z.string().uuid()}).parse(req.body);
 const story=await sheet("adminGetNews",{news_id:body.news_id});
 if(!story||story.approval_status!=="approved"||!/^https:\/\//i.test(story.original_url||"")||!story.publisher)return res.status(409).json({error:"Approval, publisher and original HTTPS source required"});
 if(!encryptionKey||encryptionKey.length!==32)return res.status(503).json({error:"Push service encryption is not configured"});
 const recipients=await sheet("broadcastRecipients",{news_id:body.news_id,audience:body.audience,request_id:body.request_id,limit:75});
 let accepted=0,failed=0,attempted=0;
 for(const d of recipients.devices||[]){
  const key="manual:"+body.request_id+":"+d.device_id;
  // Claim before sending to prevent double sends if a client retries.
  const claim=await sheet("claimNotification",{notification_id:crypto.randomUUID(),user_id:d.user_id,news_id:body.news_id,scheduled_at:new Date().toISOString(),delivery_status:"pending",idempotency_key:key});
  if(claim?.duplicate)continue;
  attempted++;
  try{
   const token=decrypt(d.push_token_reference);
   const push=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({to:token,title:"â˜€ï¸ The Good Side",body:story.title.slice(0,150),data:{news_id:story.news_id,original_url:story.original_url,sound_enabled:d.sound_enabled},sound:d.sound_enabled?pushSound:null})});
   const result=await push.json() as any;
   const ticket=result?.data;
   const ok=push.ok&&ticket?.status==="ok";
   if(ok&&ticket?.id)await recordPushTicket(String(ticket.id),key,d.user_id,d.device_id);
   await sheet("updateNotificationByKey",{idempotency_key:key,delivery_status:ok?"accepted":"error",sent_at:new Date().toISOString(),error_code:ticket?.details?.error||(!push.ok?"push_http_"+push.status:"")});
   if(ticket?.details?.error==="DeviceNotRegistered")await sheet("disableDevice",{device_id:d.device_id,user_id:d.user_id});
   ok?accepted++:failed++;
  }catch(e){
   failed++;
   try{await sheet("updateNotificationByKey",{idempotency_key:key,delivery_status:"error",sent_at:new Date().toISOString(),error_code:"push_request_failed"})}catch{}
  }
 }
 send(res,{request_id:body.request_id,attempted,accepted_by_push_service:accepted,failed,remaining_eligible:recipients.remaining_eligible||0,note:"Accepted is not confirmation of handset delivery. Limit is 75 eligible devices per request."});
}));
app.get("/admin/broadcast/history",asyncRoute(async(req,res)=>send(res,await sheet("broadcastHistory",{limit:100}))));
app.get("/admin/sources",asyncRoute(async(req,res)=>send(res,await sheet("listSources"))));
app.post("/admin/sources",asyncRoute(async(req,res)=>send(res,await sheet("upsertSource",{...req.body,actor_id:req.uid}))));
// Google News discovery is strictly editorial review only. Never auto-approve these leads.
// The Google RSS URL is not a publisher original URL and is deliberately refused here.
app.post("/worker/discover",asyncRoute(async(req,res)=>{
 const key=req.get("x-worker-key")||"";
 if(!process.env.RESEARCH_WORKER_KEY||!safeEqual(key,process.env.RESEARCH_WORKER_KEY))return res.status(403).json({error:"Unauthorized"});
 const story=z.object({
  title:z.string().trim().min(15).max(300),summary:z.string().trim().min(25).max(1200),
  original_url:z.string().url().startsWith("https://"),publisher:z.string().trim().min(2).max(100),
  category:z.string().trim().min(2).max(80),
  source_published_at:z.string().datetime(),
  content_hash:z.string().min(32).max(128),
  confidence_score:z.number().min(70).max(100),positivity_score:z.number().min(70).max(100),
  language:z.literal("en")
 }).strict().parse(req.body);
 const url=new URL(story.original_url);
 // A verified original publisher URL is required, and only curated domains are allowed.
 const domains=["positive.news","goodnewsnetwork.org","optimistdaily.com",
  "reasonstobecheerful.world","goodgoodgood.co","nicenews.com"];
 const trusted=domains.some(host=>url.hostname===host||url.hostname.endsWith("."+host));
 if(!trusted||url.username||url.password||!/^https:$/.test(url.protocol))
  return res.status(422).json({error:"Verified publisher URL required; Google News redirects cannot be published"});
 const publishedAt=Date.parse(story.source_published_at);
 if(!Number.isFinite(publishedAt)||publishedAt>Date.now()+86400000||publishedAt<Date.now()-14*86400000)
  return res.status(422).json({error:"Discovery outside the 14-day editorial window"});
 const saved=await sheet("addNews",{
  ...story,news_id:createHash("sha256").update(story.original_url).digest("hex").slice(0,24),
  full_summary:story.summary,approval_status:"pending",actor_id:"google-news-rss-review"
 });
 send(res,{...saved,status:"pending",requires_human_approval:true});
}));

// Only authenticated research-worker submissions from the trusted pilot source may auto-publish.
// Stories failing provenance, language or scoring checks never enter the public feed.
app.post("/worker/candidates",asyncRoute(async(req,res)=>{
 const key=req.get("x-worker-key")||"";
 if(!process.env.RESEARCH_WORKER_KEY||!safeEqual(key,process.env.RESEARCH_WORKER_KEY))return res.status(403).json({error:"Unauthorized"});
 const story=z.object({
  news_id:z.string().min(1).max(128),title:z.string().trim().min(15).max(300),
  summary:z.string().trim().min(25).max(1200),full_summary:z.string().trim().min(25).max(5000),
  category:z.string().min(1).max(80),publisher:z.string().min(1).max(100),
  original_url:z.string().url(),source_published_at:z.string(),
  content_hash:z.string().min(1).max(128),
  confidence_score:z.number().min(0).max(100),positivity_score:z.number().min(0).max(100),
  language:z.string().default("en"),country:z.string().default(""),image_url:z.string().default("")
 }).parse(req.body);
 const url=new URL(story.original_url);
 // Only original official-government reporting is eligible for automatic publication.
 // Commercial news feeds are discovery-only unless redistribution rights are verified.
 const hostname=url.hostname.toLowerCase().replace(/^www\./,"");
 const publisher=story.publisher.trim().toLowerCase();
 const officialSource:Record<string,string[]>={
  "nasa":["nasa.gov"],
  "noaa":["noaa.gov"],
  "usgs":["usgs.gov"],
  "nih":["nih.gov"]
 };
 const domains=officialSource[publisher]||[];
 const trusted=url.protocol==="https:"&&!url.username&&!url.password
  &&domains.some(domain=>hostname===domain||hostname.endsWith("."+domain));
 const quality=story.language==="en" && !/[\u3400-\u9fff]/u.test(story.title+" "+story.summary)
  &&story.confidence_score>=60 && story.positivity_score>=70
  &&Number.isFinite(Date.parse(story.source_published_at))
  &&Date.parse(story.source_published_at)<=Date.now()+86400000
  &&Date.parse(story.source_published_at)>=Date.now()-14*86400000
  // Do not auto-publish third-party photos or remotely hosted imagery.
  &&story.image_url==="";
 if(!trusted||!quality)return res.status(422).json({error:"Story does not meet automatic-publication requirements"});
 const record=await sheet("addNews",{...story,approval_status:"pending",actor_id:"research-worker"});
 // Respect existing approved/rejected rows; don't reverse explicit editorial decisions.
 if(record?.duplicate){
  const existing=await sheet("adminGetNews",{news_id:record.news_id});
  if(existing?.approval_status==="rejected")return send(res,{...record,approval:"rejected"});
  if(existing?.approval_status==="approved")return send(res,{...record,approval:"already_approved"});
 }
 const published=await sheet("setNewsStatus",{news_id:record.news_id,status:"approved",actor_id:"ollama-auto-editor"});
 send(res,{...record,approval:published.status});
}));
let digestRunning=false;
async function digestTick(){
 if(process.env.ENABLE_PUSH_SCHEDULER!=="true"||digestRunning)return;
 digestRunning=true;
 try {
  const users=await sheet("digestUsers");const now=new Date();
  // A fresh eligibility decision is made for each user and each due slot.
  for(const user of (users||[]) as any[]){
   try {
    const decision=scheduleDecision(now,user,"digest");
    if(!decision.due)continue;
    const devices=await sheet("listDevices",{user_id:user.user_id});
    if(!devices?.length)continue;
    const news=await sheet("listNews",{limit:50,page:1});
    const seen=await sheet("digestSeen",{user_id:user.user_id,date:decision.date});
    const already=new Set<string>(seen?.news_ids||[]);
    const selected=String(user.selected_categories||"").split(",").filter(Boolean);
    const foodEnabled=isOn(user.food_notifications_enabled);
    // Recipes share the user's existing delivery slots, never creating an extra alert.
    // Food is stored in Supabase, not the legacy Sheets recipe table.
    // Keep good news as the first daily notification; when opted into 2+ slots,
    // use later slots for a recipe. On quiet news days, a recipe is a fallback.
    const recipePool=foodEnabled?await recipeStore("listRecipes"):[];
    const recipe=Array.isArray(recipePool)
      ?recipePool.find((r:any)=>r?.approval_status==="approved"&&!already.has("recipe:"+r.recipe_id)):null;
    const article=chooseDigest(news.items||[],selected,already);
    const userTimes=String(user.notification_times||"");
    let parsedTimes:string[]=[];
    try{const v=JSON.parse(userTimes);if(Array.isArray(v))parsedTimes=v.filter(x=>typeof x==="string").sort()}catch{}
    const laterSlot=parsedTimes.length>1&&decision.time!==parsedTimes[0];
    const chooseFood=Boolean(foodEnabled&&recipe&&(!article||laterSlot));
    const chosen=chooseFood
      ?{news_id:"recipe:"+recipe.recipe_id,title:recipe.title,original_url:recipe.source_url}
      :article;
    if(!chosen)continue;
    for(const d of devices) {
     if(!isOn(d.enabled))continue;
     const key=deliveryKey(user.user_id,decision.date,decision.time,d.device_id);
     const claim=await sheet("claimNotification",{notification_id:crypto.randomUUID(),user_id:user.user_id,news_id:chosen.news_id,scheduled_at:now.toISOString(),delivery_status:"pending",idempotency_key:key});
     if(claim?.duplicate)continue;
     try {
      const token=decrypt(d.push_token_reference);
      const resp=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({to:token,title:"The Good Side",body:chosen.title,data:chooseFood?{recipe_id:recipe.recipe_id,sound_enabled:isOn(user.notification_sound_enabled)||user.notification_sound_enabled===undefined}:{news_id:chosen.news_id,sound_enabled:isOn(user.notification_sound_enabled)||user.notification_sound_enabled===undefined},sound:isOn(user.notification_sound_enabled)||user.notification_sound_enabled===undefined?pushSound:null})});
      const result=await resp.json() as any;const ticket=Array.isArray(result?.data)?result.data[0]:result?.data;
      if(resp.ok&&ticket?.status==="ok"&&ticket?.id)await recordPushTicket(String(ticket.id),key,user.user_id,d.device_id);
      await sheet("updateNotificationByKey",{idempotency_key:key,delivery_status:resp.ok&&ticket?.status==="ok"?"accepted":"error",sent_at:new Date().toISOString(),error_code:ticket?.details?.error||(!resp.ok?"push_http_"+resp.status:"")});
      if(ticket?.details?.error==="DeviceNotRegistered")await sheet("disableDevice",{device_id:d.device_id,user_id:user.user_id});
     }catch(error){
      console.error("Push send failed",error instanceof Error?error.message:"unknown");
      await sheet("updateNotificationByKey",{idempotency_key:key,delivery_status:"error",error_code:"push_request_failed"}).catch(()=>{});
     }
    }
   }catch(error){console.error("Digest user failed",error instanceof Error?error.message:"unknown");}
  }
 }finally{digestRunning=false;}
}
// Expo tickets require a second receipt check to confirm APNs/FCM handoff.
async function receiptTick(){
 if(process.env.ENABLE_PUSH_SCHEDULER!=="true"||process.env.RECIPE_STORE!=="supabase")return;
 try{
  await pollPushReceipts(async(row,status,errorCode)=>{
   await sheet("updateNotificationByKey",{
    idempotency_key:row.idempotency_key,
    delivery_status:status,
    sent_at:new Date().toISOString(),
    error_code:errorCode
   });
   if(errorCode==="DeviceNotRegistered")await sheet("disableDevice",{user_id:row.user_id,device_id:row.device_id});
  });
 }catch(e){console.error("[push] Receipt poll failed",e instanceof Error?e.message:"unknown")}
}
if(process.env.ENABLE_PUSH_SCHEDULER==="true"){
 setInterval(()=>digestTick().catch(console.error),60000);
 digestTick().catch(console.error);
 setInterval(()=>receiptTick().catch(console.error),120000);
 receiptTick().catch(console.error);
}
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(error instanceof z.ZodError){const fields=Array.from(new Set(error.issues.map(issue=>String(issue.path[0]||"preferences"))));return res.status(400).json({error:"Invalid settings: "+fields.join(", "),details:error.flatten()});}console.error(error);res.status(503).json({error:"Request could not be completed"})});
app.listen(Number(process.env.PORT||8788),()=>{
 console.log("The Good Side API listening");
 // Smoke-test the currently configured recipe backend at deployment time.
 // No credentials, recipe content, or user details are logged.
 void recipeStore("listRecipes").then(items=>{
  console.log("[recipes] storage_ready",JSON.stringify({store:process.env.RECIPE_STORE==="supabase"?"supabase":"legacy",published:Array.isArray(items)?items.length:0}));
 }).catch(error=>{
  console.error("[recipes] storage_unavailable",error instanceof Error?error.message.replace(/(sb_secret_|eyJ)[^\\s\\"]+/g,"[redacted]"):"unknown");
 });
});
