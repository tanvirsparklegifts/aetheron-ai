"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AuthPanel from "./auth-panel";
import { Activity, ArrowUpRight, AudioLines, Bell, BrainCircuit, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp, Command, Compass, FileText, FolderKanban, Globe2, LockKeyhole, Menu, Mic, Plus, Send, Settings2, ShieldCheck, Sparkles, TerminalSquare, Workflow, X } from "lucide-react";

const navigation = [{name:"Overview",icon:Compass},{name:"My intelligence",icon:BrainCircuit},{name:"Projects",icon:FolderKanban},{name:"Research",icon:Globe2},{name:"Workflows",icon:Workflow},{name:"Knowledge",icon:FileText}];
const ideas = [{name:"Business brief",desc:"Turn an idea into a clear action plan",icon:BriefcaseBusiness},{name:"Deep research",desc:"Explore a topic with cited findings",icon:Globe2},{name:"Build something",desc:"Plan, design, and review code",icon:TerminalSquare}];

export default function Home(){
 const [session,setSession]=useState<Session|null>(null); const [authReady,setAuthReady]=useState(!supabase);
 useEffect(()=>{ if(!supabase)return; let active=true; supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setAuthReady(true);}}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setAuthReady(true);}}); return ()=>{active=false;subscription.unsubscribe();}; },[]);
 const [active,setActive]=useState("Overview"); const [prompt,setPrompt]=useState(""); const [menu,setMenu]=useState(false);
 const [messages,setMessages]=useState<{role:"user"|"assistant";content:string}[]>([]); const [conversationId,setConversationId]=useState<string|null>(null);
 const [loading,setLoading]=useState(false); const [chatError,setChatError]=useState("");
 const apiUrl=(process.env.NEXT_PUBLIC_AETHERON_API_URL||"").replace(/\/$/,"");
 useEffect(()=>{let active=true;const restore=async()=>{if(!session||!apiUrl)return;try{const headers={Authorization:"Bearer "+session.access_token};const listResponse=await fetch(apiUrl+"/api/v1/conversations",{headers});if(!listResponse.ok)return;const items=await listResponse.json();if(!active||!Array.isArray(items)||!items.length)return;const latest=items[0];const historyResponse=await fetch(apiUrl+"/api/v1/conversations/"+latest.id+"/messages",{headers});if(!historyResponse.ok)return;const history=await historyResponse.json();if(active){setConversationId(latest.id);setMessages(Array.isArray(history)?history.map((item:{role:"user"|"assistant";content:string})=>({role:item.role,content:item.content})):[]);}}catch{/* History can be restored when the API becomes available. */}};restore();return()=>{active=false;};},[session,apiUrl]);
 const submit=async(value=prompt)=>{
  const text=value.trim(); if(!text||loading)return;
  if(!apiUrl){setChatError("Cloud API URL is not configured yet. Deploy the Cloud API, then set NEXT_PUBLIC_AETHERON_API_URL in the GitHub Pages build environment.");return;}
  const next=[...messages,{role:"user" as const,content:text}].slice(-12);
  setMessages(next);setPrompt("");setChatError("");setLoading(true);
  try{
   const currentSession = session ?? (supabase ? (await supabase.auth.getSession()).data.session : null);
   if(!currentSession) throw new Error("Please sign in again to continue.");
   let activeConversationId=conversationId;
   if(!activeConversationId){const created=await fetch(apiUrl+"/api/v1/conversations",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+currentSession.access_token},body:JSON.stringify({title:text.slice(0,80)||"New conversation"})});const createdData=await created.json().catch(()=>({}));if(!created.ok||!createdData.id)throw new Error(createdData.detail||"Could not create a saved conversation.");activeConversationId=createdData.id;setConversationId(activeConversationId);}
   const response=await fetch(apiUrl+"/api/v1/chat",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+currentSession.access_token},body:JSON.stringify({messages:next,conversation_id:activeConversationId})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.detail||"AETHERON could not complete this request.");
   if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("The AI provider returned an empty reply.");
   setMessages([...next,{role:"assistant" as const,content:data.reply}].slice(-12));
  }catch(error){setChatError(error instanceof Error?error.message:"Connection failed. Please try again.");}
  finally{setLoading(false);}
 };
 if(!authReady) return <main className="auth-shell"><div className="auth-card">Loading secure workspace…</div></main>;
 if(!session) return <AuthPanel />;
 return <main className="app-shell">
  <aside className={`sidebar ${menu?"sidebar-open":""}`}>
   <div className="brand"><div className="brand-symbol">A<span/></div><div><b>AETHERON</b><small>THE AUTONOMOUS INTELLIGENCE</small></div><button className="close-menu" onClick={()=>setMenu(false)} aria-label="Close menu"><X size={18}/></button></div>
   <button className="workspace"><span className="avatar">T</span><span><b>Personal workspace</b><small>Owner edition</small></span><ChevronDown size={15}/></button>
   <button className="new-chat" onClick={()=>{setPrompt("");setMessages([]);setConversationId(null);setChatError("")}}><Plus size={17}/> New conversation <kbd>⌘ K</kbd></button>
   <label className="nav-label">WORKSPACE</label><nav>{navigation.map(({name,icon:Icon})=><button key={name} onClick={()=>setActive(name)} className={`nav-link ${active===name?"selected":""}`}><Icon size={17}/>{name}{name==="Projects"&&<span className="count">05</span>}</button>)}</nav>
   <label className="nav-label system-label">YOUR SYSTEM</label><nav><button className="nav-link" onClick={()=>setActive("Integrations")}><Command size={17}/>Integrations</button><button className="nav-link" onClick={()=>setActive("Security center")}><ShieldCheck size={17}/>Security center<span className="online-dot"/></button><button className="nav-link" onClick={()=>setActive("Settings")}><Settings2 size={17}/>Settings</button></nav>
   <div className="side-bottom"><div className="privacy-card"><div><LockKeyhole size={14}/> PRIVATE BY DESIGN <i/></div><p>Your intelligence. Your rules. Your data stays yours.</p><button onClick={()=>setActive("Security center")}>Explore security <ArrowUpRight size={13}/></button></div><div className="user-row"><span className="avatar">T</span><span><b>Architect workspace</b><small>Owner account</small></span><Settings2 size={16}/></div></div>
  </aside>
  {menu&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
  <section className="main-panel"><header className="topbar"><div className="crumb"><button className="hamburger" onClick={()=>setMenu(true)} aria-label="Open menu"><Menu size={19}/></button>Workspace <span>/</span> <b>{active}</b></div><div className="top-right"><span className="preview-label"><i/> SYSTEM PREVIEW</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><button className="signout-button" onClick={()=>supabase?.auth.signOut()}>Sign out</button></div></header>
   <div className="page-content"><div className="eyebrow"><i/> YOUR PERSONAL INTELLIGENCE LAYER <i/></div><div className="hero"><div className="hero-orbit"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit-core"><AudioLines size={28}/></div><span className="star s1"/><span className="star s2"/></div><h1>Your world.<br/><em>Your intelligence.</em></h1></div><p className="intro">One intelligent space to think clearly, move faster, and bring every part of your world into focus.</p>
   <section className="prompt-card"><div className="prompt-head"><Sparkles size={15}/> AETHERON INTELLIGENCE <span>GENERAL</span></div>{messages.length>0&&<div className="conversation-feed">{messages.map((message,index)=><div className="preview-reply" key={index}><span>{message.role==="assistant"?<BrainCircuit size={19}/>:<span className="avatar">T</span>}</span><div><b>{message.role==="assistant"?"AETHERON":"You"}</b><p style={{whiteSpace:"pre-wrap"}}>{message.content}</p></div></div>)}</div>}{loading&&<div className="preview-reply"><span><BrainCircuit size={19}/></span><div><b>AETHERON</b><p>Thinking…</p></div></div>}{chatError&&<div className="preview-reply"><span><CircleHelp size={19}/></span><div><b>Connection notice</b><p>{chatError}</p></div></div>}<textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit()}}} placeholder="Ask AETHERON anything. What are we working on today?"/><div className="prompt-foot"><div><button title="Voice input coming soon"><Mic size={17}/></button><span className="vline"/><small><LockKeyhole size={12}/> Private session · AI preview</small></div><button className="send" disabled={!prompt.trim()||loading} onClick={()=>submit()}>{loading?"Thinking…":"Send"} <Send size={15}/></button></div></section>
   <div className="idea-grid">{ideas.map(({name,desc,icon:Icon})=><button className="idea" key={name} onClick={()=>submit(name+": "+desc)}><span><Icon size={17}/></span><div><b>{name}</b><small>{desc}</small></div><ArrowUpRight size={15}/></button>)}</div>
   <div className="section-head"><div><small>YOUR COMMAND CENTER</small><h2>Everything, in orbit.</h2></div><button onClick={()=>setActive("My intelligence")}>Explore your system <ArrowUpRight size={14}/></button></div>
   <div className="stats-grid"><article className="stat"><div className="stat-top"><span className="stat-icon"><BrainCircuit size={17}/></span><small>CORE ENGINE</small><b>···</b></div><label>Intelligence layer</label><strong>Preparing <i className="pulse"/></strong><p>Cloud reasoning and orchestration foundation</p><div className="progress"><i/></div><footer><span>Foundation phase</span><span>In progress</span></footer></article><article className="stat"><div className="stat-top"><span className="stat-icon violet"><FolderKanban size={17}/></span><small>YOUR ECOSYSTEM</small><b>···</b></div><label>Connected projects</label><strong>05 <small>initiatives</small></strong><p>A unified view of your active work</p><div className="project-dots"><i/><i/><i/><i/><i/><span>EliteAxis ecosystem</span></div></article><article className="stat"><div className="stat-top"><span className="stat-icon green"><ShieldCheck size={17}/></span><small>TRUST FRAMEWORK</small><b>···</b></div><label>Security posture</label><strong>By design</strong><p>Least privilege · approval gates · audit trail</p><div className="secure-foot"><Check size={13}/> Security-first architecture defined</div></article></div>
   <footer className="page-footer"><div><span className="mini-a">A</span> POWERED BY <b>ELITEAXIS GLOBAL</b></div><div><span><Activity size={13}/> Early access preview</span><span><CalendarDays size={13}/> Roadmap active</span><CircleHelp size={15}/></div></footer>
   </div>
  </section>
 </main>
}
