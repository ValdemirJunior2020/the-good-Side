import React from "react";
import {View,StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
type Tone="sun"|"peach"|"rose"|"violet"|"mint"|"sky";
const palettes:Record<Tone,[string,string,string]>={
 sun:["#FFF8CF","#FFC34C","#ED8B36"],
 peach:["#FFF6DE","#FFC69C","#ED9776"],
 rose:["#FFF0F5","#F9B9D0","#E889B9"],
 violet:["#F9EEFF","#D6B9F9","#AF91E4"],
 mint:["#EFFFEA","#A8E8CB","#68BE9F"],
 sky:["#EEF9FF","#B8E0FA","#81B8F0"]
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
 frame:{borderWidth:1.2,borderColor:"rgba(255,255,255,.92)",overflow:"visible",alignItems:"center",justifyContent:"center",shadowOpacity:.30,shadowRadius:10,shadowOffset:{width:0,height:5},elevation:5,backgroundColor:"#FFF0C5"},
 gloss:{position:"absolute",top:1,left:2,right:2,height:"45%",backgroundColor:"rgba(255,255,255,.35)",borderBottomLeftRadius:14,borderBottomRightRadius:14},
 icon:{alignItems:"center",justifyContent:"center"}
});
