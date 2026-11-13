import React,{useEffect,useState} from "react";
import {Keyboard,Platform,View} from "react-native";
import Constants from "expo-constants";
import {Stack,router} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import TabBar from "../src/TabBar";

// The navigation hamburger lives INSIDE Background via ScreenMenu.
// Do not mount a floating hamburger or a second modal beside the native Stack:
// on iOS those controls can be drawn without receiving native touches.
if (Constants.appOwnership !== "expo" && Platform.OS !== "web") {
 // expo-notifications emits unsupported-push warnings as soon as it is imported
 // in Expo Go. Load it only inside standalone and development builds.
 const Notifications: typeof import("expo-notifications") = require("expo-notifications");
 Notifications.setNotificationHandler({handleNotification:async(notification)=>({
  shouldShowBanner:true,
  shouldShowList:true,
  shouldPlaySound:notification.request.content.data?.preview_sound===true||notification.request.content.data?.sound_enabled===true,
  shouldSetBadge:false
 })});
}

function Shell(){
 const [keyboardOpen,setKeyboardOpen]=useState(false);
 // Route notification taps to the actual article or complete recipe.
 // Expo Go/web cannot prove native push delivery; this runs in installed builds.
 useEffect(()=>{
  if(Constants.appOwnership==="expo"||Platform.OS==="web")return;
  const Notifications:typeof import("expo-notifications")=require("expo-notifications");
  let active=true;
  const open=(response:import("expo-notifications").NotificationResponse)=>{
   if(!active)return;
   const data=response.notification.request.content.data||{};
   const id=typeof data.recipe_id==="string"?data.recipe_id:null;
   const news=typeof data.news_id==="string"?data.news_id:null;
   if(id)router.push({pathname:"/recipe/[id]",params:{id}});
   else if(news)router.push({pathname:"/article/[id]",params:{id:news}});
  };
  const subscription=Notifications.addNotificationResponseReceivedListener(open);
  void Notifications.getLastNotificationResponseAsync().then(response=>{
   if(active&&response)open(response);
  }).catch(()=>{});
  return ()=>{active=false;subscription.remove()};
 },[]);
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
