import test from "node:test";
import assert from "node:assert/strict";
import {qualityIssues} from "./recipe-quality.js";
const base={ingredients:["200g flour","2 eggs","1 cup milk"],instructions:["Whisk together the wet ingredients.","Fold flour through until combined.","Cook on a medium hot skillet until set."],prep_minutes:10,cook_minutes:15,servings:4,quality_score:92};
test("accepts complete ordinary vegetarian recipes",()=>assert.deepEqual(qualityIssues(base),[]));
test("rejects zero prep and cook minutes",()=>{
 const issues=qualityIssues({...base,prep_minutes:0,cook_minutes:0});
 assert.ok(issues.some(x=>x.includes("preparation time")));
 assert.ok(issues.some(x=>x.includes("cooking time")));
});
test("rejects poultry instructions missing safe thermometer reading",()=>{
 const issues=qualityIssues({...base,ingredients:["200g chicken breast","2 eggs","1 cup milk"]});
 assert.ok(issues.some(x=>x.includes("165")));
 assert.deepEqual(qualityIssues({...base,ingredients:["200g chicken breast","2 eggs","1 cup milk"],instructions:[...base.instructions,"Cook the chicken to 165 F using a food thermometer."]}),[]);
});
test("rejects ground lamb lacking temperature, accepts 160 F",()=>{
 const ing=["800g lamb mince","1 pepper","1 tsp oil"];
 assert.ok(qualityIssues({...base,ingredients:ing}).some(x=>x.includes("160")));
 assert.deepEqual(qualityIssues({...base,ingredients:ing,instructions:[...base.instructions,"Confirm 160 F in the center using a thermometer."]}),[]);
});
test("rejects invalid servings and implausible times",()=>{
 const issues=qualityIssues({...base,servings:0,prep_minutes:999});
 assert.equal(issues.length,2);
});
