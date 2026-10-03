"use client";

import { FormEvent, useState } from "react";
import { AppIcon } from "@/components/AppIcon";
import { GoogleMark } from "@/components/Icons";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { useNav } from "@/lib/useNav";

export default function LoginPage() {
  const { signInDemo } = useStore();
  const nav = useNav();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const supa = getSupabase();

  function go(displayName?: string, displayEmail?: string) {
    signInDemo(displayName || name || "You", displayEmail || email || "you@draftr.app");
    nav.go("/onboarding");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setHint("");

    if (!supa) {
      if (password.length < 4) {
        setHint("Use at least 4 characters for this demo.");
        return;
      }
      go();
      return;
    }

    if (password.length < 6) {
      setHint("Use at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supa.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        nav.go("/notes");
      } else {
        const { data, error } = await supa.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() || email.split("@")[0] }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          nav.go("/onboarding");
        } else {
          setHint("Check your email and tap the confirmation link, then sign in.");
          setMode("in");
        }
      }
    } catch (err) {
      setHint(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    if (!supa) {
      go("Google user", "google@draftr.app");
      return;
    }
    setHint("");
    const { error } = await supa.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setHint(error.message);
  }

  return (
    <Screen bare>
      <div className="flex flex-col items-center pt-6 text-center">
        <AppIcon size={72} />
        <h1 className="mt-5 text-[34px] font-bold leading-tight tracking-[-0.03em]">Draftr</h1>
        <p className="mt-1 max-w-[32ch] text-[15px] text-[var(--muted)]">
          {supa ? "Sign in to sync your notes across devices." : "Sign in, or try demo mode. Notes stay on this device."}
        </p>
      </div>

      <div className="mt-8">
        <Segmented
          items={[
            { id: "in", label: "Sign In" },
            { id: "up", label: "Create Account" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <form onSubmit={onSubmit} className="mt-5">
        <div className="group">
          {mode === "up" && (
            <label className="cell">
              <span className="w-20 flex-none">Name</span>
              <input className="field" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="cell">
            <span className="w-20 flex-none">Email</span>
            <input
              className="field"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="cell">
            <span className="w-20 flex-none">Password</span>
            <input
              className="field"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              placeholder="Required"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        {hint && <p className="group-foot text-[var(--muted)]">{hint}</p>}
        <button type="submit" className="btn mt-5 w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <button type="button" onClick={onGoogle} className="btn btn-quiet mt-3 w-full !text-[var(--ink)]">
        <GoogleMark /> Continue with Google
      </button>
      <button type="button" onClick={() => go("Demo", "demo@draftr.app")} className="btn-plain mt-2 w-full">
        Continue in demo mode
      </button>
    </Screen>
  );
}
