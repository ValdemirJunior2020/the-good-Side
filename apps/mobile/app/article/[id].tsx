import React,{useEffect,useState} from "react";
import {ScrollView,Text,View,TouchableOpacity,Linking,Alert} from "react-native";
import {useLocalSearchParams,router} from "expo-router";
import {api,auth,type News} from "../../src/client";
import {Background,Pill,Surface,styles} from "../../src/components";
import {colors} from "../../src/theme";
export default function Article(){
 const {id}=useLocalSearchParams<{id:string}>(),[story,setStory]=useState<News|null>(null),[error,setError]=useState("");
 useEffect(()=>{if(!id)return;api<News>("/news/"+encodeURIComponent(id)).then(setStory).catch(e=>setError(String(e)))},[id]);
 const save=async()=>{if(!auth.currentUser){router.push("/auth");return}try{await api("/me/saved/"+id,{method:"POST"},true);Alert.alert("Saved","Added to your reading list")}catch(e){Alert.alert("Unable to save",String(e))}};
 return <Background><ScrollView contentContainerStyle={{padding:25,paddingTop:68}}><TouchableOpacity onPress={()=>router.back()}><Text style={{fontSize:17,color:colors.ink}}>← Back</Text></TouchableOpacity>{error?<Text style={[styles.subtitle,{marginTop:30}]}>{error}</Text>:story?<><Text style={{color:colors.orange,fontWeight:"800",letterSpacing:2,marginTop:45}}>{story.category.toUpperCase()}</Text><Text style={[styles.title,{marginTop:15}]}>{story.title}</Text><Text style={[styles.muted,{marginTop:12,marginBottom:28}]}>{story.publisher} · {new Date(story.source_published_at).toLocaleDateString()}</Text><Surface><Text style={{fontSize:19,lineHeight:31,color:colors.ink}}>{story.full_summary||story.summary}</Text></Surface><Text style={[styles.subtitle,{marginTop:18,marginBottom:25}]}>Editorial summary. See the original publisher for full reporting and context.</Text><Pill title="Read original story ↗" onPress={()=>Linking.openURL(story.original_url)}/><View style={{height:12}}/><Pill title="♡ Save this story" secondary onPress={save}/></>:<Text style={[styles.subtitle,{marginTop:30}]}>Loading story…</Text>}</ScrollView></Background>
}
