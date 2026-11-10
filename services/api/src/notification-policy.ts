/**
 * Notification scheduling foundation. Pure functions: no network calls or timers.
 * The backend must invoke this with a real clock and claim idempotency keys before sending.
 */
export type NotificationFrequency="daily"|"twice_daily"|"three_daily"|"selected_weekdays"|"breaking_only"|"digest_plus_alerts";
export type NotificationOptions={
 notification_enabled?:boolean|string;
 daily_digest_enabled?:boolean|string;
 notification_local_time?:string;
 notification_times?:string[]|string;
 notification_frequency?:NotificationFrequency|string;
 notification_timezone?:string;
 timezone?:string;
 notification_weekdays?:number[]|string;
 quiet_hours_start?:string;
 quiet_hours_end?:string;
 weekend_enabled?:boolean|string;
 food_notifications_enabled?:boolean|string;
 breaking_alerts_enabled?:boolean|string;
 notification_sound_enabled?:boolean|string;
};
const CLOCK=/^([01]\d|2[0-3]):[0-5]\d$/;
export const isOn=(value:unknown)=>value===true||value===1||value==="true"||value==="TRUE";
export const validTime=(time:unknown):time is string=>typeof time==="string"&&CLOCK.test(time);
export function parseTimes(raw:NotificationOptions["notification_times"],fallback="12:00"):string[]{
 let value:unknown=raw;
 if(typeof value==="string"){const raw=value;try{value=JSON.parse(raw)}catch{value=raw.split(",")}}
 const items=Array.isArray(value)?value:[];
 const times=[...new Set(items.filter(validTime))].sort();
 return times.length?times:validTime(fallback)?[fallback]:["12:00"];
}
export function parseWeekdays(raw:NotificationOptions["notification_weekdays"]):number[]{
 let value:unknown=raw;
 if(typeof value==="string"){const raw=value;try{value=JSON.parse(raw)}catch{value=raw.split(",")}}
 return [...new Set((Array.isArray(value)?value:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort();
}
export function inQuietHours(time:string,start?:string,end?:string):boolean{
 if(!validTime(start)||!validTime(end)||start===end)return false;
 return start<end?time>=start&&time<end:time>=start||time<end;
}
export function localParts(at:Date,timeZone:string){
 const formatter=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"});
 const parts=formatter.formatToParts(at);
 const get=(key:string)=>parts.find(p=>p.type===key)?.value||"";
 const wd=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(get("weekday"));
 return {date:`${get("year")}-${get("month")}-${get("day")}`,time:`${get("hour")}:${get("minute")}`,weekday:wd};
}
export function scheduleDecision(at:Date,p:NotificationOptions,kind:"digest"|"food"|"breaking"="digest"){
 if(!isOn(p.notification_enabled))return {due:false,reason:"disabled"} as const;
 const zone=p.notification_timezone||p.timezone||"UTC";
 try{new Intl.DateTimeFormat("en-US",{timeZone:zone})}catch{return {due:false,reason:"invalid_timezone"} as const}
 const local=localParts(at,zone);
 if(isOn(p.weekend_enabled)===false && p.weekend_enabled!==undefined && p.weekend_enabled!=="" && (local.weekday===0||local.weekday===6))return {due:false,reason:"weekend_disabled"} as const;
 const days=parseWeekdays(p.notification_weekdays);
 if(days.length&&!days.includes(local.weekday))return {due:false,reason:"weekday_disabled"} as const;
 if(inQuietHours(local.time,p.quiet_hours_start,p.quiet_hours_end))return {due:false,reason:"quiet_hours"} as const;
 if(kind==="food"&&!isOn(p.food_notifications_enabled))return {due:false,reason:"food_disabled"} as const;
 if(kind==="breaking"&&!isOn(p.breaking_alerts_enabled))return {due:false,reason:"breaking_disabled"} as const;
 if(kind==="digest"){
  if(!isOn(p.daily_digest_enabled))return {due:false,reason:"digest_disabled"} as const;
  if(p.notification_frequency==="breaking_only")return {due:false,reason:"breaking_only"} as const;
  const selected=parseTimes(p.notification_times,p.notification_local_time||"12:00");
  const count=p.notification_frequency==="twice_daily"?2:p.notification_frequency==="three_daily"?3:1;
  if(!selected.slice(0,count).includes(local.time))return {due:false,reason:"not_scheduled"} as const;
 }
 return {due:true,date:local.date,time:local.time,timezone:zone,kind} as const;
}
export const deliveryKey=(userId:string,date:string,time:string,deviceId:string,kind="digest")=>
 [userId,date,time,kind,deviceId].join(":");

/** Find the next eligible digest slot without relying on the server timezone.
 * Invalid or nonexistent local DST times are skipped rather than sending at the wrong hour.
 */
export function nextDigestAt(now:Date,p:NotificationOptions,daysAhead=15):Date|null{
 if(!isOn(p.notification_enabled)||!isOn(p.daily_digest_enabled)||p.notification_frequency==="breaking_only")return null;
 const zone=p.notification_timezone||p.timezone||"UTC";
 let date:string;
 try{date=localParts(now,zone).date}catch{return null}
 const[y,m,d]=date.split("-").map(Number);
 const times=parseTimes(p.notification_times,p.notification_local_time||"12:00");
 const count=p.notification_frequency==="twice_daily"?2:p.notification_frequency==="three_daily"?3:1;
 let best:Date|null=null;
 for(let day=0;day<daysAhead;day++){
  for(const hhmm of times.slice(0,count)){
   const[hh,mm]=hhmm.split(":").map(Number);
   const target=Date.UTC(y,m-1,d+day,hh,mm);
   let candidate=new Date(target);
   for(let j=0;j<4;j++){
    const observed=localParts(candidate,zone);
    const[yy,mo,dd]=observed.date.split("-").map(Number);
    const[hr,mi]=observed.time.split(":").map(Number);
    const offset=target-Date.UTC(yy,mo-1,dd,hr,mi);
    if(offset===0)break;
    candidate=new Date(candidate.getTime()+offset);
   }
   if(candidate>now&&scheduleDecision(candidate,p).due&&(!best||candidate<best))best=candidate;
  }
  if(best)return best;
 }
 return null;
}
