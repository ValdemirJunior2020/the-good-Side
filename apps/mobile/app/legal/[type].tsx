import React from "react";
import {Linking,Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {LinearGradient} from "expo-linear-gradient";
import {ArrowLeft,ExternalLink} from "lucide-react-native";

// Exact public policy wording captured from the website on 2026-11-12.
// Update these sections whenever public-site/{privacy,terms,delete-account}.html changes.
const policies={
  "privacy": {
    "title": "Privacy Policy",
    "lead": "Effective November 12, 2026 · How The Good Side handles account and app information.",
    "sections": [
      {
        "heading": "Who we are",
        "body": "The Good Side is a positive-news discovery website and iOS app. For privacy questions, contact infojr.83@gmail.com. Our website is thegoodsidenews.com."
      },
      {
        "heading": "Information we process",
        "body": "When you sign up or sign in, we process account identifiers, your email address, display name, and sign-in provider. If you use Google sign-in, Google may supply basic profile information. We process selected news interests, saved stories and recipes, avatar choices, notification preferences, preferred notification times and timezone. For opted-in push notifications, we process device push tokens and delivery status information. Our hosting and authentication systems may also process technical network, security, diagnostic and service-request records."
      },
      {
        "heading": "Why we use your information",
        "body": "We use these details to sign you in securely, operate the app, personalize your positive-news feed, restore saved choices, send notifications you request, respond to support requests, and protect the service against misuse. News browsing does not require permission for push notifications."
      },
      {
        "heading": "Providers and publishers",
        "body": "We use services such as Supabase for account authentication and supporting data, Render for app APIs, Netlify for website hosting, Google for optional identity sign-in, and Expo/Apple for optional push delivery. News may contain links to independent publishers, and images may be fetched from external HTTPS locations. When you open an external publisher, that publisher's own privacy practices apply. We do not control third-party websites."
      },
      {
        "heading": "Your choices",
        "body": "You can edit your account preferences, notification schedule, saved stories and avatar in the app. You can disable push notifications in iOS Settings. You may request access to account information, correction or deletion by contacting our support email."
      },
      {
        "heading": "Deletion and retention",
        "body": "Where account deletion is available, open the app's You → Data & Security → Delete My Account and Data option or visit our account-deletion instructions. Account deletion is intended to remove your Good Side account and associated app records. It does not delete an independent Google account or external publisher account. Some operational logs, support correspondence, backups or records may remain for limited periods where required to operate systems, protect security or comply with law. If deletion fails, contact support for manual assistance."
      },
      {
        "heading": "Security",
        "body": "We use authenticated services, access controls and HTTPS where available, but no internet service can guarantee perfect security. Do not send passwords or login codes in support emails."
      },
      {
        "heading": "Children and international usage",
        "body": "The Good Side is not presented as a child-directed service. Service providers may process information in different countries based on their infrastructure. Additional requirements may apply to children or to users in particular regions."
      },
      {
        "heading": "Changes",
        "body": "We may revise this policy as product features or providers change. Updates will be posted here with a revised effective date. Questions: infojr.83@gmail.com."
      }
    ]
  },
  "terms": {
    "title": "Terms of Use",
    "lead": "Effective November 12, 2026 · Terms for using The Good Side.",
    "sections": [
      {
        "heading": "Using the service",
        "body": "The Good Side provides positive-news discovery, curated editorial summaries, links to source reporting, optional account features, and notification preferences. Content is for general information, not professional medical, legal, or investment advice. Features may change as the service develops."
      },
      {
        "heading": "Accounts",
        "body": "You are responsible for protecting your sign-in credentials and using the service lawfully. Do not attempt to access another user's data, interfere with our service, use automated abuse, or enter the private management systems without permission."
      },
      {
        "heading": "News and third-party content",
        "body": "Stories may be summarized and link to independent news publishers. Source articles, images, trademarks and publisher websites remain subject to the rights and rules of their respective owners. We do not guarantee that third-party reporting is complete or continuously accessible. Report any potential rights issue or correction request to support."
      },
      {
        "heading": "Notification preferences",
        "body": "Notifications are optional; operating-system permissions, connectivity, quiet hours and delivery services can affect when messages arrive. We cannot guarantee exact delivery at a particular minute."
      },
      {
        "heading": "Availability",
        "body": "The Good Side may suspend or modify features to address outages, security or abuse. We make reasonable efforts to keep the service available but cannot guarantee uninterrupted access."
      },
      {
        "heading": "Account deletion",
        "body": "See our account-deletion instructions or contact support if you need help."
      },
      {
        "heading": "Contact",
        "body": "Questions about these terms? Email infojr.83@gmail.com. These terms are subject to review against applicable laws before commercial distribution."
      }
    ]
  },
  "delete-account": {
    "title": "Delete Your Account",
    "lead": "Instructions for deleting your Good Side account and associated app data.",
    "sections": [
      {
        "heading": "Delete in the iOS app",
        "body": "Sign in, open You → Data & Security → Delete My Account and Data, and confirm the deletion request. The app requests deletion of your Good Side profile, preferences, saved stories and related records. An email sign-in identity is also scheduled for deletion through the authentication service; your separately managed Google identity is not affected."
      },
      {
        "heading": "Delete from the website",
        "body": "Sign in at My Account, scroll to Security & account → Delete my account and data, then confirm using the instructions shown there."
      },
      {
        "heading": "If something doesn't work",
        "body": "Send an email to infojr.83@gmail.com from the email associated with your account. We may need to verify the request to protect your account. Do not include your password or sign-in code."
      },
      {
        "heading": "What is and isn't deleted",
        "body": "The deletion feature is intended to remove your Good Side account and related profile and preference data. It does not delete your separate Google account, original publisher accounts, or Apple device settings. Operational records may be held for limited periods where security, backup or legal obligations require them. If a backend deletion fails, support can help finish the request."
      }
    ]
  }
} as const;
type LegalType=keyof typeof policies;
export default function LegalScreen(){
 const {type}=useLocalSearchParams<{type:string}>();
 const safe=useSafeAreaInsets();
 const key=(typeof type==="string"&&Object.prototype.hasOwnProperty.call(policies,type)?type:"privacy") as LegalType;
 const policy=policies[key];
 const goBack=()=>{if(router.canGoBack())router.back();else router.replace("/profile")};
 return <LinearGradient colors={["#FFF1DF","#F9DDD5","#ECD8EB"]} style={{flex:1}}>
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.page,{paddingTop:Math.max(safe.top,18)+14,paddingBottom:Math.max(safe.bottom,18)+155}]}>
   <Pressable accessibilityRole="button" accessibilityLabel="Back to Profile" onPress={goBack} style={styles.back}>
    <ArrowLeft color="#54362D" size={23}/><Text style={styles.backText}>Back to Profile</Text>
   </Pressable>
   <View style={styles.paper}>
    <Text style={styles.eyebrow}>THE GOOD SIDE · INFORMATION</Text>
    <Text accessibilityRole="header" style={styles.heading}>{policy.title}</Text>
    <Text style={styles.lead}>{policy.lead}</Text>
    {policy.sections.map(item=><View key={item.heading} style={styles.section}>
     <Text accessibilityRole="header" style={styles.sectionTitle}>{item.heading}</Text>
     <Text style={styles.body}>{item.body}</Text>
    </View>)}
    <Pressable accessibilityRole="link" accessibilityLabel="Open public policy website" style={styles.website} onPress={()=>void Linking.openURL("https://thegoodsidenews.com/"+key+".html")}>
     <ExternalLink size={17} color="#8B5032"/><Text style={styles.websiteText}>View official website version</Text>
    </Pressable>
   </View>
   <Pressable accessibilityRole="button" accessibilityLabel="Back to Profile" onPress={goBack} style={styles.bottomBack}><Text style={styles.bottomBackText}>← Back to Profile</Text></Pressable>
  </ScrollView>
 </LinearGradient>;
}
const styles=StyleSheet.create({
 page:{paddingHorizontal:18,width:"100%",maxWidth:690,alignSelf:"center"},
 back:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:9,backgroundColor:"rgba(255,255,255,.83)",borderWidth:1.5,borderColor:"#FFFFFF",borderRadius:26,minHeight:47,paddingHorizontal:18,marginBottom:20},
 backText:{fontWeight:"800",fontSize:15,color:"#54362D"},
 paper:{backgroundColor:"#FFFBF4",borderWidth:1,borderColor:"#E6CAB4",borderRadius:22,paddingHorizontal:21,paddingVertical:28,shadowColor:"#805341",shadowOpacity:.11,shadowRadius:18,shadowOffset:{width:0,height:6}},
 eyebrow:{letterSpacing:2.3,color:"#A16B43",fontWeight:"800",fontSize:11,marginBottom:12},
 heading:{fontFamily:"Georgia",fontWeight:"700",fontSize:38,color:"#30222A",marginBottom:16},
 lead:{fontSize:16,lineHeight:26,color:"#6B5056",marginBottom:14},
 section:{marginTop:21},
 sectionTitle:{fontFamily:"Georgia",fontWeight:"700",fontSize:23,lineHeight:30,color:"#30222A",marginBottom:9},
 body:{color:"#382C34",fontSize:15,lineHeight:25},
 website:{marginTop:30,flexDirection:"row",alignItems:"center",gap:10},
 websiteText:{fontSize:14,color:"#8B5032",fontWeight:"700",textDecorationLine:"underline"},
 bottomBack:{marginTop:20,alignItems:"center",justifyContent:"center",backgroundColor:"#FFFFFF",borderRadius:22,paddingVertical:17,borderWidth:1,borderColor:"#E6CAB4"},
 bottomBackText:{fontWeight:"800",color:"#54362D",fontSize:16}
});
