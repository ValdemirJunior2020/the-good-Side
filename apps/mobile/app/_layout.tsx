import React,{useEffect,useState} from "react";
import {Keyboard,View} from "react-native";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import TabBar from "../src/TabBar";

// The navigation hamburger lives INSIDE Background via ScreenMenu.
// Do not mount a floating hamburger or a second modal beside the native Stack:
// on iOS those controls can be drawn without receiving native touches.
Notifications.setNotificationHandler({handleNotification:async(notification)=>({
 shouldShowBanner:true,
 shouldShowList:true,
 shouldPlaySound:notification.request.content.data?.preview_sound===true||notification.request.content.data?.sound_enabled===true,
 shouldSetBadge:false
})});

function Shell(){
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 useEffect(()=>{
  const show=Keyboard.addListener("keyboardDidShow",()=>setKeyboardOpen(true));
  const hide=Keyboard.addListener("keyboardDidHide",()=>setKeyboardOpen(false));
  return ()=>{show.remove();hide.remove()};
 },[]);
 return <View style={{flex:1}}>
  <Stack screenOptions={{headerShown:false,animation:"fade"}}/>
  {!keyboardOpen&&<TabBar/>}
 </View>;
}
export default function Root(){
 return <SafeAreaProvider><StatusBar style="dark"/><Shell/></SafeAreaProvider>;
}
