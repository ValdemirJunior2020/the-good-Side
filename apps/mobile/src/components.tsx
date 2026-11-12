import React from "react";
import {View,Text,Image,TouchableOpacity,StyleSheet,type ViewStyle} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {colors} from "./theme";
export function Surface({children,style}:{children:React.ReactNode;style?:ViewStyle}){return <View style={[styles.surface,style]}><BlurView intensity={65} tint="light" pointerEvents="none" style={StyleSheet.absoluteFill}/><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,.39)","rgba(255,241,234,.29)","rgba(255,218,233,.28)"]} style={StyleSheet.absoluteFill}/><View style={{position:"absolute",top:1,left:20,right:20,height:1,backgroundColor:"rgba(255,255,255,.88)"}} pointerEvents="none"/>{children}</View>}
// Bundle the exact supplied Drive logo: remote Google Drive image links can fail inside Expo Go.
const GOOD_SIDE_LOGO=require("../assets/good-side-logo.png");
export function Brand({small=false}:{small?:boolean}){
 const [imageFailed,setImageFailed]=React.useState(false);
 const width=small?188:235,height=small?58:72;
 if(imageFailed)return <View style={{flexDirection:"row",alignItems:"center",gap:8}}><Text style={{fontSize:small?22:31}}>☀️</Text><Text style={{fontWeight:"800",fontSize:small?19:25,color:colors.ink,letterSpacing:-.6}}>the good side<Text style={{color:colors.orange}}>.</Text></Text></View>;
 return <View accessibilityLabel="The Good Side" style={{width,height,alignItems:"flex-start",justifyContent:"center"}}>
  <Image source={GOOD_SIDE_LOGO} accessibilityLabel="The Good Side logo" resizeMode="contain" onError={()=>setImageFailed(true)}
   style={{width,height,shadowColor:"#A65F27",shadowOpacity:.23,shadowRadius:7,shadowOffset:{width:0,height:3}}}/>
 </View>;
}
export function Pill({title,onPress,secondary=false,disabled=false}:{title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}){return <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={.8} style={[styles.btn,secondary&&styles.secondary,disabled&&{opacity:.4}]}><Text style={{color:secondary?colors.ink:"white",fontWeight:"700",fontSize:15}}>{title}</Text></TouchableOpacity>}
export function Background({children}:{children:React.ReactNode}){return <LinearGradient colors={["#FFF2E4","#F8D6CB","#E6D5E8"]} locations={[0,.48,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}><LinearGradient pointerEvents="none" colors={["rgba(255,209,139,.55)","rgba(255,209,139,0)"]} style={{position:"absolute",top:0,left:0,width:"65%",height:"48%"}}/><LinearGradient pointerEvents="none" colors={["rgba(198,183,226,0)","rgba(198,183,226,.43)"]} style={{position:"absolute",right:0,top:"32%",width:"65%",height:"50%"}}/>{children}</LinearGradient>}
export const styles=StyleSheet.create({surface:{backgroundColor:"rgba(255,255,255,.38)",overflow:"hidden",borderWidth:1.1,borderColor:"rgba(255,255,255,.82)",borderRadius:26,padding:22,shadowColor:"#71403B",shadowOpacity:.13,shadowRadius:30,shadowOffset:{width:0,height:12},elevation:4},btn:{backgroundColor:colors.ink,borderRadius:19,paddingVertical:16,paddingHorizontal:24,alignItems:"center",justifyContent:"center",minHeight:52},secondary:{backgroundColor:"rgba(255,255,255,.78)",borderWidth:1,borderColor:colors.stroke},title:{fontSize:35,fontWeight:"800",color:colors.ink,letterSpacing:-1.2},subtitle:{fontSize:16,color:colors.muted,lineHeight:24},input:{backgroundColor:"#fff",borderWidth:1,borderColor:colors.stroke,borderRadius:15,padding:16,fontSize:16,color:colors.ink,marginBottom:12},label:{fontWeight:"700",color:colors.ink,fontSize:17,marginBottom:10},page:{flex:1,padding:24},muted:{color:colors.muted,fontSize:14}});
