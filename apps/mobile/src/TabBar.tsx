import React from "react";
import {View,Text,TouchableOpacity,StyleSheet,Platform} from "react-native";
import {router,usePathname} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {colors} from "./theme";
import {House,Compass,ChefHat,Heart,UserRound} from "lucide-react-native";
import LuxuryIcon from "./LuxuryIcon";
const tabs:[string,string][]=[["Home","/"],["Discover","/search"],["Food","/food"],["Saved","/saved"],["You","/profile"]];
const icons={Home:House,Discover:Compass,Food:ChefHat,Saved:Heart,You:UserRound};
const tones={Home:"sun",Discover:"sky",Food:"mint",Saved:"rose",You:"peach"} as const;
const pigments={Home:"#9C5D17",Discover:"#326CA9",Food:"#297E64",Saved:"#B64F7D",You:"#9C5425"};
export default function TabBar(){
 const path=usePathname();
 return <View pointerEvents="box-none" style={styles.outer}>
  <View style={styles.container}>
   {Platform.OS==="ios"?<BlurView tint="light" intensity={75} style={StyleSheet.absoluteFill} pointerEvents="none"/>:null}
   {tabs.map(([name,href])=>{
    const active=path===href;
    const IconComponent=icons[name as keyof typeof icons];
    return <TouchableOpacity key={name} accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{selected:active}} onPress={()=>{if(!active)router.push(href as any)}} style={[styles.item,active&&styles.activeItem]} activeOpacity={.8}>
     {active?<LinearGradient colors={["#FFE7B1","#F4AA4D"]} style={StyleSheet.absoluteFill} pointerEvents="none"/>:null}
     {active?<LuxuryIcon size={46} tone="sun"><IconComponent size={27} color="#9E5019" strokeWidth={2.4}/></LuxuryIcon>:<IconComponent size={29} color="#332832" strokeWidth={1.9}/>}
     <Text style={[styles.label,active&&{color:"#A34A0F",fontWeight:"900"}]}>{name}</Text>
    </TouchableOpacity>;
   })}
  </View>
 </View>;
}
const styles=StyleSheet.create({
 outer:{position:"absolute",left:13,right:13,bottom:Platform.OS==="ios"?22:13,zIndex:30},
 container:{flexDirection:"row",borderRadius:44,minHeight:77,padding:5,backgroundColor:"rgba(255,247,246,.62)",borderWidth:1.5,borderColor:"rgba(255,255,255,.98)",overflow:"hidden",shadowColor:"#975C6C",shadowOpacity:.17,shadowRadius:21,shadowOffset:{width:0,height:10},elevation:8},
 item:{flex:1,alignItems:"center",justifyContent:"center",borderRadius:38,overflow:"visible",paddingVertical:7,gap:4},
 activeItem:{borderWidth:1,borderColor:"rgba(255,255,255,.93)"},
 icon:{fontSize:29,color:colors.ink,fontWeight:"400"},
 label:{fontSize:12.5,fontWeight:"600",color:colors.ink},
 personBadge:{width:30,height:30,borderRadius:18,alignItems:"center",justifyContent:"center",overflow:"hidden",marginBottom:1},
 personBadgeActive:{backgroundColor:"#EFA64E",borderColor:"rgba(255,255,255,.8)",borderWidth:1},
 personHead:{position:"absolute",width:11,height:11,borderRadius:7,backgroundColor:"#392536",top:4},
 personShoulders:{position:"absolute",width:21,height:15,borderTopLeftRadius:12,borderTopRightRadius:12,backgroundColor:"#392536",bottom:1}
});
