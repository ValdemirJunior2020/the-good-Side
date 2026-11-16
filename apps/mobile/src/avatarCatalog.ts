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
 {avatar_id:"cute-jay",label:"Jay · Sketch",image_url:"https://api.dicebear.com/10.x/notionists/png?seed=JayWarm&size=256&backgroundColor=e4f2d8",credit:"DiceBear / style creators"},
 {avatar_id:"external-sun-smile",label:"Happy Smiling Sun",image_url:"https://img.magnific.com/free-vector/happy-smiling-cartoon-sun-illustration_1308-179974.jpg?semt=ais_hybrid&w=740&q=80",credit:"Magnific — rights unverified"},
 {avatar_id:"external-developer",label:"Developer Avatar",image_url:"https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes-thumbnail.png",credit:"PNGWing — rights unverified"},
 {avatar_id:"external-glasses-girl",label:"Girl with Glasses",image_url:"https://img.magnific.com/premium-vector/smiling-avatar-girl-stylish-dark-clothes-with-eyeglasses_1138841-20988.jpg?semt=ais_hybrid&w=740&q=80",credit:"Magnific Premium — rights unverified"},
 {avatar_id:"external-color-avatar",label:"Colorful Avatar",image_url:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0zvh7iqPlWrUjHH6QAn1aX0-kIDZVjzKMI6sPOPa7qn2PyFrV_8ICdFLD&s=10",credit:"Google thumbnail — rights unverified"},
 {avatar_id:"external-blonde-girl",label:"Smiling Blonde Girl",image_url:"https://img.magnific.com/free-vector/smiling-blonde-girl-vector-portrait_1308-167291.jpg",credit:"Magnific — rights unverified"}
];
