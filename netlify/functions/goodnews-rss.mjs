// Public live headlines only. No article body/image is stored or redistributed.
// RSS source: https://www.goodnewsnetwork.org/feed/
// A response is generated on demand and cached briefly by Netlify's CDN.
const RSS="https://www.goodnewsnetwork.org/feed/";
const MAX_BYTES=600_000;
function decodeXml(value){
 return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/&#([0-9]+);/g,(_,n)=>String.fromCodePoint(parseInt(n,10)))
  .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
}
function field(item,name){
 const re=new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i");
 const m=item.match(re);
 return m?decodeXml(m[1]):"";
}
function safeLink(s){
 try{
  const u=new URL(s);
  if(u.protocol!=="https:"||u.username||u.password)return null;
  if(!["goodnewsnetwork.org","www.goodnewsnetwork.org"].includes(u.hostname.toLowerCase()))return null;
  return u.toString()
 }catch{return null}
}
export async function handler(event){
 if(event.httpMethod&&event.httpMethod!=="GET")return {statusCode:405,body:"Method not allowed"};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),11000);
 try{
  const response=await fetch(RSS,{
   headers:{"Accept":"application/rss+xml, application/xml;q=0.9, text/xml;q=0.8","User-Agent":"TheGoodSideRSSHeadlines/1.0 (+https://thegoodsidenews.com)"},
   signal:controller.signal
  });
  if(!response.ok)throw Error("RSS source unavailable");
  const xml=await response.text();
  if(xml.length>MAX_BYTES||!xml.includes("<rss"))throw Error("Invalid RSS response");
  const items=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,18);
  const seen=new Set(),headlines=[];
  for(const match of items){
   const item=match[1],title=field(item,"title"),url=safeLink(field(item,"link"));
   if(!title||title.length>250||!url||seen.has(url))continue;
   // Keep only unmodified headline and publisher link, not article excerpts,
   // article HTML, or embedded copyrighted thumbnails.
   seen.add(url);
   const date=new Date(field(item,"pubDate"));const published=Number.isNaN(+date)?null:date.toISOString();
   headlines.push({title,url,published,publisher:"Good News Network"});
   if(headlines.length>=12)break;
  }
  return {statusCode:200,headers:{"Content-Type":"application/json; charset=utf-8",
   "Cache-Control":"public, max-age=0, s-maxage=900, stale-while-revalidate=1800",
   "Access-Control-Allow-Origin":"https://thegoodsidenews.com",
   "X-Content-Type-Options":"nosniff"},
   body:JSON.stringify({ok:true,source:RSS,headlines,storedImages:0})};
 }catch(e){
  console.error("Good News Network live RSS:",e instanceof Error?e.message:e);
  return {statusCode:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"},
   body:JSON.stringify({ok:false,error:"News headlines are temporarily unavailable"})};
 }finally{clearTimeout(timeout)}
}