import "dotenv/config";
import {config as loadEnv} from "dotenv";
import {XMLParser} from "fast-xml-parser";
import {createHash} from "node:crypto";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../../../",import.meta.url));
loadEnv({path:join(root,"services","api",".env")});
const TARGET=10;
const requestedPublish=process.argv.includes("--publish");
const out=join(root,"services","research-worker","data","news-backfill-140-preview.json");
const groups:Record<string,{keywords:RegExp;feeds:string[]}>={
 science:{keywords:/science|discover|research|astronom|space|physics|study|scientist|breakthrough/i,feeds:["https://www.goodnewsnetwork.org/category/news/science/feed/","https://www.goodnewsnetwork.org/feed/"]},
 medical:{keywords:/health|medical|treatment|patient|cure|hospital|surgery|clinical|disease|seizure|therapy/i,feeds:["https://www.goodnewsnetwork.org/category/news/health/feed/","https://www.goodnewsnetwork.org/feed/"]},
 kindness:{keywords:/kindness|kind|gift|generos|donat|help|volunteer|stranger|compassion/i,feeds:["https://www.goodnewsnetwork.org/category/news/inspiring/feed/","https://www.goodnewsnetwork.org/feed/"]},
 animals:{keywords:/animal|wildlife|dog|cat|bird|whale|turtle|bear|rescue|species|elephant|orangutan|penguin/i,feeds:["https://www.goodnewsnetwork.org/category/news/environment/animals/feed/","https://www.goodnewsnetwork.org/feed/"]},
 environment:{keywords:/forest|climate|conserv|ocean|ecosystem|environment|renewable|habitat|river|rewild|restor/i,feeds:["https://www.goodnewsnetwork.org/category/news/environment/feed/","https://www.positive.news/feed/"]},
 technology:{keywords:/technolog|AI |app |robot|invention|engineer|device|battery|software|solar|energy storage/i,feeds:["https://www.goodnewsnetwork.org/category/news/science/feed/","https://www.goodnewsnetwork.org/feed/"]},
 achievements:{keywords:/record|first|milestone|achievement|world's|historic|wins|award|triumph|surpass/i,feeds:["https://www.goodnewsnetwork.org/category/news/inspiring/feed/","https://www.goodnewsnetwork.org/feed/"]},
 community:{keywords:/community|neighbo|volunteer|rescu|charity|town|local|hero|school|fundrais/i,feeds:["https://www.goodnewsnetwork.org/category/news/good-news/heroes/feed/","https://www.goodnewsnetwork.org/feed/"]},
 education:{keywords:/student|school|teacher|scholar|education|university|college|literacy|learn|classroom/i,feeds:["https://www.goodnewsnetwork.org/category/news/kids/feed/","https://www.goodnewsnetwork.org/feed/"]},
 sports:{keywords:/sport|athlete|team|champion|marathon|football|soccer|basketball|swim|olympic|boxing/i,feeds:["https://www.goodnewsnetwork.org/category/news/sports/feed/","https://www.goodnewsnetwork.org/feed/"]},
 families:{keywords:/family|children|child|kid|baby|daughter|son|mother|father|parent|adopt|reunion/i,feeds:["https://www.goodnewsnetwork.org/category/news/inspiring/kids/feed/","https://www.goodnewsnetwork.org/feed/"]},
 "world-progress":{keywords:/global|world|international|peace|poverty|countries|nation|progress|humanitarian|development/i,feeds:["https://www.goodnewsnetwork.org/category/news/world/feed/","https://www.positive.news/feed/"]},
 faith:{keywords:/faith|religio|church|prayer|christian|worship|chaplain|spiritual|believ/i,feeds:["https://www.goodnewsnetwork.org/category/news/religion/feed/","https://www.goodnewsnetwork.org/feed/"]},
 food:{keywords:/food|meal|cook|chef|kitchen|restaurant|farm|grow|chocolate|agriculture|nutrition/i,feeds:["https://www.goodnewsnetwork.org/category/news/lifestyle/feed/","https://www.goodnewsnetwork.org/feed/"]}
};
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:"@",trimValues:true});
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const value=(x:any)=>typeof x==="string"?x:typeof x==="number"?String(x):x&&typeof x==="object"?String(x["#text"]||x["@href"]||""):"";
const clean=(s:string)=>s.replace(/<[^>]+>/g," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
const bad=/\b(murder|massacre|shooting|war crimes|election campaign|scandal|advertisement|sponsored)\b/i;
const fetchText=async(url:string,timeout=12000)=>{const a=new AbortController();const timer=setTimeout(()=>a.abort(),timeout);try{const response=await fetch(url,{signal:a.signal,headers:{"User-Agent":"Mozilla/5.0 (compatible; TheGoodSideResearch/1.0)","Accept":"text/html,application/xml,application/rss+xml,*/*"}});if(!response.ok)throw Error("HTTP "+response.status);return await response.text();}finally{clearTimeout(timer)}};
const imageFrom=(item:any)=>{const m=item["media:content"]||item["media:thumbnail"]||item.enclosure;const candidates=[m?.["@url"],m?.[0]?.["@url"],item["itunes:image"]?.["@href"]];for(const u of candidates)if(typeof u==="string"&&u.startsWith("https://"))return u;const raw=value(item["content:encoded"]||item.description);const match=raw.match(/<img[^>]+(?:src|data-src)=["'](https:\/\/[^"']+)["']/i);return match?.[1]||""};
const ogImage=async(url:string)=>{try{const h=await fetchText(url,10000);const match=h.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i)||h.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);return match?.[1]?.replace(/&amp;/g,"&")||""}catch{return""}};
const imageWorks=async(url:string)=>{try{const a=new AbortController();const timer=setTimeout(()=>a.abort(),9000);try{const r=await fetch(url,{method:"HEAD",signal:a.signal});return r.ok&&(r.headers.get("content-type")||"").startsWith("image/")}finally{clearTimeout(timer)}}catch{return false}};
type Story={news_id:string;title:string;summary:string;full_summary:string;category:string;language:string;country:string;publisher:string;original_url:string;image_url:string;source_published_at:string;content_hash:string;confidence_score:number;positivity_score:number;approval_status:string;image_credit:string};
const byCategory=new Map<string,Story[]>();const seen=new Set<string>();const feedCache=new Map<string,any[]>();
for(const [category,g] of Object.entries(groups)){
 const selected:Story[]=[];
 for(const feed of [...g.feeds,...g.feeds.map(f=>f+(f.includes("?")?"&":"?")+"paged=2"),...g.feeds.map(f=>f+(f.includes("?")?"&":"?")+"paged=3")]){
  if(selected.length>=TARGET)break;
  let entries=feedCache.get(feed);
  if(!entries){try{const xml=parser.parse(await fetchText(feed));const got=xml?.rss?.channel?.item||xml?.feed?.entry||[];entries=Array.isArray(got)?got:[got];feedCache.set(feed,entries)}catch(e){console.warn("Feed skipped:",feed,String(e));continue}}
  for(const item of entries){
   if(selected.length>=TARGET)break;
   const title=clean(value(item?.title)),url=value(item?.link||item?.guid),desc=clean(value(item?.description||item?.summary||item?.["content:encoded"]));
   if(title.length<20||desc.length<35||bad.test(title)||!g.keywords.test(title+" "+desc.slice(0,250)))continue;
   let link:URL;try{link=new URL(url);if(link.protocol!=="https:"||!["goodnewsnetwork.org","positive.news"].some(d=>link.hostname===d||link.hostname.endsWith("."+d)))continue}catch{continue}
   if(seen.has(link.toString()))continue;
   const published=new Date(value(item?.pubDate||item?.published||item?.updated));if(!Number.isFinite(published.getTime())||Date.now()-published.getTime()>120*86400000)continue;
   let image=imageFrom(item);if(!image)image=await ogImage(link.toString());
   if(!/^https:\/\//.test(image)||!(await imageWorks(image)))continue;
   const summary=desc.slice(0,400);
   if(summary.length<35)continue;
   const story:Story={news_id:sha(link.toString()).slice(0,24),title:title.slice(0,280),summary,full_summary:desc.slice(0,1400),category,language:"en",country:"",publisher:link.hostname.includes("positive.news")?"Positive News":"Good News Network",original_url:link.toString(),image_url:image,source_published_at:published.toISOString(),content_hash:sha(title.toLowerCase().replace(/[^a-z0-9]/g,"")),confidence_score:80,positivity_score:80,approval_status:"pending",image_credit:"Illustrative image from the linked publisher"};
   selected.push(story);seen.add(link.toString());
  }
 }
 byCategory.set(category,selected);console.log(category,selected.length,"/",TARGET);
}
const stories=[...byCategory.values()].flat();await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify({generated_at:new Date().toISOString(),target:140,total:stories.length,counts:Object.fromEntries([...byCategory].map(([k,v])=>[k,v.length])),stories},null,2)+"\n");
console.log("Preview saved:",out,"verified unique stories with working images:",stories.length);
if(requestedPublish){
 const endpoint=process.env.APPS_SCRIPT_URL,secret=process.env.APPS_SCRIPT_SHARED_SECRET;
 if(!endpoint||!secret)throw Error("Missing APPS_SCRIPT_URL or APPS_SCRIPT_SHARED_SECRET in services/api/.env; preview saved, nothing published.");
 if(stories.length===0)throw Error("No source-verified stories with working image URLs were found. Nothing was published.");\n if(stories.length<140)console.warn("Coverage warning:",stories.length,"/140 stories with tested image URLs. Publishing only the valid matches and reporting gaps.");
 let published=0;
 for(const story of stories){
  for(const [action,payload] of [["addNews",{...story,actor_id:"goodside-backfill"}],["setNewsStatus",{news_id:story.news_id,status:"approved",actor_id:"goodside-backfill"}]] as const){
   const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"text/plain;charset=utf-8"},body:JSON.stringify({secret,action,payload})});
   const data=await r.json() as {ok:boolean;error?:string};if(!r.ok||!data.ok)throw Error("Database rejected "+action+" for "+story.news_id+": "+(data.error||r.status));
  }
  published++;
 }
 console.log("Published to EXISTING Google Sheets news database:",published);
}
