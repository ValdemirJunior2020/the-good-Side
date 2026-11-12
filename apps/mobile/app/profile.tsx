import TabBar from "../src/TabBar";
import React,{useEffect,useState} from "react";
import {Alert,ImageBackground,Linking,ScrollView,Share,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {api,auth,put,type Session} from "../src/client";
import {colors} from "../src/theme";

const SUNRISE="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1100&q=85";
const gold="#B96117";
const ink="#301E2C";

function Glass({children,style}:{children:React.ReactNode;style?:object}){
 return <View style={[ui.glass,style]}><LinearGradient pointerEvents="none" colors={["rgba(255,255,255,.65)","rgba(255,235,226,.45)","rgba(255,225,239,.58)"]} style={StyleSheet.absoluteFill}/>{children}</View>;
}
function Section({symbol,title,children}:{symbol:string;title:string;children:React.ReactNode}){
 return <View style={{marginTop:23}}>
  <View style={ui.sectionHeader}><Text style={ui.sectionIcon}>{symbol}</Text><Text style={ui.sectionTitle}>{title}</Text></View>
  <Glass style={{paddingVertical:0,paddingHorizontal:15}}>{children}</Glass>
 </View>;
}
function MenuRow({icon,label,onPress,last=false,disabled=false}:{icon:string;label:string;onPress:()=>void;last?:boolean;disabled?:boolean}){
 return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} activeOpacity={.75} onPress={onPress} style={[ui.menuRow,!last&&ui.rowBorder,disabled&&{opacity:.45}]}>
  <Text style={ui.menuIcon}>{icon}</Text><Text style={ui.menuLabel}>{label}</Text><Text style={ui.arrow}>›</Text>
 </TouchableOpacity>;
}
function Action({label,onPress,danger=false,disabled=false}:{label:string;onPress:()=>void;danger?:boolean;disabled?:boolean}){
 return <TouchableOpacity accessibilityRole="button" disabled={disabled} activeOpacity={.75} onPress={onPress} style={[ui.pill,danger&&ui.dangerPill,disabled&&{opacity:.55}]}>
  <Text style={[ui.pillText,danger&&{color:"#BE302C"}]}>{label}</Text>
 </TouchableOpacity>;
}
export default function Profile(){
 const[session,setSession]=useState<Session|null>(auth.currentUser);
 const[name,setName]=useState(auth.currentUser?.displayName||"");
 const[editing,setEditing]=useState(false);
 const[busy,setBusy]=useState(false);
 useEffect(()=>{const off=auth.subscribe(user=>{setSession(user);setName(user?.displayName||"")});void auth.restore();return off},[]);
 const go=(path:string)=>router.push(path as any);
 const saveName=async()=>{
  if(!name.trim()){Alert.alert("Name required","Please enter a display name.");return}
  setBusy(true);
  try{
   await api("/me",put({display_name:name.trim()}),true);
   setEditing(false);
   Alert.alert("Saved","Your display name has been updated.");
  }catch(e){Alert.alert("Unable to save",String(e))}finally{setBusy(false)}
 };
 const confirmDelete=()=>{
  Alert.alert("Permanently delete account?","Your The Good Side profile, preferences and saved data will be deleted. Your Google account will not be deleted.",[
   {text:"Cancel",style:"cancel"},
   {text:"Delete account",style:"destructive",onPress:async()=>{
    setBusy(true);
    try{await api("/me",{method:"DELETE"},true);await auth.signOut();router.replace("/");Alert.alert("Account deleted","Your The Good Side account was deleted.")}
    catch(e){Alert.alert("Unable to delete",String(e))}finally{setBusy(false)}
   }}
  ]);
 };
 const exportData=async()=>{
  setBusy(true);
  try{
   const [profile,preferences,savedNews,savedRecipes]=await Promise.all([
    api<unknown>("/me",{},true),api<unknown>("/me/preferences",{},true),
    api<unknown>("/me/saved",{},true),api<unknown>("/me/recipes",{},true)
   ]);
   await Share.share({message:JSON.stringify({exported_at:new Date().toISOString(),profile,preferences,savedNews,savedRecipes},null,2),title:"The Good Side account data"});
  }catch(e){Alert.alert("Export unavailable",String(e))}finally{setBusy(false)}
 };
 const firstName=(name.trim().split(/\s+/)[0]||"Friend");
 const signedIn=Boolean(session);
 return <LinearGradient colors={["#FFF0DE","#FFE1CF","#EAD4E6"]} style={{flex:1}}>
  <ImageBackground source={{uri:SUNRISE}} resizeMode="cover" style={ui.sunrise} imageStyle={{opacity:.72}}>
   <LinearGradient colors={["rgba(255,249,239,.79)","rgba(255,232,210,.03)","rgba(255,224,212,.18)","#F3D5D4"]} locations={[0,.24,.72,1]} style={StyleSheet.absoluteFill}/>
  </ImageBackground>
  <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
   <TouchableOpacity accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={ui.back}><Text style={ui.backText}>‹  Back</Text></TouchableOpacity>
   <View style={ui.brand}><Text style={ui.brandSun}>☀️</Text><View><Text style={ui.brandName}>the good side<Text style={{color:"#EA8F28"}}>.</Text></Text><Text style={ui.brandSubtitle}>Your corner of good news.</Text></View></View>
   <View style={ui.hero}>
    <View style={ui.avatarRim}>
     <ImageBackground source={{uri:SUNRISE}} imageStyle={{borderRadius:110}} style={ui.avatar}>
      <LinearGradient colors={["rgba(255,212,132,.06)","rgba(83,43,86,.25)"]} style={StyleSheet.absoluteFill}/>
     </ImageBackground>
    </View>
    <View style={ui.avatarCamera}><Text style={{fontSize:22}}>☀️</Text></View>
    <View style={ui.nameRow}><Text style={ui.personName}>{signedIn?firstName:"Your corner"}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit profile" onPress={()=>signedIn?setEditing(v=>!v):go("/auth")}><Text style={{fontSize:23,color:ink}}>✎</Text></TouchableOpacity></View>
    {!signedIn?<Text style={ui.heroHint}>Create an account to personalize your good news</Text>:null}
   </View>
   {editing&&signedIn?<Glass style={{padding:16,marginBottom:18}}>
    <Text style={ui.fieldLabel}>Display name</Text>
    <TextInput accessibilityLabel="Display name" value={name} onChangeText={setName} style={ui.nameInput} maxLength={80}/>
    <Action label={busy?"Saving…":"Save profile"} disabled={busy} onPress={saveName}/>
   </Glass>:null}
   <View style={ui.quickGrid}>
    {([
     ["🪪","Profile Info",()=>signedIn?setEditing(v=>!v):go("/auth")],
     ["🔗","Connected Apps",()=>Alert.alert("Connected account",signedIn?"Your Google account is used for secure sign-in. No additional connected apps are configured.":"Sign in with Google to connect your account.")],
     ["👑","Subscription",()=>Alert.alert("Free account","The Good Side currently has free access. No paid subscription is configured.")]
    ] as const).map(([icon,label,onPress])=><TouchableOpacity key={label} accessibilityRole="button" onPress={onPress} activeOpacity={.78} style={ui.quickCard}>
      <LinearGradient colors={["rgba(255,255,255,.78)","rgba(253,214,199,.62)","rgba(237,203,232,.72)"]} style={StyleSheet.absoluteFill}/>
      <Text style={ui.quickIcon}>{icon}</Text><Text style={ui.quickText}>{label}</Text>
    </TouchableOpacity>)}
   </View>
   <Section symbol="✨" title="Personalization">
    <MenuRow icon="🔔" label="Preferences & Notifications" onPress={()=>go(signedIn?"/preferences":"/auth")}/>
    <MenuRow icon="🎚️" label="Interest Tags" last onPress={()=>go(signedIn?"/categories":"/auth")}/>
   </Section>
   <Section symbol="📚" title="Activity">
    <MenuRow icon="♡" label="Saved Stories" onPress={()=>go(signedIn?"/saved":"/auth")}/>
    <MenuRow icon="📖" label="Reading History" last onPress={()=>Alert.alert("Reading history","Reading history is not available in this version yet. Your saved stories are available above.")}/>
   </Section>
   <Section symbol="🛡️" title="Data & Security">
    <MenuRow icon="🔒" label="Security & Privacy" onPress={()=>Alert.alert("Security & Privacy","The Good Side uses Google Sign-In and does not store your Google password. You can delete your app account below.")}/>
    <MenuRow icon="⇩" label="My Data Export" last onPress={()=>signedIn?void exportData():go("/auth")}/>
   </Section>
   <View style={ui.footer}>
    {signedIn?<>
     <Action label="⇥  Sign Out" onPress={async()=>{await auth.signOut();router.replace("/")}}/>
     <Action label={busy?"Please wait…":"▤  Delete My Account and Data"} danger disabled={busy} onPress={confirmDelete}/>
    </>:<>
     <Action label="Log in with Google" onPress={()=>go("/auth")}/>
     <Action label="Create Free Account" onPress={()=>go("/auth")}/>
    </>}
    <Action label="☏  Contact Support" onPress={()=>Alert.alert("Contact support","The support contact address has not yet been configured.")}/>
   </View>
  </ScrollView>
  <TabBar/>
 </LinearGradient>;
}
const ui=StyleSheet.create({
 sunrise:{position:"absolute",top:0,left:0,right:0,height:510},
 page:{paddingHorizontal:20,paddingTop:58,paddingBottom:140},
 back:{alignSelf:"flex-start",paddingVertical:7,paddingRight:16},backText:{fontSize:17,color:ink,fontWeight:"600"},
 brand:{marginTop:7,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},
 brandSun:{fontSize:37},brandName:{fontSize:30,fontWeight:"900",color:ink,letterSpacing:-1.3},
 brandSubtitle:{fontSize:13,color:"#594450",marginTop:1},
 hero:{alignItems:"center",marginTop:22,marginBottom:16},
 avatarRim:{width:142,height:142,borderRadius:90,padding:5,borderWidth:2,borderColor:"#FFF9E9",backgroundColor:"rgba(245,163,84,.83)",shadowColor:"#B45D52",shadowOpacity:.34,shadowRadius:19,shadowOffset:{width:0,height:9}},
 avatar:{width:"100%",height:"100%",borderRadius:90,overflow:"hidden",backgroundColor:"#FFCC91"},
 avatarCamera:{position:"absolute",top:104,left:"64%",width:43,height:43,borderRadius:24,backgroundColor:"#FFFAEF",borderWidth:2,borderColor:"#FFF",alignItems:"center",justifyContent:"center",shadowColor:"#A55747",shadowOpacity:.22,shadowRadius:10},
 nameRow:{flexDirection:"row",alignItems:"center",gap:12,marginTop:12},personName:{fontSize:33,color:ink,fontWeight:"900",letterSpacing:-.6},
 heroHint:{fontSize:12,color:"#58434E",marginTop:3},
 glass:{borderWidth:1.5,borderColor:"rgba(255,255,255,.96)",backgroundColor:"rgba(255,244,240,.65)",borderRadius:25,overflow:"hidden",shadowColor:"#96514C",shadowOpacity:.11,shadowRadius:15,shadowOffset:{width:0,height:8},elevation:2},
 quickGrid:{flexDirection:"row",gap:9},
 quickCard:{flex:1,borderRadius:23,minHeight:105,borderWidth:1.6,borderColor:"rgba(255,255,255,.93)",alignItems:"center",justifyContent:"center",overflow:"hidden",paddingHorizontal:5,paddingVertical:12,shadowColor:"#A76E65",shadowOpacity:.14,shadowRadius:12,shadowOffset:{width:0,height:7}},
 quickIcon:{fontSize:28,marginBottom:7,textShadowColor:"rgba(193,118,72,.3)",textShadowRadius:7},
 quickText:{fontSize:12.5,fontWeight:"800",color:ink,textAlign:"center"},
 sectionHeader:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:7},
 sectionIcon:{fontSize:25},sectionTitle:{fontSize:23,fontWeight:"900",color:ink,letterSpacing:-.7},
 menuRow:{flexDirection:"row",alignItems:"center",minHeight:61,gap:12},
 rowBorder:{borderBottomWidth:1,borderBottomColor:"rgba(163,117,120,.2)"},
 menuIcon:{fontSize:24,color:gold,width:34,textAlign:"center"},
 menuLabel:{flex:1,fontSize:15.5,fontWeight:"600",color:ink},
 arrow:{fontSize:30,color:ink,fontWeight:"300",marginRight:2},
 footer:{alignItems:"center",marginTop:23,gap:10},
 pill:{minHeight:44,minWidth:"63%",paddingHorizontal:24,paddingVertical:10,borderRadius:35,backgroundColor:"rgba(255,245,241,.65)",borderWidth:1.5,borderColor:"rgba(255,255,255,.95)",alignItems:"center",justifyContent:"center",shadowColor:"#B5776C",shadowOpacity:.12,shadowRadius:10},
 dangerPill:{backgroundColor:"rgba(255,232,232,.68)"},
 pillText:{fontSize:15.5,fontWeight:"800",color:ink},
 fieldLabel:{color:ink,fontWeight:"700",marginBottom:9},nameInput:{padding:12,backgroundColor:"#fff",borderRadius:15,borderWidth:1,borderColor:"#F3D2BD",marginBottom:10,color:ink}
});
