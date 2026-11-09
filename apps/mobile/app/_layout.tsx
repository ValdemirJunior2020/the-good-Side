import React from "react";
import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
Notifications.setNotificationHandler({handleNotification:async(notification)=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:notification.request.content.data?.preview_sound===true||notification.request.content.data?.sound_enabled===true,shouldSetBadge:false})});
export default function Root(){return <SafeAreaProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,animation:"fade"}}/></SafeAreaProvider>}
