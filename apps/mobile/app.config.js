// Preserve app.json; register the owner's optional custom notification sound only when present.
const fs=require("node:fs");
const path=require("node:path");
const base=require("./app.json").expo;
const soundPath="./assets/ding.wav";
const sounds=fs.existsSync(path.join(__dirname,"assets","ding.wav"))?[soundPath]:[];
module.exports={expo:{
 ...base,
 userInterfaceStyle:"automatic",
 extra:{...(base.extra||{}),hasSignatureSound:sounds.length>0},
 plugins:base.plugins.map(plugin=>Array.isArray(plugin)&&plugin[0]==="expo-notifications"
  ?["expo-notifications",{...plugin[1],...(sounds.length?{sounds}:{})}]
  :plugin)
}};
