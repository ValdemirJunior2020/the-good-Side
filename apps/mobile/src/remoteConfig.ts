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

export async function clearPersonalAvatar(token:string):Promise<void>{
 const r=await fetch(ROOT+"?route=my-avatar",{method:"DELETE",headers:{Authorization:"Bearer "+token}});
 const response=await r.json() as {ok:boolean;error?:string};
 if(!r.ok||!response.ok)throw Error(response.error||"Unable to clear custom avatar");
}
