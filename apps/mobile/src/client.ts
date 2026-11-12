import {Platform} from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {emailAuth,type EmailTokenResponse} from "./emailAuth";
const API_URL=process.env.EXPO_PUBLIC_API_URL||"";
const KEY="goodside_google_session"; // Retain existing storage key for migration.
export type Session={token:string;email:string;displayName:string;provider?:"google"|"email";refreshToken?:string;expiresAt?:number};
let current:Session|null=null;
let loaded=false;
const listeners=new Set<(session:Session|null)=>void>();
function emit(){for(const listener of listeners)listener(current)}
async function storeSession(session:Session|null){
 if(Platform.OS==="web"){if(session)await AsyncStorage.setItem(KEY,JSON.stringify(session));else await AsyncStorage.removeItem(KEY)}
 else if(session)await SecureStore.setItemAsync(KEY,JSON.stringify(session));
 else await SecureStore.deleteItemAsync(KEY);
}
async function renewSession(){
 if(!current||current.provider!=="email"||!current.refreshToken)return current?.token||null;
 if(current.expiresAt&&Date.now()<current.expiresAt-60_000)return current.token;
 const data=await emailAuth.refresh(current.refreshToken);
 if(!data.access_token||!data.refresh_token)throw Error("Email session expired. Please sign in again.");
 current={...current,token:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+(data.expires_in||3600)*1000};
 await storeSession(current);emit();return current.token;
}
export const auth={
 get currentUser(){return current},
 subscribe(fn:(s:Session|null)=>void){listeners.add(fn);fn(current);return()=>{listeners.delete(fn)}},
 async restore(){
  if(loaded)return;loaded=true;
  try{const value=Platform.OS==="web"?await AsyncStorage.getItem(KEY):await SecureStore.getItemAsync(KEY);
   if(value)current=JSON.parse(value) as Session;
   if(current?.provider==="email")await renewSession();
  }catch{current=null;await storeSession(null).catch(()=>{})}emit()
 },
 async signIn(token:string,user:{email:string;displayName:string}){
  current={token,email:user.email,displayName:user.displayName,provider:"google"};await storeSession(current);emit()
 },
 async signInWithEmail(data:EmailTokenResponse,displayName="",email=""){
  if(!data.access_token||!data.refresh_token)throw Error("Confirm your email address before signing in.");
  current={token:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+(data.expires_in||3600)*1000,provider:"email",
   email:data.user?.email||email,displayName:displayName||data.user?.user_metadata?.display_name||data.user?.user_metadata?.full_name||""};
  await storeSession(current);emit()
 },
 async getFreshToken(){return renewSession()},
 async signOut(){current=null;await storeSession(null);emit()}
};
export type News={news_id:string;title:string;summary:string;full_summary:string;category:string;publisher:string;original_url:string;image_url:string;source_published_at:string;country:string;language:string};
export async function api<T>(path:string,options:RequestInit={},authenticated=false):Promise<T>{
 if(!API_URL)throw Error("Set EXPO_PUBLIC_API_URL to the HTTPS Node API gateway. Do not use Apps Script directly.");
 const session=auth.currentUser;if(authenticated&&!session)throw Error("Sign in to continue");
 const token=authenticated?await auth.getFreshToken():null;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const result=await fetch(API_URL+path,{...options,headers:{"Content-Type":"application/json",...(authenticated&&session?{Authorization:"Bearer "+token}:{}),...(options.headers||{})},signal:controller.signal});const response=await result.json();if(!result.ok||!response.ok)throw Error(response.error||"Request failed");return response.data as T}finally{clearTimeout(timer)}
}
export const json=(value:unknown)=>({method:"POST",body:JSON.stringify(value)});
export const put=(value:unknown)=>({method:"PUT",body:JSON.stringify(value)});
