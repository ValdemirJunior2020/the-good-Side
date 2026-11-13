import React,{useEffect,useMemo,useState} from "react";
import {Alert,Image,Pressable,RefreshControl,ScrollView,Text,TouchableOpacity,View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router} from "expo-router";
import {api,type News} from "../src/client";
import {Background,GoodSideLoader,MenuButton,Surface,styles} from "../src/components";
import {colors} from "../src/theme";
import {CUISINES,getCountryMeals,getStarterMeals,STARTER_GROUPS,type MealPreview} from "../src/recipeDiscovery";

type Recipe={recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;servings:number;source_url:string;image_url:string;dietary_tags:string;};
const SHOW_DEVELOPMENT_MEALS = __DEV__; // TheMealDB free-key preview is never shipped in a production build.
const hasPhoto=(url:string|undefined)=>typeof url==="string"&&/^https:\/\/[^\s]+$/i.test(url);
const PICKS="goodside_food_country_picks_v1",CACHE="goodside_starter_meals_v1";
const tags=STARTER_GROUPS.map(g=>({name:g.title,key:g.key}));
function PreviewCard({meal}:{meal:MealPreview}){
 return <Pressable accessibilityRole="button" accessibilityLabel={"Read "+meal.title} onPress={()=>router.push({pathname:"/recipe/[id]",params:{id:meal.id}})} style={({pressed})=>({width:"48.5%",marginBottom:14,opacity:pressed?.78:1})}>
  <View style={{borderRadius:23,backgroundColor:"rgba(255,255,255,.82)",borderWidth:1.4,borderColor:"#FFFFFF",overflow:"hidden",minHeight:239,shadowColor:"#9B5969",shadowOpacity:.12,shadowRadius:10,shadowOffset:{width:0,height:5}}}>
   <Image accessibilityLabel={meal.title+" photo"} source={{uri:meal.image_url}} resizeMode="cover" style={{width:"100%",height:137,backgroundColor:"#EAD9CF"}}/>
   <View style={{paddingHorizontal:11,paddingVertical:12}}>
    <Text numberOfLines={2} style={{color:"#2B202C",fontWeight:"800",fontSize:15,lineHeight:19,minHeight:38}}>{meal.title}</Text>
    <Text style={{color:"#905A41",fontSize:12,fontWeight:"700",marginTop:5}}>{meal.country} · View recipe</Text>
   </View>
  </View>
 </Pressable>;
}
export default function Food(){
 const[news,setNews]=useState<News[]>([]),[recipes,setRecipes]=useState<Recipe[]>([]);
 const[starter,setStarter]=useState<MealPreview[]>([]),[countries,setCountries]=useState<string[]>(["American","Brazilian"]);
 const[countryMeals,setCountryMeals]=useState<MealPreview[]>([]),[filter,setFilter]=useState("all");
 const[loading,setLoading]=useState(true),[countryLoading,setCountryLoading]=useState(false),[error,setError]=useState("");
 const load=async()=>{
  setLoading(true);setError("");
  const [real,good,preview]=await Promise.allSettled([
   api<Recipe[]>("/recipes"),api<{items:News[]}>("/news?category=food&limit=15"),SHOW_DEVELOPMENT_MEALS?getStarterMeals():Promise.resolve([] as MealPreview[])
  ]);
  if(real.status==="fulfilled")setRecipes(real.value.filter(r=>hasPhoto(r.image_url)));
  if(good.status==="fulfilled")setNews(good.value.items||[]);
  if(SHOW_DEVELOPMENT_MEALS && preview.status==="fulfilled"){setStarter(preview.value);void AsyncStorage.setItem(CACHE,JSON.stringify(preview.value)).catch(()=>{})}
  else if(SHOW_DEVELOPMENT_MEALS && preview.status==="rejected")setError("Development recipe previews are temporarily unavailable.");
  if(real.status==="rejected")setError("Published recipes could not be loaded. Pull down to retry.");
  setLoading(false);
 };
 useEffect(()=>{
  void AsyncStorage.multiGet([PICKS,CACHE]).then(entries=>{
   try{if(entries[0][1]){const v=JSON.parse(entries[0][1]!);if(Array.isArray(v))setCountries(v.filter(c=>CUISINES.includes(c)))} }catch{}
   try{if(SHOW_DEVELOPMENT_MEALS && entries[1][1]){const v=JSON.parse(entries[1][1]!);if(Array.isArray(v))setStarter(v)}}catch{}
  }).catch(()=>{});
  void load();
 },[]);
 useEffect(()=>{
  if(!SHOW_DEVELOPMENT_MEALS || !countries.length){setCountryMeals([]);return}
  let alive=true;setCountryLoading(true);
  void Promise.allSettled(countries.map(getCountryMeals)).then(all=>{
   if(!alive)return;
   const seen=new Set<string>();
   setCountryMeals(all.flatMap(x=>x.status==="fulfilled"?x.value:[]).filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true}));
  }).finally(()=>{if(alive)setCountryLoading(false)});
  return ()=>{alive=false};
 },[countries.join("|")]);
 const toggle=(c:string)=>{
  const next=countries.includes(c)?countries.filter(x=>x!==c):[...countries,c];
  setCountries(next);void AsyncStorage.setItem(PICKS,JSON.stringify(next)).catch(()=>{});
 };
 const filtered=useMemo(()=>filter==="all"?starter:starter.filter(x=>x.group===filter),[starter,filter]);
 return <Background><ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:65,paddingBottom:170,width:"100%",maxWidth:650,alignSelf:"center"}} refreshControl={<RefreshControl refreshing={loading} onRefresh={()=>void load()}/>}>
  <View style={{alignItems:"flex-end",marginBottom:10}}><MenuButton/></View>
  <Text style={[styles.title,{fontSize:32,lineHeight:39}]}>The good kitchen <Text style={{color:"#B96B35"}}>☀</Text></Text>
  <Text style={[styles.subtitle,{marginTop:7,marginBottom:15}]}>Beautiful food, real recipes, a little sunshine at every table.</Text>
  <Surface style={{marginBottom:20,padding:16}}>
   <Text style={{fontWeight:"900",fontSize:19,color:colors.ink}}>🍽️ Your recipe countries</Text>
   <Text style={[styles.muted,{marginTop:6,marginBottom:10}]}>Choose the cuisines you love. Your choices stay saved on this device.</Text>
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
    {CUISINES.map(c=><TouchableOpacity key={c} accessibilityRole="checkbox" accessibilityState={{checked:countries.includes(c)}} onPress={()=>toggle(c)} style={{borderRadius:20,paddingHorizontal:13,paddingVertical:10,backgroundColor:countries.includes(c)?"#E7A977":"#FFFFFF",borderWidth:1.1,borderColor:countries.includes(c)?"#C97D46":"#E5D1C9"}}>
     <Text style={{fontWeight:"700",color:"#392937",fontSize:13}}>{countries.includes(c)?"✓ ":""}{c}</Text>
    </TouchableOpacity>)}
   </View>
  </Surface>
  {loading?<GoodSideLoader label="Setting your recipe table…"/>:null}
  {error?<Text style={{color:"#A9534D",fontSize:13,marginBottom:12}}>{error}</Text>:null}
  {recipes.length>0?<View style={{marginBottom:19}}><Text style={[styles.label,{fontSize:22}]}>✨ Good Side approved recipes</Text>
   {recipes.map(r=><TouchableOpacity key={r.recipe_id} onPress={()=>router.push({pathname:"/recipe/[id]",params:{id:r.recipe_id}})}><Surface style={{marginBottom:10,padding:14}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
     <Image source={{uri:r.image_url}} style={{width:96,height:88,borderRadius:16,backgroundColor:"#E6D4C5"}}/>
     <View style={{flex:1}}><Text style={{fontSize:17,fontWeight:"800",color:colors.ink}}>{r.title}</Text><Text numberOfLines={2} style={[styles.muted,{marginTop:6}]}>{r.description}</Text>
     <Text style={{color:"#A56B43",fontWeight:"700",fontSize:12,marginTop:7}}>{Number(r.prep_minutes)+Number(r.cook_minutes)} min · {r.servings} servings</Text></View>
    </View>
   </Surface></TouchableOpacity>)}
  </View>:null}
  {SHOW_DEVELOPMENT_MEALS?<>
  <View style={{marginBottom:10}}>
   <Text style={[styles.label,{fontSize:22,marginBottom:3}]}>🌎 Your countries</Text>
   <Text style={[styles.muted,{marginBottom:13}]}>Explore the dishes from your selected places.</Text>
   {countryLoading?<GoodSideLoader compact label="Finding dishes from your countries…"/>:
    countryMeals.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>{countryMeals.slice(0,14).map(m=><TouchableOpacity key={m.id} onPress={()=>router.push({pathname:"/recipe/[id]",params:{id:m.id}})} style={{width:154,marginRight:12,backgroundColor:"rgba(255,255,255,.84)",borderRadius:19,overflow:"hidden"}}>
     <Image source={{uri:m.image_url}} style={{height:112,width:154,backgroundColor:"#E5D6CD"}}/><View style={{padding:10}}><Text numberOfLines={2} style={{fontSize:13,fontWeight:"800",color:colors.ink}}>{m.title}</Text><Text style={{fontSize:11,color:"#B46A3C",marginTop:4}}>{m.country}</Text></View>
    </TouchableOpacity>)}</ScrollView>:<Text style={[styles.muted,{marginBottom:12}]}>Select a country above to discover its food.</Text>}
  </View>
  <Text style={[styles.label,{fontSize:22,marginBottom:7}]}>👩‍🍳 Starter recipe collection</Text>
  <Text style={[styles.muted,{marginBottom:13}]}>A development preview with original source photos and instructions from TheMealDB.</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:15}}>{[{name:"All recipes",key:"all"},...tags].map(t=><TouchableOpacity key={t.key} onPress={()=>setFilter(t.key)} style={{marginRight:9,paddingHorizontal:15,paddingVertical:10,borderRadius:22,backgroundColor:filter===t.key?"#D88D5B":"rgba(255,255,255,.86)",borderWidth:1,borderColor:"#FFFFFF"}}><Text style={{fontSize:13,fontWeight:"800",color:filter===t.key?"#FFFFFF":"#45313C"}}>{t.name}</Text></TouchableOpacity>)}</ScrollView>
  <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between"}}>{filtered.map(m=><PreviewCard key={m.id} meal={m}/>)}</View>
  {!loading&&!filtered.length?<Surface style={{marginBottom:14}}><Text style={styles.subtitle}>No recipes loaded in this category yet. Pull down to refresh.</Text></Surface>:null}
  <Text style={[styles.muted,{fontSize:12,marginBottom:22}]}>Preview photographs and recipes are shown from TheMealDB for development testing. A provider license and editorial review are required before public App Store distribution.</Text>
  </>:null}
  {!loading&&!recipes.length&&!SHOW_DEVELOPMENT_MEALS?<Surface style={{marginBottom:16,padding:20}}><Text style={[styles.label,{fontSize:19}]}>Fresh recipes are coming ☀️</Text><Text style={[styles.subtitle,{marginTop:8}]}>Our kitchen is preparing full recipes with beautiful, licensed photos. Check back soon for new dishes from your favorite countries.</Text></Surface>:null}
  <Text style={[styles.label,{fontSize:22,marginBottom:10}]}>✨ Food making a difference</Text>
  {news.length===0?<Surface><Text style={styles.subtitle}>Food-related good news will appear here.</Text></Surface>:news.map(item=><TouchableOpacity key={item.news_id} onPress={()=>router.push({pathname:"/article/[id]",params:{id:item.news_id}} as any)}><Surface style={{marginBottom:12}}>
   <Text style={{fontSize:18,fontWeight:"800",color:colors.ink}}>{item.title}</Text><Text numberOfLines={2} style={[styles.subtitle,{marginTop:7}]}>{item.summary}</Text>
  </Surface></TouchableOpacity>)}
 </ScrollView></Background>;
}
