import React from "react";
import {View,Text,TouchableOpacity,StyleSheet,Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router,usePathname} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import GoodSide3DIcon,{type GoodSideTab} from "./GoodSide3DIcon";

const tabs:{name:GoodSideTab;href:string}[]=[
 {name:"Home",href:"/"},{name:"Discover",href:"/search"},{name:"Food",href:"/food"},
 {name:"Saved",href:"/saved"},{name:"You",href:"/profile"}
];
export default function TabBar(){
 const path=usePathname();
 const insets=useSafeAreaInsets();
 return <View pointerEvents="box-none" style={[styles.outer,{bottom:Math.max(insets.bottom,13)}]}>
  <View style={styles.container}>
   <BlurView tint="light" intensity={Platform.OS==="web"?35:78} style={StyleSheet.absoluteFill} pointerEvents="none"/>
   <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,.62)","rgba(249,224,221,.43)","rgba(234,218,246,.47)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
   <View pointerEvents="none" style={styles.topShine}/>
   {tabs.map(({name,href})=>{
    const active=path===href;
    return <TouchableOpacity key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:active}} activeOpacity={.83} onPress={()=>{if(!active)router.push(href as any)}} style={[styles.item,active&&styles.activeItem]}>
     {active?<LinearGradient pointerEvents="none" colors={["rgba(255,249,235,.75)","rgba(255,219,197,.38)","rgba(240,210,236,.27)"]} style={StyleSheet.absoluteFill}/>:null}
     <View style={[styles.iconWrap,active&&styles.activeIcon]}><GoodSide3DIcon name={name} size={53}/></View>
     <Text numberOfLines={1} style={[styles.label,active&&styles.activeLabel]}>{name}</Text>
    </TouchableOpacity>;
   })}
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:11,right:11,zIndex:30},
 container:{flexDirection:"row",alignItems:"center",borderRadius:39,minHeight:92,padding:5,backgroundColor:"rgba(255,243,241,.62)",borderWidth:2,borderColor:"rgba(255,255,255,.98)",overflow:"hidden",shadowColor:"#87516C",shadowOpacity:.25,shadowRadius:23,shadowOffset:{width:0,height:10},elevation:10},
 topShine:{position:"absolute",top:2,left:19,right:19,height:10,borderTopLeftRadius:30,borderTopRightRadius:30,backgroundColor:"rgba(255,255,255,.68)"},
 item:{flex:1,alignItems:"center",justifyContent:"center",minWidth:0,borderRadius:31,paddingTop:3,paddingBottom:5,overflow:"hidden"},
 activeItem:{borderWidth:1,borderColor:"rgba(255,255,255,.9)",backgroundColor:"rgba(255,229,208,.30)"},
 iconWrap:{height:56,width:"100%",alignItems:"center",justifyContent:"center"},
 activeIcon:{transform:[{scale:1.08}]},
 label:{fontSize:11,fontWeight:"700",color:"#372837",marginTop:0},
 activeLabel:{color:"#AC562C",fontWeight:"900"}
});