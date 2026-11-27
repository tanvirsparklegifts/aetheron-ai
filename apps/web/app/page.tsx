"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AuthPanel from "./auth-panel";
import { Activity, ArrowUpRight, AudioLines, Bell, BrainCircuit, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp, Command, Compass, FileText, FolderKanban, Globe2, LockKeyhole, Menu, MessageSquare, Mic, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, TerminalSquare, Workflow, X } from "lucide-react";

const navigation = [{name:"Overview",icon:Compass},{name:"Conversations",icon:MessageSquare},{name:"My intelligence",icon:BrainCircuit},{name:"Projects",icon:FolderKanban},{name:"Research",icon:Globe2},{name:"Workflows",icon:Workflow},{name:"Knowledge",icon:FileText}];
const ideas = [{name:"Business brief",desc:"Turn an idea into a clear action plan",icon:BriefcaseBusiness},{name:"Deep research",desc:"Explore a topic with cited findings",icon:Globe2},{name:"Build something",desc:"Plan, design, and review code",icon:TerminalSquare}];
type Conversation = {id:string;title:string;updated_at:string};
type Memory = {id:string;memory:string;category:string;source:string;is_active:boolean;created_at:string;updated_at:string};

export default function Home(){
 const [session,setSession]=useState<Session|null>(null); const [authReady,setAuthReady]=useState(!supabase);
 useEffect(()=>{ if(!supabase)return; let active=true; supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setAuthReady(true);}}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setAuthReady(true);}}); return ()=>{active=false;subscription.unsubscribe();}; },[]);
 const [active,setActive]=useState("Overview"); const [prompt,setPrompt]=useState(""); const [menu,setMenu]=useState(false);
 const [messages,setMessages]=useState<{role:"user"|"assistant";content:string}[]>([]);
 const [conversations,setConversations]=useState<Conversation[]>([]);
 const [currentConversationId,setCurrentConversationId]=useState<string|null>(null);
 const [historyLoading,setHistoryLoading]=useState(false); const [historySearch,setHistorySearch]=useState("");
 const [loading,setLoading]=useState(false); const [chatError,setChatError]=useState("");
 const [memories,setMemories]=useState<Memory[]>([]); const [memoryDraft,setMemoryDraft]=useState(""); const [memoryCategory,setMemoryCategory]=useState("general"); const [memoryLoading,setMemoryLoading]=useState(false); const [memoryError,setMemoryError]=useState("");
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
  setMemoryLoading(true);setMemoryError("");
  (async()=>{
   const {data,error}=await supabase.from("memories").select("id,memory,category,source,is_active,created_at,updated_at").eq("user_id",session.user.id).order("updated_at",{ascending:false}).limit(100);
   if(!alive)return;
   if(error)setMemoryError("Could not load saved memories: "+error.message);
   else setMemories((data||[]) as Memory[]);
   setMemoryLoading(false);
  })();
  return ()=>{alive=false;};
 },[active,session?.user.id]);
 const openConversation=async(conversation:Conversation)=>{
  if(!supabase||loading)return;
  setHistoryLoading(true);setChatError("");setCurrentConversationId(conversation.id);
  try{
   const {data,error}=await supabase.from("messages").select("role,content").eq("conversation_id",conversation.id).order("created_at",{ascending:true}).limit(100);
   if(error)throw error;
   setMessages((data||[]) as {role:"user"|"assistant";content:string}[]);
   setPrompt("");
  }catch(error){setChatError(error instanceof Error?error.message:"Could not load this conversation.");}
  finally{setHistoryLoading(false);}
 };
 const apiUrl=(process.env.NEXT_PUBLIC_AETHERON_API_URL||"").replace(/\/$/,"");
 const submit=async(value=prompt)=>{
  const text=value.trim(); if(!text||loading)return;
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
   const response=await fetch(apiUrl+"/api/v1/chat",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+currentSession.access_token},body:JSON.stringify({messages:next})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.detail||"AETHERON could not complete this request.");
   if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("The AI provider returned an empty reply.");
   const assistantMessage={role:"assistant" as const,content:data.reply};
   setMessages([...next,assistantMessage].slice(-12));
   const {error:saveAssistantError}=await supabase.from("messages").insert({conversation_id:activeConversationId,user_id:currentSession.user.id,role:"assistant",content:data.reply});
   if(saveAssistantError){setChatError("Reply received, but it could not be saved to history: "+saveAssistantError.message);return;}
   await supabase.from("conversations").update({updated_at:new Date().toISOString()}).eq("id",activeConversationId).eq("user_id",currentSession.user.id);
   setConversations(previous=>previous.map(item=>item.id===activeConversationId?{...item,updated_at:new Date().toISOString()}:item).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)));
  }catch(error){setChatError(error instanceof Error?error.message:"Connection failed. Please try again.");}
  finally{setLoading(false);}
 };
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
   <section className="prompt-card"><div className="prompt-head"><Sparkles size={15}/> AETHERON INTELLIGENCE <span>GENERAL</span></div>{historyLoading&&currentConversationId&&<div className="history-status">Loading saved conversation…</div>}{messages.length>0&&<div className="conversation-feed">{messages.map((message,index)=><div className="preview-reply" key={index}><span>{message.role==="assistant"?<BrainCircuit size={19}/>:<span className="avatar">T</span>}</span><div><b>{message.role==="assistant"?"AETHERON":"You"}</b><p style={{whiteSpace:"pre-wrap"}}>{message.content}</p></div></div>)}</div>}{loading&&<div className="preview-reply"><span><BrainCircuit size={19}/></span><div><b>AETHERON</b><p>Thinking…</p></div></div>}{chatError&&<div className="preview-reply"><span><CircleHelp size={19}/></span><div><b>Connection notice</b><p>{chatError}</p></div></div>}<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit()}}} placeholder="Ask AETHERON anything. What are we working on today?"/><div className="prompt-foot"><div><button title="Voice input coming soon"><Mic size={17}/></button><span className="vline"/><small><LockKeyhole size={12}/> Private session · AI preview</small></div><button className="send" disabled={!prompt.trim()||loading} onClick={()=>submit()}>{loading?"Thinking…":"Send"} <Send size={15}/></button></div></section>
   <div className="idea-grid">{ideas.map(({name,desc,icon:Icon})=><button className="idea" key={name} onClick={()=>submit(name+": "+desc)}><span><Icon size={17}/></span><div><b>{name}</b><small>{desc}</small></div><ArrowUpRight size={15}/></button>)}</div>
   <div className="section-head"><div><small>YOUR COMMAND CENTER</small><h2>Everything, in orbit.</h2></div><button onClick={()=>setActive("My intelligence")}>Explore your system <ArrowUpRight size={14}/></button></div>
   <div className="stats-grid"><article className="stat"><div className="stat-top"><span className="stat-icon"><BrainCircuit size={17}/></span><small>CORE ENGINE</small><b>···</b></div><label>Intelligence layer</label><strong>Preparing <i className="pulse"/></strong><p>Cloud reasoning and orchestration foundation</p><div className="progress"><i/></div><footer><span>Foundation phase</span><span>In progress</span></footer></article><article className="stat"><div className="stat-top"><span className="stat-icon violet"><FolderKanban size={17}/></span><small>YOUR ECOSYSTEM</small><b>···</b></div><label>Connected projects</label><strong>05 <small>initiatives</small></strong><p>A unified view of your active work</p><div className="project-dots"><i/><i/><i/><i/><i/><span>EliteAxis ecosystem</span></div></article><article className="stat"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={17}/></span><small>TRUST FRAMEWORK</small><b>···</b></div><label>Security posture</label><strong>By design</strong><p>Least privilege · approval gates · audit trail</p><div className="secure-foot"><Check size={13}/> Security-first architecture defined</div></article></div>
   <footer className="page-footer"><div><span className="mini-a">A</span> POWERED BY <b>ELITEAXIS GLOBAL</b></div><div><span><Activity size={13}/> Early access preview</span><span><CalendarDays size={13}/> Roadmap active</span><CircleHelp size={15}/></div></footer>
   </> : <section className="workspace-page">
    <div className="workspace-page-head"><div className="eyebrow"><i/> AETHERON WORKSPACE <i/></div><h1>{active}</h1><p>Manage and explore your AETHERON workspace from one place.</p></div>
    {active==="Conversations" ? <div className="workspace-panel"><div className="panel-toolbar"><div><h2>Conversation history</h2><p>Open a saved conversation to continue where you left off.</p></div><div className="history-search"><Search size={15}/><input value={historySearch} onChange={e=>setHistorySearch(e.target.value)} placeholder="Search conversations"/></div></div>{historyLoading&&<p className="panel-muted">Loading saved conversations…</p>}{conversations.filter(c=>c.title.toLowerCase().includes(historySearch.toLowerCase())).length===0?<div className="panel-empty"><MessageSquare size={24}/><b>No conversations found</b><span>Your saved conversations will appear here after you start chatting.</span></div>:<div className="conversation-library">{conversations.filter(c=>c.title.toLowerCase().includes(historySearch.toLowerCase())).map(c=><button className="conversation-row" key={c.id} onClick={()=>{openConversation(c);setActive("Overview")}}><span className="conversation-row-icon"><MessageSquare size={17}/></span><span className="conversation-row-copy"><b>{c.title}</b><small>Updated {new Date(c.updated_at).toLocaleString()}</small></span><ArrowUpRight size={16}/></button>)}</div>}</div> :
    active==="My intelligence" ? <div className="workspace-grid"><article className="workspace-panel"><BrainCircuit/><h2>Persistent memory</h2><p>Save facts and preferences you want AETHERON to use in future conversations. Active memories are retrieved by the authenticated Cloud API and remain scoped to your account.</p><span className="feature-status">Cross-chat retrieval enabled</span><div className="memory-form"><textarea value={memoryDraft} onChange={event=>setMemoryDraft(event.target.value)} placeholder="Example: I prefer Bangla transliteration and practical step-by-step explanations." maxLength={4000}/><input value={memoryCategory} onChange={event=>setMemoryCategory(event.target.value)} placeholder="Category (e.g. preference, project)" maxLength={80}/><button className="panel-action" disabled={!memoryDraft.trim()||memoryLoading} onClick={saveMemory}>Save memory</button></div>{memoryError&&<p className="memory-error">{memoryError}</p>}</article><article className="workspace-panel"><LockKeyhole/><h2>Your saved context</h2><p>Only you can read, change, deactivate or delete these records. Deactivated memories are not sent to the AI.</p>{memoryLoading&&<p className="panel-muted">Loading memories…</p>}{!memoryLoading&&memories.length===0?<div className="panel-empty"><BrainCircuit size={22}/><b>No saved memories yet</b><span>Add a preference or project fact to make future chats more relevant.</span></div>:<div className="memory-list">{memories.map(item=><div className="memory-item" key={item.id}><div><span className="memory-category">{item.category}{item.is_active?" · active":" · paused"}</span><p>{item.memory}</p></div><div className="memory-actions"><button onClick={()=>toggleMemory(item)}>{item.is_active?"Pause":"Activate"}</button><button onClick={()=>removeMemory(item)}>Delete</button></div></div>)}</div>}</article></div> :
    active==="Projects" ? <div className="workspace-grid">{["AETHERON AI","Aetherium Vault","T.M.T Protocol","BLACK LOTUS","AERO-X Protocol"].map((name,i)=><article className="workspace-panel project-panel" key={name}><FolderKanban/><small>INITIATIVE 0{i+1}</small><h2>{name}</h2><p>Project workspace entry. Detailed project boards and task synchronization are not connected yet.</p><span className="feature-status pending">Workspace setup pending</span></article>)}</div> :
    active==="Research" ? <div className="workspace-panel"><Globe2/><h2>Research workspace</h2><p>Research tools, source retrieval and citation workflows are not connected in this preview. AETHERON will not claim to have browsed or verified sources unless a research connector is enabled.</p><span className="feature-status pending">Research connector not connected</span></div> :
    active==="Workflows" ? <div className="workspace-panel"><Workflow/><h2>Workflow automation</h2><p>Workflow templates and approval controls are planned. No external action will run from this screen yet.</p><span className="feature-status pending">Automation not connected</span></div> :
    active==="Knowledge" ? <div className="workspace-panel"><FileText/><h2>Knowledge library</h2><p>Saved conversations are available under Conversations. File uploads, searchable documents and knowledge retrieval are not connected yet.</p><button className="panel-action" onClick={()=>setActive("Conversations")}>Open conversation history <ArrowUpRight size={14}/></button></div> :
    active==="Integrations" ? <div className="workspace-panel"><Command/><h2>Connected services</h2><p>Supabase authentication and database are configured. Other integrations are not connected in this preview.</p><div className="integration-row"><span>Supabase</span><span className="feature-status">Configured</span></div><div className="integration-row"><span>External tools</span><span className="feature-status pending">Not connected</span></div></div> :
    active==="Security center" ? <div className="workspace-panel"><ShieldCheck/><h2>Security overview</h2><p>Authentication uses Supabase Auth and user-owned records are protected by row-level security policies. Review deployment secrets and enable leaked-password protection in Supabase before public beta.</p><span className="feature-status">RLS policies present</span><span className="feature-status pending">Security hardening required</span></div> :
    <div className="workspace-panel"><Settings2/><h2>Workspace settings</h2><p>Account sign-out is available from the top bar. Profile preferences, memory controls and data export/delete settings are not implemented yet.</p><button className="panel-action" onClick={()=>supabase?.auth.signOut()}>Sign out securely</button></div>}
   </section>}
   </div>
  </section>
 </main>
}
