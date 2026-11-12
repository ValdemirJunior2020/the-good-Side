import React,{useEffect,useMemo,useState} from "react";
const ENDPOINT="https://tqdqekxvisgmotibjiwb.supabase.co/functions/v1/goodside-admin";
type Member={user_id:string;email:string;display_name:string;avatar_id?:string;account_status?:string;created_at?:string;last_login_at?:string};
type Override={user_id:string;image_url:string};
type Avatar={avatar_id:string;label:string;image_url:string;credit:string;active:boolean;sort_order:number};
type Setting={key:string;value:string;updated_at?:string};
type Audit={admin_email:string;action:string;target:string;occurred_at:string};
type Section="users"|"avatars"|"settings"|"audit";
const defaults:Record<string,string>={welcome_message:"Real stories. Brighter perspectives.",support_email:"infojr.83@gmail.com",default_notification_time:"12:00",signup_enabled:"true",news_feed_enabled:"true"};
const explanations:Record<string,string>={
 welcome_message:"Welcome text displayed in the app when remote settings are loaded",
 support_email:"Support email displayed on the Profile screen",
 default_notification_time:"Suggested starting time for new notification preferences (does not override existing preferences)",
 signup_enabled:"Controls whether the email registration button is shown in the mobile app (not a global Auth-provider shutdown)",
 news_feed_enabled:"Controls whether the mobile Home feed presents articles (does not delete news or interrupt scheduled pushes)"
};
async function managementApi<T>(token:string,route:string,options:RequestInit={}):Promise<T>{
 const resp=await fetch(ENDPOINT+"?route="+encodeURIComponent(route),{...options,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json",...(options.headers||{})}});
 const obj=await resp.json() as {ok:boolean;data:T;error?:string};
 if(!resp.ok||!obj.ok)throw Error(obj.error||"Unable to complete request");
 return obj.data;
}
export function Management({token}:{token:string}){
 const [section,setSection]=useState<Section>("users"),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [members,setMembers]=useState<Member[]>([]),[overrides,setOverrides]=useState<Override[]>([]),[avatars,setAvatars]=useState<Avatar[]>([]),[settings,setSettings]=useState<Setting[]>([]),[audit,setAudit]=useState<Audit[]>([]);
 const [search,setSearch]=useState(""),[picked,setPicked]=useState(""),[customUrl,setCustomUrl]=useState(""),[selectedAvatar,setSelectedAvatar]=useState("");
 const [avatarForm,setAvatarForm]=useState({avatar_id:"",label:"",image_url:"",credit:"",sort_order:"100",active:true});
 const [changes,setChanges]=useState<Record<string,string>>({});
 const selected=members.find(u=>u.user_id===picked);
 const users=useMemo(()=>members.filter(u=>(u.display_name+" "+u.email+" "+u.user_id).toLowerCase().includes(search.toLowerCase())).slice(0,100),[members,search]);
 const call=<T,>(route:string,init:RequestInit={})=>managementApi<T>(token,route,init);
 const reload=async(which=section)=>{
  setLoading(true);setError("");
  try{
   if(which==="users"){const d=await call<{users:Member[];overrides:Override[]}>("users");setMembers(d.users);setOverrides(d.overrides)}
   if(which==="avatars")setAvatars(await call<Avatar[]>("avatars"));
   if(which==="settings"){const d=await call<Setting[]>("settings");setSettings(d);setChanges(Object.fromEntries(d.map(x=>[x.key,x.value])))}
   if(which==="audit")setAudit(await call<Audit[]>("audit"));
  }catch(e){setError(String(e))}finally{setLoading(false)}
 };
 useEffect(()=>{void reload(section)},[section,token]);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError("");setNotice("");try{await fn();setNotice("Saved successfully.")}catch(e){setError(String(e))}finally{setBusy(false)}};
 const assign=()=>run(async()=>{
  if(!selected)throw Error("Select a user first");
  const image_url=customUrl.trim();
  if(!image_url.startsWith("https://"))throw Error("An HTTPS avatar image URL is required");
  if(!window.confirm("Assign this image to "+selected.email+"? This affects their profile only."))return;
  await call("users",{method:"PUT",body:JSON.stringify({user_id:selected.user_id,avatar_url:image_url})});
  await reload("users");
 });
 const clear=()=>run(async()=>{
  if(!selected||!window.confirm("Remove the custom avatar override for "+selected.email+"?"))return;
  await call("users",{method:"PUT",body:JSON.stringify({user_id:selected.user_id,clear_avatar:true})});
  setCustomUrl("");await reload("users");
 });
 const saveAvatar=()=>run(async()=>{
  if(!avatarForm.avatar_id||!avatarForm.label.trim()||!avatarForm.image_url.startsWith("https://"))throw Error("Provide ID, label and HTTPS image URL");
  await call("avatars",{method:"POST",body:JSON.stringify({...avatarForm,sort_order:Number(avatarForm.sort_order)||100})});
  setAvatarForm({avatar_id:"",label:"",image_url:"",credit:"",sort_order:"100",active:true});
  await reload("avatars");
 });
 const disableAvatar=(id:string)=>run(async()=>{
  if(!window.confirm("Hide "+id+" from new gallery selections? Existing user references will remain."))return;
  await call("avatars&id="+encodeURIComponent(id),{method:"DELETE"});await reload("avatars");
 });
 const saveSetting=(key:string)=>run(async()=>{
  if(!window.confirm("Save "+key+"?"))return;
  await call("settings",{method:"PUT",body:JSON.stringify({key,value:changes[key]??""})});await reload("settings");
 });
 return <div style={{display:"grid",gap:18}}>
  <header><h2>App Management</h2><p className="description">Manage users, avatar artwork, app presentation settings and the admin audit log. This is separate from the news editorial tools.</p></header>
  <div className="actions" style={{flexWrap:"wrap",gap:8}}>
   {([["users","Users"],["avatars","Avatar catalog"],["settings","App settings"],["audit","Audit log"]] as const).map(([key,label])=>
    <button type="button" className={section===key?"primary":"soft"} key={key} onClick={()=>setSection(key)}>{label}</button>)}
   <button type="button" className="soft" disabled={loading} onClick={()=>void reload()}>↻ Refresh</button>
  </div>
  {loading&&<p className="hint">Loading records…</p>}{error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
  {section==="users"&&<>
   <section className="panel form-panel"><h3>Members ({members.length})</h3>
    <p className="hint">Includes users in the app profile table and verified-email accounts registered with Supabase. Admins cannot see passwords.</p>
    <label>Search by name, email or user ID<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…"/></label>
    <label>Choose an account<select value={picked} onChange={e=>{setPicked(e.target.value);const a=overrides.find(o=>o.user_id===e.target.value);setCustomUrl(a?.image_url||"");setSelectedAvatar("")}}>
     <option value="">Select a user</option>{users.map(u=><option key={u.user_id} value={u.user_id}>{u.display_name||"Member"} · {u.email||u.user_id}</option>)}
    </select></label>
    {selected&&<div className="source-preview"><strong>{selected.display_name||selected.email}</strong><p className="hint">Account: {selected.user_id}</p><p>{selected.email}</p>
     <label>Custom avatar URL for this user<input type="url" value={customUrl} onChange={e=>setCustomUrl(e.target.value)} placeholder="https://example.com/avatar.png"/></label>
     {customUrl.startsWith("https://")&&<img src={customUrl} alt="Avatar preview" style={{height:100,width:100,objectFit:"contain",borderRadius:20,background:"#fff"}}/>}
     <p className="hint">Only this member's profile picture is changed. The shared avatar gallery is unaffected.</p>
     <div className="actions"><button disabled={busy||!customUrl.trim()} onClick={assign}>Assign avatar URL</button>
      <button className="soft" disabled={busy} onClick={clear}>Clear custom avatar</button></div>
    </div>}
   </section>
  </>}
  {section==="avatars"&&<>
   <div className="panel form-panel"><h3>Avatar gallery · Create / Update</h3>
    <p className="hint">Add new choices or update existing URLs. Deactivation hides images from the catalog without deleting user data. Use only artwork you have rights to display.</p>
    <div className="two"><label>ID<input value={avatarForm.avatar_id} onChange={e=>setAvatarForm({...avatarForm,avatar_id:e.target.value})} placeholder="sun-avatar-02"/></label><label>Label<input value={avatarForm.label} onChange={e=>setAvatarForm({...avatarForm,label:e.target.value})}/></label></div>
    <label>Image URL<input type="url" value={avatarForm.image_url} onChange={e=>setAvatarForm({...avatarForm,image_url:e.target.value})} placeholder="https://..."/></label>
    <div className="two"><label>Image credit / rights<input value={avatarForm.credit} onChange={e=>setAvatarForm({...avatarForm,credit:e.target.value})}/></label><label>Sort order<input type="number" value={avatarForm.sort_order} onChange={e=>setAvatarForm({...avatarForm,sort_order:e.target.value})}/></label></div>
    <label className="radio"><input type="checkbox" checked={avatarForm.active} onChange={e=>setAvatarForm({...avatarForm,active:e.target.checked})}/>Active in gallery</label>
    <button disabled={busy} onClick={saveAvatar}>Save avatar</button>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
    {avatars.map(a=><div className="panel" key={a.avatar_id} style={{padding:14}}>
     <img src={a.image_url} alt={a.label} style={{display:"block",height:95,width:"100%",objectFit:"contain",background:"#fff",borderRadius:14}}/>
     <strong>{a.label}</strong><p className="hint" style={{wordBreak:"break-all",fontSize:11}}>{a.avatar_id}</p><p className="hint">{a.active?"Active":"Inactive"}</p>
     <div className="actions"><button className="soft" onClick={()=>setAvatarForm({avatar_id:a.avatar_id,label:a.label,image_url:a.image_url,credit:a.credit||"",sort_order:String(a.sort_order||100),active:a.active})}>Edit</button>
     {a.active&&<button className="soft" onClick={()=>disableAvatar(a.avatar_id)}>Deactivate</button>}</div>
    </div>)}
   </div>
  </>}
  {section==="settings"&&<>
   <div className="panel form-panel"><h3>App presentation settings</h3><p className="hint">These are controlled settings, not raw database access. Existing user preferences are not overwritten.</p>
    {settings.map(item=><div key={item.key} style={{padding:"16px 0",borderBottom:"1px solid #e8d8da"}}>
     <label>{item.key.replace(/_/g," ")}<input value={changes[item.key]??item.value} onChange={e=>setChanges({...changes,[item.key]:e.target.value})}/></label>
     <p className="hint">{explanations[item.key]||"Configuration"} </p>
     <div className="actions"><button disabled={busy||changes[item.key]===item.value} onClick={()=>saveSetting(item.key)}>Save change</button>
     <button className="soft" disabled={busy} onClick={()=>setChanges({...changes,[item.key]:defaults[item.key]||item.value})}>Restore default value</button></div>
    </div>)}
   </div>
  </>}
  {section==="audit"&&<div className="panel"><h3>Recent management changes</h3><p className="hint">Audit shows the acting admin, action, target and time. Passwords and Google tokens are never recorded here.</p>
   <div style={{overflowX:"auto"}}><table><thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th></tr></thead><tbody>{audit.map((a,i)=><tr key={a.occurred_at+i}><td>{new Date(a.occurred_at).toLocaleString()}</td><td>{a.admin_email}</td><td>{a.action}</td><td>{a.target}</td></tr>)}</tbody></table></div>
   {!audit.length&&<p>No changes recorded yet.</p>}
  </div>}
 </div>;
}
