import React,{useEffect,useState} from "react";
import {Alert,Image,ScrollView,Text,TouchableOpacity,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {api,auth} from "../../src/client";
import {Background,Surface,GoodSideLoader,styles} from "../../src/components";
import {getMealDetails,type MealDetails} from "../../src/recipeDiscovery";
import {colors} from "../../src/theme";
type Recipe={recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;servings:number;ingredients:string[]|string;instructions:string[]|string;source_url:string;source_name:string;image_url:string;image_license?:string;dietary_tags:string};
const SAVED_DEMOS="goodside_saved_demo_meals_v1";
const parsed=(value:string[]|string):string[]=>Array.isArray(value)?value:(()=>{try{const a=JSON.parse(value||"[]");return Array.isArray(a)?a:[]}catch{return []}})();
export default function RecipeDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const demo=__DEV__ && String(id).startsWith("mealdb-");
 const [r,setR]=useState<Recipe|null>(null),[error,setError]=useState(""),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false),[photoFailed,setPhotoFailed]=useState(false);
 useEffect(()=>{
  let alive=true;
  setR(null);setError("");setPhotoFailed(false);
  if(String(id).startsWith("mealdb-") && !__DEV__){
   setError("This development-only recipe is not included in the public app.");
  }else if(demo){
   void getMealDetails(String(id)).then(v=>{if(!alive)return;setR({...v,recipe_id:v.id,dietary_tags:"Development preview",image_license:"Provider-managed development preview"});}).catch(e=>{if(alive)setError(String(e))});
   void AsyncStorage.getItem(SAVED_DEMOS).then(v=>{if(alive)setSaved(Boolean(v&&JSON.parse(v).includes(id)))}).catch(()=>{});
  }else{
   // Keep complete, previously opened recipes on the reader's own device.
   const cacheKey="goodside_full_recipe_v1_"+String(id);
   const valid=(v:Recipe)=>Boolean(v&&/^https:\/\/[^\s]+$/i.test(v.image_url)&&parsed(v.ingredients).length&&parsed(v.instructions).length);
   void (async()=>{
    try{const cached=await AsyncStorage.getItem(cacheKey);if(cached){const row=JSON.parse(cached) as Recipe;if(alive&&valid(row))setR(row)}}catch{}
    try{
     const fresh=await api<Recipe>("/recipes/"+encodeURIComponent(String(id)));
     if(!valid(fresh)){if(alive)setError("This recipe is missing its photo or complete instructions and cannot be displayed.");return}
     if(alive){setR(fresh);setError("")}
     await AsyncStorage.setItem(cacheKey,JSON.stringify(fresh));
    }catch{if(alive)setError("Could not refresh this recipe. A previously opened copy may still be available offline.")}
   })();
   if(auth.currentUser)void api<Recipe[]>("/me/recipes",{},true).then(items=>{if(alive)setSaved(items.some(x=>x.recipe_id===id))}).catch(()=>{});
  }
  return ()=>{alive=false};
 },[id]);
 const toggle=async()=>{
  if(!demo&&!auth.currentUser)return router.push("/auth");
  setSaving(true);
  try{
   if(demo){
    const stored=await AsyncStorage.getItem(SAVED_DEMOS);
    const list=stored?JSON.parse(stored) as string[]:[];
    const next=saved?list.filter(x=>x!==id):[...new Set([...list,String(id)])];
    await AsyncStorage.setItem(SAVED_DEMOS,JSON.stringify(next));
   }else{
    await api("/me/recipes/"+encodeURIComponent(String(id)),{method:saved?"DELETE":"POST"},true);
   }
   setSaved(!saved);
  }catch(e){Alert.alert("Unable to save",String(e))}finally{setSaving(false)}
 };
 return <Background><ScrollView contentContainerStyle={{paddingHorizontal:21,paddingTop:74,paddingBottom:170,maxWidth:650,alignSelf:"center",width:"100%"}}>
  <TouchableOpacity accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace("/food")} style={{alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.83)",borderRadius:21,borderWidth:1,borderColor:"#FFFFFF",paddingVertical:12,paddingHorizontal:18}}>
   <Text style={{color:colors.ink,fontWeight:"800"}}>← Back to Food</Text>
  </TouchableOpacity>
  {error?<Surface style={{marginTop:20}}><Text style={styles.subtitle}>{error}</Text></Surface>:null}
  {r?<>
   {photoFailed?<Surface style={{marginTop:20}}><Text style={styles.subtitle}>The recipe photo is temporarily unavailable. Pull down or reopen the recipe to try again.</Text></Surface>:<Image accessibilityLabel={r.title+" recipe image"} source={{uri:r.image_url}} onError={()=>setPhotoFailed(true)} resizeMode="cover" style={{width:"100%",height:253,borderRadius:28,backgroundColor:"#E5D6CD",marginTop:20,borderWidth:2,borderColor:"#FFFFFF"}}/>}
   <Text style={[styles.title,{marginTop:22,marginBottom:12,fontSize:32}]}>{r.title}</Text>
   <Text style={[styles.subtitle,{lineHeight:25}]}>{r.description}</Text>
   <TouchableOpacity accessibilityRole="button" onPress={toggle} disabled={saving} style={{marginTop:19,alignSelf:"flex-start",backgroundColor:"#FFFFFF",borderWidth:1.5,borderColor:"#EBC2B1",paddingHorizontal:20,paddingVertical:13,borderRadius:19}}>
    <Text style={{fontWeight:"800",color:"#75432F"}}>{saving?"Saving…":saved?"♥ Saved recipe":"♡ Save recipe"}</Text>
   </TouchableOpacity>
   {saving?<GoodSideLoader compact label="Saving recipe…"/>:null}
   <Surface style={{marginTop:17,padding:17}}>
    <Text style={[styles.label,{marginBottom:7}]}>At a glance</Text>
    <Text style={[styles.subtitle,{fontSize:14}]}>{demo?"Photo and directions from TheMealDB":`Prep ${r.prep_minutes} min · Cook ${r.cook_minutes} min · Serves ${r.servings}`}</Text>
   </Surface>
   <Surface style={{marginTop:15,padding:19}}>
    <Text style={[styles.label,{fontSize:22,marginBottom:18}]}>🥕 Ingredients</Text>
    {parsed(r.ingredients).map((item,i)=><View key={i} style={{flexDirection:"row",marginBottom:13,paddingBottom:10,borderBottomWidth:.6,borderBottomColor:"rgba(174,126,124,.16)"}}>
     <Text style={{width:22,fontSize:16,color:"#B56E39"}}>✓</Text><Text style={{flex:1,fontSize:15,color:"#3D2D38",lineHeight:23}}>{item}</Text>
    </View>)}
   </Surface>
   <Surface style={{marginTop:15,padding:19}}>
    <Text style={[styles.label,{fontSize:22,marginBottom:18}]}>👩‍🍳 How to make it</Text>
    {parsed(r.instructions).map((step,i)=><View key={i} style={{flexDirection:"row",alignItems:"flex-start",gap:12,marginBottom:19}}>
     <View style={{width:30,height:30,borderRadius:15,backgroundColor:"#F4CA9E",alignItems:"center",justifyContent:"center"}}><Text style={{fontWeight:"900",color:"#663C2D"}}>{i+1}</Text></View>
     <Text style={{flex:1,fontSize:15,color:"#3D2D38",lineHeight:25}}>{step}</Text>
    </View>)}
   </Surface>
   <Surface style={{marginTop:20,padding:17}}>
    <Text style={{color:"#794C39",fontSize:12,lineHeight:20,fontWeight:"700"}}>Recipe source: {r.source_name||"Publisher"} · Read and cook entirely inside The Good Side.</Text>
    {!demo&&r.image_license?<Text selectable style={{color:"#795962",fontSize:12,lineHeight:20,marginTop:7}}>Photo credit and license: {r.image_license}</Text>:null}
    {!demo&&r.source_url?<Text selectable style={{color:"#795962",fontSize:11,lineHeight:18,marginTop:6}}>Photo/source details: {r.source_url}</Text>:null}
    {demo?<Text style={{color:"#795962",fontSize:12,lineHeight:20,marginTop:7}}>Development preview. Saved previews stay on this device. Public release requires verified rights to the recipe photos and source content.</Text>:null}
   </Surface>
  </>:error?null:<GoodSideLoader label="Opening the recipe…"/>}
 </ScrollView></Background>;
}
