import React,{useEffect,useState} from "react";
import {ScrollView,Text,TouchableOpacity,View,StyleSheet} from "react-native";
import {router} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {auth,type Session} from "../src/client";
import {Background,Surface} from "../src/components";
import {colors} from "../src/theme";

const items=[
 {icon:"⚙",title:"Settings & Notifications",route:"/preferences",auth:true},
 {icon:"✧",title:"Interest Tags",route:"/categories",auth:true},
 {icon:"♡",title:"Saved Stories",route:"/saved",auth:true},
 {icon:"♧",title:"Food & Recipes",route:"/food",auth:false},
 {icon:"◈",title:"Discover Good News",route:"/search",auth:false},
 {icon:"◷",title:"Notification History",route:"/notifications",auth:true},
 {icon:"◉",title:"My Profile",route:"/profile",auth:false}
] as const;
export default function MoreMenu(){
 const[session,setSession]=useState<Session|null>(auth.currentUser);
 useEffect(()=>{const off=auth.subscribe(setSession);void auth.restore();return off},[]);
 const go=(route:string,requiresAuth=false)=>router.replace((requiresAuth&&!session?"/auth":route) as any);
 return <Background><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.head}>
   <TouchableOpacity accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={styles.close}><Text style={styles.closeText}>← Back</Text></TouchableOpacity>
   <Text style={{fontSize:24}}>☀️</Text>
  </View>
  <Text style={styles.title}>More sunshine<Text style={{color:"#ec9635"}}>.</Text></Text>
  <Text style={styles.subtitle}>Your good side, your way.</Text>
  {!session?<Surface style={{marginTop:24,marginBottom:14}}>
   <Text style={styles.intro}>Make your corner yours</Text>
   <Text style={styles.subtitle}>Save good news, choose your interests and manage your notifications.</Text>
   <View style={styles.authRow}>
    <TouchableOpacity accessibilityRole="button" onPress={()=>go("/auth")} style={styles.buttonLight}><Text style={styles.buttonText}>Log in</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={()=>go("/auth")} style={styles.buttonGold}><Text style={styles.buttonText}>Create account</Text></TouchableOpacity>
   </View>
  </Surface>:<Surface style={{marginTop:24,marginBottom:14}}><Text style={styles.intro}>Your account</Text><Text style={styles.subtitle}>{session.email}</Text></Surface>}
  <Surface style={{paddingVertical:8,paddingHorizontal:15}}>
   {items.map((item,i)=><TouchableOpacity accessibilityRole="button" accessibilityLabel={item.title} key={item.title} onPress={()=>go(item.route,item.auth)} style={[styles.item,i!==items.length-1&&styles.separator]}>
    <View style={styles.iconBox}><Text style={styles.icon}>{item.icon}</Text></View>
    <Text style={styles.itemText}>{item.title}</Text><Text style={styles.chevron}>›</Text>
   </TouchableOpacity>)}
  </Surface>
  {session?<TouchableOpacity accessibilityRole="button" onPress={async()=>{await auth.signOut();router.replace("/")}} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></TouchableOpacity>:null}
 </ScrollView></Background>;
}
const ink="#251923";
const styles=StyleSheet.create({
 page:{padding:22,paddingTop:65,paddingBottom:100},
 head:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:24},
 close:{padding:8,paddingLeft:0},closeText:{color:ink,fontSize:17,fontWeight:"700"},
 title:{fontSize:34,fontWeight:"900",color:ink,letterSpacing:-1},
 subtitle:{fontSize:14,color:"#63545d",marginTop:7,lineHeight:22},
 intro:{fontSize:19,fontWeight:"800",color:ink},
 authRow:{flexDirection:"row",gap:10,marginTop:17},
 buttonLight:{flex:1,backgroundColor:"rgba(255,255,255,.75)",padding:13,borderRadius:20,alignItems:"center",borderColor:"#fff",borderWidth:1},
 buttonGold:{flex:1,backgroundColor:"#f4bb7c",padding:13,borderRadius:20,alignItems:"center",borderColor:"#fff",borderWidth:1},
 buttonText:{fontWeight:"800",color:ink},
 item:{flexDirection:"row",alignItems:"center",minHeight:62,gap:13},
 separator:{borderBottomWidth:1,borderBottomColor:"rgba(130,84,92,.16)"},
 iconBox:{height:40,width:40,borderRadius:15,backgroundColor:"rgba(252,208,155,.65)",borderWidth:1,borderColor:"#fff",alignItems:"center",justifyContent:"center"},
 icon:{fontSize:23,color:"#9d531f"},itemText:{flex:1,fontSize:16,color:ink,fontWeight:"600"},chevron:{fontSize:28,color:"#443740"},
 signOut:{alignSelf:"center",marginTop:28,backgroundColor:"rgba(255,255,255,.6)",paddingVertical:13,paddingHorizontal:55,borderRadius:30,borderWidth:1,borderColor:"#fff"},
 signOutText:{fontSize:16,fontWeight:"700",color:ink}
});
