import "dotenv/config";
import express,{type Request,type Response,type NextFunction} from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {initializeApp,applicationDefault,getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {createCipheriv,createDecipheriv,randomBytes,createHash,timingSafeEqual} from "node:crypto";
import {z} from "zod";
import {chooseDigest,localClock,isValidTimezone} from "./schedule.js";

const required=["FIREBASE_PROJECT_ID","APPS_SCRIPT_URL","APPS_SCRIPT_SHARED_SECRET"];
for(const key of required) if(!process.env[key]) throw new Error("Missing configuration: "+key);
if(!getApps().length) initializeApp({credential:applicationDefault(),projectId:process.env.FIREBASE_PROJECT_ID});
const app=express();app.disable("x-powered-by");app.use(express.json({limit:"64kb"}));
app.use(cors({origin:process.env.ALLOWED_ORIGIN?.split(",").filter(Boolean)||false}));
app.use(rateLimit({windowMs:60000,limit:90,standardHeaders:"draft-7",legacyHeaders:false}));
const encryptionKey=process.env.PUSH_TOKEN_ENCRYPTION_KEY_BASE64?Buffer.from(process.env.PUSH_TOKEN_ENCRYPTION_KEY_BASE64,"base64"):null;
type Authed=Request & {uid?:string;email?:string;admin?:boolean};
const asyncRoute=(fn:(req:Authed,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>Promise.resolve(fn(req as Authed,res)).catch(next);
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
async function identity(req:Authed,res:Response,next:NextFunction){
  try{const token=req.get("authorization")?.match(/^Bearer (.+)$/)?.[1];if(!token)return void res.status(401).json({error:"Sign in required"});
  const user=await getAuth().verifyIdToken(token,true);req.uid=user.uid;req.email=user.email;req.admin=user.admin===true;next();
  }catch{res.status(401).json({error:"Session expired or invalid"});}
}
function encrypt(value:string){if(!encryptionKey||encryptionKey.length!==32)throw Error("Push encryption key not configured");const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",encryptionKey,iv);const result=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),result]).toString("base64");}
function decrypt(value:string){if(!encryptionKey||encryptionKey.length!==32)throw Error("Push encryption key not configured");const buf=Buffer.from(value,"base64");const dec=createDecipheriv("aes-256-gcm",encryptionKey,buf.subarray(0,12));dec.setAuthTag(buf.subarray(12,28));return Buffer.concat([dec.update(buf.subarray(28)),dec.final()]).toString("utf8");}
async function sheet(action:string,payload:Record<string,unknown>={}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{const reply=await fetch(process.env.APPS_SCRIPT_URL!,{method:"POST",headers:{"content-type":"text/plain;charset=utf-8"},body:JSON.stringify({secret:process.env.APPS_SCRIPT_SHARED_SECRET,action,payload}),signal:controller.signal,redirect:"follow"});if(!reply.ok)throw Error("Database unavailable");const out=await reply.json() as {ok:boolean;data?:any;error?:string};if(!out.ok)throw Error(out.error||"Database error");return out.data;}finally{clearTimeout(timer);}
}
const profile=z.object({display_name:z.string().trim().min(1).max(80).optional(),preferred_language:z.enum(["en","pt","es"]).optional(),timezone:z.string().refine(isValidTimezone).optional()});
const prefs=z.object({selected_categories:z.array(z.string().min(1).max(80)).max(30).optional(),preferred_countries:z.array(z.string().max(2)).max(30).optional(),notification_enabled:z.boolean().optional(),notification_local_time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),daily_digest_enabled:z.boolean().optional(),content_language:z.enum(["en","pt","es"]).optional()});
const newsQuery=z.object({category:z.string().max(80).optional(),q:z.string().max(120).optional(),language:z.string().max(5).optional(),country:z.string().max(2).optional(),page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)});
const send=(res:Response,p:unknown)=>res.json({ok:true,data:p});
app.get("/health",(_req,res)=>res.json({status:"ok"}));
app.get("/news",asyncRoute(async(req,res)=>send(res,await sheet("listNews",newsQuery.parse(req.query)))));
app.get("/news/:id",asyncRoute(async(req,res)=>send(res,await sheet("getNews",{news_id:req.params.id}))));
app.use("/me",identity);
app.get("/me",asyncRoute(async(req,res)=>send(res,await sheet("getUser",{user_id:req.uid}))));
app.post("/me",asyncRoute(async(req,res)=>send(res,await sheet("syncUser",{user_id:req.uid,email:req.email||"",...profile.parse(req.body)}))));
app.put("/me",asyncRoute(async(req,res)=>send(res,await sheet("updateUser",{user_id:req.uid,...profile.parse(req.body)}))));
app.get("/me/preferences",asyncRoute(async(req,res)=>send(res,await sheet("getPreferences",{user_id:req.uid}))));
app.put("/me/preferences",asyncRoute(async(req,res)=>send(res,await sheet("setPreferences",{user_id:req.uid,...prefs.parse(req.body)}))));
app.get("/me/saved",asyncRoute(async(req,res)=>send(res,await sheet("listSaved",{user_id:req.uid}))));
app.post("/me/saved/:id",asyncRoute(async(req,res)=>send(res,await sheet("saveNews",{user_id:req.uid,news_id:req.params.id}))));
app.delete("/me/saved/:id",asyncRoute(async(req,res)=>send(res,await sheet("unsaveNews",{user_id:req.uid,news_id:req.params.id}))));
app.get("/me/notifications",asyncRoute(async(req,res)=>send(res,await sheet("listNotifications",{user_id:req.uid}))));
app.post("/me/device",asyncRoute(async(req,res)=>{const body=z.object({device_id:z.string().max(128),platform:z.enum(["ios","android"]),token:z.string().startsWith("ExponentPushToken[").max(250)}).parse(req.body);send(res,await sheet("registerDevice",{...body,user_id:req.uid,push_token_reference:encrypt(body.token),token:undefined}));}));
app.delete("/me",asyncRoute(async(req,res)=>{await sheet("deleteUser",{user_id:req.uid});await getAuth().deleteUser(req.uid!);send(res,{deleted:true})}));
app.use("/admin",identity,(req:Authed,res,next)=>req.admin?next():res.status(403).json({error:"Admin only"}));
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
   const push=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({to:token,title:"☀️ The Good Side",body:story.title.slice(0,150),data:{news_id:story.news_id,original_url:story.original_url},sound:"default"})});
   const result=await push.json() as any;
   const ticket=result?.data;
   const ok=push.ok&&ticket?.status==="ok";
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
app.post("/worker/candidates",asyncRoute(async(req,res)=>{const key=req.get("x-worker-key")||"";if(!process.env.RESEARCH_WORKER_KEY||!safeEqual(key,process.env.RESEARCH_WORKER_KEY))return res.status(403).json({error:"Unauthorized"});const story=z.object({news_id:z.string(),title:z.string().max(300),summary:z.string().max(1200),full_summary:z.string().max(5000),category:z.string(),publisher:z.string(),original_url:z.string().url(),source_published_at:z.string(),content_hash:z.string(),confidence_score:z.number().min(0).max(100),positivity_score:z.number().min(0).max(100),language:z.string().default("en"),country:z.string().default(""),image_url:z.string().default("")}).parse(req.body);send(res,await sheet("addNews",{...story,approval_status:"pending",actor_id:"research-worker"}));}));
async function digestTick(){
 if(process.env.ENABLE_PUSH_SCHEDULER!=="true")return;
 const users=await sheet("digestUsers"),news=await sheet("listNews",{limit:50,page:1});const now=new Date();
 for(const user of (users||[]) as any[]){try{
  if(!user.notification_enabled||!user.daily_digest_enabled||!isValidTimezone(user.timezone))continue;
  const local=localClock(now,user.timezone);if(local.time!==user.notification_local_time)continue;
  const key=user.user_id+":"+local.date;const sent=await sheet("digestSeen",{user_id:user.user_id,date:local.date});
  if(sent?.already_sent)continue;
  const chosen=chooseDigest(news.items||[],String(user.selected_categories||"").split(",").filter(Boolean),new Set(sent?.news_ids||[]));
  if(!chosen)continue;
  const devices=await sheet("listDevices",{user_id:user.user_id});let attempted=false;
  for(const d of devices||[]){if(!d.enabled)continue;attempted=true;const token=decrypt(d.push_token_reference);
   const resp=await fetch("https://exp.host/--/api/v2/push/send",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({to:token,title:"The Good Side",body:chosen.title,data:{news_id:chosen.news_id},sound:"default"})});
   const result=await resp.json() as any;const ticket=result?.data;await sheet("logNotification",{notification_id:crypto.randomUUID(),user_id:user.user_id,news_id:chosen.news_id,scheduled_at:now.toISOString(),sent_at:now.toISOString(),delivery_status:ticket?.status==="ok"?"accepted":"error",error_code:ticket?.details?.error||"",idempotency_key:key+":"+d.device_id});
   if(ticket?.details?.error==="DeviceNotRegistered")await sheet("disableDevice",{device_id:d.device_id,user_id:user.user_id});
  }
 }catch(e){console.error("Digest user failure",user.user_id,e instanceof Error?e.message:"unknown")}}
}
if(process.env.ENABLE_PUSH_SCHEDULER==="true"){setInterval(()=>digestTick().catch(console.error),60000);digestTick().catch(console.error);}
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(error instanceof z.ZodError)return res.status(400).json({error:"Invalid input",details:error.flatten()});console.error(error);res.status(503).json({error:"Request could not be completed"})});
app.listen(Number(process.env.PORT||8788),()=>console.log("The Good Side API listening"));
