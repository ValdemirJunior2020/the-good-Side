import React from "react";
import {View,Text,Image,TouchableOpacity,StyleSheet} from "react-native";
import {router,usePathname} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// The user's original supplied transparent artwork. Keep routes and app behavior unchanged.
const tabs=[
 {label:"Home",href:"/",art:require("../assets/navigation/home.png")},
 {label:"Discover",href:"/search",art:require("../assets/navigation/discover.png")},
 {label:"Food",href:"/food",art:require("../assets/navigation/food.png")},
 {label:"Saved",href:"/saved",art:require("../assets/navigation/saved.png")},
 {label:"You",href:"/profile",art:require("../assets/navigation/you.png")},
] as const;

export default function TabBar(){
 const pathname=usePathname();
 const insets=useSafeAreaInsets();
 return <View pointerEvents="box-none" style={[styles.outer,{bottom:Math.max(insets.bottom,12)}]}>
  <View style={styles.dock}>
   {tabs.map(({label,href,art})=>{
    const active=pathname===href;
    return <TouchableOpacity key={label} accessibilityRole="tab" accessibilityLabel={label}
     accessibilityState={{selected:active}} activeOpacity={.8}
     onPress={()=>{if(!active)router.push(href as any)}} style={[styles.tab,active&&styles.selected]}>
     <Image source={art} resizeMode="contain"
      style={[styles.icon,label==="You"&&styles.youIcon]}/>
     <Text numberOfLines={1} style={[styles.text,active&&styles.activeText]}>{label}</Text>
    </TouchableOpacity>
   })}
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:12,right:12,zIndex:30},
 dock:{height:104,flexDirection:"row",alignItems:"center",paddingHorizontal:5,
  backgroundColor:"#FFFAF7",borderRadius:33,borderWidth:1.5,borderColor:"#FFFFFF",
  shadowColor:"#785C70",shadowOpacity:.19,shadowRadius:18,shadowOffset:{width:0,height:7},elevation:10},
 tab:{flex:1,minWidth:0,height:92,alignItems:"center",justifyContent:"center",
  borderRadius:26,paddingTop:2,paddingBottom:5},
 selected:{backgroundColor:"#FFE9D3"},
 icon:{width:62,height:62},
 youIcon:{width:76,height:66},
 text:{fontSize:11,fontWeight:"700",color:"#382B37",textAlign:"center",marginTop:1},
 activeText:{fontWeight:"900",color:"#9D4E2C"}
});
