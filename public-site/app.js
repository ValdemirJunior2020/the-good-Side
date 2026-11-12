"use strict";
const API="https://the-good-side-api.onrender.com";
const grid=document.getElementById("stories-grid");
const search=document.getElementById("search");
const filters=document.getElementById("filters");
const reload=document.getElementById("reload");
const featureTitle=document.getElementById("feature-title");
const featureDescription=document.getElementById("feature-description");
const featureLink=document.getElementById("feature-link");
let allStories=[],category="",query="";
document.getElementById("year").textContent=String(new Date().getFullYear());
function safeOriginal(url){
 try{const u=new URL(url);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}
}
function dateLabel(value){
 if(!value)return "";
 const date=new Date(value);
 return Number.isNaN(date.getTime())?"":date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function make(tag,className,text){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
}
function empty(message){grid.replaceChildren(make("div","loading-card",message))}
function filterStories(){
 const term=query.trim().toLowerCase();
 const matches=allStories.filter(s=>{
  const byCategory=!category||(s.category||"").toLowerCase()===category;
  const bySearch=!term||[s.title,s.summary,s.publisher,s.category].some(v=>String(v||"").toLowerCase().includes(term));
  return byCategory&&bySearch;
 });
 if(!matches.length){empty(allStories.length?"No stories match yet. Try another topic or search.":"No approved stories are available right now. Check back soon.");return}
 const cards=matches.map(story=>{
  const card=make("article","story-card");
  const tag=make("span","tag",(story.category||"Good news").replace(/-/g," "));
  const title=make("h3","",story.title||"An uplifting story");
  const desc=make("p","",story.summary||"Read the original publisher's report.");
  const meta=make("div","card-meta");
  const publisher=make("span","",(story.publisher||"Original publisher")+(dateLabel(story.source_published_at)?" · "+dateLabel(story.source_published_at):""));
  meta.appendChild(publisher);
  const link=safeOriginal(story.original_url);
  if(link){
   const anchor=make("a","arrow","↗");
   anchor.href=link;anchor.target="_blank";anchor.rel="noopener noreferrer";
   anchor.setAttribute("aria-label","Read original story: "+story.title);
   anchor.title="Read the original source";
   meta.appendChild(anchor);
   title.style.cursor="pointer";
   title.addEventListener("click",()=>window.open(link,"_blank","noopener,noreferrer"));
  }
  card.append(tag,title,desc,meta);
  return card;
 });
 grid.replaceChildren(...cards);
}
function drawFeature(){
 const story=allStories[0];if(!story)return;
 featureTitle.textContent=story.title||"Real good news for today";
 featureDescription.textContent=story.summary||"A positive story, verified from its original source.";
 const link=safeOriginal(story.original_url);
 if(link){featureLink.href=link;featureLink.target="_blank";featureLink.rel="noopener noreferrer";featureLink.textContent="Read original story ↗"}
 else{featureLink.href="#stories";featureLink.removeAttribute("target");featureLink.textContent="Explore stories ↗"}
}
async function loadStories(){
 empty("Finding the good…");reload.disabled=true;
 try{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  let response;
  try{response=await fetch(API+"/news?limit=50",{headers:{Accept:"application/json"},signal:controller.signal,cache:"no-store"})}
  finally{clearTimeout(timeout)}
  if(!response.ok)throw Error("News service unavailable ("+response.status+")");
  const payload=await response.json();
  const items=payload?.data?.items||payload?.items||[];
  if(!Array.isArray(items))throw Error("Unexpected news response");
  const seen=new Set();
  allStories=items.filter(s=>{if(!s||!s.news_id||!s.title||seen.has(s.news_id))return false;seen.add(s.news_id);return true});
  drawFeature();filterStories();
 }catch(err){
  console.warn("The Good Side feed is temporarily unavailable:",err);
  empty("Our news feed is temporarily unavailable. Please try refreshing shortly.");
 }finally{reload.disabled=false}
}
filters.addEventListener("click",event=>{
 const btn=event.target.closest("button[data-category]");if(!btn)return;
 category=btn.dataset.category||"";
 filters.querySelectorAll("button[data-category]").forEach(el=>{
  const active=el===btn;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));
 });filterStories();
});
search.addEventListener("input",()=>{query=search.value;filterStories()});
reload.addEventListener("click",()=>void loadStories());
void loadStories();