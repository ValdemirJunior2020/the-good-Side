import React from "react";
import {TouchableOpacity,Text,StyleSheet} from "react-native";
import {router} from "expo-router";

/** Open a real Expo Router screen instead of an iOS Modal inside a ScrollView. */
export default function AppMenu(){
 return <TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Open menu"
  accessibilityHint="Open settings and account options"
  activeOpacity={0.75}
  hitSlop={12}
  onPress={()=>router.push("/menu")}
  style={styles.button}>
  <Text style={styles.icon}>☰</Text>
 </TouchableOpacity>;
}
const styles=StyleSheet.create({
 button:{height:48,width:52,backgroundColor:"rgba(255,255,255,.65)",borderColor:"rgba(255,255,255,.94)",borderWidth:1.5,borderRadius:16,alignItems:"center",justifyContent:"center",shadowColor:"#71403B",shadowOpacity:.13,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:5},
 icon:{fontSize:24,color:"#251923",lineHeight:29}
});
