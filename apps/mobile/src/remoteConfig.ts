// Read-only public config from the administrator-controlled Supabase service.
// No privileged keys or admin operations are available from the mobile app.
const ROOT="https://tqdqekxvisgmotibjiwb.supabase.co/functions/v1/goodside-admin";
export type PublicSetting={key:string;value:string};
export type GalleryAvatar={avatar_id:string;label:string;image_url:string;credit:string;active?:boolean;sort_order?:number};
async function get<T>(route:string,token?:string):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const r=await fetch(ROOT+"?route="+encodeURIComponent(route),{headers:token?{Authorization:"Bearer "+token}:{},signal:controller.signal});
  const data=await r.json() as {ok:boolean;data:T;error?:string};
  if(!r.ok||!data.ok)throw Error(data.error||"Unable to retrieve remote settings");
  return data.data;
 }finally{clearTimeout(timer)}
}
export async function getPublicSettings():Promise<Record<string,string>>{
 const rows=await get<PublicSetting[]>("public-settings");
 return Object.fromEntries(rows.map(r=>[r.key,r.value]));
}
export async function getPublicAvatars():Promise<GalleryAvatar[]>{
 return get<GalleryAvatar[]>("public-avatars");
}
export async function getPersonalAvatar(token:string):Promise<string|null>{
 const value=await get<{image_url:string|null}>("my-avatar",token);
 return value.image_url;
}

export async function savePersonalAvatar(token:string,avatarId:string):Promise<{avatar_id:string;image_url:string}>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
 try{
  const r=await fetch(ROOT+"?route=my-avatar",{
   method:"POST",
   headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
   body:JSON.stringify({avatar_id:avatarId}),
   signal:controller.signal
  });
  const response=await r.json() as {ok:boolean;data?:{avatar_id:string;image_url:string};error?:string};
  if(!r.ok||!response.ok||!response.data?.image_url)throw Error(response.error||"Unable to save your avatar");
  return response.data;
 }catch(error){
  if(controller.signal.aborted)throw Error("The avatar service timed out. Please try again.");
  throw error;
 }finally{clearTimeout(timer)}
}

export async function clearPersonalAvatar(token:string):Promise<void>{
 const r=await fetch(ROOT+"?route=my-avatar",{method:"DELETE",headers:{Authorization:"Bearer "+token}});
 const response=await r.json() as {ok:boolean;error?:string};
 if(!r.ok||!response.ok)throw Error(response.error||"Unable to clear custom avatar");
}

export async function syncManagedProfile(token:string,display_name:string):Promise<void>{
 const response=await fetch(ROOT+"?route=my-profile",{
  method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
  body:JSON.stringify({display_name:display_name.slice(0,80)})
 });
 if(!response.ok)throw Error("Admin profile synchronization unavailable");
}
