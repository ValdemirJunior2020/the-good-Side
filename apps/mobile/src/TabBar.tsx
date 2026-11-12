import React from "react";
import {View,Text,TouchableOpacity,StyleSheet,Platform} from "react-native";
import {router,usePathname} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {colors} from "./theme";
const tabs:[string,string,string][]=[["Home","⌂","/"],["Discover","◈","/search"],["Food","♧","/food"],["Saved","♡","/saved"],["You","♟","/profile"]];
export default function TabBar(){
 const path=usePathname();
 return <View pointerEvents="box-none" style={styles.outer}>
  <View style={styles.container}>
   {Platform.OS==="ios"?<BlurView tint="light" intensity={75} style={StyleSheet.absoluteFill} pointerEvents="none"/>:null}
   {tabs.map(([name,icon,href])=>{
    const active=path===href;
    return <TouchableOpacity key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:active}} onPress={()=>{if(!active)router.push(href as any)}} style={[styles.item,active&&styles.activeItem]} activeOpacity={.8}>
     {active?<LinearGradient colors={["#FFEEDC","#F8BE83","#E8AA92"]} style={StyleSheet.absoluteFill}/>:null}
     <Text style={[styles.icon,active&&{color:"#A34A0F"}]}>{icon}</Text>
     <Text style={[styles.label,active&&{color:"#A34A0F",fontWeight:"900"}]}>{name}</Text>
    </TouchableOpacity>;
   })}
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:13,right:13,bottom:Platform.OS==="ios"?25:13,zIndex:30},
 container:{flexDirection:"row",borderRadius:44,minHeight:71,padding:5,backgroundColor:"rgba(255,246,243,.84)",borderWidth:1.5,borderColor:"rgba(255,255,255,.98)",overflow:"hidden",shadowColor:"#975C6C",shadowOpacity:.17,shadowRadius:21,shadowOffset:{width:0,height:10},elevation:8},
 item:{flex:1,alignItems:"center",justifyContent:"center",borderRadius:38,overflow:"hidden",paddingVertical:7,gap:1},
 activeItem:{borderWidth:1,borderColor:"rgba(255,255,255,.93)"},
 icon:{fontSize:29,color:colors.ink,fontWeight:"400"},
 label:{fontSize:11.5,fontWeight:"600",color:colors.ink}
});
