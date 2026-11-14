import React,{useEffect,useRef} from "react";
import {View,Text,Image,TouchableOpacity,Pressable,StyleSheet,Animated,Easing,Platform,type ViewStyle} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {colors} from "./theme";
import {router,usePathname} from "expo-router";
import {Menu} from "lucide-react-native";
export function Surface({children,style}:{children:React.ReactNode;style?:ViewStyle}){return <View style={[styles.surface,style]}><View pointerEvents="none" style={[StyleSheet.absoluteFill,{overflow:"hidden",borderRadius:26}]}><BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill}/><LinearGradient colors={["rgba(255,255,255,.39)","rgba(255,241,234,.29)","rgba(255,218,233,.28)"]} style={StyleSheet.absoluteFill}/><View style={{position:"absolute",top:1,left:20,right:20,height:1,backgroundColor:"rgba(255,255,255,.88)"}}/></View><View style={{position:"relative",zIndex:2}}>{children}</View></View>}
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
/** Lightweight animated original sunrise, not a downloaded GIF. Keeps a consistent accessible waiting state. */
export function GoodSideLoader({label="Loading…",compact=false}:{label?:string;compact?:boolean}){
 const spin=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  spin.setValue(0);
  const animation=Animated.loop(Animated.timing(spin,{toValue:1,duration:1400,easing:Easing.linear,useNativeDriver:Platform.OS!=="web"}));
  animation.start();
  return ()=>animation.stop();
 },[spin]);
 return <View accessibilityRole="progressbar" accessibilityLabel={label}
  style={{flexDirection:"row",justifyContent:"center",alignItems:"center",gap:9,paddingVertical:compact?5:15}}>
  <Animated.View style={{transform:[{rotate:spin.interpolate({inputRange:[0,1],outputRange:["0deg","360deg"]})}]}}>
   <View style={{width:compact?21:30,height:compact?21:30,borderWidth:3,borderColor:"#F9BF66",borderTopColor:"#BA6D34",borderRadius:30,alignItems:"center",justifyContent:"center"}}>
    <View style={{width:compact?8:11,height:compact?8:11,borderRadius:12,backgroundColor:"#F8A334"}}/>
   </View>
  </Animated.View>
  <Text style={{color:"#694653",fontWeight:"700",fontSize:compact?12:14}}>{label}</Text>
 </View>;
}
// Real in-content navigation button: avoids native-stack sibling hit-test and modal issues.
export function MenuButton(){
 const pathname=usePathname();
 return <Pressable
  testID="in-content-menu-button"
  accessibilityRole="button"
  accessibilityLabel="Open navigation menu"
  hitSlop={10}
  onPress={()=>{if(pathname!=="/menu")router.push("/menu")}}
  style={({pressed})=>({
   width:52,height:50,borderRadius:23,backgroundColor:"#FFE7BF",borderWidth:1.5,
   borderColor:"#FFFFFF",alignItems:"center",justifyContent:"center",
   shadowColor:"#BA764E",shadowOpacity:.2,shadowRadius:9,shadowOffset:{width:0,height:4},
   opacity:pressed?.75:1
  })}>
  <Menu size={26} color="#81402A" strokeWidth={2.5}/>
 </Pressable>;
}
export function Pill({title,onPress,secondary=false,disabled=false}:{title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}){return <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={.8} style={[styles.btn,secondary&&styles.secondary,disabled&&{opacity:.4}]}><Text style={{color:secondary?colors.ink:"white",fontWeight:"700",fontSize:15}}>{title}</Text></TouchableOpacity>}
export function Background({children}:{children:React.ReactNode}){return <LinearGradient colors={["#FFF2E4","#F8D6CB","#E6D5E8"]} locations={[0,.48,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}}><LinearGradient pointerEvents="none" colors={["rgba(255,209,139,.55)","rgba(255,209,139,0)"]} style={{position:"absolute",top:0,left:0,width:"65%",height:"48%"}}/><LinearGradient pointerEvents="none" colors={["rgba(198,183,226,0)","rgba(198,183,226,.43)"]} style={{position:"absolute",right:0,top:"32%",width:"65%",height:"50%"}}/>{children}</LinearGradient>}
export const styles=StyleSheet.create({surface:{backgroundColor:"rgba(255,255,255,.38)",overflow:"hidden",borderWidth:1.1,borderColor:"rgba(255,255,255,.82)",borderRadius:26,padding:22,shadowColor:"#71403B",shadowOpacity:.13,shadowRadius:30,shadowOffset:{width:0,height:12},elevation:4},btn:{backgroundColor:colors.ink,borderRadius:19,paddingVertical:16,paddingHorizontal:24,alignItems:"center",justifyContent:"center",minHeight:52},secondary:{backgroundColor:"rgba(255,255,255,.78)",borderWidth:1,borderColor:colors.stroke},title:{fontSize:35,fontWeight:"800",color:colors.ink,letterSpacing:-1.2},subtitle:{fontSize:16,color:colors.muted,lineHeight:24},input:{backgroundColor:"#FFFFFF",opacity:1,borderWidth:1.5,borderColor:"#CF9C87",borderRadius:15,padding:16,fontSize:16,color:"#301E2C",minHeight:54,marginBottom:12,position:"relative",zIndex:3},label:{fontWeight:"700",color:colors.ink,fontSize:17,marginBottom:10},page:{flex:1,padding:24},muted:{color:colors.muted,fontSize:14}});
