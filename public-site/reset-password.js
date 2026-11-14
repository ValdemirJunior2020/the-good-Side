
(function(){
const base="https://tqdqekxvisgmotibjiwb.supabase.co",key="sb_publishable_FcW-IRdeyyBEmwxSAZZCXA_1T0qJIzo";
const params=new URLSearchParams(location.hash.slice(1));const query=new URLSearchParams(location.search);
const token=params.get("access_token");const kind=params.get("type");const err=params.get("error_description")||query.get("error_description");
const status=document.getElementById("status"),form=document.getElementById("reset"),btn=document.getElementById("save");
if(token&&["signup","email"].includes(kind)){form.style.display="none";history.replaceState(null,"",location.pathname);status.textContent="Your email is confirmed! Return to The Good Side app and log in with your email and password.";return}
if(!token||kind!=="recovery"){form.style.display="none";status.textContent=err||"This reset link is invalid or expired. Request another link from the app.";return}
history.replaceState(null,"",location.pathname);
form.addEventListener("submit",async function(ev){
ev.preventDefault();const password=document.getElementById("password").value;
if(password!==document.getElementById("confirm").value){status.textContent="Passwords do not match.";return}
btn.disabled=true;status.textContent="Updating password…";
try{
const r=await fetch(base+"/auth/v1/user",{method:"PUT",headers:{"Content-Type":"application/json",apikey:key,Authorization:"Bearer "+token},body:JSON.stringify({password})});
const result=await r.json();if(!r.ok)throw Error(result.msg||result.message||result.error_description||"Update failed");
form.style.display="none";status.textContent="Password updated. Return to The Good Side app and log in using your email and new password.";
}catch(e){status.textContent=String(e.message||e);btn.disabled=false}
});
})();
