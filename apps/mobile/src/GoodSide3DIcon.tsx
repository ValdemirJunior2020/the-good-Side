import React from "react";
import Svg,{Defs,LinearGradient,RadialGradient,Stop,Ellipse,Circle,Path,Rect,G} from "react-native-svg";

export type GoodSideTab="Home"|"Discover"|"Food"|"Saved"|"You";
export default function GoodSide3DIcon({name,size=54}:{name:GoodSideTab,size?:number}){
 const key=name.toLowerCase();
 return <Svg width={size} height={size} viewBox="0 0 90 90">
 <Defs>
  <LinearGradient id={key+"gem"} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF2BF"/><Stop offset=".23" stopColor="#FFB92A"/><Stop offset=".57" stopColor="#D67A12"/><Stop offset=".8" stopColor="#F8B52E"/><Stop offset="1" stopColor="#8B3F17"/></LinearGradient>
  <RadialGradient id={key+"earth"} cx="34%" cy="22%" rx="68%" ry="78%"><Stop offset="0" stopColor="#DDF7FF"/><Stop offset=".31" stopColor="#4CB5D8"/><Stop offset=".7" stopColor="#2262A3"/><Stop offset="1" stopColor="#1B365D"/></RadialGradient>
  <LinearGradient id={key+"green"} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#D1E995"/><Stop offset=".6" stopColor="#4B9E65"/><Stop offset="1" stopColor="#176B60"/></LinearGradient>
  <LinearGradient id={key+"cream"} x1="0" y1="0" x2=".9" y2="1"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset=".45" stopColor="#F6ECDD"/><Stop offset=".8" stopColor="#D3BCA5"/><Stop offset="1" stopColor="#AC8776"/></LinearGradient>
  <RadialGradient id={key+"heart"} cx="28%" cy="17%" rx="78%" ry="82%"><Stop offset="0" stopColor="#FF9DB0"/><Stop offset=".3" stopColor="#DC405B"/><Stop offset=".72" stopColor="#AF1B3A"/><Stop offset="1" stopColor="#65142C"/></RadialGradient>
  <LinearGradient id={key+"person"} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#E9F0FF"/><Stop offset=".29" stopColor="#9DADD6"/><Stop offset=".60" stopColor="#6176AE"/><Stop offset="1" stopColor="#384C86"/></LinearGradient>
  <RadialGradient id={key+"shine"} cx="30%" cy="10%" rx="65%" ry="75%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity=".88"/><Stop offset=".60" stopColor="#FFFFFF" stopOpacity=".1"/><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0"/></RadialGradient>
 </Defs>
 <Ellipse cx="46" cy="80" rx="27" ry="5" fill="#705474" opacity=".16"/>
 {name==="Home"&&<G>
  <Path d="M45 8 L68 18 L76 43 L64 69 L40 78 L17 63 L13 39 L25 17 Z" fill={"url(#"+key+"gem)"} stroke="#BD7430" strokeWidth="1.3"/>
  <Path d="M45 8 L41 28 L25 17 Z" fill="#FFF6C4" opacity=".73"/><Path d="M45 8 L68 18 L57 30 L41 28 Z" fill="#FFD37B" opacity=".66"/>
  <Path d="M17 63 L40 78 L41 28 L13 39 Z" fill="#A6531A" opacity=".41"/><Path d="M68 18 L76 43 L57 30 Z" fill="#FEE3A8" opacity=".47"/>
  <Path d="M25 17 L41 28 L57 30 L64 69 L40 78 L41 28 L13 39" fill="none" stroke="#FFF3B9" strokeOpacity=".45" strokeWidth="1.2"/>
  <Ellipse cx="34" cy="24" rx="13" ry="20" fill={"url(#"+key+"shine)"} transform="rotate(-29 34 24)"/>
  <Path d="M39 39 L50 31 L62 43 L50 61 L34 58 Z" fill="#FFE48D" opacity=".41"/>
 </G>}
 {name==="Discover"&&<G>
  <Circle cx="44" cy="44" r="32" fill={"url(#"+key+"earth)"} stroke="#D8E6FA" strokeWidth="1.7"/>
  <Path d="M19 27 L28 20 L40 25 L46 35 L41 42 L35 40 L31 54 L22 50 L16 41 Z" fill={"url(#"+key+"green)"}/>
  <Path d="M49 18 L61 22 L69 33 L62 42 L55 40 L50 49 L45 42 L50 34 L43 27 Z" fill={"url(#"+key+"green)"}/>
  <Path d="M50 49 L65 46 L74 55 L64 68 L55 71 L48 62 Z" fill={"url(#"+key+"green)"}/>
  <Circle cx="44" cy="44" r="32" fill={"url(#"+key+"shine)"} opacity=".57"/>
  <Circle cx="68" cy="22" r="14" fill="#E6EFF5" stroke="#7E99B1" strokeWidth="2"/><Circle cx="68" cy="22" r="10" fill="#F9FCFF" stroke="#B0C3D1"/>
  <Path d="M68 13 V31 M59 22 H77 M68 15 L74 22 L68 29 L62 22 Z" stroke="#6686A0" strokeWidth="1.4" fill="none"/><Path d="M67 22 L70 17 L69 24 Z" fill="#E95A59"/>
 </G>}
 {name==="Food"&&<G>
  <Path d="M24 49 C16 42 18 29 28 27 C29 11 49 8 56 22 C68 19 79 31 71 43 C68 48 62 50 56 48 L56 61 L25 61 Z" fill={"url(#"+key+"cream)"} stroke="#CAB7A5" strokeWidth="1.5"/>
  <Path d="M25 56 L57 56 L55 70 Q41 76 27 70 Z" fill="#E4D4C5" stroke="#B6A28E" strokeWidth="1.5"/>
  <Path d="M22 41 Q30 29 38 37 M41 26 Q49 17 58 28 M56 41 Q64 33 70 37" stroke="#FFFDF5" opacity=".77" strokeWidth="4" fill="none" strokeLinecap="round"/>
  <Path d="M27 66 Q41 72 55 65" stroke="#FFF6E9" strokeWidth="2" fill="none"/>
  <Path d="M38 57 L53 72" stroke="#D98136" strokeWidth="4" strokeLinecap="round"/><Path d="M53 57 L37 73" stroke="#4A9F93" strokeWidth="4" strokeLinecap="round"/>
  <Ellipse cx="36" cy="26" rx="10" ry="7" fill="#FFFFFF" opacity=".35"/>
 </G>}
 {name==="Saved"&&<G>
  <Path d="M45 76 C30 64 12 49 12 32 C12 14 34 9 45 27 C56 9 78 14 78 32 C78 49 60 64 45 76 Z" fill={"url(#"+key+"heart)"} stroke="#8B2140" strokeWidth="2" strokeLinejoin="round"/>
  <Path d="M45 72 C30 60 17 47 17 33 C17 21 34 16 45 33 C56 16 73 21 73 33 C73 47 60 61 45 72 Z" fill={"url(#"+key+"shine)"} opacity=".30"/>
  <Path d="M20 31 C23 21 34 19 40 29" stroke="#FFD8DD" strokeOpacity=".75" strokeWidth="5" strokeLinecap="round" fill="none"/>
  <Path d="M47 31 C58 18 68 23 71 31" stroke="#FA98AC" opacity=".57" strokeWidth="3" strokeLinecap="round" fill="none"/>
 </G>}
 {name==="You"&&<G>
  <Path d="M18 74 Q18 51 36 48 L36 44 Q27 37 29 26 C31 8 55 10 58 26 Q60 38 52 44 L52 48 Q71 51 73 74 Z" fill={"url(#"+key+"person)"} stroke="#586BA1" strokeWidth="1.5"/>
  <Ellipse cx="44" cy="27" rx="15" ry="18" fill={"url(#"+key+"person)"}/>
  <Path d="M34 48 L43 56 L54 48 L63 55 L50 72 L38 72 L25 54 Z" fill="#9BABD0" opacity=".75"/>
  <Path d="M35 15 Q44 9 50 17" stroke="#F3F7FF" strokeWidth="3.5" opacity=".6" fill="none"/>
  <Path d="M22 71 Q25 57 35 54" stroke="#E6EEFF" strokeWidth="3" opacity=".56" fill="none"/>
  <Circle cx="68" cy="65" r="11" fill="#FFCF50" stroke="#F4A519" strokeWidth="1.3"/>
  <Circle cx="68" cy="65" r="5.5" fill="#FFE999"/><Path d="M68 51 V55 M68 75 V79 M54 65 H58 M78 65 H82 M58 55 L61 58 M75 72 L78 75 M78 55 L75 58 M61 72 L58 75" stroke="#FFA319" strokeWidth="2" strokeLinecap="round"/>
 </G>}
 </Svg>
}