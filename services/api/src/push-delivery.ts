/**
 * Expo push ticket receipt ledger. Tickets are NOT device delivery proof.
 * Data is only accessible to the backend's Supabase service role.
 */
type ReceiptRow={ticket_id:string;idempotency_key:string;user_id:string;device_id:string;created_at:string};
function config(){
 const url=process.env.SUPABASE_URL?.replace(/\/$/,"");
 const modern=process.env.SUPABASE_SECRET_KEY?.trim();
 const fallback=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
 if(modern&&!modern.startsWith("sb_secret_"))throw Error("Push ledger requires a server-only secret key");
 const key=modern||fallback;
 if(!url||!key)throw Error("Supabase push receipt ledger not configured");
 const legacy=!key.startsWith("sb_secret_");
 if(legacy){
  try{const payload=JSON.parse(Buffer.from(key.split(".")[1],"base64url").toString("utf8"));if(payload.role!=="service_role")throw Error("wrong role")}
  catch{throw Error("Push ledger requires a service_role JWT or sb_secret_ key")}
 }
 return {url,key,legacy};
}
async function db(path:string,init:RequestInit={}):Promise<any>{
 const {url,key,legacy}=config();
 const response=await fetch(url+"/rest/v1/push_delivery_receipts"+path,{
  ...init,
  headers:{apikey:key,...(legacy?{Authorization:"Bearer "+key}:{}),...(init.body?{"content-type":"application/json"}:{}),...(init.headers||{})},
  signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error("Push ledger HTTP "+response.status);
 const body=await response.text();return body?JSON.parse(body):null;
}
export async function recordPushTicket(ticketId:string,key:string,userId:string,deviceId:string){
 if(!/^[a-zA-Z0-9-]{12,128}$/.test(ticketId))throw Error("Invalid Expo push ticket ID");
 await db("?on_conflict=ticket_id",{
  method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
  body:JSON.stringify({ticket_id:ticketId,idempotency_key:key,user_id:userId,device_id:deviceId,status:"pending"})
 });
}
let busy=false;
export async function pollPushReceipts(onResult:(row:ReceiptRow,status:"provider_accepted"|"error",errorCode:string)=>Promise<void>){
 if(busy)return;
 busy=true;
 try{
  const cutoff=new Date(Date.now()-90000).toISOString();
  const rows=await db("?select=ticket_id,idempotency_key,user_id,device_id,created_at&status=eq.pending&created_at=lt."+encodeURIComponent(cutoff)+"&order=created_at.asc&limit=80") as ReceiptRow[];
  if(!Array.isArray(rows)||!rows.length)return;
  const response=await fetch("https://exp.host/--/api/v2/push/getReceipts",{
   method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ids:rows.map(r=>r.ticket_id)}),
   signal:AbortSignal.timeout(20000)
  });
  if(!response.ok)throw Error("Expo push receipt HTTP "+response.status);
  const payload=await response.json() as any;
  const receipts=payload?.data||{};
  for(const row of rows){
   const result=receipts[row.ticket_id];
   if(!result)continue; // Expo may not have processed this ticket yet.
   const status=result.status==="ok"?"provider_accepted":"error";
   const errorCode=status==="error"?String(result.details?.error||"push_provider_error").slice(0,150):"";
   await db("?ticket_id=eq."+encodeURIComponent(row.ticket_id),{
    method:"PATCH",headers:{Prefer:"return=minimal"},
    body:JSON.stringify({status,error_code:errorCode,checked_at:new Date().toISOString()})
   });
   try{await onResult(row,status,errorCode)}catch(e){console.error("[push] Receipt sheet sync failed",e instanceof Error?e.message:"unknown")}
  }
 }finally{busy=false}
}
