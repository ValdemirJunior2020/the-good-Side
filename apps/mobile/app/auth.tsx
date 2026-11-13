import React,{useEffect,useState} from "react";
import {Text,ScrollView,TouchableOpacity,Platform,View,TextInput,ActivityIndicator,StyleSheet,KeyboardAvoidingView,Keyboard,Image,Alert} from "react-native";
import Constants from "expo-constants";
import {router} from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {api,auth,json} from "../src/client";
import {emailAuth} from "../src/emailAuth";
import {getPublicSettings,syncManagedProfile} from "../src/remoteConfig";
import {Background,Brand,Pill,Surface,GoodSideLoader,MenuButton,styles} from "../src/components";
import {colors} from "../src/theme";

WebBrowser.maybeCompleteAuthSession();
const ink="#301E2C";
function GoogleButton(){
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [request,response,promptAsync]=Google.useIdTokenAuthRequest({
  clientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID||"",
  iosClientId:process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID||"",
  androidClientId:process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID||"",
  webClientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID||""
 },{scheme:"thegoodside",path:"auth"});
 useEffect(()=>{
  if(response?.type!=="success")return;
  const token=response.params?.id_token||response.authentication?.idToken;
  if(!token){setError("Google did not return an ID token");return}
  setBusy(true);
  (async()=>{
   const payload=JSON.parse(decodeJwtPayload(token)) as {email?:string;name?:string};
   // The API independently verifies Google's signature and audience.
   await auth.signIn(token,{email:payload.email||"",displayName:payload.name||""});
   await api("/me",json({display_name:payload.name||payload.email?.split("@")[0]||"Friend",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",preferred_language:"en"}),true);
   await syncManagedProfile(token,payload.name||payload.email?.split("@")[0]||"Friend").catch(()=>{});
   router.replace("/categories");
  })().catch(async e=>{await auth.signOut();setError(String(e))}).finally(()=>setBusy(false));
 },[response]);
 return <View style={{marginTop:14}}>
  <TouchableOpacity
   accessibilityRole="button"
   accessibilityLabel="Continue with Google"
   accessibilityState={{disabled:busy||!request,busy}}
   activeOpacity={0.86}
   disabled={busy||!request}
   onPress={()=>{setError("");if(!request){setError("Google OAuth isn't configured for this device.");return}void promptAsync()}}
   style={[sx.googleButton,(busy||!request)&&{opacity:.58}]}>
   <View pointerEvents="none" style={sx.googleIcon}><Image source={require("../assets/google-g.png")} resizeMode="contain" accessibilityLabel="Google" style={{width:22,height:22}}/></View>
   <Text style={sx.googleButtonText}>{busy?"Connecting to Google…":"Continue with Google"}</Text>
  </TouchableOpacity>
  {busy?<GoodSideLoader compact label="Connecting securely…"/>:null}
  {error?<Text style={sx.error}>{error}</Text>:null}
 </View>;
}
function decodeJwtPayload(token:string){
 try{
  const p=(token.split(".")[1]||"").replace(/-/g,"+").replace(/_/g,"/");
  if(typeof atob==="function")return decodeURIComponent(Array.from(atob(p),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join(""));
 }catch{}
 return "{}";
}
export default function SignIn(){
 const [mode,setMode]=useState<"register"|"login">("register");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [signupEnabled,setSignupEnabled]=useState(true);
 useEffect(()=>{getPublicSettings().then(settings=>{if(settings.signup_enabled==="false"){setSignupEnabled(false);setMode("login")}}).catch(()=>{})},[]);
 const webId=process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
 const iosId=process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
 const androidId=process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
 const googleConfigured=Platform.OS==="ios"?Boolean(iosId):Platform.OS==="android"?Boolean(androidId):Boolean(webId);
 const isExpoGo=Constants.appOwnership==="expo";
 const googleAvailable=googleConfigured&&!isExpoGo;
 const recover=async()=>{
  setError("");setMessage("");
  const mail=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))return setError("Enter your email address above, then tap Forgot password again.");
  setBusy(true);
  try{await emailAuth.resetPassword(mail);setMessage("If that email has an account, a password-reset link will arrive shortly. Check spam too.")}
  catch{setMessage("If that email has an account, a password-reset link will arrive shortly. Check spam too.")}
  finally{setBusy(false)}
 };
 const submit=async()=>{
  setError("");setMessage("");
  const mail=email.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))return setError("Enter a valid email address.");
  if(password.length<8)return setError("Password must be at least 8 characters.");
  if(mode==="register"&&!signupEnabled)return setError("New email registrations are temporarily paused.");
  if(mode==="register"&&!name.trim())return setError("Please enter your name.");
  setBusy(true);
  try{
   const result=mode==="register"?await emailAuth.signUp(mail,password,name):await emailAuth.signIn(mail,password);
   if(!result.access_token){
    setMessage("Check your inbox for the confirmation email. After confirming, return here and choose Log in.");
    setMode("login");setPassword("");
    return;
   }
   await auth.signInWithEmail(result,name.trim(),mail);
   await api("/me",json({display_name:name.trim()||result.user?.user_metadata?.display_name||mail.split("@")[0],timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",preferred_language:"en"}),true);
   await syncManagedProfile(result.access_token,name.trim()||result.user?.user_metadata?.display_name||mail.split("@")[0]).catch(()=>{});
   router.replace("/categories");
  }catch(e){
   const detail=e instanceof Error?e.message:"Sign-in failed.";
   if(auth.currentUser?.provider==="email")await auth.signOut();
   setError(detail);
  }finally{setBusy(false)}
 };
 return <Background><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}><ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:22,paddingTop:68,paddingBottom:210,width:"100%",maxWidth:540,alignSelf:"center"}}>
  <TouchableOpacity onPress={()=>router.canGoBack()?router.back():router.replace("/")} style={{alignSelf:"flex-start",paddingVertical:10}}><Text style={{color:ink,fontWeight:"700"}}>← Back</Text></TouchableOpacity>
  <View style={{alignItems:"flex-start"}}><Brand small/></View><View style={{alignItems:"flex-end",marginTop:36,marginBottom:10}}><MenuButton/></View><Text style={[styles.title,{marginTop:32,fontSize:31}]}>Your bright side starts here.</Text>
  <Text style={[styles.subtitle,{marginTop:10,marginBottom:20}]}>Create a free account with any email address. Google sign-in is still available.</Text>
  <Surface style={{marginBottom:15}}>
   <View style={{flexDirection:"row",gap:8,marginBottom:18}}>
    {(signupEnabled?["register","login"] as const:["login"] as const).map(item=><TouchableOpacity key={item} onPress={()=>{setMode(item);setError("");setMessage("")}} style={[sx.tab,mode===item&&sx.tabActive]}>
     <Text style={{color:ink,fontWeight:mode===item?"900":"600"}}>{item==="register"?"Create account":"Log in"}</Text>
    </TouchableOpacity>)}
   </View>
   {mode==="register"?<><Text style={sx.label}>Your name</Text><TextInput accessibilityLabel="Your name" selectionColor="#B96F39" cursorColor="#B96F39" editable={!busy} autoComplete="name" value={name} onChangeText={setName} placeholder="First name" placeholderTextColor="#887381" style={sx.input} maxLength={80} returnKeyType="next"/></>:null}
   <Text style={sx.label}>Email address</Text><TextInput accessibilityLabel="Email address" selectionColor="#B96F39" cursorColor="#B96F39" editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#887381" style={sx.input} maxLength={254} returnKeyType="next"/>
   <Text style={sx.label}>Password</Text><TextInput accessibilityLabel="Password" selectionColor="#B96F39" cursorColor="#B96F39" editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete={mode==="register"?"new-password":"current-password"} secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor="#887381" style={sx.input} returnKeyType="done" onSubmitEditing={()=>{Keyboard.dismiss();void submit()}}/>
   {mode==="login"?<TouchableOpacity accessibilityRole="button" disabled={busy} onPress={()=>void recover()} style={{alignSelf:"flex-end",marginBottom:16,paddingVertical:4}}><Text style={{color:"#965329",fontWeight:"800"}}>Forgot password?</Text></TouchableOpacity>:null}
   <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={()=>void submit()} style={[sx.submit,busy&&{opacity:.55}]}>
    {busy?<GoodSideLoader compact label={mode==="register"?"Creating account…":"Signing in…"}/>:<Text style={{color:"#fff",fontWeight:"800",fontSize:16}}>{mode==="register"?"Create free account":"Log in with email"}</Text>}
   </TouchableOpacity>
   {message?<Text accessibilityRole="text" style={sx.success}>{message}</Text>:null}
   {error?<Text accessibilityRole="alert" style={sx.error}>{error}</Text>:null}
   <Text style={[styles.muted,{marginTop:15,fontSize:12,lineHeight:19}]}>Email accounts use secure Supabase Authentication. A verification email may be required before your first login.</Text>
  </Surface>
  <View style={{flexDirection:"row",alignItems:"center",gap:12,marginVertical:6}}><View style={sx.rule}/><Text style={{color:"#6E5865"}}>or</Text><View style={sx.rule}/></View>
  {googleAvailable?<GoogleButton/>:<View style={{marginTop:14}}>
   <TouchableOpacity
    testID="google-signin-development-build"
    accessibilityRole="button"
    accessibilityLabel="Google sign-in setup information"
    activeOpacity={0.84}
    onPress={()=>Alert.alert("Google sign-in",isExpoGo?"Google login requires an installed iOS build; it does not work in Expo Go.":"This iPhone build is missing the Google iOS OAuth client ID. Configure EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in the EAS preview environment and rebuild. Email login is available now.",[{text:"OK"}])}
    style={sx.googleButton}>
    <Image source={require("../assets/google-g.png")} resizeMode="contain" style={{width:24,height:24,marginRight:12}}/>
    <Text style={sx.googleButtonText}>Continue with Google</Text>
   </TouchableOpacity>
   <Text style={{color:"#704F50",fontSize:12.5,lineHeight:19,textAlign:"center",marginTop:8,paddingHorizontal:12}}>
    {isExpoGo?"Not supported in Expo Go":"Google iOS OAuth client ID missing from this build"}
   </Text>
  </View>}
  <View style={{marginTop:17}}><Pill title="Browse as guest" secondary onPress={()=>router.replace("/")}/></View>
  <View style={{marginTop:16,flexDirection:"row",justifyContent:"center",gap:16,flexWrap:"wrap"}}><TouchableOpacity accessibilityRole="link" onPress={()=>router.push({pathname:"/legal/[type]",params:{type:"privacy"}})}><Text style={{fontSize:13,color:"#874F37",textDecorationLine:"underline"}}>Privacy Policy</Text></TouchableOpacity><TouchableOpacity accessibilityRole="link" onPress={()=>router.push({pathname:"/legal/[type]",params:{type:"terms"}})}><Text style={{fontSize:13,color:"#874F37",textDecorationLine:"underline"}}>Terms of Use</Text></TouchableOpacity></View>
 </ScrollView></KeyboardAvoidingView></Background>;
}
const sx=StyleSheet.create({
 googleButton:{minHeight:58,marginTop:2,borderRadius:19,backgroundColor:"#FFFFFF",borderWidth:1.8,borderColor:"#D7A78C",flexDirection:"row",alignItems:"center",justifyContent:"center",paddingHorizontal:16,shadowColor:"#9B6A53",shadowOpacity:.15,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:3},
 googleIcon:{position:"absolute",left:20,top:0,bottom:0,justifyContent:"center",alignItems:"center",width:24},
 googleButtonText:{fontSize:15.5,fontWeight:"700",color:"#332830",textAlign:"center"},

 tab:{flex:1,paddingVertical:12,alignItems:"center",borderRadius:19,backgroundColor:"rgba(255,255,255,.64)",borderWidth:1,borderColor:"#fff"},
 tabActive:{backgroundColor:"#F9CAA7",borderColor:"#E7A878"},
 label:{color:ink,fontSize:14,fontWeight:"800",marginBottom:7},
 input:{backgroundColor:"#FFFFFF",opacity:1,borderWidth:2,borderColor:"#C88E78",borderRadius:16,minHeight:54,fontSize:16,color:"#301E2C",paddingHorizontal:15,marginBottom:16,position:"relative",zIndex:5},
 submit:{minHeight:51,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:"#B96F39"},
 error:{color:"#AD3535",marginTop:13,fontSize:14,lineHeight:20},
 success:{color:"#326747",marginTop:13,fontSize:14,lineHeight:20},
 rule:{flex:1,height:1,backgroundColor:"rgba(139,95,104,.24)"}
});
