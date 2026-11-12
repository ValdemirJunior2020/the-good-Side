import {BlurView} from "expo-blur";
import React,{useEffect,useState} from "react";
import {ActivityIndicator,Alert,Image,ImageBackground,Modal,ScrollView,Share,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {api,auth,put,type Session} from "../src/client";
import {colors} from "../src/theme";
import LuxuryIcon from "../src/LuxuryIcon";
import {ArrowLeft,Camera,UserSquare2,Link2,Crown,Bell,SlidersHorizontal,Sparkles,Layers3,ShieldCheck,Bookmark,BookOpen,Lock,Download,LogOut,Headphones,Trash2,ChevronRight,House,Compass,ChefHat,Heart,UserRound,Pencil,Sun} from "lucide-react-native";

const SUNRISE="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=90";
const gold="#B96117";
const ink="#301E2C";
type Avatar={avatar_id:string;label:string;image_url:string;credit:string};

function Glass({children,style}:{children:React.ReactNode;style?:object}){
 return <View style={[ui.glass,style]}>
  <BlurView tint="light" intensity={65} pointerEvents="none" style={StyleSheet.absoluteFill}/>
  <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,.60)","rgba(255,229,220,.36)","rgba(248,209,231,.48)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
  <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,.78)","rgba(255,255,255,0)"]} style={{position:"absolute",top:0,left:18,right:18,height:14,borderTopLeftRadius:18,borderTopRightRadius:18}}/>
  {children}
 </View>;
}
function Section({symbol,title,children}:{symbol:React.ReactNode;title:string;children:React.ReactNode}){
 return <View style={{marginTop:17}}>
  <View style={ui.sectionHeader}><View style={ui.sectionIcon}>{symbol}</View><Text style={ui.sectionTitle}>{title}</Text></View>
  <Glass style={{paddingVertical:0,paddingHorizontal:13}}>{children}</Glass>
 </View>;
}
function MenuRow({icon,label,onPress,last=false,disabled=false}:{icon:React.ReactNode;label:string;onPress:()=>void;last?:boolean;disabled?:boolean}){
 return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} activeOpacity={.75} onPress={onPress} style={[ui.menuRow,!last&&ui.rowBorder,disabled&&{opacity:.45}]}>
  <LuxuryIcon tone={label.includes("Notifications")?"sun":label.includes("Tags")?"sky":label.includes("Saved")?"rose":label.includes("Reading")?"violet":label.includes("Security")?"mint":"peach"} size={42}>{icon}</LuxuryIcon><Text style={ui.menuLabel}>{label}</Text><ChevronRight size={22} color="#443741"/>
 </TouchableOpacity>;
}
function Action({label,onPress,danger=false,disabled=false,icon}:{label:string;onPress:()=>void;danger?:boolean;disabled?:boolean;icon?:React.ReactNode}){
 return <TouchableOpacity accessibilityRole="button" disabled={disabled} activeOpacity={.75} onPress={onPress} style={[ui.pill,danger&&ui.dangerPill,disabled&&{opacity:.55}]}>
  {icon}<Text style={[ui.pillText,danger&&{color:"#BE302C"}]}>{label}</Text>
 </TouchableOpacity>;
}
export default function Profile(){
 const[session,setSession]=useState<Session|null>(auth.currentUser);
 const[name,setName]=useState(auth.currentUser?.displayName||"");
 const[editing,setEditing]=useState(false);
 const[busy,setBusy]=useState(false);
 const[avatarId,setAvatarId]=useState("");
 const[avatars,setAvatars]=useState<Avatar[]>([]);
 const[avatarPicker,setAvatarPicker]=useState(false);
 const[avatarLoading,setAvatarLoading]=useState(false);
 const[avatarError,setAvatarError]=useState("");
 useEffect(()=>{
  let mounted=true;
  const off=auth.subscribe(user=>{
   if(!mounted)return;
   setSession(user);setName(user?.displayName||"");
   if(user){api<{avatar_id?:string}>("/me",{},true).then(record=>{if(mounted)setAvatarId(record?.avatar_id||"")}).catch(()=>{});}
   else setAvatarId("");
  });
  void auth.restore();
  api<Avatar[]>("/avatars").then(items=>{if(mounted&&Array.isArray(items))setAvatars(items)}).catch(()=>{});
  return ()=>{mounted=false;off()};
 },[]);
 const openAvatars=async()=>{
  if(!session)return go("/auth");
  setAvatarPicker(true);setAvatarLoading(true);setAvatarError("");
  try{
   const items=await api<Avatar[]>("/avatars");
   setAvatars(Array.isArray(items)?items:[]);
  }catch(e){setAvatarError(e instanceof Error?e.message:String(e))}
  finally{setAvatarLoading(false)}
 };
 const pickAvatar=async(id:string)=>{
  setBusy(true);
  try{
   await api("/me",put({avatar_id:id}),true);
   setAvatarId(id);setAvatarPicker(false);
  }catch(e){Alert.alert("Unable to save avatar",String(e))}
  finally{setBusy(false)}
 };
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
 const currentAvatar=avatars.find(a=>a.avatar_id===avatarId);
 const avatarUrl=currentAvatar?.image_url||SUNRISE;
 return <LinearGradient colors={["#FFF1E3","#F7D1C7","#DED0E5"]} style={{flex:1}}>
  <ImageBackground source={{uri:SUNRISE}} resizeMode="cover" style={ui.sunrise} imageStyle={{opacity:.87}} pointerEvents="none">
   <LinearGradient colors={["rgba(255,230,221,.35)","rgba(255,208,178,.14)","rgba(246,199,207,.42)","rgba(232,192,216,.88)"]} locations={[0,.30,.66,1]} style={StyleSheet.absoluteFill} pointerEvents="none"/>
  </ImageBackground>
  <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
   <View style={ui.topRow}><TouchableOpacity accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={ui.back}><ArrowLeft size={23} color={ink}/><Text style={ui.backText}>Back</Text></TouchableOpacity></View>
   <View style={ui.brand}><View style={ui.brandSunBadge}><LinearGradient pointerEvents="none" colors={["#FFEB95","#FFC43A","#EF8C15"]} style={StyleSheet.absoluteFill}/><Sun size={38} color="#FFFAE8" strokeWidth={2.4}/></View><View><Text style={ui.brandName}>the good side<Text style={{color:"#EA8F28"}}>.</Text></Text><Text style={ui.brandSubtitle}>Your corner of good news.</Text></View></View>
   <View style={ui.hero}>
    <View style={ui.avatarRim}>
     <LinearGradient colors={["#FFE59A","#F8A068","#DD88B8","#FFD187"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} pointerEvents="none"/>
     <ImageBackground source={{uri:avatarUrl}} imageStyle={{borderRadius:110}} style={ui.avatar}>
      <LinearGradient colors={["rgba(255,212,132,.06)","rgba(83,43,86,.25)"]} style={StyleSheet.absoluteFill}/>
     </ImageBackground>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose profile picture" activeOpacity={.75} onPress={()=>void openAvatars()} style={ui.avatarCamera}><Camera size={20} color={ink}/></TouchableOpacity>
    <View style={ui.nameRow}><Text style={ui.personName}>{signedIn?firstName:"Your corner"}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit profile" onPress={()=>signedIn?setEditing(v=>!v):go("/auth")}><Pencil size={20} color={ink}/></TouchableOpacity></View>
    {!signedIn?<Text style={ui.heroHint}>Log in to personalize your profile</Text>:null}
   </View>
   {editing&&signedIn?<Glass style={{padding:16,marginBottom:18}}>
    <Text style={ui.fieldLabel}>Display name</Text>
    <TextInput accessibilityLabel="Display name" value={name} onChangeText={setName} style={ui.nameInput} maxLength={80}/>
    <Action label={busy?"Saving…":"Save profile"} disabled={busy} onPress={saveName}/>
   </Glass>:null}
   <View style={ui.quickGrid}>
    {([
     [<UserSquare2 size={25} color="#A45B2A"/>,"Profile Info",()=>signedIn?setEditing(v=>!v):go("/auth")],
     [<Link2 size={25} color="#A45B2A"/>,"Connected Apps",()=>Alert.alert("Connected account",signedIn?"Your Google account is used for secure sign-in. No additional connected apps are configured.":"Sign in with Google to connect your account.")],
     [<Crown size={25} color="#A45B2A"/>,"Subscription",()=>Alert.alert("Free account","The Good Side currently has free access. No paid subscription is configured.")]
    ] as const).map(([icon,label,onPress])=><TouchableOpacity key={label} accessibilityRole="button" onPress={onPress} activeOpacity={.78} style={ui.quickCard}>
      <LinearGradient colors={["rgba(255,255,255,.80)","rgba(255,225,217,.58)","rgba(247,214,236,.65)"]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill}/>
      <View pointerEvents="none" style={ui.quickShine}/>
      <LuxuryIcon size={38} tone={label==="Profile Info"?"peach":label==="Connected Apps"?"violet":"sun"}>{icon}</LuxuryIcon><Text style={ui.quickText}>{label}</Text>
    </TouchableOpacity>)}
   </View>
   <Section symbol={<Sparkles size={23} color={gold}/>} title="Personalization">
    <MenuRow icon={<Bell size={22} color={gold}/>} label="Preferences & Notifications" onPress={()=>go(signedIn?"/preferences":"/auth")}/>
    <MenuRow icon={<SlidersHorizontal size={22} color={gold}/>} label="Interest Tags" last onPress={()=>go(signedIn?"/categories":"/auth")}/>
   </Section>
   <Section symbol={<Layers3 size={23} color={gold}/>} title="Activity">
    <MenuRow icon={<Bookmark size={22} color={gold}/>} label="Saved Stories" onPress={()=>go(signedIn?"/saved":"/auth")}/>
    <MenuRow icon={<BookOpen size={22} color={gold}/>} label="Reading History" last onPress={()=>Alert.alert("Reading history","Reading history is not available in this version yet. Your saved stories are available above.")}/>
   </Section>
   <Section symbol={<ShieldCheck size={23} color={gold}/>} title="Data & Security">
    <MenuRow icon={<Lock size={22} color={gold}/>} label="Security & Privacy" onPress={()=>Alert.alert("Security & Privacy","The Good Side uses Google Sign-In and does not store your Google password. You can delete your app account below.")}/>
    <MenuRow icon={<Download size={22} color={gold}/>} label="My Data Export" last onPress={()=>signedIn?void exportData():go("/auth")}/>
   </Section>
   <View style={ui.footer}>
    {signedIn?<>
     <Action icon={<LogOut size={20} color={ink}/>} label="Sign Out" onPress={async()=>{await auth.signOut();router.replace("/")}}/>
     <Action icon={<Trash2 size={20} color="#BE302C"/>} label={busy?"Please wait…":"Delete My Account and Data"} danger disabled={busy} onPress={confirmDelete}/>
    </>:<>
     <Action label="Log in with Google" onPress={()=>go("/auth")}/>
     <Action label="Create Free Account" onPress={()=>go("/auth")}/>
    </>}
    <Action icon={<Headphones size={20} color={ink}/>} label="Contact Support" onPress={()=>Alert.alert("Contact support","The support contact address has not yet been configured.")}/>
   </View>
  </ScrollView>
  <Modal visible={avatarPicker} transparent animationType="slide" onRequestClose={()=>setAvatarPicker(false)}>
   <View style={ui.modalBackdrop}>
    <View style={ui.modalPanel}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <Text style={ui.modalTitle}>Choose your sunshine</Text>
      <TouchableOpacity accessibilityRole="button" onPress={()=>setAvatarPicker(false)} style={{padding:9}}><Text style={{fontSize:25,color:ink}}>×</Text></TouchableOpacity>
     </View>
     <Text style={{color:"#644A57",marginBottom:15}}>Pick an image from our gallery. Your selection is saved in your account, not on your phone or PC.</Text>
     {avatarLoading?<ActivityIndicator color="#D77F32" size="large" style={{marginVertical:35}}/>:null}
     {avatarError?<Text style={{color:"#A63232",marginBottom:15}}>{avatarError}. Check that the latest Google Apps Script has been deployed.</Text>:null}
     <ScrollView style={{maxHeight:380}} contentContainerStyle={{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",paddingBottom:18}}>
      {avatars.map(a=><TouchableOpacity key={a.avatar_id} accessibilityRole="button" accessibilityLabel={"Select "+a.label} disabled={busy} onPress={()=>void pickAvatar(a.avatar_id)} style={[ui.avatarChoice,avatarId===a.avatar_id&&{borderColor:"#D17929",borderWidth:3}]}>
       <Image source={{uri:a.image_url}} style={{width:"100%",height:130,borderRadius:15}}/>
       <Text numberOfLines={1} style={{fontSize:12,color:ink,fontWeight:"700",marginTop:7,textAlign:"center"}}>{a.label}</Text>
      </TouchableOpacity>)}
     </ScrollView>
     {!avatarLoading&&!avatarError&&avatars.length===0?<Text style={{color:"#674B59"}}>No profile images are currently available.</Text>:null}
     <Action label={busy?"Saving…":"Cancel"} disabled={busy} onPress={()=>setAvatarPicker(false)}/>
    </View>
   </View>
  </Modal>
  
 </LinearGradient>;
}
const ui=StyleSheet.create({
 sunrise:{position:"absolute",top:0,left:0,right:0,bottom:0},
 page:{paddingHorizontal:16,paddingTop:72,paddingBottom:180,width:"100%",maxWidth:550,alignSelf:"center"},
 topRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 back:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,paddingVertical:8,paddingHorizontal:14,borderRadius:30,borderWidth:1.5,borderColor:"rgba(255,255,255,.95)",backgroundColor:"rgba(255,245,240,.46)",shadowColor:"#fff",shadowOpacity:.75,shadowRadius:8},backText:{fontSize:16,color:ink,fontWeight:"650"},
 brand:{marginTop:0,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},brandSunBadge:{width:49,height:49,borderRadius:25,overflow:"hidden",justifyContent:"center",alignItems:"center",shadowColor:"#EC952A",shadowRadius:14,shadowOpacity:.33},
 brandSun:{fontSize:37},brandName:{fontSize:30,fontWeight:"900",color:ink,letterSpacing:-1.25},
 brandSubtitle:{fontSize:14,color:"#594450",marginTop:1},
 hero:{alignItems:"center",marginTop:16,marginBottom:13},
 avatarRim:{width:152,height:152,borderRadius:90,padding:6,borderWidth:2,borderColor:"#FFF9E9",overflow:"hidden",backgroundColor:"#ECA76D",shadowColor:"#B45D52",shadowOpacity:.34,shadowRadius:21,shadowOffset:{width:0,height:9}},
 avatar:{width:"100%",height:"100%",borderRadius:90,overflow:"hidden",backgroundColor:"#FFCC91"},
 avatarCamera:{position:"absolute",top:111,left:"61%",width:45,height:45,borderRadius:24,backgroundColor:"#FFFAEF",borderWidth:2,borderColor:"#FFF",alignItems:"center",justifyContent:"center",shadowColor:"#A55747",shadowOpacity:.22,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:5},
 nameRow:{flexDirection:"row",alignItems:"center",gap:12,marginTop:10},personName:{fontSize:32,color:ink,fontWeight:"900",letterSpacing:-.6},
 heroHint:{fontSize:12,color:"#58434E",marginTop:3},
 glass:{borderWidth:1.7,borderColor:"rgba(255,255,255,.98)",backgroundColor:"rgba(255,255,255,.32)",borderRadius:27,overflow:"hidden",shadowColor:"#995F68",shadowOpacity:.22,shadowRadius:22,shadowOffset:{width:0,height:9},elevation:5},
 quickGrid:{flexDirection:"row",gap:7,marginTop:2},
 quickCard:{flex:1,borderRadius:25,minHeight:94,borderWidth:1.8,borderColor:"rgba(255,255,255,.98)",alignItems:"center",justifyContent:"center",overflow:"hidden",paddingHorizontal:3,paddingVertical:9,shadowColor:"#A56C68",shadowOpacity:.20,shadowRadius:21,shadowOffset:{width:0,height:8}},
 quickShine:{position:"absolute",height:17,top:2,left:8,right:8,borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:"rgba(255,255,255,.40)"},
 quickIconBadge:{height:45,width:45,borderRadius:15,backgroundColor:"rgba(255,226,171,.74)",borderColor:"rgba(255,255,255,.87)",borderWidth:1,alignItems:"center",justifyContent:"center",marginBottom:10,shadowColor:"#BC6F41",shadowOpacity:.2,shadowRadius:12,shadowOffset:{width:0,height:5}},
 quickIcon:{alignItems:"center",justifyContent:"center"},
 quickText:{fontSize:11.5,fontWeight:"800",color:ink,textAlign:"center",marginTop:5,lineHeight:14},
 sectionHeader:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:7},
 sectionIcon:{width:27,height:30,justifyContent:"center",alignItems:"center"},sectionTitle:{fontSize:22,fontWeight:"900",color:ink,letterSpacing:-.7},
 menuRow:{flexDirection:"row",alignItems:"center",minHeight:60,gap:12},
 rowBorder:{borderBottomWidth:1,borderBottomColor:"rgba(163,117,120,.2)"},
 menuIconBadge:{width:39,height:39,backgroundColor:"rgba(255,213,178,.65)",borderRadius:20,alignItems:"center",justifyContent:"center",borderColor:"rgba(255,255,255,.7)",borderWidth:1},
 menuIcon:{alignItems:"center",justifyContent:"center"},
 menuLabel:{flex:1,fontSize:15.5,fontWeight:"600",color:ink},
 arrow:{fontSize:30,color:ink,fontWeight:"300",marginRight:2},
 footer:{alignItems:"center",marginTop:16,gap:9},
 pill:{minHeight:44,minWidth:"61%",paddingHorizontal:23,paddingVertical:10,borderRadius:50,backgroundColor:"rgba(255,255,255,.56)",borderWidth:1.6,borderColor:"rgba(255,255,255,.98)",flexDirection:"row",gap:10,alignItems:"center",justifyContent:"center",shadowColor:"#71403B",shadowOpacity:.20,shadowRadius:16,shadowOffset:{width:0,height:7}},
 dangerPill:{backgroundColor:"rgba(255,232,232,.68)"},
 pillText:{fontSize:15.5,fontWeight:"800",color:ink},
 fieldLabel:{color:ink,fontWeight:"700",marginBottom:9},nameInput:{padding:12,backgroundColor:"#fff",borderRadius:15,borderWidth:1,borderColor:"#F3D2BD",marginBottom:10,color:ink},
 modalBackdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(50,28,42,.42)"},
 modalPanel:{backgroundColor:"#FFF0E9",borderTopLeftRadius:32,borderTopRightRadius:32,paddingHorizontal:20,paddingTop:22,paddingBottom:35,borderWidth:1.5,borderColor:"#FFF"},
 modalTitle:{fontSize:24,color:ink,fontWeight:"900"},
 avatarChoice:{width:"47%",borderWidth:1.5,borderColor:"rgba(255,255,255,.95)",backgroundColor:"rgba(255,255,255,.55)",borderRadius:21,padding:9,marginBottom:14},
 choiceImage:{width:"100%",height:130,borderRadius:15},
 goldIcon:{width:34,height:34,borderRadius:12,borderColor:"rgba(255,255,255,.9)",borderWidth:1,justifyContent:"center",alignItems:"center"},
 authHeading:{color:ink,fontSize:20,fontWeight:"800"},authHelper:{color:"#63545d",fontSize:14,lineHeight:20,marginTop:8,marginBottom:14},
 authRow:{flexDirection:"row",gap:10},authLight:{flex:1,backgroundColor:"rgba(255,255,255,.78)",borderColor:"#fff",borderWidth:1,borderRadius:18,alignItems:"center",paddingVertical:13},authGold:{flex:1,overflow:"hidden",borderColor:"#fff",borderWidth:1,borderRadius:18,alignItems:"center",paddingVertical:13},authText:{fontSize:15,fontWeight:"800",color:ink}
});
