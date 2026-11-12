import React,{useEffect,useState} from "react";
import {ScrollView,Text,View,TouchableOpacity,Alert,Platform,StyleSheet,ActivityIndicator} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {api,auth,put} from "../src/client";
import {Background,Pill,styles} from "../src/components";
import {categories,colors} from "../src/theme";

function asCategories(value:unknown):string[]{
 if(Array.isArray(value))return value.filter((item):item is string=>typeof item==="string");
 if(typeof value==="string")return value.split(",").map(item=>item.trim()).filter(Boolean);
 return [];
}
export default function Categories(){
 const [selected,setSelected]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const insets=useSafeAreaInsets();
 // The floating tab bar is absolutely positioned; clearance must include the safe area.
 const bottomClearance=87+Math.max(insets.bottom,13)+38;
 useEffect(()=>{
  let live=true;
  const load=async()=>{
   try{
    await auth.restore();
    if(!auth.currentUser)return;
    const pref=await api<{selected_categories?:string|string[]}>("/me/preferences",{},true);
    if(live)setSelected(asCategories(pref.selected_categories));
   }catch(e){console.warn("Unable to restore interests",e)}
   finally{if(live)setLoading(false)}
  };
  void load();
  return ()=>{live=false};
 },[]);
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
 const save=async()=>{
  setBusy(true);
  try{
   // Never reset an existing user's notification schedule while changing interest tags.
   await api("/me/preferences",put({selected_categories:selected}),true);
   router.replace("/preferences");
  }catch(e){Alert.alert("Unable to save",String(e))}
  finally{setBusy(false)}
 };
 return <Background><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[ui.page,{paddingBottom:bottomClearance}]}>
  <Text style={[styles.title,{fontSize:36,lineHeight:42}]}>What makes you{"\n"}smile?</Text>
  <Text style={[styles.subtitle,{marginTop:10,marginBottom:22}]}>Choose the stories that brighten your day. Change your interests anytime.</Text>
  {loading?<ActivityIndicator color={colors.orange} style={{marginVertical:24}}/>:null}
  <View style={ui.grid}>{categories.map(([label,id,emoji])=>{
   const active=selected.includes(id);
   return <TouchableOpacity key={id} accessibilityRole="checkbox" accessibilityState={{checked:active}} onPress={()=>toggle(id)} activeOpacity={.79} style={[ui.card,active&&ui.selected]}>
    <LinearGradient pointerEvents="none" colors={active?["rgba(255,247,206,.98)","rgba(250,176,109,.92)","rgba(242,160,165,.80)"]:["rgba(255,255,255,.86)","rgba(255,232,223,.59)","rgba(249,218,237,.60)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
    <Text style={ui.symbol}>{emoji}</Text>
    <Text style={ui.cardText}>{label}</Text>
    <View style={[ui.check,active&&ui.checkSelected]}><Text style={{fontSize:13,color:active?"#fff":"#C39982",fontWeight:"900"}}>{active?"✓":"+"}</Text></View>
   </TouchableOpacity>
  })}</View>
  <View style={ui.footer}>
   <Text style={ui.counter}>{selected.length} interests selected</Text>
   <Pill title={busy?"Saving…":"Continue →"} onPress={save} disabled={busy||loading}/>
  </View>
 </ScrollView></Background>;
}
const ui=StyleSheet.create({
 page:{paddingHorizontal:20,paddingTop:76,width:"100%",maxWidth:600,alignSelf:"center"},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:11,justifyContent:"space-between"},
 card:{width:"48%",minHeight:108,borderRadius:24,borderWidth:1.7,borderColor:"rgba(255,255,255,.97)",padding:13,justifyContent:"center",overflow:"hidden",shadowColor:"#B67681",shadowOpacity:.17,shadowRadius:15,shadowOffset:{width:0,height:6},elevation:3},
 selected:{borderColor:"#FFE5AB",shadowColor:"#D77D2F",shadowOpacity:.27},
 symbol:{fontSize:27,marginBottom:6},
 cardText:{color:"#332330",fontWeight:"800",fontSize:13.5,lineHeight:18,paddingRight:13},
 check:{position:"absolute",right:10,top:10,width:21,height:21,borderRadius:12,backgroundColor:"rgba(255,255,255,.67)",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"rgba(255,255,255,.9)"},
 checkSelected:{backgroundColor:"#CF7627"},
 footer:{marginTop:24,gap:13},
 counter:{fontSize:13,fontWeight:"700",textAlign:"center",color:"#634653"}
});
