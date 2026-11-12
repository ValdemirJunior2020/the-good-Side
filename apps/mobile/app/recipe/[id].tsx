import React,{useEffect,useState}from"react";
import{ScrollView,Text,TouchableOpacity,Linking,Alert}from"react-native";
import{router,useLocalSearchParams}from"expo-router";
import{api,auth}from"../../src/client";
import{Background,Surface,GoodSideLoader,styles}from"../../src/components";
import{colors}from"../../src/theme";
type Recipe={recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;servings:number;ingredients:string[]|string;instructions:string[]|string;source_url:string;source_name:string;dietary_tags:string};
const parsed=(value:string[]|string)=>Array.isArray(value)?value:(()=>{try{return JSON.parse(value||"[]")}catch{return []}})();
export default function RecipeDetail(){
 const{id}=useLocalSearchParams<{id:string}>(),[r,setR]=useState<Recipe|null>(null),[error,setError]=useState(""),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false);
 useEffect(()=>{api<Recipe>("/recipes/"+encodeURIComponent(String(id))).then(setR).catch(e=>setError(String(e)));if(auth.currentUser)api<Recipe[]>("/me/recipes",{},true).then(items=>setSaved(items.some(x=>x.recipe_id===id))).catch(()=>{})},[id]);
 const toggle=async()=>{if(!auth.currentUser)return router.push("/auth");setSaving(true);try{await api("/me/recipes/"+encodeURIComponent(String(id)),{method:saved?"DELETE":"POST"},true);setSaved(!saved)}catch(e){Alert.alert("Unable to save",String(e))}finally{setSaving(false)}};
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:64,paddingBottom:90}}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.muted}>← Food</Text></TouchableOpacity>
  {error?<Text style={styles.subtitle}>{error}</Text>:null}
  {r?<><Text style={[styles.title,{marginTop:25,marginBottom:12}]}>{r.title}</Text><Text style={styles.subtitle}>{r.description}</Text>
   <TouchableOpacity accessibilityRole="button" onPress={toggle} disabled={saving} style={{marginTop:22,alignSelf:"flex-start",padding:14,backgroundColor:"rgba(255,255,255,.75)",borderRadius:18}}><Text style={{fontWeight:"800",color:colors.ink}}>{saving?"Saving…":saved?"♥ Saved recipe":"♡ Save recipe"}</Text></TouchableOpacity>
   {saving?<GoodSideLoader compact label="Saving recipe…"/>:null}
   <Surface style={{marginTop:22}}><Text style={styles.label}>At a glance</Text><Text style={styles.subtitle}>Preparation: {r.prep_minutes} min · Cooking: {r.cook_minutes} min · Servings: {r.servings}</Text></Surface>
   <Surface style={{marginTop:16}}><Text style={styles.label}>Ingredients</Text>{parsed(r.ingredients).map((item:string,i:number)=><Text key={i} style={[styles.subtitle,{marginBottom:8}]}>• {item}</Text>)}</Surface>
   <Surface style={{marginTop:16}}><Text style={styles.label}>How to make it</Text>{parsed(r.instructions).map((step:string,i:number)=><Text key={i} style={[styles.subtitle,{marginBottom:12}]}>{i+1}. {step}</Text>)}</Surface>
   <TouchableOpacity onPress={()=>Linking.openURL(r.source_url)} style={{marginTop:24}}><Text style={{fontWeight:"700",color:colors.ink}}>Original recipe: {r.source_name||"Source"} ↗</Text></TouchableOpacity>
  </>:error?null:<GoodSideLoader label="Opening recipe…"/>}
 </ScrollView></Background>;
}
