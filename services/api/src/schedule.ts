export type DigestCandidate = {news_id:string; title:string; category:string; approval_status:string; confidence_score:string; source_published_at:string};
export function chooseDigest(articles:DigestCandidate[], interests:string[], previouslySent:Set<string>) {
  const approved=articles.filter(a=>a.approval_status==="approved" && !previouslySent.has(a.news_id));
  const matching=approved.filter(a=>interests.includes(a.category));
  const pool=matching.length?matching:approved;
  return [...pool].sort((a,b)=>Number(b.confidence_score||0)-Number(a.confidence_score||0)||Date.parse(b.source_published_at||"0")-Date.parse(a.source_published_at||"0"))[0]||null;
}
export function localClock(instant:Date,tz:string) {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(instant);
  const get=(s:string)=>parts.find(p=>p.type===s)?.value||"";
  return {time:get("hour").padStart(2,"0")+":"+get("minute"),date:get("year")+"-"+get("month")+"-"+get("day")};
}
export function isValidTimezone(tz:string) { try { new Intl.DateTimeFormat("en-US",{timeZone:tz});return true; }catch{return false;} }
