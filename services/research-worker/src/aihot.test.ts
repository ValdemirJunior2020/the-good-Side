import {test} from "node:test";
import assert from "node:assert/strict";
import {isPublicArticleUrl,isEnglishHeadlineAndSummary,toDraft,validateAihotFeed,type AihotItem} from "./aihot.js";
const sample:AihotItem={id:"item1",title:"Community planted 100 trees",summary:"A local community planted trees.",
 source:{name:"Local News"},links:{original:"https://example.com/trees?utm_source=feed#top",aihot:"http://localhost:3000/item/1"},
 publishedAt:"2026-11-07T12:00:00Z",discoveredAt:"2026-11-07T13:00:00Z",category:"other",score:87,selected:true};
const positive={positive:true,confidence:90,positivity:85,summary:"Volunteers planted 100 trees.",category:"environment"};
test("only credible HTTPS publisher URLs qualify",()=>{
 assert.equal(isPublicArticleUrl("https://example.com/news"),true);
 for(const url of ["http://example.com","javascript:alert(1)","https://localhost/article","https://example.com@localhost/story","file:///tmp/test"])assert.equal(isPublicArticleUrl(url),false);
});
test("creates pending-review compatible candidate with publisher attribution",()=>{
 const result=toDraft(sample,positive);
 assert.ok(result);assert.equal(result.publisher,"Local News");assert.equal(result.original_url,"https://example.com/trees");
 assert.equal(result.category,"environment");assert.equal(result.confidence_score,90);
});
test("rejects nonpositive and unverified submissions",()=>{
 assert.equal(toDraft(sample,{...positive,positive:false}),null);
 assert.equal(toDraft({...sample,selected:false},positive),null);
 assert.equal(toDraft({...sample,publishedAt:null},positive),null);
 assert.equal(toDraft({...sample,score:30},positive),null);
 assert.equal(toDraft({...sample,links:{...sample.links,original:"http://example.com"}},positive),null);
});
test("API schema change fails closed",()=>{
 assert.throws(()=>validateAihotFeed({items:[]}));
 assert.equal(validateAihotFeed({schemaVersion:1,items:[sample]}).items.length,1);
});

test("English guard allows English positive news and blocks Chinese output",()=>{
 assert.equal(isEnglishHeadlineAndSummary("A student makes chocolate from British cocoa","Six bars created in England."),true);
 assert.equal(isEnglishHeadlineAndSummary("Community conservation efforts","A conservation project helps the Amazon。"),true);
 assert.equal(isEnglishHeadlineAndSummary("NVIDIA 发布新产品","AI news"),false);
 assert.equal(isEnglishHeadlineAndSummary("A good headline","这是中文摘要"),false);
});

test("automatic publication screening withholds low-confidence or weakly positive stories",()=>{
 assert.equal(toDraft(sample,{...positive,confidence:59}),null);
 assert.equal(toDraft(sample,{...positive,positivity:69}),null);
 assert.equal(toDraft(sample,{...positive,summary:"Short"}),null);
 assert.ok(toDraft(sample,{...positive,confidence:60,positivity:70}));
});
