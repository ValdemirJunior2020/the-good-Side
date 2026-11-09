import test from "node:test";import assert from "node:assert/strict";
import{scheduleDecision,inQuietHours,parseTimes,isOn,deliveryKey,nextDigestAt}from "./notification-policy.js";
const at=new Date("2026-11-09T17:00:00Z"); // 12 PM in New York (EST)
test("does not accidentally treat string false as enabled",()=>{assert.equal(isOn("false"),false);assert.equal(scheduleDecision(at,{notification_enabled:"false",daily_digest_enabled:true,timezone:"America/New_York"}).due,false)});
test("noon in user's timezone",()=>{assert.equal(scheduleDecision(at,{notification_enabled:true,daily_digest_enabled:true,notification_local_time:"12:00",timezone:"America/New_York"}).due,true)});
test("quiet hours include crossing midnight",()=>{assert.equal(inQuietHours("23:00","22:00","07:00"),true);assert.equal(inQuietHours("06:59","22:00","07:00"),true);assert.equal(inQuietHours("12:00","22:00","07:00"),false)});
test("food is always blocked by quiet hours",()=>{assert.equal(scheduleDecision(at,{notification_enabled:true,food_notifications_enabled:true,quiet_hours_start:"11:00",quiet_hours_end:"13:00",timezone:"America/New_York"},"food").due,false)});
test("parse multiple times and remove duplicates",()=>{assert.deepEqual(parseTimes('["12:00","08:00","12:00"]'),["08:00","12:00"])});
test("weekends disabled",()=>{assert.equal(scheduleDecision(new Date("2026-11-08T17:00:00Z"),{notification_enabled:true,daily_digest_enabled:true,notification_local_time:"12:00",timezone:"America/New_York",weekend_enabled:false}).due,false)});
test("stable unique delivery keys per device/time",()=>{assert.notEqual(deliveryKey("u","2026-11-09","12:00","a"),deliveryKey("u","2026-11-09","15:00","a"))});

test("two daily deliveries fire separately",()=>{
 const base={notification_enabled:true,daily_digest_enabled:true,timezone:"America/New_York",notification_frequency:"twice_daily",notification_times:["08:00","12:00"]};
 assert.equal(scheduleDecision(new Date("2026-11-09T13:00:00Z"),base).due,true);
 assert.equal(scheduleDecision(new Date("2026-11-09T17:00:00Z"),base).due,true);
 assert.equal(scheduleDecision(new Date("2026-11-09T18:00:00Z"),base).due,false);
});
test("respects spring DST transition in New York",()=>{
 const opts={notification_enabled:true,daily_digest_enabled:true,timezone:"America/New_York",notification_times:["12:00"]};
 assert.equal(scheduleDecision(new Date("2027-03-13T17:00:00Z"),opts).due,true);
 assert.equal(scheduleDecision(new Date("2027-03-14T16:00:00Z"),opts).due,true);
});
test("breaking alerts require explicit opt-in and obey quiet hours",()=>{
 const opts={notification_enabled:true,breaking_alerts_enabled:false,timezone:"America/New_York"};
 assert.equal(scheduleDecision(at,opts,"breaking").due,false);
 assert.equal(scheduleDecision(at,{...opts,breaking_alerts_enabled:true,quiet_hours_start:"11:00",quiet_hours_end:"13:00"},"breaking").due,false);
});

test("next notification preview follows timezone and DST",()=>{
 const p={notification_enabled:true,daily_digest_enabled:true,notification_timezone:"America/New_York",notification_times:["12:00"]};
 assert.equal(nextDigestAt(new Date("2027-03-14T14:00:00Z"),p)?.toISOString(),"2027-03-14T16:00:00.000Z");
});
test("next notification honors weekends and quiet hours",()=>{
 const p={notification_enabled:true,daily_digest_enabled:true,notification_timezone:"America/New_York",notification_times:["12:00"],weekend_enabled:false};
 assert.equal(nextDigestAt(new Date("2026-11-07T16:00:00Z"),p)?.toISOString(),"2026-11-09T17:00:00.000Z");
 assert.equal(nextDigestAt(new Date("2026-11-09T14:00:00Z"),{...p,quiet_hours_start:"11:00",quiet_hours_end:"13:00"}),null);
});
