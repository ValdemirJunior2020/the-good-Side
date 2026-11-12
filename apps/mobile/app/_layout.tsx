import React,{useEffect,useState} from "react";
import {View,TouchableOpacity,Pressable,StyleSheet,Platform} from "react-native";
import {Stack,usePathname} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider,useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {Menu,X} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import TabBar from "../src/TabBar";
import GoodSideDrawer from "../src/GoodSideDrawer";

Notifications.setNotificationHandler({handleNotification:async(notification)=>({
 shouldShowBanner:true,
 shouldShowList:true,
 shouldPlaySound:notification.request.content.data?.preview_sound===true||notification.request.content.data?.sound_enabled===true,
 shouldSetBadge:false
})});

function Shell(){
 const [menuOpen,setMenuOpen]=useState(false);
 const insets=useSafeAreaInsets();
 const pathname=usePathname();
 useEffect(()=>{setMenuOpen(false)},[pathname]);

 return <View style={styles.root}>
  <Stack screenOptions={{headerShown:false,animation:"fade"}}/>
  <TabBar/>
  <TouchableOpacity
   testID="global-menu-button"
   accessibilityRole="button"
   accessibilityLabel={menuOpen?"Close menu":"Open menu"}
   accessibilityHint="Show settings and navigation on every screen"
   activeOpacity={.72}
   hitSlop={12}
   onPress={()=>setMenuOpen(open=>!open)}
   style={[styles.trigger,{top:insets.top+12}]}>
   <LinearGradient pointerEvents="none" colors={["#FFF9E8","#FFE2B6","#F3AD78"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
   {menuOpen?<X color="#81402A" size={25} strokeWidth={2.4}/>:<Menu color="#81402A" size={26} strokeWidth={2.5}/>}
  </TouchableOpacity>
  {menuOpen?<View style={styles.overlay}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={()=>setMenuOpen(false)} style={styles.backdrop}/>
    <View style={[styles.drawer,{paddingTop:Math.max(insets.top,20)}]}>
     <GoodSideDrawer close={()=>setMenuOpen(false)}/>
    </View>
   </View>:null}
 </View>;
}
export default function Root(){
 return <SafeAreaProvider><StatusBar style="dark"/><Shell/></SafeAreaProvider>;
}
const styles=StyleSheet.create({
 root:{flex:1},
 trigger:{position:"absolute",right:17,zIndex:70,height:48,width:52,borderRadius:17,overflow:"hidden",borderWidth:1.5,borderColor:"rgba(255,255,255,.98)",alignItems:"center",justifyContent:"center",backgroundColor:"#FFE7BF",shadowColor:"#BA764E",shadowOpacity:.25,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:12},
 overlay:{...StyleSheet.absoluteFillObject,zIndex:60,flexDirection:"row",justifyContent:"flex-end"},
 backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(37,25,35,.40)"},
 drawer:{width:"86%",maxWidth:390,height:"100%",backgroundColor:"#FCE8DF",borderTopLeftRadius:32,borderBottomLeftRadius:32,overflow:"hidden",shadowColor:"#49313D",shadowOpacity:.28,shadowRadius:28,shadowOffset:{width:-8,height:0},elevation:15}
});
