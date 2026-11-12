import test from "node:test";
import assert from "node:assert/strict";
import {feedUrl,verifiedPublisherUrl,plausibleHeadline} from "./google-news.js";

test("Google RSS search keeps US English parameters",()=>{
 const u=new URL(feedUrl('"good news" when:7d'));
 assert.equal(u.hostname,"news.google.com");
 assert.equal(u.pathname,"/rss/search");
 assert.equal(u.searchParams.get("hl"),"en-US");
 assert.equal(u.searchParams.get("gl"),"US");
 assert.equal(u.searchParams.get("ceid"),"US:en");
});
test("Google wrapper must never be treated as a verified publisher original",()=>{
 assert.equal(verifiedPublisherUrl("https://news.google.com/rss/articles/CBMi123"),null);
 assert.equal(verifiedPublisherUrl("https://evil.example/good-news"),null);
 assert.equal(verifiedPublisherUrl("http://www.positive.news/article"),null);
 assert.equal(verifiedPublisherUrl("https://positive.news.evil.example/article"),null);
});
test("trusted HTTPS original is normalized without trackers",()=>{
 assert.equal(verifiedPublisherUrl("https://www.positive.news/story?utm_source=google&ref=home#story"),"https://www.positive.news/story?ref=home");
});
test("obvious violent and political headlines are withheld",()=>{
 assert.equal(plausibleHeadline("Election scandal shocks the country"),false);
 assert.equal(plausibleHeadline("Community volunteers restore an abandoned garden"),true);
});
