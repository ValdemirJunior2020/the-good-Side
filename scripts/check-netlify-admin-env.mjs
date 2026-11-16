// Build-time guard for the Netlify Command Center. Never print environment values.
// Vite bundles VITE_* variables into public JavaScript. Only public client IDs and HTTPS endpoints belong there.
const api=process.env.VITE_API_URL?.trim();
const client=process.env.VITE_GOOGLE_WEB_CLIENT_ID?.trim();
const problems=[];
if(!api)problems.push("VITE_API_URL is missing");
else{
 try{
  const url=new URL(api);
  if(url.protocol!=="https:" && !(url.protocol==="http:"&&["localhost","127.0.0.1"].includes(url.hostname)))problems.push("VITE_API_URL must use HTTPS for deployed Admin");
  if(url.username||url.password)problems.push("VITE_API_URL must not contain credentials");
 }catch{problems.push("VITE_API_URL is not a valid URL");}
}
if(!client)problems.push("VITE_GOOGLE_WEB_CLIENT_ID is missing");
else if(!client.endsWith(".apps.googleusercontent.com"))problems.push("VITE_GOOGLE_WEB_CLIENT_ID does not look like a Google web OAuth client ID");
if(problems.length){
 for(const error of problems)console.error("[Admin build configuration] "+error);
 console.error("Set these as Netlify site Build environment variables, not in the repository.");
 process.exit(1);
}
console.log("[Admin build configuration] API URL and Google OAuth web client ID are present and structurally valid. Values were not printed.");
