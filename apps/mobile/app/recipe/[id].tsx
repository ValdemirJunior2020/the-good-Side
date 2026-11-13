import React,{useEffect,useState} from "react";
import {Alert,Image,Linking,ScrollView,Text,TouchableOpacity,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {api,auth} from "../../src/client";
import {Background,Surface,GoodSideLoader,styles} from "../../src/components";
import {getMealDetails,type MealDetails} from "../../src/recipeDiscovery";
import {colors} from "../../src/theme";
type Recipe={recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;servings:number;ingredients:string[]|string;instructions:string[]|string;source_url:string;source_name:string;image_url?:string;image_license?:string;dietary_tags:string};
const SAVED_DEMOS="goodside_saved_demo_meals_v1";
const parsed=(value:string[]|string):string[]=>Array.isArray(value)?value:(()=>{try{const a=JSON.parse(value||"[]");return Array.isArray(a)?a:[]}catch{return []}})();
export default function RecipeDetail(){
 const {id}=useLocalSearchParams<{id:string}>();
 const demo=String(id).startsWith("mealdb-");
 const [r,setR]=useState<Recipe|null>(null),[error,setError]=useState(""),[saved,setSaved]=useState(false),[saving,setSaving]=useState(false);
 useEffect(()=>{
  let alive=true;
  setR(null);setError("");
  if(demo){
   void getMealDetails(String(id)).then(v=>{if(!alive)return;setR({...v,recipe_id:v.id,dietary_tags:"Development preview",image_license:"Provider-managed development preview"});}).catch(e=>{if(alive)setError(String(e))});
   void AsyncStorage.getItem(SAVED_DEMOS).then(v=>{if(alive)setSaved(Boolean(v&&JSON.parse(v).includes(id)))}).catch(()=>{});
  }else{
   void api<Recipe>("/recipes/"+encodeURIComponent(String(id))).then(v=>{if(alive)setR(v)}).catch(e=>{if(alive)setError(String(e))});
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
   {r.image_url?<Image accessibilityLabel={r.title+" recipe image"} source={{uri:r.image_url}} resizeMode="cover" style={{width:"100%",height:253,borderRadius:28,backgroundColor:"#E5D6CD",marginTop:20,borderWidth:2,borderColor:"#FFFFFF"}}/>:null}
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
   <TouchableOpacity accessibilityRole="link" onPress={()=>void Linking.openURL(r.source_url)} style={{backgroundColor:"#FFFFFF",borderRadius:19,borderWidth:1,borderColor:"#E5C5B7",padding:17,marginTop:20}}>
    <Text style={{color:"#9E592C",fontWeight:"800"}}>View original recipe · {r.source_name||"Publisher"} ↗</Text>
   </TouchableOpacity>
   {demo?<Text style={[styles.muted,{marginTop:12,fontSize:12}]}>Development-only preview. Saved preview recipes stay on this device. Publication requires licensed source images and editorial approval.</Text>:null}
  </>:error?null:<GoodSideLoader label="Opening the recipe…"/>}
 </ScrollView></Background>;
}
