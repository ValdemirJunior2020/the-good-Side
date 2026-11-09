import test from "node:test";import assert from "node:assert/strict";
import{scheduleDecision,inQuietHours,parseTimes,isOn,deliveryKey}from "./notification-policy.js";
const at=new Date("2026-11-09T17:00:00Z"); // 12 PM in New York (EST)
test("does not accidentally treat string false as enabled",()=>{assert.equal(isOn("false"),false);assert.equal(scheduleDecision(at,{notification_enabled:"false",daily_digest_enabled:true,timezone:"America/New_York"}).due,false)});
test("noon in user's timezone",()=>{assert.equal(scheduleDecision(at,{notification_enabled:true,daily_digest_enabled:true,notification_local_time:"12:00",timezone:"America/New_York"}).due,true)});
test("quiet hours include crossing midnight",()=>{assert.equal(inQuietHours("23:00","22:00","07:00"),true);assert.equal(inQuietHours("06:59","22:00","07:00"),true);assert.equal(inQuietHours("12:00","22:00","07:00"),false)});
test("food is always blocked by quiet hours",()=>{assert.equal(scheduleDecision(at,{notification_enabled:true,food_notifications_enabled:true,quiet_hours_start:"11:00",quiet_hours_end:"13:00",timezone:"America/New_York"},"food").due,false)});
test("parse multiple times and remove duplicates",()=>{assert.deepEqual(parseTimes('["12:00","08:00","12:00"]'),["08:00","12:00"])});
test("weekends disabled",()=>{assert.equal(scheduleDecision(new Date("2026-11-08T17:00:00Z"),{notification_enabled:true,daily_digest_enabled:true,notification_local_time:"12:00",timezone:"America/New_York",weekend_enabled:false}).due,false)});
test("stable unique delivery keys per device/time",()=>{assert.notEqual(deliveryKey("u","2026-11-09","12:00","a"),deliveryKey("u","2026-11-09","15:00","a"))});
