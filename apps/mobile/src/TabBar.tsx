import React from "react";
import {View,Text,Image,TouchableOpacity,StyleSheet,Platform} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {router,usePathname} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Existing navigation routes remain unchanged; only visuals use the supplied icons.
const NAV_ITEMS=[
 {label:"Home",href:"/",art:require("../assets/navigation/home.png")},
 {label:"Discover",href:"/search",art:require("../assets/navigation/discover.png")},
 {label:"Food",href:"/food",art:require("../assets/navigation/food.png")},
 {label:"Saved",href:"/saved",art:require("../assets/navigation/saved.png")},
 {label:"You",href:"/profile",art:require("../assets/navigation/you.png")},
] as const;

export default function TabBar(){
 const path=usePathname();
 const insets=useSafeAreaInsets();
 return <View pointerEvents="box-none" style={[styles.outer,{bottom:Math.max(insets.bottom,13)}]}>
   <View style={styles.dock}>
    <BlurView intensity={Platform.OS==="web"?34:82} tint="light" pointerEvents="none" style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" style={StyleSheet.absoluteFill}
      colors={["rgba(255,255,255,.68)","rgba(255,222,212,.46)","rgba(228,217,248,.51)"]}
      locations={[0,.52,1]} start={{x:0,y:0}} end={{x:1,y:1}}/>
    <View pointerEvents="none" style={styles.upperShine}/>
    <View pointerEvents="none" style={styles.lowerShine}/>
    {NAV_ITEMS.map(({label,href,art})=>{
      const selected=path===href;
      return <TouchableOpacity key={label} accessibilityLabel={label} accessibilityRole="tab"
        accessibilityState={{selected}} activeOpacity={.8}
        onPress={()=>{if(!selected)router.push(href as any)}}
        style={[styles.slot,selected&&styles.selectedSlot]}>
        {selected?<LinearGradient pointerEvents="none" colors={["rgba(255,253,247,.58)","rgba(255,225,211,.27)"]} style={StyleSheet.absoluteFill}/>:null}
        <Image source={art} style={[styles.art,selected&&styles.artSelected]} resizeMode="contain"/>
        <Text allowFontScaling numberOfLines={1} style={[styles.caption,selected&&styles.captionSelected]}>{label}</Text>
      </TouchableOpacity>;
    })}
   </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:12,right:12,zIndex:30},
 dock:{height:98,flexDirection:"row",alignItems:"center",paddingHorizontal:5,paddingVertical:6,
  backgroundColor:"rgba(255,246,245,.52)",borderWidth:2,borderColor:"rgba(255,255,255,.99)",
  borderRadius:40,overflow:"hidden",shadowColor:"#7B4B68",shadowRadius:22,shadowOpacity:.27,
  shadowOffset:{width:0,height:10},elevation:12},
 upperShine:{position:"absolute",top:2,left:18,right:18,height:9,
  borderTopLeftRadius:27,borderTopRightRadius:27,backgroundColor:"rgba(255,255,255,.55)"},
 lowerShine:{position:"absolute",bottom:1,left:22,right:22,height:2,
  backgroundColor:"rgba(255,255,255,.51)",borderRadius:10},
 slot:{flex:1,minWidth:0,height:82,borderRadius:29,justifyContent:"center",alignItems:"center",overflow:"hidden"},
 selectedSlot:{borderWidth:1,borderColor:"rgba(255,255,255,.78)",backgroundColor:"rgba(255,231,202,.20)"},
 art:{width:57,height:57,maxWidth:"100%"},
 artSelected:{transform:[{scale:1.04}]},
 caption:{color:"#3B2936",fontWeight:"700",fontSize:11,textAlign:"center",marginTop:0},
 captionSelected:{color:"#9B512C",fontWeight:"900"},
});
