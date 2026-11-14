import React,{useCallback,useState} from "react";
import {RefreshControl,ScrollView,Text,TouchableOpacity,View} from "react-native";
import {router,useFocusEffect} from "expo-router";
import {ArrowLeft,Bell,ChefHat,ChevronRight,Newspaper,RefreshCw,ShieldCheck} from "lucide-react-native";
import {api,auth} from "../src/client";
import {Background,Brand,GoodSideLoader,Surface} from "../src/components";
import {colors} from "../src/theme";

type RecordEntry={
 notification_id?:string;
 news_id?:string;
 scheduled_at?:string;
 sent_at?:string;
 delivery_status?:string;
 error_code?:string;
};
type Tab="all"|"news"|"recipes";
const ink="#301E2C";
const typeOf=(row:RecordEntry)=>String(row.news_id||"").startsWith("recipe:")?"recipes":"news";
function formatWhen(input?:string){
 if(!input)return "Time unavailable";
 const date=new Date(input);
 return Number.isFinite(date.getTime())?date.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}):"Time unavailable";
}
function receipt(status?:string){
 const value=String(status||"").toLowerCase();
 if(value==="provider_accepted"||value==="accepted")return "Accepted by push service";
 if(value==="pending")return "Waiting for push confirmation";
 if(value==="error"||value==="failed"||value==="rejected")return "Could not send";
 if(value==="delivered")return "Delivery confirmed by push service";
 return value?value.replace(/_/g," "):"Status unknown";
}
function fallbackTitle(row:RecordEntry){
 const id=String(row.news_id||"");
 if(!id)return "Notification";
 if(id.startsWith("recipe:")){
  const slug=id.slice(7).replace(/^(dessert|pasta|brazilian|american|middle-eastern)-/,"");
  return slug.split("-").filter(Boolean).map(v=>v[0].toUpperCase()+v.slice(1)).join(" ")||"Recipe";
 }
 return "Good news story";
}
function rowsOf(raw:unknown):RecordEntry[]{
 if(Array.isArray(raw))return raw as RecordEntry[];
 if(raw&&typeof raw==="object"){
  const object=raw as {items?:unknown;notifications?:unknown;rows?:unknown};
  const value=object.items??object.notifications??object.rows;
  if(Array.isArray(value))return value as RecordEntry[];
 }
 return [];
}
export default function NotificationHistory(){
 const [items,setItems]=useState<RecordEntry[]>([]);
 const [titles,setTitles]=useState<Record<string,string>>({});
 const [tab,setTab]=useState<Tab>("all");
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");
 const [loggedIn,setLoggedIn]=useState(true);
 const load=useCallback(async()=>{
  setRefreshing(true);setError("");
  try{
   await auth.restore();
   if(!auth.currentUser){setLoggedIn(false);setItems([]);return}
   setLoggedIn(true);
   const raw=await api<unknown>("/me/notifications",{},true);
   const sorted=rowsOf(raw).filter(v=>v&&v.news_id).sort((a,b)=>
    Date.parse(b.scheduled_at||b.sent_at||"")-Date.parse(a.scheduled_at||a.sent_at||"")
   ).slice(0,100);
   setItems(sorted);
   // Resolve readable titles where possible. Never block history on a failing article lookup.
   const ids=[...new Set(sorted.slice(0,30).map(v=>v.news_id).filter((v):v is string=>Boolean(v)))];
   const names:Record<string,string>={};
   for(let i=0;i<ids.length;i+=5){
    const batch=ids.slice(i,i+5);
    const resolved=await Promise.all(batch.map(async id=>{
     try{
      const path=id.startsWith("recipe:")?"/recipes/"+encodeURIComponent(id.slice(7)):"/news/"+encodeURIComponent(id);
      const entry=await api<{title?:string}>(path);
      return [id,String(entry?.title||"")] as const;
     }catch{return [id,""] as const}
    }));
    for(const [id,title] of resolved)if(title)names[id]=title;
   }
   setTitles(names);
  }catch(e){setError(e instanceof Error?e.message:"Could not load notification history.")}
  finally{setLoading(false);setRefreshing(false)}
 },[]);
 useFocusEffect(useCallback(()=>{void load()},[load]));
 const shown=items.filter(row=>tab==="all"||typeOf(row)===tab);
 const open=(row:RecordEntry)=>{
  const id=String(row.news_id||"");
  if(!id)return;
  if(id.startsWith("recipe:"))router.push({pathname:"/recipe/[id]",params:{id:id.slice(7)}});
  else router.push({pathname:"/article/[id]",params:{id}});
 };
 return <Background>
  <ScrollView
   contentContainerStyle={{paddingHorizontal:20,paddingTop:65,paddingBottom:170,width:"100%",maxWidth:700,alignSelf:"center"}}
   refreshControl={<RefreshControl refreshing={refreshing&&!loading} onRefresh={()=>void load()} tintColor={colors.orange}/>}
  >
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={()=>router.canGoBack()?router.back():router.replace("/profile")}
    style={{alignSelf:"flex-start",backgroundColor:"rgba(255,255,255,.7)",borderColor:"white",borderWidth:1,borderRadius:20,paddingVertical:10,paddingHorizontal:17,flexDirection:"row",alignItems:"center",gap:8}}>
    <ArrowLeft size={19} color={ink}/><Text style={{color:ink,fontWeight:"800"}}>Back</Text>
   </TouchableOpacity>
   <View style={{marginTop:24,alignItems:"center"}}><Brand small/></View>
   <View style={{marginTop:23,flexDirection:"row",alignItems:"center",gap:12}}>
    <View style={{width:50,height:50,borderRadius:20,backgroundColor:"#FFE4B6",alignItems:"center",justifyContent:"center"}}>
     <Bell size={24} color="#AC602C"/>
    </View>
    <View style={{flex:1}}>
     <Text style={{fontSize:25,fontWeight:"900",color:ink}}>Notification History</Text>
     <Text style={{color:"#765968",marginTop:3}}>Your good news and recipe alerts</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh history" onPress={()=>void load()}
     style={{padding:11,borderRadius:20,backgroundColor:"rgba(255,255,255,.65)"}}>
     <RefreshCw size={20} color={ink}/>
    </TouchableOpacity>
   </View>
   <Surface style={{marginTop:22,paddingVertical:15}}>
    <View style={{flexDirection:"row",alignItems:"flex-start",gap:10}}>
     <ShieldCheck size={20} color="#A35B29"/>
     <Text style={{flex:1,fontSize:13,lineHeight:20,color:"#654F5D"}}>
      This history records attempts from The Good Side server. "Accepted by push service" does not confirm the alert appeared on your iPhone.
     </Text>
    </View>
   </Surface>
   <View style={{flexDirection:"row",gap:8,marginTop:21,marginBottom:17}}>
    {([["all","All"],["news","Good News"],["recipes","Recipes"]] as const).map(([id,label])=>
     <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{selected:tab===id}} onPress={()=>setTab(id)}
      style={{paddingHorizontal:15,paddingVertical:11,borderRadius:20,borderWidth:1,borderColor:tab===id?"#CD874A":"#EAD7D3",backgroundColor:tab===id?"#F6BE8E":"rgba(255,255,255,.75)"}}>
      <Text style={{fontSize:13,color:ink,fontWeight:tab===id?"900":"600"}}>{label}</Text>
     </TouchableOpacity>
    )}
   </View>
   {loading?<GoodSideLoader label="Loading your notification history…"/>:
    !loggedIn?<Surface><Text style={{color:ink,fontWeight:"800",fontSize:17}}>Sign in to see your history</Text>
     <TouchableOpacity onPress={()=>router.push("/auth")} style={{paddingVertical:14}}><Text style={{color:"#A85D29",fontWeight:"800"}}>Log in or create an account →</Text></TouchableOpacity>
    </Surface>:
    error?<Surface><Text style={{color:"#9C3535",fontWeight:"800"}}>Couldn't load your history</Text><Text style={{color:ink,marginTop:7}}>{error}</Text>
      <TouchableOpacity onPress={()=>void load()} style={{marginTop:14}}><Text style={{color:"#A85D29",fontWeight:"800"}}>Try again</Text></TouchableOpacity>
     </Surface>:
    shown.length===0?<Surface>
     <Text style={{color:ink,fontWeight:"900",fontSize:17}}>No {tab==="all"?"notifications":tab==="news"?"good-news alerts":"recipe alerts"} recorded yet</Text>
     <Text style={{color:"#765968",lineHeight:22,marginTop:8}}>New server notification attempts will appear here after their scheduled time.</Text>
    </Surface>:
    <>
     <Text style={{fontSize:13,color:"#765968",marginBottom:12}}>{shown.length} {shown.length===1?"notification":"notifications"} · newest first</Text>
     {shown.map((row,index)=>{
      const recipe=typeOf(row)==="recipes";
      const title=titles[String(row.news_id)]||fallbackTitle(row);
      const status=receipt(row.delivery_status);
      const failure=/error|failed|rejected/i.test(String(row.delivery_status||""));
      return <TouchableOpacity key={String(row.notification_id||row.news_id||index)+":"+index} activeOpacity={.8}
       accessibilityRole="button" accessibilityLabel={"Open "+title}
       onPress={()=>open(row)} style={{marginBottom:11}}>
       <Surface style={{paddingVertical:16}}>
        <View style={{flexDirection:"row",alignItems:"flex-start",gap:13}}>
         <View style={{width:45,height:45,borderRadius:18,backgroundColor:recipe?"#FFE2CB":"#FFF0B9",justifyContent:"center",alignItems:"center"}}>
          {recipe?<ChefHat size={23} color="#A45B2A"/>:<Newspaper size={23} color="#A45B2A"/>}
         </View>
         <View style={{flex:1}}>
          <Text style={{color:"#986033",fontSize:11,fontWeight:"900",letterSpacing:.5}}>{recipe?"FOOD & RECIPES":"GOOD NEWS"}</Text>
          <Text style={{color:ink,fontSize:16,fontWeight:"800",marginTop:4,lineHeight:22}} numberOfLines={3}>{title}</Text>
          <Text style={{color:"#725C69",fontSize:12,marginTop:8}}>{formatWhen(row.scheduled_at||row.sent_at)}</Text>
          <Text style={{color:failure?"#A43838":"#76606D",fontSize:12,marginTop:5,fontWeight:"700"}}>{status}</Text>
         </View>
         <ChevronRight size={20} color="#8D6C78" style={{marginTop:16}}/>
        </View>
       </Surface>
      </TouchableOpacity>
     })}
    </>}
  </ScrollView>
 </Background>;
}
