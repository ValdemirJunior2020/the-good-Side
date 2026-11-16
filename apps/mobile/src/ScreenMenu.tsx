import React,{useEffect,useState} from "react";
import {Keyboard,Modal,Platform,Pressable,StyleSheet,Text,View} from "react-native";
import {usePathname} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {Menu,X} from "lucide-react-native";
import GoodSideDrawer from "./GoodSideDrawer";

/**
 * Render INSIDE the actual route screen, not next to the native Expo Router Stack.
 * On iOS a sibling of the Stack may draw above it without participating in native hit testing.
 * This component is installed in Background, which is used by the consumer screens.
 */
export default function ScreenMenu(){
 const [open,setOpen]=useState(false);
 const [keyboardVisible,setKeyboardVisible]=useState(false);
 const insets=useSafeAreaInsets();
 const pathname=usePathname();
 useEffect(()=>setOpen(false),[pathname]);
 useEffect(()=>{
  const show=Keyboard.addListener("keyboardDidShow",()=>setKeyboardVisible(true));
  const hide=Keyboard.addListener("keyboardDidHide",()=>setKeyboardVisible(false));
  return ()=>{show.remove();hide.remove()};
 },[]);
 const close=()=>setOpen(false);
 return <>
  {!keyboardVisible&&<View pointerEvents="box-none" style={[styles.touchLayer,{top:insets.top+12}]}>
   <Pressable
    testID="screen-menu-button"
    accessibilityRole="button"
    accessibilityLabel="Open navigation menu"
    accessibilityHint="Opens the app navigation and settings"
    hitSlop={10}
    onPress={()=>{console.info("[GoodSideMenu] hamburger pressed");setOpen(true)}}
    style={({pressed})=>[styles.trigger,pressed&&{opacity:.75,transform:[{scale:.96}]}]}>
    <LinearGradient pointerEvents="none" colors={["#FFF8F0","#FFE5D7","#F5C8D4"]} style={StyleSheet.absoluteFill}/>
    <Menu size={25} strokeWidth={2.5} color="#81402A"/>
   </Pressable>
  </View>}
  <Modal
   visible={open}
   transparent
   statusBarTranslucent={Platform.OS==="android"}
   presentationStyle="overFullScreen"
   animationType="slide"
   onRequestClose={close}>
    <View style={styles.overlay}>
     <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close navigation menu" style={styles.backdrop}/>
     <View style={[styles.drawer,{paddingTop:Math.max(insets.top,20)}]}>
      <GoodSideDrawer close={close}/>
     </View>
     <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close menu" style={[styles.closeButton,{top:Math.max(insets.top,20)+12}]}>
      <X size={23} color="#81402A" strokeWidth={2.5}/>
     </Pressable>
    </View>
  </Modal>
 </>;
}
const styles=StyleSheet.create({
 touchLayer:{position:"absolute",right:17,width:54,height:54,zIndex:1000,elevation:30,alignItems:"center",justifyContent:"center"},
 trigger:{width:50,height:50,backgroundColor:"#FFE7BF",borderRadius:25,borderWidth:1.5,borderColor:"#FFFFFF",overflow:"hidden",alignItems:"center",justifyContent:"center",shadowColor:"#BA764E",shadowOpacity:.25,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:12},
 overlay:{flex:1,flexDirection:"row",justifyContent:"flex-end"},
 backdrop:{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(37,25,35,.40)"},
 drawer:{width:"86%",maxWidth:390,height:"100%",backgroundColor:"#FCE8DF",borderTopLeftRadius:32,borderBottomLeftRadius:32,overflow:"hidden",shadowColor:"#49313D",shadowOpacity:.28,shadowRadius:28,shadowOffset:{width:-8,height:0},elevation:15},
 closeButton:{position:"absolute",right:18,height:45,width:48,borderRadius:19,backgroundColor:"#FFE7BF",borderWidth:1.5,borderColor:"#FFFFFF",alignItems:"center",justifyContent:"center"}
});
