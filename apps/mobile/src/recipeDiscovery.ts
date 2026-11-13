/** TheMealDB development-only discovery. Public app distribution requires a supporter key
 * and a review of image/content usage terms; no data is silently republished. */
export type MealPreview={
 id:string;title:string;image_url:string;group:string;country:string;source_url:string;
};
export type MealDetails=MealPreview & {description:string;ingredients:string[];instructions:string[];source_name:string;prep_minutes:number;cook_minutes:number;servings:number};
export const CUISINES=[
 "American","Brazilian","Italian","Egyptian","Turkish","Moroccan","British","Canadian",
 "Mexican","Indian","Japanese","Chinese","Thai","Vietnamese","French","Greek","Spanish","Jamaican","Portuguese"
] as const;
export const STARTER_GROUPS=[
 {title:"American favorites",key:"american",count:10,query:"a=American",country:"American"},
 {title:"Sweet desserts",key:"desserts",count:5,query:"c=Dessert",country:"World"},
 {title:"Pasta nights",key:"pasta",count:5,query:"c=Pasta",country:"Italian"},
 {title:"Middle Eastern table",key:"middle-east",count:5,query:"a=Egyptian",country:"Egyptian"},
 {title:"Brazilian kitchen",key:"brazilian",count:5,query:"a=Brazilian",country:"Brazilian"}
] as const;
const BASE="https://www.themealdb.com/api/json/v1/1";
async function meals(path:string):Promise<any[]>{
 const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const res=await fetch(BASE+"/"+path,{signal:ctl.signal});
  if(!res.ok)throw Error("Recipe provider unavailable ("+res.status+")");
  const obj=await res.json() as {meals?:any[]|null};
  return Array.isArray(obj.meals)?obj.meals:[];
 }finally{clearTimeout(timer)}
}
const select=(r:any,group:string,country:string):MealPreview=>({
 id:"mealdb-"+String(r.idMeal),title:String(r.strMeal||"Recipe"),
 image_url:String(r.strMealThumb||""),group,country,source_url:"https://www.themealdb.com/meal/"+String(r.idMeal)
});
function distinct(items:MealPreview[]):MealPreview[]{return items.filter((m,i,a)=>m.id!=="mealdb-undefined"&&Boolean(m.image_url)&&a.findIndex(other=>other.id===m.id)===i)}
export async function getStarterMeals():Promise<MealPreview[]>{
 const responses=await Promise.allSettled(STARTER_GROUPS.map(g=>meals("filter.php?"+g.query)));
 const used=new Set<string>();
 const result:MealPreview[]=[];
 responses.forEach((r,i)=>{
  if(r.status!=="fulfilled")return;
  const g=STARTER_GROUPS[i];
  for(const raw of r.value){
   const m=select(raw,g.key,g.country);
   if(!m.image_url||used.has(m.id))continue;
   result.push(m);used.add(m.id);
   if(result.filter(x=>x.group===g.key).length>=g.count)break;
  }
 });
 if(!result.length)throw Error("Recipe previews are temporarily unavailable. Pull down to retry.");
 return distinct(result);
}
export async function getCountryMeals(country:string):Promise<MealPreview[]>{
 if(!CUISINES.includes(country as any))return [];
 return distinct((await meals("filter.php?a="+encodeURIComponent(country))).map(v=>select(v,"country",country)));
}
export async function getMealDetails(id:string):Promise<MealDetails>{
 if(!/^mealdb-\d{3,9}$/.test(id))throw Error("Invalid recipe ID");
 const [raw]=await meals("lookup.php?i="+id.slice(7));
 if(!raw)throw Error("Recipe unavailable");
 const ingredients=Array.from({length:20},(_,i)=>{
  const k=i+1,ingredient=String(raw["strIngredient"+k]||"").trim(),measure=String(raw["strMeasure"+k]||"").trim();
  return ingredient?(measure?measure+" ":"")+ingredient:"";
 }).filter(Boolean);
 const instructions=String(raw.strInstructions||"").replace(/\r/g,"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
 const source=String(raw.strSource||"");
 return {...select(raw,"country",String(raw.strArea||"World")),
  description:"A "+String(raw.strArea||"world")+" "+String(raw.strCategory||"recipe").toLowerCase()+" from TheMealDB.",
  ingredients,
  instructions:instructions.length?instructions:[String(raw.strInstructions||"Instructions available at original source.")],
  source_name:"TheMealDB",
  source_url:/^https:\/\//.test(source)?source:"https://www.themealdb.com/meal/"+id.slice(7),
  prep_minutes:0,cook_minutes:0,servings:0
 };
}
