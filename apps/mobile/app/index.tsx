import React,{useEffect,useState} from "react";
import {ScrollView,View,Text,TouchableOpacity,ActivityIndicator,RefreshControl,Linking} from "react-native";
import {router} from "expo-router";

import {api,auth,type News} from "../src/client";
import {Background,Brand,Pill,Surface,styles} from "../src/components";
import {colors,categories} from "../src/theme";
export default function Home(){
 const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[news,setNews]=useState<News[]>([]),[error,setError]=useState(""),[logged,setLogged]=useState(false),[category,setCategory]=useState("");
 const load=async(c=category)=>{try{setError("");const result=await api<{items:News[]}>("/news?limit=30"+(c?"&category="+encodeURIComponent(c):""));setNews(result.items||[])}catch(e){setError(e instanceof Error?e.message:"Connection error")}};
 useEffect(()=>{const unsub=auth.subscribe(user=>{setLogged(Boolean(user));setLoading(false)});void auth.restore();load();return unsub},[]);
 const refresh=async()=>{setRefreshing(true);await load();setRefreshing(false)};
 return <Background><ScrollView contentContainerStyle={{padding:23,paddingTop:60,paddingBottom:70}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>}>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}><Brand small/><TouchableOpacity onPress={()=>router.push((logged?"/profile":"/auth") as any)}><Text style={{fontSize:27}}>{logged?"◉":"♙"}</Text></TouchableOpacity></View>
  <Text style={[styles.title,{marginTop:40}]}>There's good in{"\n"}the world. <Text style={{color:colors.orange}}>Find it.</Text></Text>
  <Text style={[styles.subtitle,{marginTop:10,marginBottom:26}]}>Real stories. Brighter perspectives.{"\n"}A little good, every day.</Text>
  <Surface style={{backgroundColor:"#B46C4F",minHeight:160,marginBottom:28}}><Text style={{color:"#FEECCB",fontSize:12,fontWeight:"800",letterSpacing:2}}>TODAY'S GOOD SIDE ✦</Text><Text style={{color:"white",fontSize:23,fontWeight:"700",lineHeight:30,marginTop:12}}>{news[0]?.title||"Your daily dose of good news starts here."}</Text>{news[0]&&<TouchableOpacity onPress={()=>router.push({pathname:"/article/[id]",params:{id:news[0].news_id}} as any)} style={{marginTop:18}}><Text style={{color:"white",fontWeight:"700"}}>Read this story  →</Text></TouchableOpacity>}</Surface>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:13}}><Text style={{fontSize:22,fontWeight:"800",color:colors.ink}}>Explore good news</Text><TouchableOpacity onPress={()=>router.push("/search")}><Text style={{fontSize:15,color:colors.ink}}>Search ⌕</Text></TouchableOpacity></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:18}}>{[["All",""],...categories.map(c=>[c[0],c[1]])].map(c=><TouchableOpacity key={c[1]} onPress={()=>{setCategory(c[1]);load(c[1]);}} style={{marginRight:8,paddingHorizontal:15,paddingVertical:11,borderRadius:30,backgroundColor:category===c[1]?colors.ink:"rgba(255,255,255,.75)"}}><Text style={{color:category===c[1]?"white":colors.ink,fontWeight:"600"}}>{c[0]}</Text></TouchableOpacity>)}</ScrollView>
  {error?<Surface><Text style={styles.subtitle}>{error}</Text><Pill title="Try again" onPress={refresh}/></Surface>:null}
  {!news.length&&!error?<Surface><Text style={styles.subtitle}>No approved stories yet. Every article is checked before publication.</Text></Surface>:null}
  {news.map(item=><TouchableOpacity key={item.news_id} onPress={()=>router.push({pathname:"/article/[id]",params:{id:item.news_id}} as any)}><Surface style={{marginBottom:13}}><Text style={{color:colors.orange,fontWeight:"700",fontSize:12,textTransform:"uppercase"}}>{item.category||"Good news"}</Text><Text style={{color:colors.ink,fontSize:20,fontWeight:"700",marginTop:8,lineHeight:27}}>{item.title}</Text><Text numberOfLines={3} style={[styles.subtitle,{marginTop:8}]}>{item.summary}</Text><Text style={[styles.muted,{marginTop:14}]}>{item.publisher} · {item.source_published_at?new Date(item.source_published_at).toLocaleDateString():""}</Text></Surface></TouchableOpacity>)}
  <View style={{flexDirection:"row",gap:10,marginTop:14}}><View style={{flex:1}}><Pill title="♡ Saved" secondary onPress={()=>router.push((logged?"/saved":"/auth") as any)}/></View><View style={{flex:1}}><Pill title="⚙ Preferences" secondary onPress={()=>router.push((logged?"/preferences":"/auth") as any)}/></View></View>
 </ScrollView></Background>
}
