import React,{useEffect,useState} from "react";
import {ScrollView,TouchableOpacity,View,Text,StyleSheet} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {House,Compass,ChefHat,Heart,UserRound,Settings,SlidersHorizontal,Bell,LogIn,LogOut,Sun,ChevronRight,Bookmark} from "lucide-react-native";
import {auth,type Session} from "./client";
import LuxuryIcon from "./LuxuryIcon";

const ink="#251923";
const menuItems=[
 {label:"Home",route:"/",icon:House,protected:false,tone:"sun"},
 {label:"Discover Good News",route:"/search",icon:Compass,protected:false,tone:"sky"},
 {label:"Food & Recipes",route:"/food",icon:ChefHat,protected:false,tone:"mint"},
 {label:"Saved Stories",route:"/saved",icon:Heart,protected:true,tone:"rose"},
 {label:"Your Profile",route:"/profile",icon:UserRound,protected:false,tone:"peach"},
 {label:"Settings & Notifications",route:"/preferences",icon:Settings,protected:true,tone:"violet"},
 {label:"Interest Tags",route:"/categories",icon:SlidersHorizontal,protected:true,tone:"sky"},
 {label:"Notification History",route:"/notifications",icon:Bell,protected:true,tone:"peach"}
] as const;
export default function GoodSideDrawer({close}:{close:()=>void}){
 const [session,setSession]=useState<Session|null>(auth.currentUser);
 useEffect(()=>{const unsubscribe=auth.subscribe(setSession);void auth.restore();return unsubscribe},[]);
 const navigate=(route:string,needsAccount=false)=>{
  close();
  router.push((needsAccount&&!session?"/auth":route) as any);
 };
 return <LinearGradient colors={["#FFF1DB","#F9DBCE","#E9D7E9"]} style={{flex:1}}>
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   <View style={styles.brand}><Sun color="#E69A2F" size={30}/><Text style={styles.brandName}>the good side<Text style={{color:"#E69A2F"}}>.</Text></Text></View>
   <Text style={styles.sub}>More sunshine, your way.</Text>
   {!session?<View style={styles.login}>
    <Text style={styles.loginTitle}>Your bright side starts here</Text>
    <Text style={styles.sub}>Sign in to save stories and personal preferences.</Text>
    <TouchableOpacity accessibilityRole="button" onPress={()=>navigate("/auth")} style={styles.loginButton}><LogIn size={20} color={ink}/><Text style={{color:ink,fontWeight:"800"}}>Log in / Create account</Text></TouchableOpacity>
   </View>:<View style={styles.login}><Text style={styles.loginTitle}>Your account</Text><Text style={styles.sub}>{session.email}</Text></View>}
   <View style={styles.list}>
    {menuItems.map(item=>{
     const Icon=item.icon;
     return <TouchableOpacity key={item.route} accessibilityRole="button" accessibilityLabel={item.label} onPress={()=>navigate(item.route,item.protected)} style={styles.line}>
      <LuxuryIcon tone={item.tone} size={39}><Icon size={20} color="#87502C" strokeWidth={2.15}/></LuxuryIcon>
      <Text style={styles.lineText}>{item.label}</Text><ChevronRight size={18} color="#64525D"/>
     </TouchableOpacity>;
    })}
   </View>
   {session?<TouchableOpacity style={styles.signout} accessibilityRole="button" onPress={async()=>{close();await auth.signOut();router.replace("/")}}><LogOut size={19} color={ink}/><Text style={{color:ink,fontWeight:"800"}}>Sign out</Text></TouchableOpacity>:null}
  </ScrollView>
 </LinearGradient>;
}
const styles=StyleSheet.create({
 content:{paddingTop:68,paddingBottom:58,paddingHorizontal:19},
 brand:{flexDirection:"row",alignItems:"center",gap:8},
 brandName:{fontSize:23,fontWeight:"900",color:ink,letterSpacing:-1},
 sub:{fontSize:13,color:"#665460",lineHeight:20,marginTop:5},
 login:{backgroundColor:"rgba(255,255,255,.53)",borderWidth:1,borderColor:"rgba(255,255,255,.85)",borderRadius:23,padding:17,marginTop:24,marginBottom:16},
 loginTitle:{fontWeight:"800",fontSize:18,color:ink},
 loginButton:{marginTop:13,borderRadius:16,padding:13,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,backgroundColor:"#F8C48C",borderWidth:1,borderColor:"#fff"},
 list:{borderRadius:25,overflow:"hidden",borderWidth:1.2,borderColor:"rgba(255,255,255,.9)",backgroundColor:"rgba(255,255,255,.49)"},
 line:{flexDirection:"row",alignItems:"center",paddingVertical:12,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:"rgba(138,88,106,.12)",minHeight:60},
 iconWrap:{width:38,height:38,borderRadius:14,backgroundColor:"rgba(250,206,163,.65)",borderWidth:1,borderColor:"#fff",justifyContent:"center",alignItems:"center"},
 lineText:{flex:1,color:ink,fontWeight:"700",fontSize:14,marginLeft:11},
 signout:{backgroundColor:"rgba(255,255,255,.5)",borderColor:"#fff",borderWidth:1,borderRadius:22,alignSelf:"center",paddingVertical:13,paddingHorizontal:28,marginTop:25,flexDirection:"row",alignItems:"center",gap:12}
});
