import {initializeApp,getApps,getApp} from "firebase/app";
import {initializeAuth,getAuth,getReactNativePersistence,type User} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
const config={apiKey:process.env.EXPO_PUBLIC_FIREBASE_API_KEY||"",authDomain:process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN||"",projectId:process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID||"",appId:process.env.EXPO_PUBLIC_FIREBASE_APP_ID||""};
const fb=getApps().length?getApp():initializeApp(config);
export const auth=(()=>{try{return initializeAuth(fb,{persistence:getReactNativePersistence(AsyncStorage)})}catch{return getAuth(fb)}})();
const apiUrl=process.env.EXPO_PUBLIC_API_URL||"";
export type News={news_id:string;title:string;summary:string;full_summary:string;category:string;publisher:string;original_url:string;image_url:string;source_published_at:string;country:string;language:string};
export async function api<T>(path:string,options:RequestInit={},authenticated=false):Promise<T>{
 if(!apiUrl)throw Error("API URL not configured");
 const user=auth.currentUser;
 if(authenticated&&!user)throw Error("Sign in required");
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try {
  const token=authenticated?await user!.getIdToken():null;
  const res=await fetch(apiUrl+path,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{}),...(options.headers||{})},signal:controller.signal});
  const body=await res.json();
  if(!res.ok||!body.ok)throw Error(body.error||"Something went wrong");
  return body.data as T;
 }finally{clearTimeout(timeout);}
}
export const json=(value:unknown)=>({method:"POST",body:JSON.stringify(value)});
export const put=(value:unknown)=>({method:"PUT",body:JSON.stringify(value)});
export const signedIn=(u:User|null)=>Boolean(u);
