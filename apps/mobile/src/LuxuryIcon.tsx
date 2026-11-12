import React from "react";
import {View,StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
type Tone="sun"|"peach"|"rose"|"violet"|"mint"|"sky";
const palettes:Record<Tone,[string,string,string]>={
 sun:["#FFF6CE","#FFC04B","#E47A19"],
 peach:["#FFECE0","#FFA978","#EB735E"],
 rose:["#FFE7F2","#F9A1C1","#D95D94"],
 violet:["#F2E5FF","#C69DF4","#8C63D0"],
 mint:["#E8FFF0","#92E1BA","#39AD86"],
 sky:["#EAF8FF","#96D4FA","#4B9BD9"]
};
export default function LuxuryIcon({children,tone="sun",size=46}:{children:React.ReactNode;tone?:Tone;size?:number}){
 const radius=Math.round(size*.33);
 return <View style={[styles.frame,{width:size,height:size,borderRadius:radius,shadowColor:palettes[tone][2]}]}>
  <LinearGradient pointerEvents="none" colors={palettes[tone]} locations={[0,.42,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={[StyleSheet.absoluteFill,{borderRadius:radius}]}/>
  <View pointerEvents="none" style={[styles.gloss,{borderTopLeftRadius:radius,borderTopRightRadius:radius}]}/>
  <View style={styles.icon}>{children}</View>
 </View>;
}
const styles=StyleSheet.create({
 frame:{borderWidth:1.2,borderColor:"rgba(255,255,255,.92)",overflow:"visible",alignItems:"center",justifyContent:"center",shadowOpacity:.42,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:5,backgroundColor:"#FFF0C5"},
 gloss:{position:"absolute",top:1,left:2,right:2,height:"45%",backgroundColor:"rgba(255,255,255,.35)",borderBottomLeftRadius:14,borderBottomRightRadius:14},
 icon:{alignItems:"center",justifyContent:"center"}
});
