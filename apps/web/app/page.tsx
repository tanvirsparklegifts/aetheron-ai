"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AuthPanel from "./auth-panel";
import { Activity, ArrowUpRight, AudioLines, Bell, BrainCircuit, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp, Command, Compass, FileText, FolderKanban, Globe2, LockKeyhole, Menu, MessageSquare, Mic, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, TerminalSquare, Workflow, X } from "lucide-react";

const navigation = [{name:"Overview",icon:Compass},{name:"Conversations",icon:MessageSquare},{name:"My intelligence",icon:BrainCircuit},{name:"Projects",icon:FolderKanban},{name:"Research",icon:Globe2},{name:"Workflows",icon:Workflow},{name:"Knowledge",icon:FileText}];
const ideas = [{name:"Business brief",desc:"Turn an idea into a clear action plan",icon:BriefcaseBusiness},{name:"Deep research",desc:"Explore a topic with cited findings",icon:Globe2},{name:"Build something",desc:"Plan, design, and review code",icon:TerminalSquare}];
const voiceLanguages = [
 {code:"bn-BD",name:"বাংলা"},{code:"en-US",name:"English (US)"},{code:"en-GB",name:"English (UK)"},{code:"en-IN",name:"English (India)"},
 {code:"ar-SA",name:"العربية"},{code:"ur-PK",name:"اردو"},{code:"hi-IN",name:"हिन्दी"},{code:"es-ES",name:"Español"},{code:"es-MX",name:"Español (México)"},
 {code:"fr-FR",name:"Français"},{code:"de-DE",name:"Deutsch"},{code:"it-IT",name:"Italiano"},{code:"pt-BR",name:"Português (Brasil)"},{code:"pt-PT",name:"Português (Portugal)"},
 {code:"ru-RU",name:"Русский"},{code:"uk-UA",name:"Українська"},{code:"tr-TR",name:"Türkçe"},{code:"fa-IR",name:"فارسی"},{code:"he-IL",name:"עברית"},
 {code:"zh-CN",name:"中文 (简体)"},{code:"zh-TW",name:"中文 (繁體)"},{code:"yue-HK",name:"粵語"},{code:"ja-JP",name:"日本語"},{code:"ko-KR",name:"한국어"},
 {code:"id-ID",name:"Bahasa Indonesia"},{code:"ms-MY",name:"Bahasa Melayu"},{code:"th-TH",name:"ไทย"},{code:"vi-VN",name:"Tiếng Việt"},{code:"fil-PH",name:"Filipino"},
 {code:"ne-NP",name:"नेपाली"},{code:"si-LK",name:"සිංහල"},{code:"ta-IN",name:"தமிழ்"},{code:"te-IN",name:"తెలుగు"},{code:"ml-IN",name:"മലയാളം"},
 {code:"kn-IN",name:"ಕನ್ನಡ"},{code:"mr-IN",name:"मराठी"},{code:"gu-IN",name:"ગુજરાતી"},{code:"pa-IN",name:"ਪੰਜਾਬੀ"},{code:"or-IN",name:"ଓଡ଼ିଆ"},
 {code:"pl-PL",name:"Polski"},{code:"nl-NL",name:"Nederlands"},{code:"sv-SE",name:"Svenska"},{code:"no-NO",name:"Norsk"},{code:"da-DK",name:"Dansk"},
 {code:"fi-FI",name:"Suomi"},{code:"is-IS",name:"Íslenska"},{code:"el-GR",name:"Ελληνικά"},{code:"cs-CZ",name:"Čeština"},{code:"sk-SK",name:"Slovenčina"},
 {code:"hu-HU",name:"Magyar"},{code:"ro-RO",name:"Română"},{code:"bg-BG",name:"Български"},{code:"hr-HR",name:"Hrvatski"},{code:"sr-RS",name:"Српски"},
 {code:"sl-SI",name:"Slovenščina"},{code:"lt-LT",name:"Lietuvių"},{code:"lv-LV",name:"Latviešu"},{code:"et-EE",name:"Eesti"},{code:"ca-ES",name:"Català"},
 {code:"eu-ES",name:"Euskara"},{code:"gl-ES",name:"Galego"},{code:"af-ZA",name:"Afrikaans"},{code:"sw-KE",name:"Kiswahili"},{code:"am-ET",name:"አማርኛ"},
 {code:"zu-ZA",name:"isiZulu"},{code:"xh-ZA",name:"isiXhosa"},{code:"ha-NG",name:"Hausa"},{code:"yo-NG",name:"Yorùbá"},{code:"ig-NG",name:"Igbo"},
 {code:"km-KH",name:"ខ្មែរ"},{code:"lo-LA",name:"ລາວ"},{code:"my-MM",name:"မြန်မာ"},{code:"mn-MN",name:"Монгол"},{code:"ka-GE",name:"ქართული"},
 {code:"hy-AM",name:"Հայերեն"},{code:"az-AZ",name:"Azərbaycanca"},{code:"kk-KZ",name:"Қазақша"},{code:"uz-UZ",name:"Oʻzbekcha"},{code:"ps-AF",name:"پښتو"}
];
type Conversation = {id:string;title:string;updated_at:string};
type Memory = {id:string;memory:string;category:string;source:string;is_active:boolean;created_at:string;updated_at:string};
type Project = {id:string;name:string;description:string;status:"active"|"on_hold"|"completed"|"archived";created_at:string;updated_at:string};
type Task = {id:string;project_id:string;title:string;description:string;status:"todo"|"in_progress"|"done";priority:"low"|"medium"|"high";due_date:string|null};
type KnowledgeDocument = {id:string;title:string;source_name:string;content:string;is_active:boolean;created_at:string;updated_at:string};
type ResearchResult = {title:string;url:string;content:string;score:number|null;published_date:string|null};
type SpeechRecognitionResultLike = {isFinal:boolean;[index:number]:{transcript:string}};
type SpeechRecognitionEventLike = {resultIndex:number;results:ArrayLike<SpeechRecognitionResultLike>};
type SpeechRecognitionLike = {lang:string;interimResults:boolean;continuous:boolean;onresult:((event:SpeechRecognitionEventLike)=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
type SpeechRecognitionWindow = Window & {SpeechRecognition?:new()=>SpeechRecognitionLike;webkitSpeechRecognition?:new()=>SpeechRecognitionLike};

export default function Home(){
 const [session,setSession]=useState<Session|null>(null); const [authReady,setAuthReady]=useState(!supabase);
 useEffect(()=>{ if(!supabase)return; let active=true; supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setAuthReady(true);}}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setAuthReady(true);}}); return ()=>{active=false;subscription.unsubscribe();}; },[]);
 const [active,setActive]=useState("Overview"); const [prompt,setPrompt]=useState(""); const [menu,setMenu]=useState(false); const [voiceInputActive,setVoiceInputActive]=useState(false); const [voiceInputError,setVoiceInputError]=useState(""); const [voiceLanguage,setVoiceLanguage]=useState("bn-BD"); const [replyLanguage,setReplyLanguage]=useState("auto"); const [speakReplies,setSpeakReplies]=useState(false); const [recognition,setRecognition]=useState<SpeechRecognitionLike|null>(null);
 const [messages,setMessages]=useState<{role:"user"|"assistant";content:string}[]>([]);
 const [conversations,setConversations]=useState<Conversation[]>([]);
 const [currentConversationId,setCurrentConversationId]=useState<string|null>(null);
 const [historyLoading,setHistoryLoading]=useState(false); const [historySearch,setHistorySearch]=useState(""); const [historyActionId,setHistoryActionId]=useState<string|null>(null); const [historyError,setHistoryError]=useState("");
 const [loading,setLoading]=useState(false); const [chatError,setChatError]=useState("");
 const [memories,setMemories]=useState<Memory[]>([]); const [projects,setProjects]=useState<Project[]>([]); const [tasks,setTasks]=useState<Task[]>([]); const [projectError,setProjectError]=useState(""); const [projectBusy,setProjectBusy]=useState(false); const [knowledgeDocs,setKnowledgeDocs]=useState<KnowledgeDocument[]>([]); const [knowledgeBusy,setKnowledgeBusy]=useState(false); const [knowledgeError,setKnowledgeError]=useState(""); const [researchQuery,setResearchQuery]=useState(""); const [researchResults,setResearchResults]=useState<ResearchResult[]>([]); const [researchBusy,setResearchBusy]=useState(false); const [researchError,setResearchError]=useState(""); const [researchNotice,setResearchNotice]=useState(""); const [memoryDraft,setMemoryDraft]=useState(""); const [memoryCategory,setMemoryCategory]=useState("general"); const [memoryLoading,setMemoryLoading]=useState(false); const [memoryError,setMemoryError]=useState("");
 useEffect(()=>{
  if(!supabase||!session?.user.id)return;
  let active=true;
  (async()=>{
   const {data,error}=await supabase.from("conversations").select("id,title,updated_at").eq("user_id",session.user.id).eq("archived",false).order("updated_at",{ascending:false}).limit(30);
   if(active){if(error)setChatError("Could not load conversation history: "+error.message);else setConversations((data||[]) as Conversation[]);setHistoryLoading(false);}
  })();
  return ()=>{active=false;};
 },[session?.user.id]);
 useEffect(()=>{
  if(active!=="My intelligence"||!supabase||!session?.user.id)return;
  let alive=true;
  (async()=>{
   const {data,error}=await supabase.from("memories").select("id,memory,category,source,is_active,created_at,updated_at").eq("user_id",session.user.id).order("updated_at",{ascending:false}).limit(100);
   if(!alive)return;
   if(error)setMemoryError("Could not load saved memories: "+error.message);
   else setMemories((data||[]) as Memory[]);
   setMemoryLoading(false);
  })();
  return ()=>{alive=false;};
 },[active,session?.user.id]);
 useEffect(()=>{if(active!=="Knowledge"||!supabase||!session?.user.id)return;let alive=true;(async()=>{setKnowledgeBusy(true);setKnowledgeError("");const {data,error}=await supabase.from("knowledge_documents").select("id,title,source_name,content,is_active,created_at,updated_at").eq("user_id",session.user.id).order("updated_at",{ascending:false}).limit(100);if(alive){if(error)setKnowledgeError("Could not load knowledge documents: "+error.message);else setKnowledgeDocs((data||[]) as KnowledgeDocument[]);setKnowledgeBusy(false);}})();return()=>{alive=false;};},[active,session?.user.id]);
 const uploadKnowledgeFile=async(file?:File)=>{if(!file||!supabase||!session||knowledgeBusy)return;const allowed=/\.(txt|md|csv|json|log)$/i.test(file.name);if(!allowed){setKnowledgeError("Supported formats: .txt, .md, .csv, .json and .log.");return;}if(file.size>200000){setKnowledgeError("File is too large. Maximum size is 200 KB per text document.");return;}setKnowledgeBusy(true);setKnowledgeError("");try{const content=await file.text();if(!content.trim())throw new Error("This file is empty.");if(content.length>50000)throw new Error("Text content exceeds the 50,000-character limit.");const title=file.name.replace(/\.[^.]+$/,"").slice(0,180)||"Untitled document";const {data,error}=await supabase.from("knowledge_documents").insert({user_id:session.user.id,title,source_name:file.name,content}).select("id,title,source_name,content,is_active,created_at,updated_at").single();if(error)throw error;if(data)setKnowledgeDocs(previous=>[data as KnowledgeDocument,...previous]);}catch(error){setKnowledgeError(error instanceof Error?error.message:"Could not import this document.");}finally{setKnowledgeBusy(false);}};
 const toggleKnowledge=async(doc:KnowledgeDocument)=>{if(!supabase||!session||knowledgeBusy)return;setKnowledgeBusy(true);setKnowledgeError("");const {error}=await supabase.from("knowledge_documents").update({is_active:!doc.is_active}).eq("id",doc.id).eq("user_id",session.user.id);if(error)setKnowledgeError("Could not update document: "+error.message);else setKnowledgeDocs(previous=>previous.map(item=>item.id===doc.id?{...item,is_active:!doc.is_active}:item));setKnowledgeBusy(false);};
 const deleteKnowledge=async(doc:KnowledgeDocument)=>{if(!supabase||!session||knowledgeBusy||!window.confirm("Permanently delete this knowledge document?"))return;setKnowledgeBusy(true);setKnowledgeError("");const {error}=await supabase.from("knowledge_documents").delete().eq("id",doc.id).eq("user_id",session.user.id);if(error)setKnowledgeError("Could not delete document: "+error.message);else setKnowledgeDocs(previous=>previous.filter(item=>item.id!==doc.id));setKnowledgeBusy(false);};
 useEffect(()=>{if(active!=="Projects"||!supabase||!session?.user.id)return;let alive=true;(async()=>{setProjectBusy(true);setProjectError("");const {data:pd,error:pe}=await supabase.from("projects").select("id,name,description,status,created_at,updated_at").eq("user_id",session.user.id).order("updated_at",{ascending:false});if(pe){if(alive)setProjectError("Could not load projects: "+pe.message);setProjectBusy(false);return;}const ps=(pd||[]) as Project[];const {data:td,error:te}=ps.length?await supabase.from("tasks").select("id,project_id,title,description,status,priority,due_date").eq("user_id",session.user.id).order("created_at",{ascending:false}):{data:[],error:null};if(alive){setProjects(ps);if(te)setProjectError("Could not load tasks: "+te.message);else setTasks((td||[]) as Task[]);setProjectBusy(false);}})();return()=>{alive=false;};},[active,session?.user.id]);
 const createProject=async()=>{if(!supabase||!session||projectBusy)return;const name=window.prompt("Project name");if(name===null)return;const clean=name.trim();if(!clean||clean.length>120){setProjectError("Project name must be between 1 and 120 characters.");return;}setProjectBusy(true);setProjectError("");const {data,error}=await supabase.from("projects").insert({user_id:session.user.id,name:clean}).select("id,name,description,status,created_at,updated_at").single();if(error)setProjectError("Could not create project: "+error.message);else if(data)setProjects(prev=>[data as Project,...prev]);setProjectBusy(false);};
 const createTask=async(project:Project)=>{if(!supabase||!session||projectBusy)return;const title=window.prompt("Task title for "+project.name);if(title===null)return;const clean=title.trim();if(!clean||clean.length>200){setProjectError("Task title must be between 1 and 200 characters.");return;}setProjectBusy(true);setProjectError("");const {data,error}=await supabase.from("tasks").insert({project_id:project.id,user_id:session.user.id,title:clean}).select("id,project_id,title,description,status,priority,due_date").single();if(error)setProjectError("Could not create task: "+error.message);else if(data)setTasks(prev=>[data as Task,...prev]);setProjectBusy(false);};
 const updateTaskStatus=async(task:Task)=>{if(!supabase||!session||projectBusy)return;const status=task.status==="todo"?"in_progress":task.status==="in_progress"?"done":"todo";setProjectBusy(true);setProjectError("");const {error}=await supabase.from("tasks").update({status}).eq("id",task.id).eq("user_id",session.user.id);if(error)setProjectError("Could not update task: "+error.message);else setTasks(prev=>prev.map(t=>t.id===task.id?{...t,status}:t));setProjectBusy(false);};
 const deleteProject=async(project:Project)=>{if(!supabase||!session||projectBusy||!window.confirm("Delete this project and all its tasks?"))return;setProjectBusy(true);setProjectError("");const {error}=await supabase.from("projects").delete().eq("id",project.id).eq("user_id",session.user.id);if(error)setProjectError("Could not delete project: "+error.message);else{setProjects(prev=>prev.filter(p=>p.id!==project.id));setTasks(prev=>prev.filter(t=>t.project_id!==project.id));}setProjectBusy(false);};
 const openConversation=async(conversation:Conversation)=>{
  if(!supabase||loading||historyLoading)return;
  setHistoryLoading(true);setChatError("");setCurrentConversationId(conversation.id);setMessages([]);
  try{
   const {data,error}=await supabase.from("messages").select("role,content").eq("conversation_id",conversation.id).order("created_at",{ascending:true}).limit(100);
   if(error)throw error;
   setMessages((data||[]) as {role:"user"|"assistant";content:string}[]);
   setPrompt("");
  }catch(error){
   // Do not leave the previous conversation visible or attach a later send to a failed load.
   setMessages([]);setCurrentConversationId(null);
   setChatError(error instanceof Error?error.message:"Could not load this conversation.");
  }
  finally{setHistoryLoading(false);}
 };
 const renameConversation=async(conversation:Conversation)=>{
  if(!supabase||!session||historyActionId)return;
  const proposed=window.prompt("Rename this conversation",conversation.title);
  if(proposed===null)return;
  const title=proposed.trim();
  if(!title||title===conversation.title)return;
  if(title.length>120){setHistoryError("Conversation titles must be 120 characters or fewer.");return;}
  setHistoryActionId(conversation.id);setHistoryError("");
  const {error}=await supabase.from("conversations").update({title,updated_at:new Date().toISOString()}).eq("id",conversation.id).eq("user_id",session.user.id);
  if(error)setHistoryError("Could not rename conversation: "+error.message);
  else setConversations(previous=>previous.map(item=>item.id===conversation.id?{...item,title,updated_at:new Date().toISOString()}:item));
  setHistoryActionId(null);
 };
 const archiveConversation=async(conversation:Conversation)=>{
  if(!supabase||!session||historyActionId)return;
  if(!window.confirm("Archive this conversation? It will be hidden from the active history, but not deleted."))return;
  setHistoryActionId(conversation.id);setHistoryError("");
  const {error}=await supabase.from("conversations").update({archived:true,updated_at:new Date().toISOString()}).eq("id",conversation.id).eq("user_id",session.user.id);
  if(error)setHistoryError("Could not archive conversation: "+error.message);
  else{
   setConversations(previous=>previous.filter(item=>item.id!==conversation.id));
   if(currentConversationId===conversation.id){setCurrentConversationId(null);setMessages([]);}
  }
  setHistoryActionId(null);
 };
 const deleteConversation=async(conversation:Conversation)=>{
  if(!supabase||!session||historyActionId)return;
  if(!window.confirm("Permanently delete this conversation and all its messages? This cannot be undone."))return;
  setHistoryActionId(conversation.id);setHistoryError("");
  const {error}=await supabase.from("conversations").delete().eq("id",conversation.id).eq("user_id",session.user.id);
  if(error)setHistoryError("Could not delete conversation: "+error.message);
  else{
   setConversations(previous=>previous.filter(item=>item.id!==conversation.id));
   if(currentConversationId===conversation.id){setCurrentConversationId(null);setMessages([]);}
  }
  setHistoryActionId(null);
 };
 const apiUrl=(process.env.NEXT_PUBLIC_AETHERON_API_URL||"").replace(/\/$/,"");
 useEffect(()=>()=>{if(recognition){try{recognition.stop();}catch{}}if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();},[recognition]);
 const stopVoiceOutput=()=>{if(typeof window!=="undefined"&&"speechSynthesis" in window)window.speechSynthesis.cancel();};
 const speakReply=(value:string)=>{
  if(typeof window==="undefined"||!("speechSynthesis" in window)||!value.trim())return;
  window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(value);const speechLanguage=replyLanguage==="auto"?voiceLanguage:replyLanguage;utterance.lang=speechLanguage;utterance.rate=0.96;utterance.pitch=1;
  const prefix=speechLanguage.toLowerCase().split("-")[0];const voice=window.speechSynthesis.getVoices().find(item=>item.lang.toLowerCase().startsWith(prefix));if(voice)utterance.voice=voice;
  window.speechSynthesis.speak(utterance);
 };
 const startVoiceInput=()=>{
  setVoiceInputError("");const speechWindow=window as SpeechRecognitionWindow;const Recognition=speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition;
  if(!Recognition){setVoiceInputError("Speech input is not supported in this browser. Try an updated Chrome browser or type your message.");return;}
  if(voiceInputActive){recognition?.stop();setVoiceInputActive(false);return;}
  try{const instance=new Recognition();instance.lang=voiceLanguage;instance.interimResults=true;instance.continuous=false;
   instance.onresult=event=>{let transcript="";for(let index=event.resultIndex;index<event.results.length;index++){const result=event.results[index];if(result?.isFinal&&result[0]?.transcript)transcript+=result[0].transcript;}if(transcript.trim())setPrompt(previous=>previous?previous+" "+transcript.trim():transcript.trim());};
   instance.onerror=event=>{setVoiceInputError(event.error==="not-allowed"?"Microphone permission was denied. Allow microphone access in your browser settings.":"Voice input stopped: "+event.error+". You can continue by typing.");setVoiceInputActive(false);};
   instance.onend=()=>{setVoiceInputActive(false);setRecognition(null);};setRecognition(instance);instance.start();setVoiceInputActive(true);
  }catch{setVoiceInputError("Could not start the microphone. Check browser permission and try again.");setVoiceInputActive(false);}
 };
 const toggleReplySpeech=()=>{if(speakReplies){setSpeakReplies(false);stopVoiceOutput();return;}if(typeof window==="undefined"||!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){setVoiceInputError("Speech output is not supported in this browser.");return;}setSpeakReplies(true);};

 const submit=async(value=prompt)=>{
  const text=value.trim(); if(!text||loading||historyLoading)return;
  if(!apiUrl){setChatError("Cloud API URL is not configured yet. Deploy the Cloud API, then set NEXT_PUBLIC_AETHERON_API_URL in the GitHub Pages build environment.");return;}
  const next=[...messages,{role:"user" as const,content:text}].slice(-12);
  setMessages(next);setPrompt("");setChatError("");setLoading(true);
  try{
   const currentSession = session ?? (supabase ? (await supabase.auth.getSession()).data.session : null);
   if(!currentSession||!supabase) throw new Error("Please sign in again to continue.");
   let activeConversationId=currentConversationId;
   if(!activeConversationId){
    const {data:created,error:createError}=await supabase.from("conversations").insert({user_id:currentSession.user.id,title:text.slice(0,72)}).select("id,title,updated_at").single();
    if(createError||!created)throw createError||new Error("Could not create conversation.");
    activeConversationId=created.id;
    setCurrentConversationId(created.id);
    setConversations(previous=>[created as Conversation,...previous.filter(item=>item.id!==created.id)].slice(0,30));
   }
   const {error:saveUserError}=await supabase.from("messages").insert({conversation_id:activeConversationId,user_id:currentSession.user.id,role:"user",content:text});
   if(saveUserError)throw saveUserError;
   const response=await fetch(apiUrl+"/api/v1/chat",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+currentSession.access_token},body:JSON.stringify({messages:next,response_language:replyLanguage})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.detail||"AETHERON could not complete this request.");
   if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("The AI provider returned an empty reply.");
   const assistantMessage={role:"assistant" as const,content:data.reply};
   setMessages([...next,assistantMessage].slice(-12));
    if(speakReplies)speakReply(data.reply);
   const {error:saveAssistantError}=await supabase.from("messages").insert({conversation_id:activeConversationId,user_id:currentSession.user.id,role:"assistant",content:data.reply});
   if(saveAssistantError){setChatError("Reply received, but it could not be saved to history: "+saveAssistantError.message);return;}
   await supabase.from("conversations").update({updated_at:new Date().toISOString()}).eq("id",activeConversationId).eq("user_id",currentSession.user.id);
   setConversations(previous=>previous.map(item=>item.id===activeConversationId?{...item,updated_at:new Date().toISOString()}:item).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)));
  }catch(error){setChatError(error instanceof Error?error.message:"Connection failed. Please try again.");}
  finally{setLoading(false);}
 };
 const runResearch=async(event?:FormEvent<HTMLFormElement>)=>{event?.preventDefault();const query=researchQuery.trim();if(query.length<3||researchBusy)return;const apiUrl=(process.env.NEXT_PUBLIC_AETHERON_API_URL||"").replace(/\/$/,"");if(!apiUrl){setResearchError("Cloud API URL is not configured in the frontend build.");return;}setResearchBusy(true);setResearchError("");setResearchNotice("");setResearchResults([]);try{const currentSession=session??(supabase?(await supabase.auth.getSession()).data.session:null);if(!currentSession)throw new Error("Please sign in to use private research.");const response=await fetch(apiUrl+"/api/v1/research/search",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+currentSession.access_token},body:JSON.stringify({query})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.detail||"Research search failed.");const results=Array.isArray(data.results)?data.results as ResearchResult[]:[];setResearchResults(results);setResearchNotice(results.length?("Found "+results.length+" web sources. Check each source before relying on its claims."):"No matching sources were returned. Try a more specific query.");}catch(error){setResearchError(error instanceof Error?error.message:"Research search failed.");}finally{setResearchBusy(false);}};
 const saveMemory=async()=>{
  const value=memoryDraft.trim();if(!value||!supabase||!session)return;
  setMemoryLoading(true);setMemoryError("");
  const {data,error}=await supabase.from("memories").insert({user_id:session.user.id,memory:value,category:memoryCategory.trim()||"general",source:"user"}).select("id,memory,category,source,is_active,created_at,updated_at").single();
  if(error)setMemoryError("Could not save memory: "+error.message);
  else{setMemories(previous=>[data as Memory,...previous]);setMemoryDraft("");}
  setMemoryLoading(false);
 };
 const toggleMemory=async(item:Memory)=>{
  if(!supabase||!session)return;
  const {error}=await supabase.from("memories").update({is_active:!item.is_active}).eq("id",item.id).eq("user_id",session.user.id);
  if(error)setMemoryError("Could not update memory: "+error.message);
  else setMemories(previous=>previous.map(memory=>memory.id===item.id?{...memory,is_active:!memory.is_active}:memory));
 };
 const removeMemory=async(item:Memory)=>{
  if(!supabase||!session)return;
  const {error}=await supabase.from("memories").delete().eq("id",item.id).eq("user_id",session.user.id);
  if(error)setMemoryError("Could not delete memory: "+error.message);
  else setMemories(previous=>previous.filter(memory=>memory.id!==item.id));
 };
 if(!authReady) return <main className="auth-shell"><div className="auth-card">Loading secure workspace…</div></main>;
 if(!session) return <AuthPanel />;
 return <main className="app-shell">
  <aside className={`sidebar ${menu?"sidebar-open":""}`}>
   <div className="brand"><div className="brand-symbol">A<span/></div><div><b>AETHERON</b><small>THE AUTONOMOUS INTELLIGENCE</small></div><button className="close-menu" onClick={()=>setMenu(false)} aria-label="Close menu"><X size={18}/></button></div>
   <button className="workspace"><span className="avatar">T</span><span><b>Personal workspace</b><small>Owner edition</small></span><ChevronDown size={15}/></button>
   <button className="new-chat" onClick={()=>{setPrompt("");setMessages([]);setCurrentConversationId(null);setChatError("");setActive("Overview");setMenu(false)}}><Plus size={17}/> New conversation <kbd>⌘ K</kbd></button>
   <label className="nav-label">WORKSPACE</label><nav>{navigation.map(({name,icon:Icon})=><button key={name} onClick={()=>{setActive(name);setMenu(false)}} className={`nav-link ${active===name?"selected":""}`}><Icon size={17}/>{name}{name==="Projects"&&<span className="count">05</span>}</button>)}</nav>
   <div className="history-heading"><label className="nav-label history-label">RECENT CONVERSATIONS</label><button onClick={()=>{setActive("Conversations");setMenu(false)}}>View all</button></div><div className="history-list">{historyLoading&&conversations.length===0?<small className="history-empty">Loading history…</small>:conversations.length===0?<small className="history-empty">Your saved chats will appear here.</small>:conversations.map(conversation=><button key={conversation.id} className={"history-item "+(currentConversationId===conversation.id?"history-active":"")} onClick={()=>{openConversation(conversation);setActive("Overview");setMenu(false)}} title={conversation.title}><span className="history-dot"/><span>{conversation.title}</span></button>)}</div>
   <label className="nav-label system-label">YOUR SYSTEM</label><nav><button className="nav-link" onClick={()=>{setActive("Integrations");setMenu(false)}}><Command size={17}/>Integrations</button><button className="nav-link" onClick={()=>{setActive("Security center");setMenu(false)}}><ShieldCheck size={17}/>Security center<span className="online-dot"/></button><button className="nav-link" onClick={()=>{setActive("Settings");setMenu(false)}}><Settings2 size={17}/>Settings</button></nav>
   <div className="side-bottom"><div className="privacy-card"><div><LockKeyhole size={14}/> PRIVATE BY DESIGN <i/></div><p>Your intelligence. Your rules. Your data stays yours.</p><button onClick={()=>setActive("Security center")}>Explore security <ArrowUpRight size={13}/></button></div><div className="user-row"><span className="avatar">T</span><span><b>Architect workspace</b><small>Owner account</small></span><Settings2 size={16}/></div></div>
  </aside>
  {menu&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
  <section className="main-panel"><header className="topbar"><div className="crumb"><button className="hamburger" onClick={()=>setMenu(true)} aria-label="Open menu"><Menu size={19}/></button>Workspace <span>/</span> <b>{active}</b></div><div className="top-right"><span className="preview-label"><i/> SYSTEM PREVIEW</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><button className="signout-button" onClick={()=>supabase?.auth.signOut()}>Sign out</button></div></header>
   <div className="page-content">{active==="Overview" ? <><div className="eyebrow"><i/> YOUR PERSONAL INTELLIGENCE LAYER <i/></div><div className="hero"><div className="hero-orbit"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit-core"><AudioLines size={28}/></div><span className="star s1"/><span className="star s2"/></div><h1>Your world.<br/><em>Your intelligence.</em></h1></div><p className="intro">One intelligent space to think clearly, move faster, and bring every part of your world into focus.</p>
   <section className="prompt-card"><div className="prompt-head"><Sparkles size={15}/> AETHERON INTELLIGENCE <span>GENERAL</span></div>{historyLoading&&currentConversationId&&<div className="history-status">Loading saved conversation…</div>}{messages.length>0&&<div className="conversation-feed">{messages.map((message,index)=><div className="preview-reply" key={index}><span>{message.role==="assistant"?<BrainCircuit size={19}/>:<span className="avatar">T</span>}</span><div><b>{message.role==="assistant"?"AETHERON":"You"}</b><p style={{whiteSpace:"pre-wrap"}}>{message.content}</p></div></div>)}</div>}{loading&&<div className="preview-reply"><span><BrainCircuit size={19}/></span><div><b>AETHERON</b><p>Thinking…</p></div></div>}{chatError&&<div className="preview-reply"><span><CircleHelp size={19}/></span><div><b>Connection notice</b><p>{chatError}</p></div></div>}<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit()}}} placeholder="Ask AETHERON anything. What are we working on today?"/><p className="voice-privacy">Microphone speech recognition is handled by your browser provider; raw audio is not sent to the AETHERON API.</p>{voiceInputError&&<p className="voice-notice" role="status">{voiceInputError}</p>}{speakReplies&&<p className="voice-notice" role="status">Spoken replies enabled · uses your browser/device voice, not a cloned personal voice. Browser speech recognition may process microphone audio under the browser provider’s privacy policy; AETHERON does not send raw microphone audio to its API. <button type="button" onClick={stopVoiceOutput}>Stop speaking</button></p>}<div className="prompt-foot"><div><button type="button" className={voiceInputActive?"voice-control active":""} onClick={startVoiceInput} title={voiceInputActive?"Stop voice input":"Start voice input"} aria-label={voiceInputActive?"Stop voice input":"Start voice input"}><Mic size={17}/></button><button type="button" className={speakReplies?"voice-control active":""} onClick={toggleReplySpeech} title={speakReplies?"Turn reply speech off":"Turn reply speech on"} aria-label={speakReplies?"Turn reply speech off":"Turn reply speech on"}><AudioLines size={17}/></button><select className="voice-language" aria-label="Voice language" value={voiceLanguage} onChange={event=>setVoiceLanguage(event.target.value)}>{voiceLanguages.map(language=><option key={language.code} value={language.code}>{language.name}</option>)}</select><select className="voice-language reply-language" aria-label="AETHERON reply language" value={replyLanguage} onChange={event=>setReplyLanguage(event.target.value)}><option value="auto">Reply: Auto-detect</option>{voiceLanguages.map(language=><option key={language.code} value={language.code}>Reply: {language.name}</option>)}</select>{voiceInputActive&&<span className="voice-live">Listening…</span>}<span className="vline"/><small><LockKeyhole size={12}/> Private session · AI preview</small></div><button className="send" disabled={!prompt.trim()||loading} onClick={()=>submit()}>{loading?"Thinking…":"Send"} <Send size={15}/></button></div></section>
   <div className="idea-grid">{ideas.map(({name,desc,icon:Icon})=><button className="idea" key={name} onClick={()=>submit(name+": "+desc)}><span><Icon size={17}/></span><div><b>{name}</b><small>{desc}</small></div><ArrowUpRight size={15}/></button>)}</div>
   <div className="section-head"><div><small>YOUR COMMAND CENTER</small><h2>Everything, in orbit.</h2></div><button onClick={()=>setActive("My intelligence")}>Explore your system <ArrowUpRight size={14}/></button></div>
   <div className="stats-grid"><article className="stat"><div className="stat-top"><span className="stat-icon"><BrainCircuit size={17}/></span><small>CORE ENGINE</small><b>···</b></div><label>Intelligence layer</label><strong>Preparing <i className="pulse"/></strong><p>Cloud reasoning and orchestration foundation</p><div className="progress"><i/></div><footer><span>Foundation phase</span><span>In progress</span></footer></article><article className="stat"><div className="stat-top"><span className="stat-icon violet"><FolderKanban size={17}/></span><small>YOUR ECOSYSTEM</small><b>···</b></div><label>Connected projects</label><strong>05 <small>initiatives</small></strong><p>A unified view of your active work</p><div className="project-dots"><i/><i/><i/><i/><i/><span>EliteAxis ecosystem</span></div></article><article className="stat"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={17}/></span><small>TRUST FRAMEWORK</small><b>···</b></div><label>Security posture</label><strong>By design</strong><p>Least privilege · approval gates · audit trail</p><div className="secure-foot"><Check size={13}/> Security-first architecture defined</div></article></div>
   <footer className="page-footer"><div><span className="mini-a">A</span> POWERED BY <b>ELITEAXIS GLOBAL</b></div><div><span><Activity size={13}/> Early access preview</span><span><CalendarDays size={13}/> Roadmap active</span><CircleHelp size={15}/></div></footer>
   </> : <section className="workspace-page">
    <div className="workspace-page-head"><div className="eyebrow"><i/> AETHERON WORKSPACE <i/></div><h1>{active}</h1><p>Manage and explore your AETHERON workspace from one place.</p></div>
    {active==="Conversations" ? <div className="workspace-panel"><div className="panel-toolbar"><div><h2>Conversation history</h2><p>Open a saved conversation to continue where you left off.</p></div><div className="history-search"><Search size={15}/><input value={historySearch} onChange={e=>setHistorySearch(e.target.value)} placeholder="Search conversations"/></div></div>{historyLoading&&<p className="panel-muted">Loading saved conversations…</p>}{historyError&&<p className="memory-error" role="alert">{historyError}</p>}{conversations.filter(c=>c.title.toLowerCase().includes(historySearch.toLowerCase())).length===0?<div className="panel-empty"><MessageSquare size={24}/><b>No conversations found</b><span>Your saved conversations will appear here after you start chatting.</span></div>:<div className="conversation-library">{conversations.filter(c=>c.title.toLowerCase().includes(historySearch.toLowerCase())).map(c=><div className="conversation-row" key={c.id}><button className="conversation-open" onClick={()=>{openConversation(c);setActive("Overview")}} disabled={historyActionId===c.id}><span className="conversation-row-icon"><MessageSquare size={17}/></span><span className="conversation-row-copy"><b>{c.title}</b><small>Updated {new Date(c.updated_at).toLocaleString()}</small></span><ArrowUpRight size={16}/></button><div className="conversation-actions"><button onClick={()=>renameConversation(c)} disabled={!!historyActionId} aria-label={"Rename "+c.title}>Rename</button><button onClick={()=>archiveConversation(c)} disabled={!!historyActionId} aria-label={"Archive "+c.title}>Archive</button><button className="danger" onClick={()=>deleteConversation(c)} disabled={!!historyActionId} aria-label={"Delete "+c.title}>Delete</button></div></div>)}</div>}</div> :
    active==="My intelligence" ? <div className="workspace-grid"><article className="workspace-panel"><BrainCircuit/><h2>Persistent memory</h2><p>Save facts and preferences you want AETHERON to use in future conversations. Active memories are retrieved by the authenticated Cloud API and remain scoped to your account.</p><span className="feature-status">Cross-chat retrieval enabled</span><div className="memory-form"><textarea value={memoryDraft} onChange={event=>setMemoryDraft(event.target.value)} placeholder="Example: I prefer Bangla transliteration and practical step-by-step explanations." maxLength={4000}/><input value={memoryCategory} onChange={event=>setMemoryCategory(event.target.value)} placeholder="Category (e.g. preference, project)" maxLength={80}/><button className="panel-action" disabled={!memoryDraft.trim()||memoryLoading} onClick={saveMemory}>Save memory</button></div>{memoryError&&<p className="memory-error">{memoryError}</p>}</article><article className="workspace-panel"><LockKeyhole/><h2>Your saved context</h2><p>Only you can read, change, deactivate or delete these records. Deactivated memories are not sent to the AI.</p>{memoryLoading&&<p className="panel-muted">Loading memories…</p>}{!memoryLoading&&memories.length===0?<div className="panel-empty"><BrainCircuit size={22}/><b>No saved memories yet</b><span>Add a preference or project fact to make future chats more relevant.</span></div>:<div className="memory-list">{memories.map(item=><div className="memory-item" key={item.id}><div><span className="memory-category">{item.category}{item.is_active?" · active":" · paused"}</span><p>{item.memory}</p></div><div className="memory-actions"><button onClick={()=>toggleMemory(item)}>{item.is_active?"Pause":"Activate"}</button><button onClick={()=>removeMemory(item)}>Delete</button></div></div>)}</div>}</article></div> :
    active==="Projects" ? <div className="project-workspace"><div className="project-toolbar"><div><h2>Projects & tasks</h2><p>Create and track work in your private workspace.</p></div><button className="panel-action" onClick={createProject} disabled={projectBusy}><Plus size={15}/> New project</button></div>{projectError&&<p className="memory-error" role="alert">{projectError}</p>}{projectBusy&&<p className="panel-muted">Saving or loading…</p>}{projects.length===0&&!projectBusy?<div className="workspace-panel panel-empty"><FolderKanban size={24}/><b>No projects yet</b><span>Create your first project to start organizing tasks.</span></div>:<div className="workspace-grid">{projects.map(project=><article className="workspace-panel project-panel" key={project.id}><div className="project-card-head"><FolderKanban/><span className={"project-status "+project.status}>{project.status.replace("_"," ")}</span></div><h2>{project.name}</h2><p>{project.description||"A private project workspace."}</p><div className="task-list">{tasks.filter(task=>task.project_id===project.id).map(task=><div className="task-row" key={task.id}><button className={"task-status "+task.status} onClick={()=>updateTaskStatus(task)} title="Change task status" disabled={projectBusy}>{task.status==="done"?"✓":task.status==="in_progress"?"◐":"○"}</button><span className={task.status==="done"?"task-done":""}>{task.title}</span><small>{task.priority}</small></div>)}{tasks.every(task=>task.project_id!==project.id)&&<p className="panel-muted">No tasks in this project yet.</p>}</div><div className="project-actions"><button onClick={()=>createTask(project)} disabled={projectBusy}><Plus size={14}/> Add task</button><button className="danger" onClick={()=>deleteProject(project)} disabled={projectBusy}>Delete project</button></div></article>)}</div>}</div> :
    active==="Research" ? <div className="research-workspace"><div className="workspace-panel"><div className="research-heading"><div><Globe2/><h2>Web research</h2><p>Search the public web and inspect the original sources. Search is powered by Tavily when its free-tier key is configured on the server.</p></div><span className="feature-status">Source-linked results</span></div><form className="research-form" onSubmit={runResearch}><input value={researchQuery} onChange={event=>setResearchQuery(event.target.value)} maxLength={300} minLength={3} placeholder="Search a topic, technology, company or question…" aria-label="Research query"/><button className="panel-action" type="submit" disabled={researchBusy||researchQuery.trim().length<3}>{researchBusy?"Searching…":<><Search size={15}/> Search web</>}</button></form><small className="panel-muted">Free-tier target: 1,000 search credits per month · up to 5 results per query · requires sign-in</small>{researchError&&<p className="memory-error" role="alert">{researchError}</p>}{researchNotice&&<p className="panel-muted" role="status">{researchNotice}</p>}{researchBusy&&<p className="panel-muted">Searching and collecting source links…</p>}{researchResults.length>0&&<div className="research-results">{researchResults.map((item,index)=><article className="research-result" key={item.url}><div className="research-result-top"><span> SOURCE {index+1}</span>{item.published_date&&<small>{item.published_date}</small>}</div><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}<ArrowUpRight size={14}/></a><p>{item.content}</p><small className="research-domain">{(()=>{try{return new URL(item.url).hostname}catch{return item.url}})()}</small></article>)}</div>}</div><p className="research-disclaimer">Research results are third-party content, not verified endorsements. Open and evaluate original sources; availability and quota depend on the provider.</p></div> :
    active==="Workflows" ? <div className="workspace-panel"><Workflow/><h2>Workflow automation</h2><p>Workflow templates and approval controls are planned. No external action will run from this screen yet.</p><span className="feature-status pending">Automation not connected</span></div> :
    active==="Knowledge" ? <div className="knowledge-workspace"><div className="workspace-panel"><div className="project-toolbar"><div><FileText/><h2>Private knowledge library</h2><p>Import text-based documents. Active documents can be referenced by AETHERON in future chats.</p></div><label className="panel-action upload-control"> <Plus size={15}/> Import document <input type="file" accept=".txt,.md,.csv,.json,.log,text/plain,text/markdown,application/json" disabled={knowledgeBusy} onChange={event=>{const file=event.target.files?.[0];void uploadKnowledgeFile(file);event.currentTarget.value="";}}/></label></div><small className="panel-muted">TXT, Markdown, CSV, JSON or LOG · maximum 200 KB per file · content limit 50,000 characters</small>{knowledgeError&&<p className="memory-error" role="alert">{knowledgeError}</p>}{knowledgeBusy&&<p className="panel-muted">Processing…</p>}{!knowledgeBusy&&knowledgeDocs.length===0?<div className="panel-empty"><FileText size={24}/><b>Your knowledge library is empty</b><span>Import a document to give AETHERON private reference material for your chats.</span></div>:<div className="knowledge-list">{knowledgeDocs.map(doc=><article className="knowledge-item" key={doc.id}><div className="knowledge-copy"><b>{doc.title}</b><small>{doc.source_name||"Text note"} · {doc.content.length.toLocaleString()} characters · {doc.is_active?"Active":"Paused"}</small><p>{doc.content.slice(0,240)}{doc.content.length>240?"…":""}</p></div><div className="knowledge-actions"><button onClick={()=>toggleKnowledge(doc)} disabled={knowledgeBusy}>{doc.is_active?"Pause":"Activate"}</button><button className="danger" onClick={()=>deleteKnowledge(doc)} disabled={knowledgeBusy}>Delete</button></div></article>)}</div>}</div></div> :
    active==="Integrations" ? <div className="workspace-panel"><Command/><h2>Connected services</h2><p>Supabase authentication and database are configured. Other integrations are not connected in this preview.</p><div className="integration-row"><span>Supabase</span><span className="feature-status">Configured</span></div><div className="integration-row"><span>External tools</span><span className="feature-status pending">Not connected</span></div></div> :
    active==="Security center" ? <div className="workspace-panel"><ShieldCheck/><h2>Security overview</h2><p>Authentication uses Supabase Auth and user-owned records are protected by row-level security policies. Review deployment secrets and enable leaked-password protection in Supabase before public beta.</p><span className="feature-status">RLS policies present</span><span className="feature-status pending">Security hardening required</span></div> :
    <div className="workspace-panel"><Settings2/><h2>Workspace settings</h2><p>Account sign-out is available from the top bar. Profile preferences, memory controls and data export/delete settings are not implemented yet.</p><button className="panel-action" onClick={()=>supabase?.auth.signOut()}>Sign out securely</button></div>}
   </section>}
   </div>
  </section>
 </main>
}
