import React,{useState,useCallback} from "react";
import {ScrollView,Text,TextInput,TouchableOpacity,View,Linking,Alert} from "react-native";
import {router} from "expo-router";
import {api,type News} from "../src/client";
import {Background,Surface,Pill,GoodSideLoader,MenuButton,styles} from "../src/components";
import {colors} from "../src/theme";
type LiveStory={title:string;url:string;publisher:string;published_at:string};
const suggestions=["Science","Kindness","Animals","Nature","Community","Health"];
export default function Search(){
 const [q,setQ]=useState(""),[items,setItems]=useState<News[]>([]),[live,setLive]=useState<LiveStory[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[searched,setSearched]=useState(false),[liveError,setLiveError]=useState("");
 const search=useCallback(async(value=q)=>{
  const term=value.trim();if(term.length<2){setError("Enter at least two characters to search.");return}
  setQ(term);setBusy(true);setError("");setLiveError("");setSearched(true);setItems([]);setLive([]);
  try{
   const local=await api<{items:News[]}>("/news?q="+encodeURIComponent(term)+"&limit=30");
   setItems(local.items||[]);
  }catch(e){setError("Saved stories are temporarily unavailable. Live search may still work.")}
  try{
   const results=await api<{items:LiveStory[]}>("/news/search-live?q="+encodeURIComponent(term));
   setLive(results.items||[]);
  }catch(e){setLiveError("Live news search is unavailable right now. Please try again later.")}
  setBusy(false);
 },[q]);
 const openExternal=async(url:string)=>{try{const parsed=new URL(url);if(parsed.protocol!=="https:")throw Error("Insecure link");await Linking.openURL(url)}catch{Alert.alert("Cannot open story","This external news link is currently unavailable.")}};
 return <Background><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:24,paddingTop:65,paddingBottom:175}}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.muted}>← Back</Text></TouchableOpacity>
  <View style={{alignItems:"flex-end",marginTop:36,marginBottom:10}}><MenuButton/></View>
  <Text style={[styles.title,{marginTop:18,marginBottom:8}]}>Discover the good.</Text>
  <Text style={[styles.subtitle,{marginBottom:22}]}>Find inspiring stories from around the world.</Text>
  <View style={{backgroundColor:"rgba(255,255,255,.86)",borderRadius:23,padding:10,borderWidth:1.5,borderColor:"#FFFFFF"}}>
   <TextInput value={q} onChangeText={setQ} onSubmitEditing={()=>void search()} returnKeyType="search" autoCorrect={false}
    placeholder="Search good news, science, people…" style={[styles.input,{marginBottom:0}]} selectionColor="#B96F39" placeholderTextColor="#806D78"/>
  </View>
  <View style={{marginTop:14}}><Pill title={busy?"Searching…":"Search stories"} onPress={()=>void search()} disabled={busy||q.trim().length<2}/></View>
  <Text style={[styles.muted,{marginTop:22,marginBottom:8}]}>Explore topics</Text>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{suggestions.map(topic=><TouchableOpacity key={topic} onPress={()=>void search(topic)} style={{backgroundColor:"rgba(255,255,255,.78)",paddingVertical:11,paddingHorizontal:15,borderRadius:30,borderWidth:1,borderColor:"#FFF"}}><Text style={{color:colors.ink,fontWeight:"700"}}>{topic}</Text></TouchableOpacity>)}</View>
  {busy?<GoodSideLoader label="Searching stories and live sources…"/>:null}
  {error?<Text style={[styles.subtitle,{marginTop:15}]}>{error}</Text>:null}
  {items.length>0?<View style={{marginTop:22}}><Text style={[styles.label,{fontSize:19}]}>From The Good Side</Text>{items.map(n=><TouchableOpacity key={n.news_id} onPress={()=>router.push({pathname:"/article/[id]",params:{id:n.news_id}} as any)}><Surface style={{marginTop:12}}><Text style={{fontWeight:"800",fontSize:18,color:colors.ink}}>{n.title}</Text><Text style={[styles.muted,{marginTop:8}]}>{n.publisher}</Text></Surface></TouchableOpacity>)}</View>:null}
  {live.length>0?<View style={{marginTop:24}}><Text style={[styles.label,{fontSize:19}]}>Live news discoveries</Text><Text style={[styles.muted,{marginBottom:4}]}>External articles from Google News. Not yet reviewed or published by The Good Side.</Text>{live.map((n,i)=><TouchableOpacity key={n.url+"-"+i} onPress={()=>void openExternal(n.url)}><Surface style={{marginTop:12}}><Text style={{fontWeight:"800",fontSize:18,color:colors.ink}}>{n.title}</Text><Text style={[styles.muted,{marginTop:8}]}>{n.publisher}{n.published_at?" · "+n.published_at:""} · Read at source ↗</Text></Surface></TouchableOpacity>)}</View>:null}
  {!busy&&liveError?<Text style={[styles.muted,{marginTop:20}]}>{liveError}</Text>:null}
  {!busy&&searched&&!items.length&&!live.length?<Surface style={{marginTop:22}}><Text style={styles.subtitle}>No stories found. Try a broader subject, such as science, nature, or kindness.</Text></Surface>:null}
 </ScrollView></Background>
}