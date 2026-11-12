// Public avatar artwork catalog mirrored from the existing PROFILE_AVATARS sheet.
// These are only image references and display labels, never account information.
// The six entries marked inactive in the sheet are intentionally excluded.
export type AvatarCatalogItem={avatar_id:string;label:string;image_url:string;credit:string};
export const avatarCatalog:AvatarCatalogItem[]=[
 {avatar_id:"cute-mila",label:"Mila · Cartoon",image_url:"https://api.dicebear.com/10.x/adventurer/png?seed=MilaHappy&size=256&backgroundColor=ffd5dc",credit:"DiceBear / style creators"},
 {avatar_id:"cute-oliver",label:"Oliver · Cartoon",image_url:"https://api.dicebear.com/10.x/adventurer/png?seed=OliverSmiles&size=256&backgroundColor=c0e5ff",credit:"DiceBear / style creators"},
 {avatar_id:"cute-zoe",label:"Zoe · Cartoon",image_url:"https://api.dicebear.com/10.x/lorelei/png?seed=ZoeSunshine&size=256&backgroundColor=ffe0cc",credit:"DiceBear / style creators"},
 {avatar_id:"cute-leo",label:"Leo · Cartoon",image_url:"https://api.dicebear.com/10.x/lorelei/png?seed=LeoSunny&size=256&backgroundColor=d9e6ff",credit:"DiceBear / style creators"},
 {avatar_id:"cute-kiki",label:"Kiki · Chibi",image_url:"https://api.dicebear.com/10.x/big-ears/png?seed=KikiJoy&size=256&backgroundColor=fce7c8",credit:"DiceBear / style creators"},
 {avatar_id:"cute-poppy",label:"Poppy · Chibi",image_url:"https://api.dicebear.com/10.x/big-ears/png?seed=PoppyBloom&size=256&backgroundColor=fbd9f3",credit:"DiceBear / style creators"},
 {avatar_id:"cute-benny",label:"Benny · Cute",image_url:"https://api.dicebear.com/10.x/big-smile/png?seed=BennyLaugh&size=256&backgroundColor=c8f0e1",credit:"DiceBear / style creators"},
 {avatar_id:"cute-nina",label:"Nina · Cute",image_url:"https://api.dicebear.com/10.x/big-smile/png?seed=NinaSmile&size=256&backgroundColor=fce3c7",credit:"DiceBear / style creators"},
 {avatar_id:"cute-cloud",label:"Happy Cloud",image_url:"https://api.dicebear.com/10.x/fun-emoji/png?seed=CloudyJoy&size=256&backgroundColor=cdebf8",credit:"DiceBear / style creators"},
 {avatar_id:"cute-star",label:"Star Buddy",image_url:"https://api.dicebear.com/10.x/fun-emoji/png?seed=TwinkleStar&size=256&backgroundColor=fff0b8",credit:"DiceBear / style creators"},
 {avatar_id:"cute-pip",label:"Pip · Pixel",image_url:"https://api.dicebear.com/10.x/pixel-art/png?seed=PipPixel&size=256&backgroundColor=ffe5db",credit:"DiceBear / style creators"},
 {avatar_id:"cute-luna",label:"Luna · Pixel",image_url:"https://api.dicebear.com/10.x/pixel-art/png?seed=LunaPixel&size=256&backgroundColor=e6d8ff",credit:"DiceBear / style creators"},
 {avatar_id:"cute-robot",label:"Sunny Robot",image_url:"https://api.dicebear.com/10.x/bottts/png?seed=SunnyBot&size=256&backgroundColor=d7efff",credit:"DiceBear / style creators"},
 {avatar_id:"cute-peach",label:"Peach · Sketch",image_url:"https://api.dicebear.com/10.x/notionists/png?seed=PeachSketch&size=256&backgroundColor=fce0e8",credit:"DiceBear / style creators"},
 {avatar_id:"cute-jay",label:"Jay · Sketch",image_url:"https://api.dicebear.com/10.x/notionists/png?seed=JayWarm&size=256&backgroundColor=e4f2d8",credit:"DiceBear / style creators"}
];
