import React from "react";
import {StyleSheet,View} from "react-native";
import Svg,{Defs,LinearGradient as SvgLinearGradient,RadialGradient,Stop,Rect,Path,Circle,Line} from "react-native-svg";

// Lightweight, offline-safe sunrise artwork, designed for the Profile reference.
// It deliberately contains no touch targets and sits behind all interactive content.
export default function SunriseBackdrop(){
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <Svg width="100%" height="100%" viewBox="0 0 400 840" preserveAspectRatio="xMidYMid slice">
   <Defs>
    <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
     <Stop offset="0" stopColor="#EACDE7"/>
     <Stop offset="21%" stopColor="#FFE3D5"/>
     <Stop offset="39%" stopColor="#FFCFB1"/>
     <Stop offset="67%" stopColor="#F2C6CA"/>
     <Stop offset="1" stopColor="#F0D4E5"/>
    </SvgLinearGradient>
    <RadialGradient id="glow" cx="30%" cy="39%" rx="70%" ry="45%">
     <Stop offset="0" stopColor="#FFF9B3" stopOpacity={0.96}/>
     <Stop offset="25%" stopColor="#FFE2A1" stopOpacity={0.57}/>
     <Stop offset="1" stopColor="#FFE2B8" stopOpacity="0"/>
    </RadialGradient>
    <RadialGradient id="sun" cx="50%" cy="50%" rx="50%" ry="50%">
     <Stop offset="0" stopColor="#FFFFFF"/>
     <Stop offset="38%" stopColor="#FFF6C7"/>
     <Stop offset="1" stopColor="#FFD574" stopOpacity={0.1}/>
    </RadialGradient>
    <SvgLinearGradient id="far" x1="0" y1="0" x2="0" y2="1">
     <Stop offset="0" stopColor="#A59CB7" stopOpacity={0.82}/>
     <Stop offset="1" stopColor="#E6B5C5" stopOpacity={0.60}/>
    </SvgLinearGradient>
    <SvgLinearGradient id="near" x1="0" y1="0" x2="0" y2="1">
     <Stop offset="0" stopColor="#A78EAC" stopOpacity={0.57}/>
     <Stop offset="1" stopColor="#F0C1C5" stopOpacity={0.05}/>
    </SvgLinearGradient>
    <SvgLinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
     <Stop offset="0" stopColor="#E8B8C2" stopOpacity={0.23}/>
     <Stop offset="50%" stopColor="#F7C6BC" stopOpacity={0.55}/>
     <Stop offset="1" stopColor="#F0D3E5" stopOpacity={0.94}/>
    </SvgLinearGradient>
   </Defs>
   <Rect width="400" height="840" fill="url(#sky)"/>
   <Rect width="400" height="680" fill="url(#glow)"/>
   <Path d="M0 359 L45 331 L98 352 L154 303 L211 333 L288 286 L344 321 L400 293 V710 H0 Z" fill="url(#far)"/>
   <Path d="M0 395 L53 364 L113 383 L187 342 L240 362 L310 320 L400 372 V740 H0 Z" fill="#C5A4B9" opacity={0.56}/>
   <Path d="M0 430 L65 405 L122 418 L184 383 L229 409 L293 385 L354 413 L400 395 V780 H0 Z" fill="url(#near)"/>
   <Path d="M0 472 C68 426 108 469 169 449 C237 421 287 476 400 426 V840 H0 Z" fill="url(#fade)"/>
   <Circle cx="91" cy="335" r="98" fill="url(#glow)"/>
   <Line x1="91" y1="270" x2="91" y2="403" stroke="#FFF5C8" strokeOpacity={0.34} strokeWidth="2"/>
   <Line x1="25" y1="335" x2="155" y2="335" stroke="#FFF5C8" strokeOpacity={0.32} strokeWidth="2"/>
   <Line x1="39" y1="284" x2="143" y2="385" stroke="#FFF5C8" strokeOpacity={0.27} strokeWidth="2"/>
   <Line x1="40" y1="383" x2="145" y2="285" stroke="#FFF5C8" strokeOpacity={0.28} strokeWidth="2"/>
   <Circle cx="91" cy="335" r="28" fill="url(#sun)"/>
  </Svg>
 </View>;
}
