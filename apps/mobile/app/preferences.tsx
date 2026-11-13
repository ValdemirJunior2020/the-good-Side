import React,{useEffect,useState} from "react";
import{ScrollView,Text,View,Switch,TouchableOpacity,Alert,TextInput,Platform}from"react-native";

import{router}from"expo-router";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import{api,auth,put}from"../src/client";
import{Background,Pill,Surface,GoodSideLoader,MenuButton,styles}from"../src/components";
import{colors,categories}from"../src/theme";
type Frequency="daily"|"twice_daily"|"three_daily"|"selected_weekdays"|"breaking_only"|"digest_plus_alerts";
type Pref={
 selected_categories:string;notification_enabled:boolean|string;daily_digest_enabled:boolean|string;
 notification_local_time:string;content_language:"en"|"pt"|"es";notification_timezone:string;
 notification_frequency:Frequency;notification_times:string[]|string;notification_weekdays:number[]|string;
 quiet_hours_start:string;quiet_hours_end:string;weekend_enabled:boolean|string;
 food_notifications_enabled:boolean|string;breaking_alerts_enabled:boolean|string;
 notification_sound_enabled:boolean|string;
};
// Do not initialize push modules inside Expo Go (unsupported remote notifications).
const loadNotifications=():typeof import("expo-notifications")|null=>
 Constants.appOwnership==="expo"||Platform.OS==="web"?null:require("expo-notifications");
const enabled=(v:unknown)=>v===true||v==="true"||v==="TRUE";
const parse=<T,>(v:unknown,fallback:T):T=>{if(Array.isArray(v))return v as T;try{return typeof v==="string"?JSON.parse(v) as T:fallback}catch{return fallback}};
const clock=/^([01]\d|2[0-3]):[0-5]\d$/;
const freq:[string,Frequency][]=[["Once daily","daily"],["Twice daily","twice_daily"],["Three times daily","three_daily"],["Selected weekdays","selected_weekdays"],["Breaking only","breaking_only"],["Daily digest + alerts","digest_plus_alerts"]];
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const initial:Pref={selected_categories:"",notification_enabled:true,daily_digest_enabled:true,notification_local_time:"12:00",content_language:"en",notification_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"America/New_York",notification_frequency:"daily",notification_times:["12:00"],notification_weekdays:[],quiet_hours_start:"",quiet_hours_end:"",weekend_enabled:true,food_notifications_enabled:false,breaking_alerts_enabled:true,notification_sound_enabled:true};
export default function Preferences(){
 const [editingTime,setEditingTime]=useState<number|null>(null);
 const[p,setP]=useState<Pref>(initial),[busy,setBusy]=useState(false),[error,setError]=useState(""),[preview,setPreview]=useState(""),[signedIn,setSignedIn]=useState(Boolean(auth.currentUser));
 const refreshPreview=()=>api<{next_at:string|null;timezone:string}>("/me/next-notification",{},true).then(v=>setPreview(v.next_at?new Date(v.next_at).toLocaleString(undefined,{timeZone:v.timezone,dateStyle:"medium",timeStyle:"short"})+" ("+v.timezone+")":"No digest currently scheduled")).catch(()=>setPreview("Preview unavailable"));
 useEffect(()=>{const unsubscribe=auth.subscribe(user=>{setSignedIn(Boolean(user));if(!user){setPreview("Sign in to view your notification schedule");return}api<Partial<Pref>>("/me/preferences",{},true).then(v=>setP({...initial,...v,notification_timezone:v.notification_timezone||initial.notification_timezone,notification_times:parse(v.notification_times,[v.notification_local_time||"12:00"]),notification_weekdays:parse(v.notification_weekdays,[])})).catch(e=>setError(String(e)));void refreshPreview()});void auth.restore();return unsubscribe},[]);
 const set=(key:keyof Pref,value:any)=>setP(prev=>({...prev,[key]:value}));
 const selected=String(p.selected_categories||"").split(",").filter(Boolean);
 const parsedTimes=parse<string[]>(p.notification_times,["12:00"]);
 const times=Array.from({length:p.notification_frequency==="three_daily"?3:p.notification_frequency==="twice_daily"?2:1},(_,i)=>parsedTimes[i]||(["12:00","18:00","09:00"][i]));
 const days=parse<number[]>(p.notification_weekdays,[]);
 const slots=p.notification_frequency==="twice_daily"?2:p.notification_frequency==="three_daily"?3:1;
 const asDate=(time:string)=>{const d=new Date();const valid=clock.test(time)?time:"12:00";const [h,m]=valid.split(":").map(Number);d.setHours(h,m,0,0);return d};
 const humanTime=(time:string)=>asDate(time).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
 const updateClockPart=(part:"hour"|"minute"|"period",value:number|string)=>{
  if(editingTime===null)return;
  const date=asDate(times[editingTime]||"12:00");
  const oldHour=date.getHours();
  if(part==="hour"){const h=Number(value)%12;date.setHours(h+(oldHour>=12?12:0))}
  else if(part==="minute")date.setMinutes(Number(value));
  else date.setHours((oldHour%12)+(value==="PM"?12:0));
  const updated=String(date.getHours()).padStart(2,"0")+":"+String(date.getMinutes()).padStart(2,"0");
  set("notification_times",times.map((v,i)=>i===editingTime?updated:v));
 };
 const toggleInterest=(c:string)=>set("selected_categories",(selected.includes(c)?selected.filter(x=>x!==c):[...selected,c]).join(","));
 const switchRow=(label:string,key:keyof Pref)=> <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:49,gap:10}}><Text style={[styles.subtitle,{flex:1,color:colors.ink}]}>{label}</Text><Switch accessibilityLabel={label} value={enabled(p[key])} onValueChange={v=>set(key,v)} trackColor={{true:colors.orange}}/></View>;
 const validZone=()=>{try{new Intl.DateTimeFormat("en-US",{timeZone:p.notification_timezone});return true}catch{return false}};
 const previewSound=async()=>{
  const Notifications=loadNotifications();
  if(!Notifications)return Alert.alert("Development build required","Signature notification sounds are available in the installed iOS app, not Expo Go.");
  try{
   const permission=await Notifications.requestPermissionsAsync();
   if(!permission.granted)return Alert.alert("Permission required","Allow notifications to preview the sound.");
   const custom=Constants.expoConfig?.extra?.hasSignatureSound===true;
   await Notifications.scheduleNotificationAsync({content:{title:"☀️ The Good Side",body:"Here is a little good for your day.",sound:custom?"ding.wav":"default",data:{preview_sound:true}},trigger:null});
   if(!custom)Alert.alert("Default sound preview","The custom ding requires a development build configured with the bundled sound.");
  }catch(e){Alert.alert("Unable to play preview",String(e))}
 };
 const save=async()=>{
  if(!auth.currentUser)return Alert.alert("Sign in required","Create an account or log in with Google to save preferences.",[{text:"Cancel",style:"cancel"},{text:"Log in / Sign up",onPress:()=>router.push("/auth")}]);
  const deliveryTimes=times.slice(0,slots).map(v=>v.trim());
  if(!validZone())return Alert.alert("Invalid timezone","Enter an IANA timezone such as America/New_York.");
  if(deliveryTimes.some(t=>!clock.test(t))||new Set(deliveryTimes).size!==deliveryTimes.length)return Alert.alert("Invalid times","Enter unique delivery times in HH:MM format.");
  
  if(p.notification_frequency==="selected_weekdays"&&days.length===0)return Alert.alert("Choose weekdays","Select the days on which you want good news.");
  setBusy(true);
  try{
   const requestedNotifications=true;
   const body={selected_categories:selected,notification_enabled:requestedNotifications,daily_digest_enabled:enabled(p.daily_digest_enabled),notification_local_time:deliveryTimes[0]||"12:00",
    notification_times:deliveryTimes,notification_timezone:p.notification_timezone,notification_frequency:p.notification_frequency,
    notification_weekdays:days,quiet_hours_start:"",quiet_hours_end:"",
    weekend_enabled:enabled(p.weekend_enabled),food_notifications_enabled:enabled(p.food_notifications_enabled),
    breaking_alerts_enabled:true,notification_sound_enabled:enabled(p.notification_sound_enabled),content_language:p.content_language};
   // Persist preferences first. Push token registration is an independent operation
   // and must never cause users to lose their selected interests and schedule.
   const saved=await api<Pref>("/me/preferences",put(body),true);
   setP(prev=>({...prev,...saved,
    selected_categories:Array.isArray(saved.selected_categories)?saved.selected_categories.join(","):saved.selected_categories??prev.selected_categories,
    notification_enabled:requestedNotifications,
    notification_times:parse(saved.notification_times,deliveryTimes),
    notification_weekdays:parse(saved.notification_weekdays,days)}));
   void refreshPreview();
   if(requestedNotifications){
    try{
     const Notifications=loadNotifications();
     if(!Notifications)throw Error("Push notifications require an installed iOS build.");
     const permission=await Notifications.requestPermissionsAsync();
     if(!permission.granted)throw Error("Notifications are disabled in iPhone Settings.");
     if(Platform.OS!=="web"){
      const projectId=process.env.EXPO_PUBLIC_EXPO_PROJECT_ID||Constants.expoConfig?.extra?.eas?.projectId;
      if(!projectId)throw Error("EAS project ID is not configured.");
      const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
      let deviceId=await SecureStore.getItemAsync("goodside_device_id");
      if(!deviceId){deviceId="device-"+Platform.OS+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);await SecureStore.setItemAsync("goodside_device_id",deviceId)}
      await api("/me/device",{method:"POST",body:JSON.stringify({device_id:deviceId,platform:Platform.OS,token})},true);
     }
    }catch(pushError){
     Alert.alert("Settings saved","Your preferences were saved, but push notification setup could not finish: "+(pushError instanceof Error?pushError.message:String(pushError)));
     return;
    }
   }
   Alert.alert("Saved","Your good news preferences and schedule have been updated.");
  }catch(e){Alert.alert("Unable to save",String(e))}finally{setBusy(false)}
 };
 const choice=(label:string,active:boolean,action:()=>void)=> <TouchableOpacity accessibilityRole="button" accessibilityState={{selected:active}} onPress={action} style={{paddingHorizontal:13,paddingVertical:11,margin:3,borderRadius:16,backgroundColor:active?colors.peach:"rgba(255,255,255,.9)",borderWidth:1,borderColor:active?colors.orange:colors.stroke}}><Text style={{color:colors.ink,fontWeight:active?"800":"500"}}>{label}</Text></TouchableOpacity>;
 return <Background><ScrollView contentContainerStyle={{padding:22,paddingTop:58,paddingBottom:180}}>
  <TouchableOpacity onPress={()=>router.back()}><Text style={styles.muted}>← Back</Text></TouchableOpacity>
  <View style={{alignItems:"flex-end",marginTop:36,marginBottom:10}}><MenuButton/></View>
  <Text style={[styles.title,{marginTop:24}]}>Make good news yours.</Text>
  <Text style={[styles.subtitle,{marginVertical:13}]}>Your interests, your schedule, your peace.</Text>
  {!signedIn?<Surface style={{marginBottom:16,backgroundColor:"#FFF0DA"}}><Text style={styles.label}>Save your preferences with a free account</Text><Text style={[styles.muted,{marginVertical:10}]}>You are browsing as a guest. Sign in to save interests, notification times and food alerts.</Text><Pill title="Log in / Create account" onPress={()=>router.push("/auth")}/></Surface>:null}
  {error?<Text style={{color:"#AD3535"}}>{error}</Text>:null}
  <Surface style={{marginBottom:14}}><Text style={styles.label}>Notifications</Text><Text style={[styles.muted,{marginTop:8,marginBottom:8}]}>Uplifting news is built into your experience. Allow notifications in iPhone Settings to receive them, then customize your delivery schedule below.</Text>{switchRow("Daily digest","daily_digest_enabled")}
   <Text style={[styles.muted,{marginTop:12}]}>Delivery frequency</Text><View style={{flexDirection:"row",flexWrap:"wrap",marginTop:8}}>{freq.map(([label,id])=><React.Fragment key={id}>{choice(label,p.notification_frequency===id,()=>set("notification_frequency",id))}</React.Fragment>)}</View>
   {p.notification_frequency!=="breaking_only"?<View style={{marginTop:16,gap:8}}>
    <Text style={styles.muted}>Delivery times · 24-hour clock</Text>
    {times.slice(0,slots).map((t,i)=><TouchableOpacity key={i} accessibilityRole="button" accessibilityLabel={"Choose delivery time "+(i+1)} onPress={()=>setEditingTime(i)} style={{backgroundColor:"#FFFFFF",borderWidth:1.5,borderColor:"#DDBAA8",borderRadius:15,minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16}}>
      <Text style={{fontSize:18,fontWeight:"700",color:"#301E2C"}}>{humanTime(t)}</Text><Text style={{fontSize:14,color:colors.orange,fontWeight:"700"}}>Change time ◷</Text>
     </TouchableOpacity>)}
     {editingTime!==null?<View style={{borderRadius:18,backgroundColor:"rgba(255,255,255,.9)",padding:12,gap:12}}>
       <Text style={[styles.label,{textAlign:"center"}]}>Choose a delivery time</Text>
       <Text style={{textAlign:"center",color:colors.ink,fontWeight:"800",fontSize:26}}>{humanTime(times[editingTime]||"12:00")}</Text>
       <Text style={styles.muted}>Hour</Text>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">{Array.from({length:12},(_,i)=>i+1).map(h=><TouchableOpacity key={h} onPress={()=>updateClockPart("hour",h)} style={{marginRight:6,minWidth:48,padding:12,alignItems:"center",borderRadius:14,backgroundColor:((asDate(times[editingTime]||"12:00").getHours()%12)||12)===h?colors.peach:"#FFFFFF"}}><Text style={{fontWeight:"800",color:colors.ink}}>{h}</Text></TouchableOpacity>)}</ScrollView>
       <Text style={styles.muted}>Minutes</Text>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">{Array.from({length:12},(_,i)=>i*5).map(m=><TouchableOpacity key={m} onPress={()=>updateClockPart("minute",m)} style={{marginRight:6,minWidth:48,padding:12,alignItems:"center",borderRadius:14,backgroundColor:asDate(times[editingTime]||"12:00").getMinutes()===m?colors.peach:"#FFFFFF"}}><Text style={{fontWeight:"800",color:colors.ink}}>{String(m).padStart(2,"0")}</Text></TouchableOpacity>)}</ScrollView>
       <View style={{flexDirection:"row",gap:10}}>{(["AM","PM"] as const).map(period=><TouchableOpacity key={period} onPress={()=>updateClockPart("period",period)} style={{flex:1,alignItems:"center",padding:14,borderRadius:15,backgroundColor:(asDate(times[editingTime]||"12:00").getHours()>=12?"PM":"AM")===period?colors.peach:"#FFFFFF"}}><Text style={{fontWeight:"900",color:colors.ink}}>{period}</Text></TouchableOpacity>)}</View>
       <Pill title="Done" onPress={()=>setEditingTime(null)}/>
      </View>:null}
   </View>:null}
   <Text style={[styles.muted,{marginTop:14}]}>Times shown in your timezone: {p.notification_timezone||"Device timezone"}</Text>
  </Surface>
  <Surface style={{marginBottom:14}}><Text style={styles.label}>Which days?</Text>{switchRow("Include weekends","weekend_enabled")}<Text style={[styles.muted,{marginTop:10}]}>Selected weekdays</Text><View style={{flexDirection:"row",flexWrap:"wrap",marginTop:8}}>{weekdays.map((d,i)=><React.Fragment key={d}>{choice(d,days.includes(i),()=>set("notification_weekdays",days.includes(i)?days.filter(x=>x!==i):[...days,i]))}</React.Fragment>)}</View></Surface>
  <Surface style={{marginBottom:14}}><Text style={styles.label}>Extra good things</Text><View style={{paddingVertical:8}}><Text style={[styles.subtitle,{fontWeight:"700"}]}>Breaking positive news · Always on ✓</Text><Text style={styles.muted}>News alerts are enabled when iPhone notifications are allowed.</Text></View>{switchRow("Food & Recipes alerts","food_notifications_enabled")}{switchRow("Play notification sound","notification_sound_enabled")}<TouchableOpacity accessibilityRole="button" onPress={previewSound} style={{padding:13,backgroundColor:"rgba(255,255,255,.85)",borderRadius:16,marginVertical:8}}><Text style={{fontWeight:"800",color:colors.ink}}>♫ Preview notification sound</Text></TouchableOpacity><Text style={styles.muted}>Your signature ding plays after it is bundled in an EAS build. iPhone silent mode and Focus settings are respected.</Text></Surface>
  <Surface style={{marginBottom:14}}><Text style={styles.label}>Your interests</Text><View style={{flexDirection:"row",flexWrap:"wrap"}}>{categories.filter((c,i,all)=>all.findIndex(v=>v[1]===c[1])===i).map(([label,id,emoji])=><React.Fragment key={id}>{choice(emoji+" "+label,selected.includes(id),()=>toggleInterest(id))}</React.Fragment>)}</View></Surface>
  <Surface style={{marginBottom:18}}><Text style={styles.label}>Language</Text><View style={{flexDirection:"row",flexWrap:"wrap"}}>{([["English","en"],["Português","pt"],["Español","es"]]as const).map(([label,id])=><React.Fragment key={id}>{choice(label,p.content_language===id,()=>set("content_language",id))}</React.Fragment>)}</View></Surface>
  <Surface style={{marginBottom:16}}><Text style={styles.label}>Next expected notification</Text>{preview?<Text style={styles.subtitle}>{preview}</Text>:<GoodSideLoader compact label="Checking next delivery…"/>}<Text style={[styles.muted,{marginTop:6}]}>This preview reflects saved settings. Delivery can be delayed by your device or Apple.</Text></Surface>
  {busy?<GoodSideLoader label="Saving your preferences…"/>:null}
   <Pill title={busy?"Saving…":signedIn?"Save my settings":"Log in to save settings"} disabled={busy} onPress={signedIn?save:()=>router.push("/auth")}/>
 </ScrollView></Background>
}
