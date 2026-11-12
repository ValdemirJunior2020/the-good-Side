import TabBar from "../src/TabBar";
import React,{useEffect,useState} from "react";
import {ScrollView,Text,TextInput,TouchableOpacity,Alert,View} from "react-native";
import {router} from "expo-router";
import {api,auth,put,type Session} from "../src/client";
import {Background,Brand,Pill,Surface,styles} from "../src/components";
import {colors} from "../src/theme";

export default function Profile(){
 const [session,setSession]=useState<Session|null>(auth.currentUser);
 const [name,setName]=useState(auth.currentUser?.displayName||"");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{const unsubscribe=auth.subscribe(user=>{setSession(user);setName(user?.displayName||"")});void auth.restore();return unsubscribe},[]);
 const save=async()=>{
  if(!session)return router.push("/auth");
  setBusy(true);
  try{await api("/me",put({display_name:name}),true);Alert.alert("Updated","Profile saved")}
  catch(e){Alert.alert("Unable to save",String(e))}finally{setBusy(false)}
 };
 const del=()=>{
  if(!session)return router.push("/auth");
  Alert.alert("Delete The Good Side account?","This permanently deletes your The Good Side profile and associated saved data and preferences. It does NOT delete your Google account.",[
   {text:"Cancel",style:"cancel"},
   {text:"Delete permanently",style:"destructive",onPress:async()=>{
    setBusy(true);
    try{await api("/me",{method:"DELETE"},true);await auth.signOut();router.replace("/");Alert.alert("Account deleted","Your The Good Side account was deleted. Your Google account was not affected.")}
    catch(e){Alert.alert("Unable to delete",String(e))}finally{setBusy(false)}
   }}
  ]);
 };
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:68,paddingBottom:135}}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.muted}>← Back</Text></TouchableOpacity>
  <Brand/>
  {session?<>
   <Text style={[styles.title,{marginTop:35,marginBottom:16}]}>Your little corner{"\n"}of the good.</Text>
   <Surface style={{marginBottom:15}}>
    <Text style={styles.label}>Your account</Text>
    <Text style={[styles.subtitle,{marginTop:6,marginBottom:14}]}>{session.email}</Text>
    <Text style={styles.label}>Display name</Text>
    <TextInput accessibilityLabel="Display name" value={name} onChangeText={setName} style={styles.input}/>
    <Pill title={busy?"Saving…":"Save profile"} disabled={busy} onPress={save}/>
   </Surface>
   {[["☀ Preferences & notifications","/preferences"],["✉ Notification history","/notifications"],["♡ Saved stories","/saved"]].map(([label,href])=><TouchableOpacity key={href} accessibilityRole="button" onPress={()=>router.push(href as any)} style={{marginVertical:13}}><Text style={styles.label}>{label} →</Text></TouchableOpacity>)}
   <Pill title="Log out" secondary onPress={async()=>{await auth.signOut();router.replace("/")}}/>
   <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={del} style={{padding:20,alignItems:"center"}}><Text style={{color:"#B54440",fontWeight:"700"}}>Delete my The Good Side account</Text></TouchableOpacity>
  </>:<>
   <Text style={[styles.title,{marginTop:35,marginBottom:15}]}>Your good side starts here.</Text>
   <Text style={[styles.subtitle,{marginBottom:24}]}>Create your free profile to save stories, choose interests and set your good news schedule.</Text>
   <Surface style={{marginBottom:16}}>
    <Text style={styles.label}>New to The Good Side?</Text>
    <Text style={[styles.muted,{marginVertical:10}]}>Use Google to create an account. No password to remember.</Text>
    <Pill title="Create free account" onPress={()=>router.push("/auth")}/>
   </Surface>
   <Surface style={{marginBottom:16}}>
    <Text style={styles.label}>Already have an account?</Text>
    <Text style={[styles.muted,{marginVertical:10}]}>Log in with the Google account you used before.</Text>
    <Pill title="Log in" secondary onPress={()=>router.push("/auth")}/>
   </Surface>
   <Pill title="Continue browsing as guest" secondary onPress={()=>router.replace("/")}/>
  </>}
 </ScrollView><TabBar/></Background>
}
