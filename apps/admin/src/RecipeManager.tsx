import React,{useEffect,useState} from "react";
import {RECIPE_SOURCES} from "./recipeSourceCatalog";

type Recipe={
 recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;
 servings:number;ingredients:string[]|string;instructions:string[]|string;dietary_tags:string;
 source_name:string;source_url:string;approval_status?:string;
};
type CreateResponse={recipe_id:string;status:string};
type Api=<T,>(path:string,options?:RequestInit)=>Promise<T>;
const lines=(text:string)=>text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
function extractList(value:string[]|string):string[]{
 if(Array.isArray(value))return value;
 try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.map(String):[String(value)]}catch{return lines(value)}
}
export function RecipeManager({api}:{api:Api}){
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [prep,setPrep]=useState("15"),[cook,setCook]=useState("20"),[servings,setServings]=useState("4");
 const [ingredients,setIngredients]=useState(""),[instructions,setInstructions]=useState("");
 const [tags,setTags]=useState(""),[publisher,setPublisher]=useState(""),[sourceUrl,setSourceUrl]=useState("");
 const [language,setLanguage]=useState<"en"|"pt"|"es">("en");
 const [publication,setPublication]=useState<"pending"|"approved">("pending");
 const [busy,setBusy]=useState(false),[feedback,setFeedback]=useState("");
 const [existing,setExisting]=useState<Recipe[]>([]);
 const refresh=async()=>{setExisting(await api<Recipe[]>("/recipes"))};
 useEffect(()=>{void refresh().catch(e=>setFeedback("Unable to read published recipes: "+String(e)))},[]);
 const save=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();setBusy(true);setFeedback("");
  try{
   const url=new URL(sourceUrl.trim());
   if(url.protocol!=="https:"||url.username||url.password)throw Error("Use the original HTTPS recipe link.");
   const ingredientList=lines(ingredients),stepList=lines(instructions);
   if(!ingredientList.length||!stepList.length)throw Error("Add at least one ingredient and one instruction.");
   if(ingredientList.length>80||stepList.length>80)throw Error("Limit ingredients and instructions to 80 lines each.");
   if([...ingredientList,...stepList].some(x=>x.length>500))throw Error("Each ingredient or instruction must be under 500 characters.");
   const prepMinutes=Number(prep),cookMinutes=Number(cook),servingCount=Number(servings);
   if(!Number.isInteger(prepMinutes)||prepMinutes<0||prepMinutes>1440||!Number.isInteger(cookMinutes)||cookMinutes<0||cookMinutes>1440||!Number.isInteger(servingCount)||servingCount<1||servingCount>100)throw Error("Check time and serving values.");
   if(publication==="approved"&&!window.confirm("PUBLISH THIS RECIPE NOW to The Good Side iOS Food tab?\n\n"+title+"\nSource: "+sourceUrl+"\n\nPlease verify the recipe, source attribution, and content permissions first."))return;
   const out=await api<CreateResponse>("/admin/recipes",{method:"POST",body:JSON.stringify({
    title:title.trim(),description:description.trim(),prep_minutes:prepMinutes,cook_minutes:cookMinutes,servings:servingCount,
    ingredients:ingredientList,instructions:stepList,dietary_tags:tags.trim(),
    source_name:publisher.trim(),source_url:url.toString(),language,approval_status:publication
   })});
   await refresh();
   setFeedback(out.status==="approved"?"Recipe saved to Google Sheets and published to the iOS Food tab. No push was sent.":"Recipe saved to Google Sheets as pending. Only approved recipes show in the app.");
   setTitle("");setDescription("");setIngredients("");setInstructions("");setPublisher("");setSourceUrl("");setTags("");
  }catch(err){setFeedback(err instanceof Error?err.message:"Unable to save recipe")}finally{setBusy(false)}
 };
 return <div style={{display:"grid",gap:20}}>
  <div className="panel form-panel">
   <h2>Food & Recipe Manager</h2>
   <p className="description">Save to the existing RECIPES tab. Choose Draft (pending) or Publish to the iOS Food screen. Recipe alerts are a separate feature and are not triggered by this form.</p>
   {feedback&&<p role="status" className="notice">{feedback}</p>}
   <form onSubmit={save}>
    <label>Recipe title<input required maxLength={200} minLength={3} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Easy lemon and chickpea bowl"/></label>
    <label>Short description<textarea required maxLength={1200} value={description} onChange={e=>setDescription(e.target.value)} placeholder="A simple recipe and why it is worth trying."/></label>
    <div className="two">
     <label>Prep minutes<input required type="number" min="0" max="1440" value={prep} onChange={e=>setPrep(e.target.value)}/></label>
     <label>Cook minutes<input required type="number" min="0" max="1440" value={cook} onChange={e=>setCook(e.target.value)}/></label>
    </div>
    <div className="two">
     <label>Servings<input required type="number" min="1" max="100" value={servings} onChange={e=>setServings(e.target.value)}/></label>
     <label>Language<select value={language} onChange={e=>setLanguage(e.target.value as "en"|"pt"|"es")}><option value="en">English</option><option value="pt">Português</option><option value="es">Español</option></select></label>
    </div>
    <label>Ingredients — one per line<textarea required rows={6} maxLength={15000} value={ingredients} onChange={e=>setIngredients(e.target.value)} placeholder={"1 cup cooked chickpeas\n1 lemon\n2 tbsp olive oil"}/></label>
    <label>Instructions — one step per line<textarea required rows={6} maxLength={15000} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder={"Drain the chickpeas.\nMix all ingredients.\nServe fresh."}/></label>
    <label>Dietary tags (optional)<input maxLength={200} value={tags} onChange={e=>setTags(e.target.value)} placeholder="vegetarian, easy, budget"/></label>
    <label>Original recipe publisher<input required minLength={2} maxLength={150} value={publisher} onChange={e=>setPublisher(e.target.value)} placeholder="Budget Bytes"/></label>
    <label>Original recipe URL<input required type="url" pattern="https://.*" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://example.com/recipe-name"/></label>
    <label>Publication status<select value={publication} onChange={e=>setPublication(e.target.value as "pending"|"approved")}><option value="pending">Save as draft (not visible in app)</option><option value="approved">Publish to iOS Food tab now</option></select></label>
    <div className="notice">Use your own factual description and recipe instructions or properly licensed material. Keep original-source attribution. This first version does not import copyrighted text or photographs automatically.</div>
    <button className="primary" type="submit" disabled={busy||!title.trim()||!ingredients.trim()||!instructions.trim()||!sourceUrl.trim()||!publisher.trim()}>{busy?"Saving…":publication==="approved"?"Publish recipe to app →":"Save recipe draft →"}</button>
   </form>
  </div>
  <div className="panel form-panel">
   <h2>Published recipes</h2><p className="description">{existing.length} recipes currently available to the iPhone Food section.</p>
   {existing.length===0?<p className="hint">No published recipes yet.</p>:existing.map(r=><article key={r.recipe_id} className="source-preview" style={{marginBottom:12}}><strong>{r.title}</strong><p>{r.description}</p><p className="hint">{Number(r.prep_minutes)+Number(r.cook_minutes)} minutes · {r.servings} servings · {extractList(r.ingredients).length} ingredients</p><a href={r.source_url} target="_blank" rel="noopener noreferrer">Original: {r.source_name} ↗</a></article>)}
  </div>
  <div className="panel form-panel">
   <h2>15 recipe source websites</h2><p className="description">Saved in the source catalog for future review. No scraper, subscriptions or automated republication are enabled.</p>
   <div style={{display:"grid",gap:10}}>{RECIPE_SOURCES.map(s=><div className="source-preview" key={s.homepage}><strong>{s.name}</strong><p className="hint"><a href={s.homepage} target="_blank" rel="noopener noreferrer">{s.homepage}</a></p></div>)}</div>
  </div>
 </div>;
}
