import React,{useState} from "react";
import {ScrollView,Text,View,TouchableOpacity,Alert} from "react-native";
import {router} from "expo-router";
import {api,put} from "../src/client";
import {Background,Pill,styles} from "../src/components";
import {categories,colors} from "../src/theme";
export default function Categories(){
 const [selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false);
 const save=async()=>{setBusy(true);try{await api("/me/preferences",put({selected_categories:selected,notification_local_time:"12:00",notification_enabled:false,daily_digest_enabled:true,content_language:"en"}),true);router.replace("/preferences")}catch(e){Alert.alert("Unable to save",String(e))}finally{setBusy(false)}};
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:65,paddingBottom:55}}><Text style={styles.title}>What makes you{"\n"}smile?</Text><Text style={[styles.subtitle,{marginTop:10,marginBottom:25}]}>Choose the kinds of good news you want. You can change this anytime.</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>{categories.map(c=><TouchableOpacity key={c[1]} onPress={()=>setSelected(x=>x.includes(c[1])?x.filter(z=>z!==c[1]):[...x,c[1]])} style={{padding:17,borderRadius:19,backgroundColor:selected.includes(c[1])?"#E8A56C":"rgba(255,255,255,.8)",width:"48%",minHeight:92,justifyContent:"center"}}><Text style={{fontSize:27}}>{c[2]}</Text><Text style={{fontWeight:"700",color:colors.ink,marginTop:7}}>{c[0]}</Text></TouchableOpacity>)}</View><View style={{marginTop:30}}><Pill title={busy?"Saving…":"Continue →"} onPress={save} disabled={busy}/></View></ScrollView></Background>
}
