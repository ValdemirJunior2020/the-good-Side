import {Platform} from "react-native";
import * as SecureStore from "expo-secure-store";
const API_URL=process.env.EXPO_PUBLIC_API_URL||"";
const KEY="goodside_google_session";
export type Session={token:string;email:string;displayName:string};
let current:Session|null=null;
let loaded=false;
const listeners=new Set<(session:Session|null)=>void>();
function emit(){for(const listener of listeners)listener(current)}
export const auth={
 get currentUser(){return current},
 subscribe(fn:(s:Session|null)=>void){listeners.add(fn);fn(current);return()=>{listeners.delete(fn)}},
 async restore(){if(loaded)return;loaded=true;try{if(Platform.OS!=="web"){const value=await SecureStore.getItemAsync(KEY);if(value)current=JSON.parse(value)}}catch{current=null}emit()},
 async signIn(token:string,user:{email:string;displayName:string}){current={token,email:user.email,displayName:user.displayName};if(Platform.OS!=="web")await SecureStore.setItemAsync(KEY,JSON.stringify(current));emit()},
 async signOut(){current=null;if(Platform.OS!=="web")await SecureStore.deleteItemAsync(KEY);emit()}
};
export type News={news_id:string;title:string;summary:string;full_summary:string;category:string;publisher:string;original_url:string;image_url:string;source_published_at:string;country:string;language:string};
export async function api<T>(path:string,options:RequestInit={},authenticated=false):Promise<T>{
 if(!API_URL)throw Error("Set EXPO_PUBLIC_API_URL to the HTTPS Node API gateway. Do not use Apps Script directly.");
 const session=auth.currentUser;if(authenticated&&!session)throw Error("Sign in with Google first");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const result=await fetch(API_URL+path,{...options,headers:{"Content-Type":"application/json",...(authenticated&&session?{Authorization:"Bearer "+session.token}:{}),...(options.headers||{})},signal:controller.signal});const response=await result.json();if(!result.ok||!response.ok)throw Error(response.error||"Request failed");return response.data as T}finally{clearTimeout(timer)}
}
export const json=(value:unknown)=>({method:"POST",body:JSON.stringify(value)});
export const put=(value:unknown)=>({method:"PUT",body:JSON.stringify(value)});
