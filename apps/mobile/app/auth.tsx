import React,{useState} from "react";
import {View,Text,TextInput,ScrollView,Alert,TouchableOpacity} from "react-native";
import {router} from "expo-router";
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,updateProfile} from "firebase/auth";
import {api,auth,json} from "../src/client";
import {Background,Brand,Pill,Surface,styles} from "../src/components";
import {colors} from "../src/theme";
export default function Auth(){
 const [mode,setMode]=useState<"login"|"register"|"reset">("login"),[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async()=>{setBusy(true);setError("");try{
 if(mode==="reset"){await sendPasswordResetEmail(auth,email.trim());Alert.alert("Check your inbox","If an account exists, you'll receive reset instructions.");setMode("login");return;}
 const credential=mode==="register"?await createUserWithEmailAndPassword(auth,email.trim(),password):await signInWithEmailAndPassword(auth,email.trim(),password);
 if(mode==="register"&&name.trim())await updateProfile(credential.user,{displayName:name.trim()});
 await api("/me",json({display_name:name.trim()||credential.user.displayName||"",preferred_language:"en",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"America/New_York"}),true);
 router.replace(mode==="register"?"/categories":"/");
 }catch(e){setError(e instanceof Error?e.message:"Could not sign in")}finally{setBusy(false)}};
 return <Background><ScrollView contentContainerStyle={{padding:24,paddingTop:75}}><TouchableOpacity onPress={()=>router.back()}><Text style={{color:colors.ink}}>← Back</Text></TouchableOpacity><View style={{marginTop:45,marginBottom:30}}><Brand/></View><Text style={[styles.title,{marginBottom:10}]}>{mode==="register"?"Come on in.":mode==="reset"?"Reset your password":"Welcome back."}</Text><Text style={[styles.subtitle,{marginBottom:32}]}>A brighter world is one sign-in away.</Text><Surface>{mode==="register"&&<TextInput autoCapitalize="words" placeholder="Your name" value={name} onChangeText={setName} style={styles.input}/>}<TextInput placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input}/>{mode!=="reset"&&<TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input}/>}<Text style={{color:"#B54440",marginBottom:error?15:0}}>{error}</Text><Pill title={busy?"Please wait…":mode==="register"?"Create account":mode==="reset"?"Send reset email":"Sign in"} disabled={busy} onPress={submit}/></Surface><TouchableOpacity onPress={()=>{setError("");setMode(mode==="register"?"login":"register")}} style={{marginTop:25,alignItems:"center"}}><Text style={{color:colors.ink,fontWeight:"700"}}>{mode==="register"?"Already have an account? Sign in":"New here? Create an account"}</Text></TouchableOpacity><TouchableOpacity onPress={()=>setMode("reset")} style={{marginTop:19,alignItems:"center"}}><Text style={styles.muted}>Forgot password?</Text></TouchableOpacity><Pill title="Continue as guest" secondary onPress={()=>router.replace("/")}/></ScrollView></Background>
}
