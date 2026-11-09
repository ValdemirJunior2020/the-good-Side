/**
 * The Good Side — privileged Sheets data service.
 * Deploy as Web app: execute as owner, access Anyone.
 * Requests are rejected without the long secret stored ONLY in Script Properties.
 * All user/admin authorization occurs in the authenticated Node gateway.
 */
const TAB_NAMES = {
 NEWS:"news_id,title,summary,full_summary,category,language,country,publisher,original_url,image_url,source_published_at,discovered_at,verified_at,confidence_score,positivity_score,content_hash,approval_status,featured,created_at,updated_at",
 USERS:"user_id,auth_provider_id,display_name,email,preferred_language,timezone,account_status,created_at,last_login_at,updated_at",
 USER_PREFERENCES:"user_id,selected_categories,preferred_countries,notification_enabled,notification_local_time,daily_digest_enabled,content_language,updated_at,notification_timezone,notification_frequency,notification_times,notification_weekdays,quiet_hours_start,quiet_hours_end,weekend_enabled,food_notifications_enabled,breaking_alerts_enabled,notification_sound_enabled",
 PUSH_DEVICES:"device_id,user_id,platform,push_token_reference,enabled,last_registered_at,last_successful_delivery_at",
 NOTIFICATION_LOGS:"notification_id,user_id,news_id,scheduled_at,sent_at,delivery_status,error_code,idempotency_key",
 SAVED_NEWS:"user_id,news_id,saved_at",
 NEWS_SOURCES:"source_id,publisher,feed_url,homepage_url,category,country,language,reliability,terms_reviewed,active,last_fetched_at,created_at",
 SYSTEM_SETTINGS:"key,value,description,updated_at",
 RECIPES:"recipe_id,title,description,prep_minutes,cook_minutes,servings,ingredients,instructions,dietary_tags,source_name,source_url,image_url,image_license,language,approval_status,created_at,updated_at",
 SAVED_RECIPES:"user_id,recipe_id,saved_at",
 AUDIT_LOG:"audit_id,actor_id,action,object_type,object_id,details,created_at"
};
const SHEET_ID = "1VsZXyPxvOuOSG-6Mc9I3snRFRgwkdGOsr1agAeTwtyc";
function now_(){return new Date().toISOString();}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function safeError_(err){console.error(String(err));return json_({ok:false,error:"Database request failed"});}
function doGet(){return json_({ok:false,error:"POST only"});}
function doPost(e){
 try{
  const body=JSON.parse((e.postData||{}).contents||"{}");
  const secret=PropertiesService.getScriptProperties().getProperty("BACKEND_SHARED_SECRET");
  if(!secret || typeof body.secret!=="string" || body.secret!==secret)return json_({ok:false,error:"Unauthorized"});
  const allowed={
   listNews:listNews_,getNews:getNews_,getUser:getUser_,syncUser:syncUser_,updateUser:updateUser_,
   getPreferences:getPreferences_,setPreferences:setPreferences_,listSaved:listSaved_,saveNews:saveNews_,
   unsaveNews:unsaveNews_,registerDevice:registerDevice_,listNotifications:listNotifications_,
   deleteUser:deleteUser_,stats:stats_,listPending:listPending_,addNews:addNews_,editNews:editNews_,
   setNewsStatus:setNewsStatus_,listSources:listSources_,upsertSource:upsertSource_,
   adminGetNews:adminGetNews_,broadcastPreview:broadcastPreview_,broadcastRecipients:broadcastRecipients_,claimNotification:claimNotification_,updateNotificationByKey:updateNotificationByKey_,broadcastHistory:broadcastHistory_,
   listRecipes:listRecipes_,getRecipe:getRecipe_,upsertRecipe:upsertRecipe_,listSavedRecipes:listSavedRecipes_,saveRecipe:saveRecipe_,unsaveRecipe:unsaveRecipe_,
   digestUsers:digestUsers_,digestSeen:digestSeen_,listDevices:listDevices_,logNotification:logNotification_,disableDevice:disableDevice_
  };
  if(!Object.prototype.hasOwnProperty.call(allowed,body.action))return json_({ok:false,error:"Unknown action"});
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(8000))return json_({ok:false,error:"Busy; retry"});
  try{return json_({ok:true,data:allowed[body.action](body.payload||{})});}finally{lock.releaseLock();}
 }catch(err){return safeError_(err);}
}
function sheet_(name){const ss=SpreadsheetApp.openById(SHEET_ID),s=ss.getSheetByName(name);if(!s)throw Error("Missing "+name);return s;}
function records_(name){const s=sheet_(name),all=s.getDataRange().getValues();if(!all.length)return [];const h=all[0].map(String);return all.slice(1).map((v,i)=>({__row:i+2,...Object.fromEntries(h.map((k,j)=>[k,v[j]]))})).filter(x=>String(x[h[0]]||"").trim()!=="");}
function headers_(name){return TAB_NAMES[name].split(",");}
function append_(name,data){const s=sheet_(name);s.appendRow(headers_(name).map(k=>data[k]===undefined?"":typeof data[k]==="object"?JSON.stringify(data[k]):data[k]));return data;}
function patch_(name,record,data){const h=headers_(name),s=sheet_(name);const row=h.map(k=>data[k]===undefined?record[k]:(typeof data[k]==="object"?JSON.stringify(data[k]):data[k]));s.getRange(record.__row,1,1,h.length).setValues([row]);return Object.fromEntries(h.map((k,i)=>[k,row[i]]));}
function find_(name,key,value){return records_(name).find(x=>String(x[key])===String(value));}
function required_(p,key){if(typeof p[key]!=="string"||!p[key].trim())throw Error("Missing "+key);}
function isHttps_(value){
 // Apps Script V8 does not provide the browser/Node URL constructor.
 // Accept HTTPS public DNS hostnames only; reject credentials, local hosts and HTTP.
 if(typeof value!=="string")return false;
 const match=/^https:\/\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?::443)?(?:[/?#]|$)/i.exec(value);
 if(!match)return false;
 const host=match[1].toLowerCase();
 return host!=="localhost" && !host.endsWith(".localhost") && !host.endsWith(".local");
}
function audit_(actor,action,type,id){append_("AUDIT_LOG",{audit_id:Utilities.getUuid(),actor_id:actor||"system",action,object_type:type,object_id:id,details:"",created_at:now_()});}
function publicNews_(a){const h=headers_("NEWS");return Object.fromEntries(h.filter(k=>k!=="content_hash").map(k=>[k,a[k]]));}
function listNews_(p){let all=records_("NEWS").filter(x=>x.approval_status==="approved");if(p.category)all=all.filter(x=>x.category===p.category);if(p.country)all=all.filter(x=>x.country===p.country);if(p.language)all=all.filter(x=>x.language===p.language);if(p.q){const q=String(p.q).toLowerCase();all=all.filter(x=>String(x.title+" "+x.summary).toLowerCase().includes(q));}all.sort((a,b)=>String(b.source_published_at).localeCompare(String(a.source_published_at)));const page=Math.max(1,Math.min(10000,Number(p.page)||1)),limit=Math.max(1,Math.min(50,Number(p.limit)||20));return {items:all.slice((page-1)*limit,page*limit).map(publicNews_),page,limit,total:all.length};}
function getNews_(p){return records_("NEWS").filter(x=>x.approval_status==="approved").map(publicNews_).find(x=>x.news_id===p.news_id)||null;}
function getUser_(p){required_(p,"user_id");return find_("USERS","user_id",p.user_id)||null;}
function syncUser_(p){required_(p,"user_id");const existing=getUser_(p);if(existing)return patch_("USERS",existing,{last_login_at:now_()});const stamp=now_();append_("USERS",{user_id:p.user_id,auth_provider_id:p.user_id,display_name:p.display_name||"",email:p.email||"",preferred_language:p.preferred_language||"en",timezone:p.timezone||"America/New_York",account_status:"active",created_at:stamp,last_login_at:stamp,updated_at:stamp});return getUser_(p);}
function updateUser_(p){const u=getUser_(p);if(!u)throw Error("Profile not found");return patch_("USERS",u,{display_name:p.display_name,preferred_language:p.preferred_language,timezone:p.timezone,updated_at:now_()});}
function getPreferences_(p){required_(p,"user_id");return find_("USER_PREFERENCES","user_id",p.user_id)||{user_id:p.user_id,selected_categories:"",preferred_countries:"",notification_enabled:false,notification_local_time:"12:00",daily_digest_enabled:true,content_language:"en",notification_timezone:"",notification_frequency:"daily",notification_times:"[\"12:00\"]",notification_weekdays:"[]",quiet_hours_start:"",quiet_hours_end:"",weekend_enabled:true,food_notifications_enabled:false,breaking_alerts_enabled:false,notification_sound_enabled:true};}
function setPreferences_(p){required_(p,"user_id");const old=find_("USER_PREFERENCES","user_id",p.user_id),data={...p,updated_at:now_()};for(const key of ["selected_categories","preferred_countries"])if(Array.isArray(data[key]))data[key]=data[key].join(",");if(old)return patch_("USER_PREFERENCES",old,data);return append_("USER_PREFERENCES",{...getPreferences_(p),...data});}
function listSaved_(p){return records_("SAVED_NEWS").filter(x=>x.user_id===p.user_id).map(x=>getNews_({news_id:x.news_id})).filter(Boolean);}
function saveNews_(p){required_(p,"user_id");required_(p,"news_id");if(!getNews_(p))throw Error("Story unavailable");if(!records_("SAVED_NEWS").some(x=>x.user_id===p.user_id&&x.news_id===p.news_id))append_("SAVED_NEWS",{user_id:p.user_id,news_id:p.news_id,saved_at:now_()});return {saved:true};}
function unsaveNews_(p){const match=records_("SAVED_NEWS").find(x=>x.user_id===p.user_id&&x.news_id===p.news_id);if(match)sheet_("SAVED_NEWS").deleteRow(match.__row);return {saved:false};}
function registerDevice_(p){required_(p,"user_id");required_(p,"device_id");required_(p,"push_token_reference");const old=find_("PUSH_DEVICES","device_id",p.device_id),row={...p,enabled:true,last_registered_at:now_()};if(old&&old.user_id!==p.user_id)throw Error("Device owned by another user");return old?patch_("PUSH_DEVICES",old,row):append_("PUSH_DEVICES",row);}
function disableDevice_(p){const d=find_("PUSH_DEVICES","device_id",p.device_id);if(d&&d.user_id===p.user_id)patch_("PUSH_DEVICES",d,{enabled:false});return {disabled:true};}
function listDevices_(p){return records_("PUSH_DEVICES").filter(x=>x.user_id===p.user_id&&String(x.enabled)==="true");}
function listNotifications_(p){return records_("NOTIFICATION_LOGS").filter(x=>x.user_id===p.user_id).slice(-100).reverse().map(x=>({notification_id:x.notification_id,news_id:x.news_id,scheduled_at:x.scheduled_at,sent_at:x.sent_at,delivery_status:x.delivery_status}));}
function logNotification_(p){required_(p,"idempotency_key");if(records_("NOTIFICATION_LOGS").some(x=>x.idempotency_key===p.idempotency_key))return {duplicate:true};return append_("NOTIFICATION_LOGS",p);}
function digestSeen_(p){const all=records_("NOTIFICATION_LOGS").filter(x=>x.user_id===p.user_id);return {already_sent:all.some(x=>String(x.idempotency_key).startsWith(p.user_id+":"+p.date+":")),news_ids:all.map(x=>x.news_id)};}
function digestUsers_(){const prefs=records_("USER_PREFERENCES"),users=records_("USERS");return prefs.map(p=>{const u=users.find(x=>x.user_id===p.user_id);return u?{...p,timezone:p.notification_timezone||u.timezone}:null;}).filter(Boolean);}
function deleteUser_(p){required_(p,"user_id");for(const name of ["USERS","USER_PREFERENCES","PUSH_DEVICES","NOTIFICATION_LOGS","SAVED_NEWS","SAVED_RECIPES"]){const rows=records_(name).filter(x=>x.user_id===p.user_id).sort((a,b)=>b.__row-a.__row);for(const r of rows)sheet_(name).deleteRow(r.__row);}audit_(p.user_id,"delete_account","user","deleted");return {deleted:true};}
function listPending_(){return records_("NEWS").filter(x=>x.approval_status==="pending").slice(-100).reverse();}
function stats_(){return {users:records_("USERS").length,approved:records_("NEWS").filter(x=>x.approval_status==="approved").length,pending:records_("NEWS").filter(x=>x.approval_status==="pending").length,notifications:records_("NOTIFICATION_LOGS").length,sources:records_("NEWS_SOURCES").length};}
function addNews_(p){required_(p,"title");required_(p,"original_url");if(!isHttps_(p.original_url))throw Error("Invalid source URL");const duplicate=records_("NEWS").find(x=>x.original_url===p.original_url||(p.content_hash&&x.content_hash===p.content_hash));if(duplicate)return {news_id:duplicate.news_id,duplicate:true};const stamp=now_(),news_id=p.news_id||Utilities.getUuid();const record={...p,news_id,approval_status:p.approval_status==="pending"?"pending":"pending",discovered_at:stamp,verified_at:"",featured:false,created_at:stamp,updated_at:stamp};append_("NEWS",record);audit_(p.actor_id,"add","news",news_id);return {news_id,duplicate:false};}
function editNews_(p){required_(p,"news_id");const record=find_("NEWS","news_id",p.news_id);if(!record)throw Error("News not found");const allowed=["title","summary","full_summary","category","language","country","publisher","image_url","source_published_at","confidence_score","positivity_score","featured"];const data={updated_at:now_()};allowed.forEach(k=>{if(p[k]!==undefined)data[k]=p[k];});patch_("NEWS",record,data);audit_(p.actor_id,"edit","news",p.news_id);return {updated:true};}
function setNewsStatus_(p){const item=find_("NEWS","news_id",p.news_id);if(!item)throw Error("News not found");if(!["approved","rejected","pending"].includes(p.status))throw Error("Invalid status");patch_("NEWS",item,{approval_status:p.status,verified_at:p.status==="approved"?now_():"",updated_at:now_()});audit_(p.actor_id,p.status,"news",p.news_id);return {status:p.status};}
function listSources_(){return records_("NEWS_SOURCES");}
function upsertSource_(p){required_(p,"feed_url");if(!isHttps_(p.feed_url))throw Error("HTTPS feed required");const old=records_("NEWS_SOURCES").find(x=>x.feed_url===p.feed_url),data={source_id:old?old.source_id:Utilities.getUuid(),publisher:String(p.publisher||"").slice(0,100),feed_url:p.feed_url,homepage_url:p.homepage_url||"",category:p.category||"",country:p.country||"",language:p.language||"en",reliability:p.reliability||"review",terms_reviewed:Boolean(p.terms_reviewed),active:Boolean(p.active),last_fetched_at:old?old.last_fetched_at:"",created_at:old?old.created_at:now_()};audit_(p.actor_id,"upsert","source",data.source_id);return old?patch_("NEWS_SOURCES",old,data):append_("NEWS_SOURCES",data);}


/* Manual editorial push: this service is available only through the admin-verified Node gateway. */
function adminGetNews_(p){required_(p,"news_id");return find_("NEWS","news_id",p.news_id)||null;}
function broadcastDevicePool_(p){
 const approved=find_("NEWS","news_id",p.news_id);
 if(!approved||approved.approval_status!=="approved"||!isHttps_(String(approved.original_url||"")))throw Error("Approved sourced article required");
 const prefs=new Map(records_("USER_PREFERENCES").map(x=>[String(x.user_id),x]));
 const users=new Set(records_("USERS").filter(x=>x.account_status==="active").map(x=>String(x.user_id)));
 return records_("PUSH_DEVICES").filter(d=>{
  const pref=prefs.get(String(d.user_id));
  if(!users.has(String(d.user_id))||!pref||String(pref.notification_enabled)!=="true"||String(d.enabled)!=="true")return false;
  if(p.audience==="matching"){const interests=String(pref.selected_categories||"").split(",").map(s=>s.trim());if(!interests.includes(String(approved.category)))return false;}
  return true;
 });
}
function broadcastPreview_(p){const devices=broadcastDevicePool_(p);return {eligible_devices:devices.length,eligible_users:new Set(devices.map(d=>String(d.user_id))).size,audience:p.audience,category:find_("NEWS","news_id",p.news_id).category};}
function broadcastRecipients_(p){
 required_(p,"request_id");const max=Math.min(75,Math.max(1,Number(p.limit)||75));
 const keys=new Set(records_("NOTIFICATION_LOGS").map(x=>String(x.idempotency_key)));
 const all=broadcastDevicePool_(p).filter(d=>!keys.has("manual:"+p.request_id+":"+d.device_id));
 const devices=all.slice(0,max).map(x=>({device_id:x.device_id,user_id:x.user_id,push_token_reference:x.push_token_reference}));
 return {devices,remaining_eligible:Math.max(0,all.length-devices.length)};
}
function claimNotification_(p){
 required_(p,"idempotency_key");
 if(records_("NOTIFICATION_LOGS").some(x=>x.idempotency_key===p.idempotency_key))return {duplicate:true};
 append_("NOTIFICATION_LOGS",p);
 return {duplicate:false};
}
function updateNotificationByKey_(p){
 required_(p,"idempotency_key");const record=find_("NOTIFICATION_LOGS","idempotency_key",p.idempotency_key);
 if(!record)throw Error("Notification not found");
 const allowed={delivery_status:String(p.delivery_status||"error"),sent_at:p.sent_at||now_(),error_code:p.error_code||""};
 patch_("NOTIFICATION_LOGS",record,allowed);return {updated:true};
}
function broadcastHistory_(p){return records_("NOTIFICATION_LOGS").filter(x=>String(x.idempotency_key).indexOf("manual:")===0).slice(-Math.min(100,Number(p.limit)||100)).reverse().map(x=>({news_id:x.news_id,sent_at:x.sent_at,delivery_status:x.delivery_status,error_code:x.error_code,idempotency_key:x.idempotency_key}));}


/* Recipes are distinct from news and must be sourced and editorially approved. */
function publicRecipe_(r){return Object.fromEntries(headers_("RECIPES").filter(k=>k!=="approval_status").map(k=>[k,r[k]]));}
function listRecipes_(){return records_("RECIPES").filter(r=>r.approval_status==="approved"&&isHttps_(String(r.source_url||""))).slice(-100).reverse().map(publicRecipe_);}
function getRecipe_(p){required_(p,"recipe_id");const r=find_("RECIPES","recipe_id",p.recipe_id);return r&&r.approval_status==="approved"&&isHttps_(String(r.source_url||""))?publicRecipe_(r):null;}
function upsertRecipe_(p){
 required_(p,"title");required_(p,"source_url");
 if(!isHttps_(p.source_url))throw Error("Recipe must credit an HTTPS source");
 if(!Array.isArray(p.ingredients)||!p.ingredients.length||p.ingredients.length>80)throw Error("Ingredients required");
 if(!Array.isArray(p.instructions)||!p.instructions.length||p.instructions.length>80)throw Error("Instructions required");
 const clean=v=>v.map(x=>String(x).slice(0,500));
 const old=p.recipe_id?find_("RECIPES","recipe_id",p.recipe_id):null;
 const data={recipe_id:old?old.recipe_id:Utilities.getUuid(),title:String(p.title).slice(0,200),description:String(p.description||"").slice(0,1200),
 prep_minutes:Math.max(0,Math.min(1440,Number(p.prep_minutes)||0)),cook_minutes:Math.max(0,Math.min(1440,Number(p.cook_minutes)||0)),
 servings:Math.max(1,Math.min(100,Number(p.servings)||1)),ingredients:JSON.stringify(clean(p.ingredients)),
 instructions:JSON.stringify(clean(p.instructions)),dietary_tags:String(p.dietary_tags||"").slice(0,200),
 source_name:String(p.source_name||"").slice(0,150),source_url:p.source_url,image_url:p.image_url||"",
 image_license:String(p.image_license||"").slice(0,150),language:p.language||"en",
 approval_status:p.approval_status==="approved"?"approved":"pending",
 created_at:old?old.created_at:now_(),updated_at:now_()};
 if(old)patch_("RECIPES",old,data);else append_("RECIPES",data);
 audit_(p.actor_id,old?"edit":"add","recipe",data.recipe_id);
 return {recipe_id:data.recipe_id,status:data.approval_status};
}
function listSavedRecipes_(p){required_(p,"user_id");return records_("SAVED_RECIPES").filter(x=>x.user_id===p.user_id).map(x=>getRecipe_({recipe_id:x.recipe_id})).filter(Boolean);}
function saveRecipe_(p){required_(p,"user_id");required_(p,"recipe_id");if(!getRecipe_(p))throw Error("Recipe unavailable");if(!records_("SAVED_RECIPES").some(x=>x.user_id===p.user_id&&x.recipe_id===p.recipe_id))append_("SAVED_RECIPES",{user_id:p.user_id,recipe_id:p.recipe_id,saved_at:now_()});return {saved:true};}
function unsaveRecipe_(p){required_(p,"user_id");required_(p,"recipe_id");const x=records_("SAVED_RECIPES").find(x=>x.user_id===p.user_id&&x.recipe_id===p.recipe_id);if(x)sheet_("SAVED_RECIPES").deleteRow(x.__row);return {saved:false};}
