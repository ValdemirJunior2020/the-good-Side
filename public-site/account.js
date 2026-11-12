"use strict";
const API="https://the-good-side-api.onrender.com";
const SB="https://tqdqekxvisgmotibjiwb.supabase.co";
const KEY="sb_publishable_FcW-IRdeyyBEmwxSAZZCXA_1T0qJIzo";
const MANAGE=SB+"/functions/v1/goodside-admin";
const WEB_GOOGLE_ID="1090749452629-uljfcv421km7hg12d32vuiq0o0dml7fm.apps.googleusercontent.com";
const SESSION_KEY="goodside_web_session_v1";
const HISTORY_KEY="goodside_web_read_history_v1";
const TOPICS=["community","environment","science","medical","kindness","technology","food","animals","education","culture"];
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const $=id=>document.getElementById(id);
const state={session:null,mode:"signup",user:null,preferences:null,news:[],recipes:[],saved:[],savedRecipes:[],avatars:[],avatarOverride:null,view:"discover",selectedCategory:"",history:[]};
function show(el,on=true){el.hidden=!on}
function setText(id,text){$(id).textContent=String(text||"")}
function feedback(text,error=false,element="workspace-message"){const node=$(element);node.textContent=String(text||"");node.classList.toggle("error",error);node.classList.toggle("success",!error)}
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
function cookieSafeJSON(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
function persist(){if(state.session?.token)sessionStorage.setItem(SESSION_KEY,JSON.stringify(state.session));else sessionStorage.removeItem(SESSION_KEY)}
function validUrl(v){try{const u=new URL(v);return u.protocol==="https:"?u.href:null}catch{return null}}
function emailLike(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
function displayError(e,where="workspace-message"){feedback(e instanceof Error?e.message:"Something went wrong. Please try again.",true,where)}
async function authCall(path,body){
 const r=await fetch(SB+"/auth/v1"+path,{method:"POST",headers:{"Content-Type":"application/json",apikey:KEY},body:JSON.stringify(body)});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.msg||d.error_description||d.message||d.error||"Authentication failed");
 return d;
}
async function freshToken(){
 const s=state.session;if(!s)return null;
 if(s.provider==="google")return s.token;
 if(!s.expiresAt||s.expiresAt>Date.now()+60000)return s.token;
 const d=await authCall("/token?grant_type=refresh_token",{refresh_token:s.refreshToken});
 state.session={...s,token:d.access_token,refreshToken:d.refresh_token,expiresAt:Date.now()+(d.expires_in||3600)*1000};
 persist();return state.session.token;
}
async function request(path,opts={},authenticated=false){
 const token=authenticated?await freshToken():null;
 if(authenticated&&!token)throw Error("Please sign in again");
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const r=await fetch(API+path,{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(opts.headers||{})},signal:controller.signal});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||d.ok===false)throw Error(d.error||"The Good Side service is temporarily unavailable");
  return d.data??d;
 }finally{clearTimeout(timeout)}
}
async function management(route,opts={},authenticated=false){
 const token=authenticated?await freshToken():null;
 const r=await fetch(MANAGE+"?route="+encodeURIComponent(route),{...opts,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(opts.headers||{})}});
 const d=await r.json().catch(()=>({}));
 if(!r.ok||!d.ok)throw Error(d.error||"Could not load your profile preferences");
 return d.data;
}
function commonButton(label,onClick,secondary=false){
 const button=element("button",secondary?"mini-secondary":"mini-action",label);button.type="button";button.addEventListener("click",onClick);return button
}
function signedIn(){
 show($("auth-screen"),false);show($("workspace"));
 setText("hello","Hello, "+(state.user?.display_name||state.session?.displayName||state.session?.email?.split("@")[0]||"friend")+" ☀");
 renderProfile();renderDiscover();void activateView("discover");
}
function signedOut(){
 show($("workspace"),false);show($("auth-screen"));setAuthMode("signup");
}
async function registerProfile(){
 if(!state.session)return;
 const email=state.session.email||"";
 const name=state.session.displayName||email.split("@")[0]||"Friend";
 try{
  await request("/me",{method:"POST",body:JSON.stringify({display_name:name,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",preferred_language:"en"})},true)
 }catch(e){console.warn("Account profile initialization is delayed",e)}
 await management("my-profile",{method:"POST",body:JSON.stringify({display_name:name})},true).catch(()=>{});
}
async function afterLogin(){
 persist();feedback("","", "auth-message");await registerProfile();
 state.user=await request("/me",{},true).catch(()=>({display_name:state.session.displayName||state.session.email?.split("@")[0]}));
 signedIn();
}
function setAuthMode(mode){
 state.mode=mode;
 const signup=mode==="signup";
 $("tab-signup").classList.toggle("active",signup);$("tab-login").classList.toggle("active",!signup);
 show($("name-field"),signup);show($("forgot-button"),!signup);
 $("auth-password").autocomplete=signup?"new-password":"current-password";
 setText("auth-submit",signup?"Create my account ↗":"Log in with email ↗");
 feedback("",false,"auth-message")
}
$("tab-signup").addEventListener("click",()=>setAuthMode("signup"));
$("tab-login").addEventListener("click",()=>setAuthMode("login"));
$("auth-form").addEventListener("submit",async ev=>{
 ev.preventDefault();const email=$("auth-email").value.trim().toLowerCase(),password=$("auth-password").value,name=$("auth-name").value.trim();
 feedback("",false,"auth-message");
 if(!emailLike(email))return feedback("Enter a valid email address.",true,"auth-message");
 if(password.length<8)return feedback("Your password must contain at least 8 characters.",true,"auth-message");
 if(state.mode==="signup"&&!name)return feedback("Enter your name.",true,"auth-message");
 $("auth-submit").disabled=true;
 try{
  const redirect=encodeURIComponent(location.origin+"/reset-password.html");
  const d=state.mode==="signup"
   ?await authCall("/signup?redirect_to="+redirect,{email,password,data:{display_name:name}})
   :await authCall("/token?grant_type=password",{email,password});
  if(!d.access_token){
   setAuthMode("login");
   $("auth-password").value="";
   return feedback("Check your email for a confirmation link. Once verified, return and log in. If no email arrives, our delivery service may still need setup.",false,"auth-message")
  }
  state.session={provider:"email",token:d.access_token,refreshToken:d.refresh_token,expiresAt:Date.now()+(d.expires_in||3600)*1000,email:d.user?.email||email,displayName:d.user?.user_metadata?.display_name||name||email.split("@")[0]};
  await afterLogin()
 }catch(e){displayError(e,"auth-message")}
 finally{$("auth-submit").disabled=false}
});
$("forgot-button").addEventListener("click",async()=>{
 const email=$("auth-email").value.trim().toLowerCase();
 if(!emailLike(email))return feedback("Enter your email address first.",true,"auth-message");
 try{
  await authCall("/recover?redirect_to="+encodeURIComponent(location.origin+"/reset-password.html"),{email});
  feedback("If an account exists, you'll receive password-reset instructions. Check your spam folder too.",false,"auth-message")
 }catch{feedback("If an account exists, you'll receive password-reset instructions if email delivery is available.",false,"auth-message")}
});
function initializeGoogle(){
 if(!window.google?.accounts?.id)return;
 window.google.accounts.id.initialize({client_id:WEB_GOOGLE_ID,callback:async({credential})=>{
  if(!credential)return;
  try{
   // JWT payload is only used for UI labels; the API verifies Google's signature independently.
   const part=credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
   const payload=cookieSafeJSON(atob(part),"")||{};
   state.session={provider:"google",token:credential,email:payload.email||"",displayName:payload.name||payload.email?.split("@")[0]||"Friend"};
   await afterLogin()
  }catch(e){state.session=null;persist();displayError(e,"auth-message")}
 }});
 window.google.accounts.id.renderButton($("google-button"),{theme:"outline",size:"large",shape:"pill",width:310,text:"continue_with"});
}
let googlePoll=0;const googleTimer=setInterval(()=>{googlePoll++;if(window.google?.accounts?.id){clearInterval(googleTimer);initializeGoogle()}else if(googlePoll>25)clearInterval(googleTimer)},350);
$("logout").addEventListener("click",()=>{
 state.session=null;state.user=null;persist();window.google?.accounts?.id?.disableAutoSelect?.();signedOut()
});
async function loadNews(){
 try{
  const d=await request("/news?limit=50");state.news=Array.isArray(d.items)?d.items:[];
 }catch(e){state.news=[];displayError(e)}
 renderDiscover()
}
async function loadRecipes(){
 try{const d=await request("/recipes");state.recipes=Array.isArray(d)?d:Array.isArray(d.items)?d.items:[]}
 catch(e){state.recipes=[];displayError(e)}
 renderFood()
}
function storyCard(story,opts={}){
 const id=String(story.news_id||"");
 const card=element("article","story-card");
 card.append(element("span","tag",story.category||"Good news"),element("h3","",story.title||"An uplifting story"),element("p","",story.summary||"See original reporting"));
 const meta=element("div","card-meta");
 meta.append(element("span","",story.publisher||"Original publisher"));
 const url=validUrl(story.original_url);
 if(url){
  const a=element("a","source-link","Read source ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";
  a.addEventListener("click",()=>rememberStory(story));meta.append(a)
 }
 card.append(meta);
 if(state.session&&id){
  card.append(commonButton(opts.saved?"Remove saved ♡":"Save story ♡",async()=>{
   try{await request("/me/saved/"+encodeURIComponent(id),{method:opts.saved?"DELETE":"POST"},true);feedback(opts.saved?"Removed from saved stories":"Story saved");await loadSaved()}
   catch(e){displayError(e)}
  }))
 }
 return card
}
function recipeCard(recipe,opts={}){
 const id=String(recipe.recipe_id||"");
 const card=element("article","story-card");
 card.append(element("span","tag","Food"),element("h3","",recipe.title||recipe.name||"Recipe"),element("p","",recipe.summary||recipe.description||"A little good for your table"));
 const link=validUrl(recipe.original_url||recipe.source_url);
 if(link){const a=element("a","source-link","View original recipe ↗");a.href=link;a.target="_blank";a.rel="noopener noreferrer";card.append(a)}
 if(id)card.append(commonButton(opts.saved?"Remove saved ♡":"Save recipe ♡",async()=>{
  try{await request("/me/recipes/"+encodeURIComponent(id),{method:opts.saved?"DELETE":"POST"},true);await loadSaved();feedback("Recipe collection updated")}
  catch(e){displayError(e)}
 }));
 return card
}
function drawCards(target,items,renderer,emptyMessage){
 $(target).replaceChildren(...(items.length?items.map(renderer):[element("p","empty-note",emptyMessage)]))
}
function renderDiscover(){
 const term=$("story-search").value.toLowerCase().trim();
 const stories=state.news.filter(s=>(!state.selectedCategory||(s.category||"").toLowerCase()===state.selectedCategory)&&(!term||[s.title,s.summary,s.publisher].some(x=>String(x||"").toLowerCase().includes(term))));
 drawCards("discover-cards",stories,s=>storyCard(s),"No matching approved stories yet.");
}
const filters=$("topic-filters");
["",...TOPICS].forEach(c=>{
 const b=element("button","chip"+(!c?" active":""),c?c[0].toUpperCase()+c.slice(1):"All");
 b.type="button";b.dataset.topic=c;
 b.addEventListener("click",()=>{state.selectedCategory=c;filters.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderDiscover()});
 filters.append(b)
});
$("story-search").addEventListener("input",renderDiscover);
function renderFood(){drawCards("food-cards",state.recipes,recipeCard,"No approved recipes yet. Check back for new ideas.")}
async function loadSaved(){
 try{
  const [news,recipes]=await Promise.all([request("/me/saved",{},true),request("/me/recipes",{},true)]);
  state.saved=Array.isArray(news)?news:news.items||news.stories||[];
  state.savedRecipes=Array.isArray(recipes)?recipes:recipes.items||[];
  const newsById=new Map(state.news.map(x=>[x.news_id,x]));
  const normalized=state.saved.map(s=>s.title?s:newsById.get(s.news_id)||null).filter(Boolean);
  drawCards("saved-cards",normalized,s=>storyCard(s,{saved:true}),"You haven't saved any stories yet.");
  drawCards("saved-recipes",state.savedRecipes,s=>recipeCard(s,{saved:true}),"No saved recipes yet.")
 }catch(e){displayError(e)}
}
function rememberStory(story){
 const row={news_id:story.news_id,title:story.title,summary:story.summary,original_url:story.original_url,publisher:story.publisher,category:story.category};
 const previous=cookieSafeJSON(localStorage.getItem(HISTORY_KEY),"");
 const list=Array.isArray(previous)?previous:[];
 const updated=[row,...list.filter(x=>x.news_id!==row.news_id)].slice(0,80);
 localStorage.setItem(HISTORY_KEY,JSON.stringify(updated));
}
function renderHistory(){
 const history=cookieSafeJSON(localStorage.getItem(HISTORY_KEY),"");
 drawCards("history-cards",Array.isArray(history)?history:[],storyCard,"Your reading history on this browser is empty.")
}
async function loadProfile(){
 try{state.user=await request("/me",{},true)||state.user}catch(e){displayError(e)}
 await Promise.allSettled([
  management("my-avatar",{},true).then(x=>{state.avatarOverride=x?.image_url||null}),
  management("public-avatars").then(x=>{state.avatars=Array.isArray(x)?x:[]})
 ]);
 renderProfile()
}
function renderProfile(){
 const u=state.user||{},s=state.session||{};
 setText("profile-name",u.display_name||s.displayName||"Your profile");
 setText("profile-email",s.email||u.email||"");
 $("display-name").value=u.display_name||s.displayName||"";
 $("profile-lang").value=u.preferred_language||"en";
 setText("provider-label","Connected with "+(s.provider==="google"?"Google":"email and password")+".");
 const avatar=state.avatars.find(a=>a.avatar_id===u.avatar_id);
 $("profile-avatar").src=validUrl(state.avatarOverride||avatar?.image_url)||"/favicon.svg";
 show($("account-recovery"),s.provider==="email")
}
$("profile-form").addEventListener("submit",async ev=>{
 ev.preventDefault();
 const display_name=$("display-name").value.trim(),preferred_language=$("profile-lang").value;
 if(!display_name)return feedback("Enter a display name",true);
 try{await request("/me",{method:"PUT",body:JSON.stringify({display_name,preferred_language})},true);
  state.user={...state.user,display_name,preferred_language};renderProfile();setText("hello","Hello, "+display_name+" ☀");feedback("Your profile is updated on all devices")}
 catch(e){displayError(e)}
});
$("choose-avatar").addEventListener("click",async()=>{
 show($("avatar-picker"));
 if(!state.avatars.length)await management("public-avatars").then(x=>state.avatars=x||[]).catch(displayError);
 const grid=$("avatar-grid");grid.replaceChildren();
 for(const avatar of state.avatars){
  const b=element("button","avatar-option");b.type="button";
  const img=element("img");img.src=validUrl(avatar.image_url)||"/favicon.svg";img.alt="";
  img.loading="lazy";b.append(img,element("span","",avatar.label));
  b.addEventListener("click",async()=>{
   try{
    await request("/me",{method:"PUT",body:JSON.stringify({avatar_id:avatar.avatar_id})},true);
    if(state.avatarOverride){
     await management("my-avatar",{method:"DELETE"},true);
     state.avatarOverride=null;
    }
    state.user={...state.user,avatar_id:avatar.avatar_id};renderProfile();show($("avatar-picker"),false);feedback("Avatar saved across your devices")
   }catch(e){displayError(e)}
  });grid.append(b)
 }
});
$("avatar-close").addEventListener("click",()=>show($("avatar-picker"),false));
$("avatar-picker").addEventListener("click",ev=>{if(ev.target===$("avatar-picker"))show($("avatar-picker"),false)});
$("account-recovery").addEventListener("click",async()=>{
 const email=state.session?.email;
 if(!email||!confirm("Send a password reset email to "+email+"?"))return;
 try{await authCall("/recover?redirect_to="+encodeURIComponent(location.origin+"/reset-password.html"),{email});feedback("Check your inbox for reset instructions, if email delivery is configured")}
 catch(e){displayError(e)}
});
$("account-delete").addEventListener("click",async()=>{
 const word=prompt("This permanently deletes your Good Side account and data. Type DELETE to proceed.");
 if(word!=="DELETE")return;
 try{await request("/me",{method:"DELETE"},true);state.session=null;state.user=null;persist();signedOut();feedback("Account deleted",false,"auth-message")}
 catch(e){displayError(e)}
});
function interestPills(items=[],weekdays=[]){
 const cont=$("interest-options");cont.replaceChildren();
 TOPICS.forEach(cat=>{
  const label=element("label","select-chip");const input=element("input");input.type="checkbox";input.value=cat;input.checked=items.includes(cat);
  label.append(input,document.createTextNode(" "+cat[0].toUpperCase()+cat.slice(1)));cont.append(label)
 });
 const days=$("weekday-options");days.replaceChildren();
 DAYS.forEach((day,i)=>{
  const label=element("label","select-chip"),input=element("input");input.type="checkbox";input.value=String(i);input.checked=weekdays.includes(i);
  label.append(input,document.createTextNode(" "+day));days.append(label)
 })
}
function arrayValue(value,fallback=[]){
 if(Array.isArray(value))return value;
 if(typeof value==="string"){try{const result=JSON.parse(value);return Array.isArray(result)?result:fallback}catch{return fallback}}
 return fallback
}
const bool=value=>value===true||value==="TRUE"||value==="true";
function frequencyChanged(){
 const f=$("frequency").value;
 show($("time-fields"),f!=="breaking_only");
 show($("time-two-label"),f==="twice_daily"||f==="three_daily");
 show($("time-three-label"),f==="three_daily")
}
$("frequency").addEventListener("change",frequencyChanged);
async function loadPreferences(){
 try{
  const p=await request("/me/preferences",{},true)||{};
  state.preferences=p;
  const times=arrayValue(p.notification_times,[p.notification_local_time||"12:00"]);
  const weekdays=arrayValue(p.notification_weekdays,[]);
  interestPills(arrayValue(p.selected_categories,typeof p.selected_categories==="string"?p.selected_categories.split(",").filter(Boolean):[]),weekdays);
  $("notify-enabled").checked=bool(p.notification_enabled);
  $("digest-enabled").checked=p.daily_digest_enabled===undefined?true:bool(p.daily_digest_enabled);
  $("frequency").value=p.notification_frequency||"daily";
  $("time-one").value=times[0]||"12:00";$("time-two").value=times[1]||"18:00";$("time-three").value=times[2]||"09:00";
  $("timezone").value=p.notification_timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||"America/New_York";
  $("quiet-from").value=p.quiet_hours_start||"22:00";$("quiet-until").value=p.quiet_hours_end||"07:00";
  $("weekends").checked=p.weekend_enabled===undefined?true:bool(p.weekend_enabled);
  $("food-alerts").checked=bool(p.food_notifications_enabled);
  $("breaking-alerts").checked=bool(p.breaking_alerts_enabled);
  $("language").value=p.content_language||"en";frequencyChanged();
  const n=await request("/me/next-notification",{},true).catch(()=>null);
  setText("next-notification",n?.next_at?"Next scheduled delivery: "+new Date(n.next_at).toLocaleString():"Your next scheduled delivery will appear here after saving.")
 }catch(e){displayError(e)}
}
$("preferences-form").addEventListener("submit",async ev=>{
 ev.preventDefault();
 const frequency=$("frequency").value;
 const selected=[...$("interest-options").querySelectorAll("input:checked")].map(x=>x.value);
 const days=[...$("weekday-options").querySelectorAll("input:checked")].map(x=>Number(x.value));
 const n=frequency==="three_daily"?3:frequency==="twice_daily"?2:1;
 const times=[$("time-one").value,$("time-two").value,$("time-three").value].slice(0,n);
 if(frequency==="selected_weekdays"&&!days.length)return feedback("Select at least one weekday",true);
 if(new Set(times).size!==times.length)return feedback("Each delivery time must be unique",true);
 const timezone=$("timezone").value.trim();
 try{new Intl.DateTimeFormat("en-US",{timeZone:timezone})}catch{return feedback("Enter a valid timezone, for example America/New_York",true)}
 const body={selected_categories:selected,notification_enabled:$("notify-enabled").checked,daily_digest_enabled:$("digest-enabled").checked,
  notification_local_time:times[0],notification_times:times,notification_timezone:timezone,notification_frequency:frequency,notification_weekdays:days,
  quiet_hours_start:$("quiet-from").value,quiet_hours_end:$("quiet-until").value,weekend_enabled:$("weekends").checked,
  food_notifications_enabled:$("food-alerts").checked,breaking_alerts_enabled:$("breaking-alerts").checked,
  notification_sound_enabled:true,content_language:$("language").value};
 try{await request("/me/preferences",{method:"PUT",body:JSON.stringify(body)},true);await loadPreferences();feedback("Preferences saved. These settings are shared with your iPhone app.")}
 catch(e){displayError(e)}
});
async function activateView(name){
 state.view=name;
 $("account-tabs").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
 document.querySelectorAll(".account-view").forEach(panel=>show(panel,panel.dataset.panel===name));
 feedback("");
 if(name==="discover")await loadNews();
 if(name==="food")await loadRecipes();
 if(name==="saved")await loadSaved();
 if(name==="profile")await loadProfile();
 if(name==="preferences")await loadPreferences();
 if(name==="history")renderHistory()
}
$("account-tabs").addEventListener("click",event=>{
 const button=event.target.closest("button[data-view]");
 if(button)void activateView(button.dataset.view)
});
async function start(){
 const existing=cookieSafeJSON(sessionStorage.getItem(SESSION_KEY),null);
 if(!existing?.token)return signedOut();
 state.session=existing;
 try{
  await freshToken();
  if(state.session.provider==="email"){
   const r=await fetch(SB+"/auth/v1/user",{headers:{apikey:KEY,Authorization:"Bearer "+state.session.token}});
   if(!r.ok)throw Error("Email session expired");
  }
  state.user=await request("/me",{},true);
  signedIn()
 }catch{state.session=null;persist();signedOut()}
}
void start();