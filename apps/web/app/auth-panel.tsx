"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!supabase) {
      setNotice("Supabase is not configured. Add the Supabase URL and publishable key to the GitHub Pages build variables.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setNotice(data.session
          ? "Account created. Your AETHERON workspace is ready."
          : "Account created. Check your email to confirm your address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="auth-mark">A</span><div><b>AETHERON</b><small>THE AUTONOMOUS INTELLIGENCE</small></div></div>
        <div className="auth-kicker"><Sparkles size={14}/> YOUR WORLD. YOUR INTELLIGENCE.</div>
        <h1>{mode === "signin" ? "Welcome back." : "Create your workspace."}</h1>
        <p className="auth-intro">Sign in securely to access your personal intelligence workspace.</p>
        <form onSubmit={submit}>
          <label htmlFor="auth-email">Email address</label>
          <div className="auth-input"><Mail size={16}/><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
          <label htmlFor="auth-password">Password</label>
          <div className="auth-input"><LockKeyhole size={16}/><input id="auth-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></div>
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create account"}</button>
        </form>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
        <p className="auth-switch">{mode === "signin" ? "New to AETHERON?" : "Already have an account?"} <button onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setNotice("");}}>{mode === "signin" ? "Create account" : "Sign in"}</button></p>
        <div className="auth-security"><LockKeyhole size={13}/> Passwords are handled by Supabase Auth. AETHERON never sees or stores your password.</div>
      </section>
    </main>
  );
}
