import React,{useEffect,useState} from "react";
import {Modal,Pressable,ScrollView,StyleSheet,Text,TouchableOpacity,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {BlurView} from "expo-blur";
import {router} from "expo-router";
import {auth,type Session} from "./client";
import {colors} from "./theme";

const ink="#251923";
type Item={icon:string;title:string;route?:string;requiresAuth?:boolean};
const items:Item[]=[
 {icon:"⚙",title:"Settings & notifications",route:"/preferences",requiresAuth:true},
 {icon:"✧",title:"Interest tags",route:"/categories",requiresAuth:true},
 {icon:"♡",title:"Saved stories",route:"/saved",requiresAuth:true},
 {icon:"♧",title:"Food & recipes",route:"/food"},
 {icon:"◈",title:"Discover good news",route:"/search"},
 {icon:"☰",title:"Notification history",route:"/notifications",requiresAuth:true},
 {icon:"◉",title:"My profile",route:"/profile"}
];
export default function AppMenu(){
 const[open,setOpen]=useState(false);
 const[session,setSession]=useState<Session|null>(auth.currentUser);
 useEffect(()=>auth.subscribe(setSession),[]);
 const navigate=(item:Item)=>{
  setOpen(false);
  router.push((item.requiresAuth&&!session?"/auth":item.route||"/") as any);
 };
 const logout=async()=>{setOpen(false);await auth.signOut();router.replace("/")};
 return <>
  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open menu" accessibilityHint="More options and settings" onPress={()=>setOpen(true)} activeOpacity={.8} style={s.menuButton}>
   <Text style={s.hamburger}>☰</Text>
  </TouchableOpacity>
  <Modal transparent visible={open} animationType="fade" statusBarTranslucent onRequestClose={()=>setOpen(false)}>
   <View style={s.screen}>
    <Pressable accessibilityLabel="Close menu" onPress={()=>setOpen(false)} style={StyleSheet.absoluteFill}/>
    <View style={s.panel}>
     <BlurView tint="light" intensity={75} style={StyleSheet.absoluteFill} pointerEvents="none"/>
     <LinearGradient colors={["rgba(255,250,239,.76)","rgba(255,230,214,.78)","rgba(239,215,234,.80)"]} style={StyleSheet.absoluteFill} pointerEvents="none"/>
     <View style={s.header}>
      <View><Text style={s.title}>More sunshine ✦</Text><Text style={s.subtitle}>Your good side, your way.</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close menu" style={s.close} onPress={()=>setOpen(false)}><Text style={s.closeText}>×</Text></TouchableOpacity>
     </View>
     {!session?<View style={s.authRow}>
      <TouchableOpacity style={s.authLight} accessibilityRole="button" onPress={()=>navigate({icon:"",title:"Log in",route:"/auth"})}><Text style={s.authText}>Log in</Text></TouchableOpacity>
      <TouchableOpacity style={s.authGold} accessibilityRole="button" onPress={()=>navigate({icon:"",title:"Sign up",route:"/auth"})}><Text style={s.authText}>Create account</Text></TouchableOpacity>
     </View>:<Text style={s.accountText}>Signed in as {session.email}</Text>}
     <ScrollView style={{maxHeight:475}} showsVerticalScrollIndicator={false}>
      {items.map((item,i)=><TouchableOpacity key={item.title} accessibilityRole="button" style={[s.item,i!==items.length-1&&s.separator]} onPress={()=>navigate(item)}>
       <View style={s.iconBadge}><Text style={s.iconText}>{item.icon}</Text></View>
       <Text style={s.itemText}>{item.title}</Text>
       <Text style={s.chevron}>›</Text>
      </TouchableOpacity>)}
     </ScrollView>
     {session?<TouchableOpacity accessibilityRole="button" style={s.logout} onPress={()=>void logout()}><Text style={s.logoutText}>Sign out</Text></TouchableOpacity>:null}
    </View>
   </View>
  </Modal>
 </>;
}
const s=StyleSheet.create({
 menuButton:{height:43,width:44,backgroundColor:"rgba(255,255,255,.48)",borderColor:"rgba(255,255,255,.9)",borderWidth:1.5,borderRadius:16,alignItems:"center",justifyContent:"center",shadowColor:"#71403B",shadowOpacity:.13,shadowRadius:12,shadowOffset:{width:0,height:6}},
 hamburger:{fontSize:24,color:ink,lineHeight:29},
 screen:{flex:1,justifyContent:"flex-start",alignItems:"flex-end",paddingTop:57,paddingHorizontal:14,backgroundColor:"rgba(40,23,40,.25)"},
 panel:{width:"92%",maxWidth:370,overflow:"hidden",borderRadius:28,borderWidth:1.5,borderColor:"rgba(255,255,255,.9)",padding:17,shadowColor:"#59374A",shadowOpacity:.2,shadowRadius:26,shadowOffset:{width:0,height:14}},
 header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:14},
 title:{fontSize:22,fontWeight:"800",color:ink,letterSpacing:-.7},subtitle:{fontSize:13,color:"#63545d",marginTop:4},
 close:{width:34,height:34,borderRadius:19,backgroundColor:"rgba(255,255,255,.75)",alignItems:"center",justifyContent:"center"},
 closeText:{fontSize:26,color:ink,lineHeight:31},
 authRow:{flexDirection:"row",gap:9,marginBottom:12},
 authLight:{flex:1,paddingVertical:13,borderRadius:17,alignItems:"center",backgroundColor:"rgba(255,255,255,.8)",borderWidth:1,borderColor:"#fff"},
 authGold:{flex:1,paddingVertical:13,borderRadius:17,alignItems:"center",backgroundColor:"#f6bc78",borderWidth:1,borderColor:"#fff"},
 authText:{fontSize:14,fontWeight:"800",color:ink},
 accountText:{fontSize:12,color:"#63545d",marginBottom:10},
 item:{flexDirection:"row",alignItems:"center",minHeight:55,gap:11},
 separator:{borderBottomColor:"rgba(130,84,92,.15)",borderBottomWidth:1},
 iconBadge:{width:38,height:38,alignItems:"center",justifyContent:"center",borderRadius:15,backgroundColor:"rgba(250,199,139,.55)",borderColor:"rgba(255,255,255,.86)",borderWidth:1},
 iconText:{fontSize:21,color:"#9d531f"},
 itemText:{flex:1,color:ink,fontSize:15.5,fontWeight:"600"},chevron:{fontSize:27,color:"#443740"},
 logout:{marginTop:11,alignItems:"center",padding:13,borderRadius:18,backgroundColor:"rgba(255,255,255,.56)",borderWidth:1,borderColor:"#fff"},
 logoutText:{color:"#a14f31",fontWeight:"800"}
});