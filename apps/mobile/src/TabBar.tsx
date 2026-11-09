import React from "react";
import{View,Text,TouchableOpacity,StyleSheet,Platform}from"react-native";
import{router,usePathname}from"expo-router";
import{BlurView}from"expo-blur";
import{colors}from"./theme";
const tabs:[string,string,string][]=[["Home","⌂","/"],["Discover","⌕","/search"],["Food","🥗","/food"],["Saved","♡","/saved"],["You","◉","/profile"]];
export default function TabBar(){
 const path=usePathname();
 return <View pointerEvents="box-none" style={styles.outer}><View style={styles.container}>
  {Platform.OS==="ios"?<BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill}/>:null}
  {tabs.map(([name,icon,href])=><TouchableOpacity key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:path===href}} onPress={()=>router.push(href as any)} style={styles.item}>
   <Text style={{fontSize:23,color:path===href?colors.orange:colors.ink}}>{icon}</Text>
   <Text style={{fontSize:11,fontWeight:path===href?"800":"600",color:path===href?colors.orange:colors.muted}}>{name}</Text>
  </TouchableOpacity>)}
 </View></View>;
}
const styles=StyleSheet.create({outer:{position:"absolute",left:18,right:18,bottom:Platform.OS==="ios"?27:16,zIndex:20},container:{flexDirection:"row",borderRadius:28,minHeight:66,backgroundColor:Platform.OS==="ios"?"rgba(255,255,255,.69)":"#FFF8F0",borderWidth:1,borderColor:"rgba(255,255,255,.9)",overflow:"hidden",shadowOpacity:.14,shadowRadius:18,shadowOffset:{width:0,height:8},shadowColor:"#805C4C",elevation:8},item:{flex:1,alignItems:"center",justifyContent:"center",paddingVertical:8,gap:3}});
