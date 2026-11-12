import React,{useEffect,useState}from"react";
import{ScrollView,Text,TouchableOpacity,RefreshControl,View}from"react-native";
import{router}from"expo-router";
import{api,type News}from"../src/client";
import{Background,Surface,GoodSideLoader,styles}from"../src/components";
import TabBar from"../src/TabBar";
import{colors}from"../src/theme";
type Recipe={recipe_id:string;title:string;description:string;prep_minutes:number;cook_minutes:number;servings:number;source_url:string;dietary_tags:string};
export default function Food(){
 const[news,setNews]=useState<News[]>([]),[recipes,setRecipes]=useState<Recipe[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const load=async()=>{setLoading(true);try{
  const n=await api<{items:News[]}>("/news?category=food&limit=30");
  setNews(n.items||[]);
  try{setRecipes(await api<Recipe[]>("/recipes"))}catch{setRecipes([])}
  setError("");
 }catch(e){setError(String(e))}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 return <Background><ScrollView contentContainerStyle={{padding:22,paddingTop:65,paddingBottom:115}} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>}>
  <Text style={[styles.title,{marginBottom:8}]}>Good food. Good world.</Text>
  <Text style={[styles.subtitle,{marginBottom:24}]}>Food innovations, community kindness and recipes worth sharing.</Text>
  {loading?<GoodSideLoader label="Finding recipes and news…"/>:null}
  {error?<Text style={styles.subtitle}>{error}</Text>:null}
  <Text style={[styles.label,{fontSize:22,marginBottom:12}]}>🥗 Recipes</Text>
  {recipes.length===0?<Surface style={{marginBottom:20}}><Text style={styles.subtitle}>Fresh, properly credited recipes will appear here once reviewed.</Text></Surface>:
   recipes.map(r=><TouchableOpacity key={r.recipe_id} onPress={()=>router.push({pathname:"/recipe/[id]" as any,params:{id:r.recipe_id}})}><Surface style={{marginBottom:12}}>
    <Text style={{fontSize:19,fontWeight:"800",color:colors.ink}}>{r.title}</Text>
    <Text style={[styles.subtitle,{marginTop:6}]}>{r.description}</Text>
    <Text style={[styles.muted,{marginTop:8}]}>{Number(r.prep_minutes||0)+Number(r.cook_minutes||0)} min · {r.servings} servings</Text>
   </Surface></TouchableOpacity>)}
  <Text style={[styles.label,{fontSize:22,marginBottom:12}]}>✨ Food making a difference</Text>
  {news.length===0?<Surface><Text style={styles.subtitle}>Verified food-related good news will appear here.</Text></Surface>:
   news.map(item=><TouchableOpacity key={item.news_id} onPress={()=>router.push({pathname:"/article/[id]",params:{id:item.news_id}} as any)}><Surface style={{marginBottom:12}}>
    <Text style={{fontSize:19,fontWeight:"800",color:colors.ink}}>{item.title}</Text>
    <Text style={[styles.subtitle,{marginTop:8}]} numberOfLines={3}>{item.summary}</Text>
    <Text style={[styles.muted,{marginTop:8}]}>{item.publisher}</Text>
   </Surface></TouchableOpacity>)}
 </ScrollView></Background>;
}
