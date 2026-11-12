"use strict";
const API="https://the-good-side-api.onrender.com";
const byId=id=>document.getElementById(id);
const grid=byId("stories-grid"),latest=byId("latest-feed"),popular=byId("most-read-feed"),search=byId("search"),filters=byId("filters"),reload=byId("reload");
let stories=[],category="",query="";
const allowedLink=url=>{try{const u=new URL(url);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e};
function canonical(item){return String(item?.news_id||item?.original_url||item?.title||"")}
function renderNews(){
 const filtered=stories.filter(s=>(!category||String(s.category||"").toLowerCase()===category)&&(!query||[s.title,s.summary,s.publisher,s.category].some(v=>String(v||"").toLowerCase().includes(query))));
 if(!filtered.length){grid.replaceChildren(make("p","news-loading",stories.length?"No matching stories. Try another category.":"No approved stories are available right now."));return}
 const cards=filtered.map(s=>{
  const card=make("article","editorial-card");
  const photo=allowedLink(s.image_url);
  if(photo){const img=make("img");img.src=photo;img.alt="Photo accompanying "+s.title;img.loading="lazy";img.referrerPolicy="no-referrer";img.onerror=()=>img.replaceWith(make("div","editorial-placeholder"));card.append(img)}
  else card.append(make("div","editorial-placeholder"));
  card.append(make("div","label",s.category||"Good news"));
  const title=make("h3","",s.title||"Positive news");
  const link=allowedLink(s.original_url);
  if(link){const a=make("a","",s.title||"Read story");a.href=link;a.target="_blank";a.rel="noopener noreferrer";title.replaceChildren(a)}
  card.append(title,make("p","",s.summary||"Read the original reporting for details."));
  if(link){const a=make("a","source-link","Read original source ↗");a.href=link;a.target="_blank";a.rel="noopener noreferrer";card.append(a)}
  return card
 });
 grid.replaceChildren(...cards)
}
function renderRails(){
 const railStories=stories.slice(0,5).map(s=>{
  const el=make("div","rail-story");
  el.append(make("span","rail-category",s.category||"GOOD NEWS"));
  const link=allowedLink(s.original_url);const a=make(link?"a":"strong","",s.title||"Read the story");
  if(link){a.href=link;a.target="_blank";a.rel="noopener noreferrer"}
  el.append(a,make("p","",s.summary||""));
  return el
 });
 latest.replaceChildren(...(railStories.length?railStories:[make("p","rail-note","More uplifting stories are on their way.")]));
 // There is no verified read-count API yet. Show approved articles as editor's picks, never claim a fake ranking.
 const picks=stories.slice(0,5).map((s,index)=>{
  const line=make("div","most-read-item"),num=make("b","",index+1),a=make("a","",s.title||"A good story");
  const link=allowedLink(s.original_url);if(link){a.href=link;a.target="_blank";a.rel="noopener noreferrer"}else a.removeAttribute("href");
  line.append(num,a);return line
 });
 popular.replaceChildren(...(picks.length?picks:[make("p","rail-note","Positive stories will appear here when available.")]));
 const heading=popular.previousElementSibling;if(heading&&heading.tagName==="H2")heading.textContent="EDITOR'S PICKS"
}
async function fetchStories(){
 reload.disabled=true;grid.replaceChildren(make("p","news-loading","Finding the good…"));
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),14000);
 try{
  const response=await fetch(API+"/news?limit=50",{headers:{Accept:"application/json"},cache:"no-store",signal:ctl.signal});
  if(!response.ok)throw Error("News service unavailable");
  const payload=await response.json();
  const items=payload?.data?.items||payload?.items||[];
  if(!Array.isArray(items))throw Error("Unexpected response");
  const seen=new Set();
  stories=items.filter(s=>{const id=canonical(s);if(!s?.title||seen.has(id))return false;seen.add(id);return true});
  renderRails();renderNews();
 }catch(err){console.warn("News feed error:",err);stories=[];renderRails();grid.replaceChildren(make("p","news-loading","The approved-news feed is temporarily unavailable. Please refresh later."))}
 finally{clearTimeout(timer)}
}
byId("atacama-read").addEventListener("click",()=>{
 const detail=byId("atacama-detail"),open=detail.hidden;detail.hidden=!open;byId("atacama-read").textContent=open?"Hide story ↑":"Read the story ↓";
 if(open)detail.scrollIntoView({behavior:"smooth",block:"nearest"});
});
filters.addEventListener("click",ev=>{
 const target=ev.target.closest("button[data-category]");if(!target)return;
 category=target.dataset.category;
 filters.querySelectorAll("button[data-category]").forEach(b=>{const active=b===target;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 renderNews()
});
document.querySelectorAll(".news-nav [data-filter]").forEach(a=>a.addEventListener("click",()=>{
 category=a.dataset.filter||"";
 filters.querySelectorAll("button[data-category]").forEach(b=>{let yes=b.dataset.category===category;b.classList.toggle("active",yes);b.setAttribute("aria-pressed",String(yes))});
 renderNews()
}));
search.addEventListener("input",()=>{query=search.value.trim().toLowerCase();renderNews()});
reload.addEventListener("click",fetchStories);
byId("email-interest-form").addEventListener("submit",ev=>{
 ev.preventDefault();const email=byId("email-interest").value.trim();
 if(!email)return;location.href="/account.html?email="+encodeURIComponent(email);
});
fetchStories();

function openRSSReader(item){
 const dialog=byId("rss-reader");
 if(!dialog||typeof dialog.showModal!=="function")return;
 const link=allowedLink(item.url);
 if(!link||new URL(link).hostname.replace(/^www\\./,"")!=="goodnewsnetwork.org")return;
 byId("rss-reader-title").textContent=item.title||"Good news";
 const date=item.published?new Date(item.published):null;
 byId("rss-reader-byline").textContent="Good News Network"+(date&&!Number.isNaN(+date)?" · "+date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"");
 byId("rss-reader-source").href=link;
 const approved=stories.find(story=>allowedLink(story.original_url)===link&&story.summary);
 byId("rss-reader-summary").textContent=approved
  ?approved.summary
  :"This headline comes from Good News Network. The complete original reporting remains available at the publisher.";
 byId("rss-reader-note").textContent=approved
  ?"This is The Good Side's approved summary, not the full publisher article."
  :"Read the complete original article using the publisher link below.";
 dialog.showModal();
}
byId("rss-reader-close")?.addEventListener("click",()=>byId("rss-reader").close());
byId("rss-reader-done")?.addEventListener("click",()=>byId("rss-reader").close());
byId("rss-reader")?.addEventListener("click",event=>{if(event.target===event.currentTarget)event.currentTarget.close()});

/* Live RSS is link discovery only; it does not bypass the approved article pipeline. */
async function loadGoodNewsNetwork(){
 const box=byId("rss-headlines"),refresh=byId("rss-refresh");
 if(!box||!refresh)return;
 refresh.disabled=true;
 box.replaceChildren(make("p","news-loading","Checking Good News Network…"));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{
  const response=await fetch("/.netlify/functions/goodnews-rss",{signal:controller.signal,headers:{Accept:"application/json"}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok||!Array.isArray(data.headlines))throw Error("RSS temporarily unavailable");
  const cards=data.headlines.map(item=>{
   const link=allowedLink(item.url);
   if(!link||new URL(link).hostname.replace(/^www\./,"")!=="goodnewsnetwork.org")return null;
   const card=make("article","rss-item"),title=make("button","rss-title rss-story-open",item.title);
   title.type="button";
   title.addEventListener("click",()=>openRSSReader(item));
   const details=make("div","rss-item-meta","GOOD NEWS NETWORK");
   if(item.published){
    const date=new Date(item.published);
    if(!Number.isNaN(+date))details.append(make("span","", " · "+date.toLocaleDateString("en-US",{month:"short",day:"numeric"})));
   }
   card.append(title,details);
   return card
  }).filter(Boolean);
  box.replaceChildren(...(cards.length?cards:[make("p","news-loading","No recent headlines from this feed.")]));
 }catch(error){
  console.warn("RSS headlines not available",error);
  box.replaceChildren(make("p","news-loading","The external headlines feed is temporarily unavailable. Your approved Good Side news remains accessible below."));
 }finally{clearTimeout(timer);refresh.disabled=false}
}
byId("rss-refresh")?.addEventListener("click",loadGoodNewsNetwork);
void loadGoodNewsNetwork();
