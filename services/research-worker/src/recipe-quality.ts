/** Conservative editorial checks independent of Ollama's self-reported score. */
export type CookingDraft={ingredients:string[];instructions:string[];prep_minutes:number;cook_minutes:number;servings:number;quality_score:number};
export function qualityIssues(draft:CookingDraft):string[]{
 const issues:string[]=[];
 if(!Number.isInteger(draft.prep_minutes)||draft.prep_minutes<1||draft.prep_minutes>360)issues.push("Missing or unrealistic preparation time");
 if(!Number.isInteger(draft.cook_minutes)||draft.cook_minutes<1||draft.cook_minutes>720)issues.push("Missing or unrealistic cooking time");
 if(!Number.isInteger(draft.servings)||draft.servings<1||draft.servings>24)issues.push("Invalid servings");
 if(!Number.isInteger(draft.quality_score)||draft.quality_score<85||draft.quality_score>100)issues.push("Ollama rejected quality threshold");
 if(draft.ingredients.length<3||draft.instructions.length<3||draft.instructions.length>12)issues.push("Recipe has incomplete ingredients or instructions");
 if(draft.instructions.some(s=>s.trim().length<12))issues.push("Recipe directions too brief");
 const items=draft.ingredients.join(" ").toLowerCase();
 const directions=draft.instructions.join(" ").toLowerCase();
 // Internal temperature checks follow FDA/USDA recommendations.
 // They are conservative: ambiguous meat recipes stay in drafts rather than auto-publish.
 const poultry=/\b(chicken|turkey|duck|poultry)\b/.test(items);
 const ground=/\b(minced?\s+(?:beef|lamb|pork|veal)|ground\s+(?:beef|lamb|pork|veal)|(?:beef|lamb|pork|veal)\s+mince|lamb mince|burger meat)\b/.test(items);
 const poultrySafe=/\b(?:165\s*°?\s*f|74\s*°?\s*c)\b/i.test(directions);
 const groundSafe=/\b(?:160\s*°?\s*f|71\s*°?\s*c)\b/i.test(directions);
 if(poultry&&!poultrySafe)issues.push("Poultry requires a food thermometer instruction of at least 165 F / 74 C");
 if(ground&&!groundSafe)issues.push("Ground meat requires a food thermometer instruction of at least 160 F / 71 C");
 return issues;
}
