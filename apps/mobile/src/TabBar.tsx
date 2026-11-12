import React from "react";
import {View,Text,TouchableOpacity,StyleSheet,Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router,usePathname} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {House,Compass,ChefHat,Heart,UserRound} from "lucide-react-native";
const tabs:[string,string][]=[["Home","/"],["Discover","/search"],["Food","/food"],["Saved","/saved"],["You","/profile"]];
const icons={Home:House,Discover:Compass,Food:ChefHat,Saved:Heart,You:UserRound};
export default function TabBar(){
 const path=usePathname();
 const insets=useSafeAreaInsets();
 return <View pointerEvents="box-none" style={[styles.outer,{bottom:Math.max(insets.bottom,Platform.OS==="ios"?13:13)}]}>
  <View style={styles.container}>
   <BlurView tint="light" intensity={Platform.OS==="web"?35:78} style={StyleSheet.absoluteFill} pointerEvents="none"/>
   <LinearGradient pointerEvents="none" colors={["rgba(255,253,251,.55)","rgba(255,218,210,.35)","rgba(251,221,246,.42)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
   {tabs.map(([name,href])=>{
    const active=path===href;
    const IconComponent=icons[name as keyof typeof icons];
    return <TouchableOpacity key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:active}} onPress={()=>{if(!active)router.push(href as any)}} style={[styles.item,active&&styles.activeItem]} activeOpacity={.8}>
     {active?<LinearGradient colors={["rgba(255,246,225,.7)","rgba(255,192,127,.58)","rgba(255,219,201,.68)"]} style={StyleSheet.absoluteFill} pointerEvents="none"/>:null}
     {active?<View style={styles.activeOrb}><LinearGradient pointerEvents="none" colors={["#FFF1A9","#FFB52C","#E87913"]} locations={[0,.43,1]} style={[StyleSheet.absoluteFill,{borderRadius:40}]}/><IconComponent size={25} color="#FFF8E6" strokeWidth={2.6}/></View>:<View style={styles.iconOutline}><IconComponent size={26} color="#32222C" strokeWidth={1.85}/></View>}
     <Text style={[styles.label,active&&styles.activeLabel]}>{name}</Text>
    </TouchableOpacity>;
   })}
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:13,right:13,zIndex:30},
 container:{flexDirection:"row",borderRadius:45,minHeight:87,padding:5,backgroundColor:"rgba(255,237,234,.58)",borderWidth:1.8,borderColor:"rgba(255,255,255,.98)",overflow:"hidden",shadowColor:"#975C6C",shadowOpacity:.22,shadowRadius:24,shadowOffset:{width:0,height:11},elevation:10},
 item:{flex:1,alignItems:"center",justifyContent:"center",borderRadius:38,overflow:"hidden",paddingVertical:6,gap:3},
 activeItem:{borderWidth:1.2,borderColor:"rgba(255,255,255,.88)",shadowColor:"#F99B25",shadowOpacity:.28,shadowRadius:14},
 iconOutline:{height:45,alignItems:"center",justifyContent:"center"},
 activeOrb:{width:47,height:47,borderRadius:25,borderColor:"rgba(255,255,255,.98)",borderWidth:1.5,alignItems:"center",justifyContent:"center",overflow:"hidden",shadowColor:"#E98C25",shadowOpacity:.5,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:5},
 label:{fontSize:11.5,fontWeight:"650",color:"#2E2029"},
 activeLabel:{color:"#FFF9F2",fontWeight:"900",textShadowColor:"rgba(139,65,15,.6)",textShadowOffset:{width:0,height:1},textShadowRadius:3}
});
