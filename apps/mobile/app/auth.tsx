import React,{useEffect,useState} from "react";
import {Text,ScrollView,TouchableOpacity,Platform} from "react-native";
import {router} from "expo-router";
import * as Google from "expo-auth-session/providers/google";
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
 });
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
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:75}}><TouchableOpacity onPress={()=>router.back()}><Text style={{color:colors.ink}}>← Back</Text></TouchableOpacity><Brand/><Text style={[styles.title,{marginTop:45,marginBottom:14}]}>Your bright side starts here.</Text><Text style={[styles.subtitle,{marginBottom:25}]}>Log in or create your free account with Google. Your profile is created automatically the first time you sign in. We do not store passwords.</Text><Surface><Pill title={busy?"Signing in…":"Log in / Create account with Google"} onPress={()=>{setError("");if(!request){setError("Configure the Google OAuth client IDs first");return}void promptAsync()}} disabled={busy||!request}/>{error?<Text style={{color:"#B54440",marginTop:15}}>{error}</Text>:null}<Text style={[styles.muted,{marginTop:17}]}>Sign in once to save stories and preferences. You can always browse news without an account.</Text></Surface><Pill title="Browse as guest" secondary onPress={()=>router.replace("/")}/></ScrollView></Background>
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
 if(configured)return <GoogleSignIn/>;
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:75}}><TouchableOpacity onPress={()=>router.back()}><Text>← Back</Text></TouchableOpacity><Brand/><Text style={[styles.title,{marginTop:45,marginBottom:12}]}>Set up Google login</Text><Surface><Text style={styles.subtitle}>Google login is not ready for this device. On iPhone, create an iOS OAuth client with bundle ID com.thegoodside.app and add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to apps/mobile/.env. Restart Expo after updating the file. To test native Google login reliably, use an EAS development build instead of Expo Go. Firebase is not used.</Text></Surface><Pill title="Browse good news as guest" secondary onPress={()=>router.replace("/")}/></ScrollView></Background>
}
