import React,{useEffect,useState} from "react";
import {ScrollView,Text,View,TouchableOpacity,Linking,Alert,Share} from "react-native";
import {useLocalSearchParams,router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {api,auth,type News} from "../../src/client";
import {Background,Pill,Surface,GoodSideLoader,styles} from "../../src/components";
import {colors} from "../../src/theme";
export default function Article(){
 const {id}=useLocalSearchParams<{id:string}>(),[story,setStory]=useState<News|null>(null),[error,setError]=useState(""),[saving,setSaving]=useState(false);
 useEffect(()=>{
  if(!id)return;
  let alive=true;
  const key="goodside_article_v1_"+String(id);
  void (async()=>{
   try{const cached=await AsyncStorage.getItem(key);if(alive&&cached)setStory(JSON.parse(cached) as News)}catch{}
   try{const fresh=await api<News>("/news/"+encodeURIComponent(String(id)));if(alive){setStory(fresh);setError("")}await AsyncStorage.setItem(key,JSON.stringify(fresh))}
   catch{if(alive)setError("Could not refresh this story. A previously opened version may still be available.")}
  })();
  return()=>{alive=false};
 },[id]);
 const share=async()=>{if(!story)return;const link="https://the-good-side-command-center.netlify.app/share/?story="+encodeURIComponent(story.news_id);try{await Share.share({message:"☀️ I found some good news on The Good Side: "+story.title+"\n"+link,url:link,title:story.title})}catch(e){Alert.alert("Unable to share",String(e))}};
 const save=async()=>{if(!auth.currentUser){router.push("/auth");return}setSaving(true);try{await api("/me/saved/"+id,{method:"POST"},true);Alert.alert("Saved","Added to your reading list")}catch(e){Alert.alert("Unable to save",String(e))}finally{setSaving(false)}};
 return <Background><ScrollView contentContainerStyle={{padding:25,paddingTop:68,paddingBottom:100}}><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><TouchableOpacity onPress={()=>router.back()}><Text style={{fontSize:17,color:colors.ink}}>← Back</Text></TouchableOpacity></View>{error?<Text style={[styles.subtitle,{marginTop:30}]}>{error}</Text>:story?<><Text style={{color:colors.orange,fontWeight:"800",letterSpacing:2,marginTop:45}}>{story.category.toUpperCase()}</Text><Text style={[styles.title,{marginTop:15}]}>{story.title}</Text><Text style={[styles.muted,{marginTop:12,marginBottom:28}]}>{story.publisher} · {new Date(story.source_published_at).toLocaleDateString()}</Text><Surface><Text style={{fontSize:19,lineHeight:31,color:colors.ink}}>{story.full_summary||story.summary}</Text></Surface><Text style={[styles.subtitle,{marginTop:18,marginBottom:25}]}>Editorial summary. See the original publisher for full reporting and context.</Text><Pill title="Read original story ↗" onPress={()=>Linking.openURL(story.original_url)}/><View style={{height:12}}/><Pill title="↗ Share this good news" secondary onPress={()=>void share()}/><View style={{height:12}}/>{saving?<GoodSideLoader compact label="Saving story…"/>:null}<Pill title={saving?"Saving…":"♡ Save this story"} disabled={saving} secondary onPress={save}/></>:<GoodSideLoader label="Opening story…"/>}</ScrollView></Background>
}
