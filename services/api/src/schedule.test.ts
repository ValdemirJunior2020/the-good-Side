import test from "node:test";
import assert from "node:assert/strict";
import {chooseDigest,localClock,isValidTimezone} from "./schedule.js";
const article=(id:string,cat:string,score=90)=>({news_id:id,title:"Test story",category:cat,approval_status:"approved",confidence_score:String(score),source_published_at:"2026-11-06"});
test("prefers matching unseen approved story",()=>{assert.equal(chooseDigest([article("x","animals"),article("y","science",95)],["animals"],new Set())?.news_id,"x")});
test("fallback excludes repeats",()=>{assert.equal(chooseDigest([article("x","animals"),article("y","science")],["animals"],new Set(["x"]))?.news_id,"y")});
test("no fabricated fallback",()=>{assert.equal(chooseDigest([],[],new Set()),null)});
test("DST conversion",()=>{assert.deepEqual(localClock(new Date("2026-03-08T16:00:00Z"),"America/New_York"),{date:"2026-03-08",time:"12:00"})});
test("invalid tz",()=>{assert.equal(isValidTimezone("Mars/Lunar"),false)});
