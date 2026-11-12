import "react-native-gesture-handler";
import React from "react";
import {View,TouchableOpacity,StyleSheet} from "react-native";
import {Drawer} from "expo-router/drawer";
import {StatusBar} from "expo-status-bar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Menu} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import TabBar from "../src/TabBar";
import GoodSideDrawer from "../src/GoodSideDrawer";

Notifications.setNotificationHandler({handleNotification:async(notification)=>({
 shouldShowBanner:true,
 shouldShowList:true,
 shouldPlaySound:notification.request.content.data?.preview_sound===true||notification.request.content.data?.sound_enabled===true,
 shouldSetBadge:false
})});

const screens=["index","search","food","saved","profile","auth","categories","preferences","notifications","menu","article/[id]","recipe/[id]"] as const;

export default function Root(){
 return <SafeAreaProvider>
  <StatusBar style="dark"/>
  <View style={{flex:1}}>
   <Drawer
    drawerContent={props=><GoodSideDrawer close={()=>props.navigation.closeDrawer()}/>}
    screenOptions={({navigation})=>({
     drawerType:"front",
     drawerPosition:"right",
     drawerStyle:{width:"84%",maxWidth:390,backgroundColor:"#FBE8DA"},
     overlayColor:"rgba(37,25,35,.36)",
     swipeEnabled:true,
     headerShown:true,
     headerTransparent:true,
     headerTitle:"",
     headerLeft:()=>null,
     headerRight:()=>(
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open navigation menu" accessibilityHint="Shows all app pages and settings" onPress={()=>navigation.openDrawer()} hitSlop={12} activeOpacity={.75} style={styles.menu}>
       <Menu color="#251923" size={27} strokeWidth={2.3}/>
      </TouchableOpacity>
     ),
     headerRightContainerStyle:{paddingRight:17},
    })}
   >
    {screens.map(name=><Drawer.Screen key={name} name={name} options={{drawerItemStyle:{display:"none"}}}/>)}
   </Drawer>
   <TabBar/>
  </View>
 </SafeAreaProvider>;
}
const styles=StyleSheet.create({
 menu:{height:45,width:49,backgroundColor:"rgba(255,255,255,.8)",borderColor:"rgba(255,255,255,.98)",borderWidth:1.4,borderRadius:15,alignItems:"center",justifyContent:"center",shadowColor:"#71403B",shadowOpacity:.15,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:6}
});
