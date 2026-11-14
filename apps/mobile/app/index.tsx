import React,{useCallback,useEffect,useState} from "react";
import {ScrollView,View,Text,TouchableOpacity,RefreshControl,StyleSheet,Linking} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router,useFocusEffect} from "expo-router";

import {api,auth,type News} from "../src/client";
import {Background,Brand,Pill,Surface,GoodSideLoader,MenuButton,styles} from "../src/components";
import SunriseBackdrop from "../src/SunriseBackdrop";
import {getPublicSettings} from "../src/remoteConfig";
import {colors,categories} from "../src/theme";
const newsCacheKey=(category:string,userId:string)=>"goodside_news_cache_v2_"+encodeURIComponent(userId||"public")+"_"+(category||"all");

type DiscoveryItem={title:string;url:string;publisher:string;published_at:string;interest:string};
const interestQueries:Record<string,string>={
 science:"science discovery breakthrough",medical:"medical health breakthrough",kindness:"acts of kindness generosity",
 animals:"animal rescue wildlife recovery",environment:"conservation ecosystem restoration",
 technology:"technology innovation helping people",achievements:"inspiring human achievement",
 community:"community hero volunteers",education:"education students scholarship success",
 sports:"inspiring sports achievement",families:"children families uplifting story",
 "world-progress":"global positive progress",faith:"faith community charity kindness",
 food:"food community meals generosity"
};

export default function Home(){
 const [liveWelcome,setLiveWelcome]=useState("Real stories. Brighter perspectives."),[feedEnabled,setFeedEnabled]=useState(true);
 const [loading,setLoading]=useState(true),[feedLoading,setFeedLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[news,setNews]=useState<News[]>([]),[error,setError]=useState(""),[logged,setLogged]=useState(false),[category,setCategory]=useState("");
 const [discoveries,setDiscoveries]=useState<DiscoveryItem[]>([]);
 const [interests,setInterests]=useState<string[]>([]);
 const discover=async()=>{
  const user=auth.currentUser;
  if(!user){setDiscoveries([]);setInterests([]);return;}
  try{
   const prefs=await api<{selected_categories:string[]|string}>("/me/preferences",{},true);
   const raw=prefs?.selected_categories;
   let parsed:unknown=raw;
   if(typeof raw==="string"){try{parsed=JSON.parse(raw)}catch{parsed=raw.split(",")}}
   const selected=(Array.isArray(parsed)?parsed:[]).map(v=>String(v).trim()).filter(v=>v in interestQueries);
   setInterests(selected);
   const ordered=selected.length?selected:[];
   const offset=ordered.length?(Math.floor(Date.now()/86400000)%ordered.length):0;
   const chosen=[...ordered.slice(offset),...ordered.slice(0,offset)].slice(0,4);
   if(!chosen.length){setDiscoveries([]);return;}
   const found=await Promise.allSettled(chosen.map(async interest=>{
    const response=await api<{items:Array<{title:string;url:string;publisher:string;published_at:string}>}>("/news/search-live?q="+encodeURIComponent(interestQueries[interest]));
    return (response.items||[]).slice(0,2).map(item=>({...item,interest}));
   }));
   if(!auth.currentUser||auth.currentUser.email!==user.email)return;
   const seen=new Set<string>();
   setDiscoveries(found.flatMap(result=>result.status==="fulfilled"?result.value:[]).filter(item=>{
    if(!item.title||!item.url||seen.has(item.url))return false;
    seen.add(item.url);return true;
   }));
  }catch{setDiscoveries([])}
 };

 const load=async(c=category)=>{
  setFeedLoading(true);setError("");
  // An authenticated reader sees only their selected topics in the default feed.
  // Caches are per account to avoid mixing two readers' interests on one phone.
  const user=auth.currentUser;
  const personalized=Boolean(user&&!c);
  const cacheKey=newsCacheKey(c,user?.email||"public");
  try{
   const cached=await AsyncStorage.getItem(cacheKey);
   if(cached){const rows=JSON.parse(cached) as News[];if(Array.isArray(rows))setNews(rows)}
  }catch{}
  try{
   const result=await api<{items:News[]}>(personalized?"/me/news?limit=30":"/news?limit=30"+(c?"&category="+encodeURIComponent(c):""),{},personalized);
   const fresh=(result.items||[]).filter((item,i,all)=>Boolean(item.news_id)&&all.findIndex(other=>other.news_id===item.news_id)===i);
   setNews(fresh);void AsyncStorage.setItem(cacheKey,JSON.stringify(fresh.slice(0,30))).catch(()=>{});
  }catch(e){setError("Cannot refresh news right now. Previously downloaded stories may still be available.")}finally{setFeedLoading(false)}
 };
 useEffect(()=>{const unsub=auth.subscribe(user=>{setLogged(Boolean(user));setLoading(false);void load("");void discover()});void auth.restore();getPublicSettings().then(s=>{if(s.welcome_message)setLiveWelcome(s.welcome_message);if(s.news_feed_enabled)setFeedEnabled(s.news_feed_enabled!=="false")}).catch(()=>{});return unsub},[]);
 const refresh=async()=>{setRefreshing(true);await Promise.all([load(),discover()]);setRefreshing(false)};
 useFocusEffect(useCallback(()=>{if(auth.currentUser){void load("");void discover()}},[]));
 return <Background><SunriseBackdrop/><ScrollView contentContainerStyle={{padding:20,paddingTop:80,paddingBottom:185,width:"100%",maxWidth:540,alignSelf:"center"}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>}>
  <View style={{alignItems:"flex-start"}}><Brand small/></View><View style={{alignItems:"flex-end",marginTop:36,marginBottom:10}}><MenuButton/></View>{!logged?<View style={{flexDirection:"row",gap:9,marginTop:15}}><TouchableOpacity accessibilityRole="button" onPress={()=>router.push("/auth")} style={{flex:1,paddingVertical:12,borderRadius:30,alignItems:"center",backgroundColor:"rgba(255,255,255,.55)",borderColor:"rgba(255,255,255,.98)",borderWidth:1.5}}><Text style={{fontWeight:"800",color:colors.ink}}>Log in</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={()=>router.push("/auth")} style={{flex:1,paddingVertical:12,borderRadius:30,alignItems:"center",backgroundColor:"rgba(255,208,162,.68)",borderColor:"rgba(255,255,255,.98)",borderWidth:1.5}}><Text style={{fontWeight:"800",color:colors.ink}}>Create free account</Text></TouchableOpacity></View>:<TouchableOpacity accessibilityRole="button" onPress={()=>router.push("/profile")} style={{alignSelf:"flex-start",marginTop:12,padding:12,borderRadius:28,backgroundColor:"rgba(255,255,255,.55)",borderWidth:1.5,borderColor:"#fff"}}><Text style={{fontWeight:"800",color:colors.ink}}>My profile →</Text></TouchableOpacity>}
  <Text style={[styles.title,{marginTop:33,fontSize:34,lineHeight:41}]}>There's good in{"\n"}the world. <Text style={{color:colors.orange}}>Find it.</Text></Text>
  <Text style={[styles.subtitle,{marginTop:10,marginBottom:26}]}>{liveWelcome}{"\n"}A little good, every day.</Text>
  <View style={{borderRadius:31,overflow:"hidden",borderWidth:2,borderColor:"rgba(255,255,255,.98)",marginBottom:27,backgroundColor:"rgba(255,255,255,.36)",shadowColor:"#9B6471",shadowOpacity:.24,shadowRadius:22,shadowOffset:{width:0,height:10}}}><LinearGradient colors={["rgba(255,253,241,.78)","rgba(255,213,193,.60)","rgba(248,213,240,.70)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:24,minHeight:177}}><View style={{flexDirection:"row",alignItems:"center",gap:8}}><Text style={{fontSize:21}}>☀️</Text><Text style={{color:"#6E3B38",fontSize:12,fontWeight:"900",letterSpacing:1.4}}>TODAY'S GOOD SIDE</Text></View><Text style={{color:"#251923",fontSize:23,fontWeight:"800",lineHeight:31,marginTop:15}}>{news[0]?.title||"Your daily dose of good news starts here."}</Text>{news[0]&&<TouchableOpacity accessibilityRole="button" onPress={()=>router.push({pathname:"/article/[id]",params:{id:news[0].news_id}} as any)} style={{marginTop:17,alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.65)",paddingVertical:11,paddingHorizontal:17,borderRadius:25,borderWidth:1.5,borderColor:"#fff"}}><Text style={{color:"#6D3A37",fontWeight:"800"}}>Read this story  →</Text></TouchableOpacity>}</LinearGradient></View>
  <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:13}}><Text style={{fontSize:21,fontWeight:"800",color:colors.ink}}>Explore good news</Text><TouchableOpacity onPress={()=>router.push("/search")}><Text style={{fontSize:15,color:colors.ink}}>Search ⌕</Text></TouchableOpacity></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:18}}>{[["All",""],...categories.map(c=>[c[0],c[1]])].filter((c,i,all)=>all.findIndex(x=>x[1]===c[1])===i).map(c=><TouchableOpacity key={c[1]} onPress={()=>{setCategory(c[1]);load(c[1]);}} style={{marginRight:8,paddingHorizontal:15,paddingVertical:11,borderRadius:30,backgroundColor:category===c[1]?"rgba(223,147,79,.92)":"rgba(255,255,255,.62)",borderColor:"rgba(255,255,255,.95)",borderWidth:1}}><Text style={{color:category===c[1]?"#fff":colors.ink,fontWeight:"600"}}>{c[0]}</Text></TouchableOpacity>)}</ScrollView>
  {feedLoading?<GoodSideLoader label="Finding today’s good news…"/>:null}
  {error?<Surface><Text style={styles.subtitle}>{error}</Text><Pill title="Try again" onPress={refresh}/></Surface>:null}
  {!news.length&&!feedLoading&&!error?<Surface><Text style={styles.subtitle}>No approved stories yet. Every article is checked before publication.</Text></Surface>:null}
  {feedEnabled?news.map((item,index)=><TouchableOpacity key={item.news_id+"-"+index} onPress={()=>router.push({pathname:"/article/[id]",params:{id:item.news_id}} as any)}><Surface style={{marginBottom:15,minHeight:150}}><Text style={{color:colors.orange,fontWeight:"700",fontSize:12,textTransform:"uppercase"}}>{item.category||"Good news"}</Text><Text style={{color:colors.ink,fontSize:20,fontWeight:"700",marginTop:8,lineHeight:27}}>{item.title}</Text><Text numberOfLines={3} style={[styles.subtitle,{marginTop:8}]}>{item.summary}</Text><Text style={[styles.muted,{marginTop:14}]}>{item.publisher} · {item.source_published_at?new Date(item.source_published_at).toLocaleDateString():""}</Text></Surface></TouchableOpacity>):<Surface><Text style={styles.subtitle}>The Good Side news feed is temporarily paused. Check back later.</Text></Surface>}
  {logged&&interests.length>0&&discoveries.length>0?<View style={{marginTop:20,marginBottom:8}}>
   <Text style={[styles.label,{fontSize:21,marginBottom:7}]}>🔎 From your interests</Text>
   <Text style={[styles.muted,{marginBottom:12}]}>Additional headlines from other publishers. These external links are not yet reviewed or published by The Good Side.</Text>
   {discoveries.map((item,i)=><TouchableOpacity key={item.url+"-"+i} onPress={()=>void Linking.openURL(item.url)} accessibilityRole="link"><Surface style={{marginBottom:11,padding:15}}>
    <Text style={{color:colors.orange,fontWeight:"800",fontSize:12}}>{categories.find(c=>c[1]===item.interest)?.[0]||item.interest} · External news</Text>
    <Text style={{fontSize:16,fontWeight:"700",color:colors.ink,marginTop:7}}>{item.title}</Text>
    <Text style={[styles.muted,{marginTop:8}]}>{item.publisher} · Open publisher ↗</Text>
   </Surface></TouchableOpacity>)}
  </View>:null}
  <View style={{marginTop:14}}><Pill title="♡ Saved stories" secondary onPress={()=>router.push((logged?"/saved":"/auth") as any)}/></View>
 </ScrollView></Background>
}
