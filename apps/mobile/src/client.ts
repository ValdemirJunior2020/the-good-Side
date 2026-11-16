import {Platform} from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {emailAuth,type EmailTokenResponse} from "./emailAuth";
const API_URL=process.env.EXPO_PUBLIC_API_URL||"";
const KEY="goodside_google_session"; // Retain existing storage key for migration.
export type Session={token:string;email:string;displayName:string;provider?:"google"|"email"|"apple";refreshToken?:string;expiresAt?:number};
let current:Session|null=null;
let loaded=false;
const listeners=new Set<(session:Session|null)=>void>();
function emit(){for(const listener of listeners)listener(current)}
async function storeSession(session:Session|null){
 if(Platform.OS==="web"){if(session)await AsyncStorage.setItem(KEY,JSON.stringify(session));else await AsyncStorage.removeItem(KEY)}
 else if(session)await SecureStore.setItemAsync(KEY,JSON.stringify(session));
 else await SecureStore.deleteItemAsync(KEY);
}
let refreshing:Promise<string|null>|null=null;
function refreshInvalid(error:unknown){
 const msg=error instanceof Error?error.message.toLowerCase():"";
 return /invalid refresh token|refresh token not found|refresh_token_not_found|refresh token already used|session not found|invalid_grant/.test(msg);
}
// Deduplicate concurrent refreshes: rotating a refresh token more than once can invalidate the session.
async function renewSession(force=false):Promise<string|null>{
 if(!current)return null;
 if(current.provider!=="email"&&current.provider!=="apple")return current.token;
 if(!current.refreshToken)return current.token;
 if(!force&&current.expiresAt&&Date.now()<current.expiresAt-90_000)return current.token;
 if(refreshing)return refreshing;
 refreshing=(async()=>{
  const old=current;
  if(!old?.refreshToken)return null;
  try{
   const data=await emailAuth.refresh(old.refreshToken);
   if(!data.access_token||!data.refresh_token)throw Error("Could not refresh your account.");
   // Do not overwrite a session if the user signed out or switched accounts while the request was in flight.
   if(current!==old)return current?.token||null;
   current={...old,token:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+(data.expires_in||3600)*1000};
   await storeSession(current);
   // Refreshing credentials is not a profile change: avoid reloading in-progress preference edits.
   return current.token;
  }catch(error){
   // An offline device or temporary auth-server error is NOT a reason to delete stored credentials.
   if(refreshInvalid(error))throw Error("Please sign in again to reconnect your account.");
   throw Error("Couldn't connect to your account. Check your connection and retry.");
  }
 })();
 try{return await refreshing}finally{refreshing=null}
}
export const auth={
 get currentUser(){return current},
 subscribe(fn:(s:Session|null)=>void){listeners.add(fn);fn(current);return()=>{listeners.delete(fn)}},
 async restore(){
  if(loaded)return;loaded=true;
  const initialSession=current;
  try{
   const value=Platform.OS==="web"?await AsyncStorage.getItem(KEY):await SecureStore.getItemAsync(KEY);
   // Never replace a freshly signed-in user with a stale in-flight restore.
   if(value&&current===initialSession)current=JSON.parse(value) as Session;
  }catch{
   // Storage read failed: don't delete credentials or silently sign the user out.
  }
  emit();
  // Refresh independently so a temporarily unreachable auth server doesn't erase the session.
  if(current?.provider==="email"||current?.provider==="apple")void renewSession().catch(()=>{});
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
 async signInWithApple(data:EmailTokenResponse,displayName=""){
  if(!data.access_token||!data.refresh_token)throw Error("Apple sign-in did not create a session.");
  current={token:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+(data.expires_in||3600)*1000,provider:"apple",
   email:data.user?.email||"",displayName:displayName||data.user?.user_metadata?.display_name||data.user?.user_metadata?.full_name||""};
  await storeSession(current);emit();
 },
 async getFreshToken(force=false){return renewSession(force)},
 async signOut(){current=null;await storeSession(null);emit()}
};
export type News={news_id:string;title:string;summary:string;full_summary:string;category:string;publisher:string;original_url:string;image_url:string;source_published_at:string;country:string;language:string};
export async function api<T>(path:string,options:RequestInit={},authenticated=false):Promise<T>{
 if(!API_URL)throw Error("Set EXPO_PUBLIC_API_URL to the HTTPS Node API gateway. Do not use Apps Script directly.");
 if(authenticated&&!auth.currentUser)throw Error("Sign in to continue");
 const request=async(token:string|null):Promise<{status:number;body:any}>=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const result=await fetch(API_URL+path,{...options,headers:{"Content-Type":"application/json",...(authenticated&&token?{Authorization:"Bearer "+token}:{}),...(options.headers||{})},signal:controller.signal});
   return {status:result.status,body:await result.json()};
  }finally{clearTimeout(timer)}
 };
 const requestToken=authenticated?await auth.getFreshToken():null;
 const first=await request(requestToken);
 if(first.status!==401||!authenticated){
  if(first.status>=400||!first.body.ok)throw Error(first.body.error||"Request failed");
  return first.body.data as T;
 }
 // If the access token expired between checks, refresh and retry exactly once.
 if(auth.currentUser?.provider==="email"||auth.currentUser?.provider==="apple"){
  // Another request may already have refreshed the rotating token.
  // Reuse that newer token instead of invalidating it with a second refresh.
  const fresh=auth.currentUser?.token&&auth.currentUser.token!==requestToken
   ?auth.currentUser.token:await auth.getFreshToken(true);
  const retry=await request(fresh);
  if(retry.status>=400||!retry.body.ok)throw Error(retry.body.error||"Couldn't save your settings. Please retry.");
  return retry.body.data as T;
 }
 // Google OAuth ID tokens cannot be silently renewed by this authentication flow.
 throw Error("Please reconnect your Google account to save changes.");
}
export const json=(value:unknown)=>({method:"POST",body:JSON.stringify(value)});
export const put=(value:unknown)=>({method:"PUT",body:JSON.stringify(value)});
