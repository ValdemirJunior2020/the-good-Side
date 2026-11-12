import React,{useEffect,useState} from "react";
import {Text,ScrollView,TouchableOpacity,Platform,View} from "react-native";
import Constants from "expo-constants";
import {router} from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();
import {api,auth,json} from "../src/client";
import {Background,Brand,Pill,Surface,styles} from "../src/components";
import {colors} from "../src/theme";
function GoogleSignIn(){
 const [error,setError]=useState(""),[busy,setBusy]=useState(false);
 const [request,response,promptAsync]=Google.useIdTokenAuthRequest({
  clientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID||"",
  iosClientId:process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID||"",
  androidClientId:process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID||"",
  webClientId:process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID||""
 },{scheme:"thegoodside",path:"auth"});
 useEffect(()=>{if(response?.type!=="success")return;const token=response.params?.id_token;if(!token){setError("Google did not return an ID token");return}
  setBusy(true);
  // The server verifies the signed Google token before any profile is accepted.
  (async()=>{
   const info=JSON.parse(atobCompat(token.split(".")[1]||"")) as {email?:string;name?:string};
   await auth.signIn(token,{email:info.email||"",displayName:info.name||""});
   await api("/me",json({display_name:info.name||"",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",preferred_language:"en"}),true);
   router.replace("/categories");
  })().catch(e=>{auth.signOut();setError(String(e))}).finally(()=>setBusy(false));
 },[response]);
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:75}}><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><TouchableOpacity onPress={()=>router.back()}><Text style={{color:colors.ink}}>← Back</Text></TouchableOpacity></View><Brand/><Text style={[styles.title,{marginTop:45,marginBottom:14}]}>Your bright side starts here.</Text><Text style={[styles.subtitle,{marginBottom:25}]}>Log in or create your free account with Google. Your profile is created automatically the first time you sign in. We do not store passwords.</Text><Surface><Pill title={busy?"Signing in…":"Log in / Create account with Google"} onPress={()=>{setError("");if(!request){setError("Configure the Google OAuth client IDs first");return}void promptAsync()}} disabled={busy||!request}/>{error?<Text style={{color:"#B54440",marginTop:15}}>{error}</Text>:null}<Text style={[styles.muted,{marginTop:17}]}>Sign in once to save stories and preferences. You can always browse news without an account.</Text>{Platform.OS==="web"?<View style={{marginTop:18,padding:12,backgroundColor:"rgba(255,255,255,.75)",borderRadius:14}}><Text style={{fontWeight:"800",color:colors.ink,marginBottom:6}}>Google Cloud authorized redirect URI</Text><Text selectable style={{fontSize:12,color:colors.ink,lineHeight:19}}>{request?.redirectUri||AuthSession.makeRedirectUri({scheme:"thegoodside",path:"auth"})}</Text><Text style={[styles.muted,{marginTop:8,fontSize:12}]}>Copy this exact URI into Google Cloud → OAuth Web Client → Authorized redirect URIs. Also authorize this browser origin under JavaScript origins. Both values must match the client ID configured for this app.</Text></View>:null}</Surface><Pill title="Browse as guest" secondary onPress={()=>router.replace("/")}/></ScrollView></Background>
}
function atobCompat(input:string){
 const p=input.replace(/-/g,"+").replace(/_/g,"/");if(typeof atob==="function")return decodeURIComponent(Array.from(atob(p),c=>"%"+c.charCodeAt(0).toString(16).padStart(2,"0")).join(""));
 return "{}";
}

export default function SignIn(){
 const webId=process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
 const iosId=process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
 const androidId=process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
 const configured=Platform.OS==="ios"?Boolean(iosId):Platform.OS==="android"?Boolean(androidId):Boolean(webId);
 const expoGo=Constants.appOwnership==="expo";
 if(configured&&!expoGo)return <GoogleSignIn/>;
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:75}}><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}><TouchableOpacity onPress={()=>router.back()}><Text style={{color:colors.ink}}>← Back</Text></TouchableOpacity></View><Brand/><Text style={[styles.title,{marginTop:45,marginBottom:12}]}>Set up Google login</Text><Surface><Text style={styles.subtitle}>{expoGo?"Google sign-in cannot finish inside Expo Go, even if the Client IDs are configured. Install an EAS development build to use your app-specific OAuth redirect. You can browse all good news as a guest now.": "Google login needs a valid iOS OAuth client ID. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID for bundle ID com.thegoodside.app to apps/mobile/.env and restart the development build. We do not use Firebase."}</Text></Surface><Pill title="Browse good news as guest" secondary onPress={()=>router.replace("/")}/></ScrollView></Background>
}
