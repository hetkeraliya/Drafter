"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleMark } from "@/components/Icons";
import { Phone } from "@/components/Phone";
import { Segmented } from "@/components/Segmented";
import { Spark } from "@/components/Spark";
import { withViewTransition } from "@/lib/motion";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const { signInDemo } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const supa = getSupabase();

  function go(displayName?: string, displayEmail?: string) {
    signInDemo(displayName || name || "You", displayEmail || email || "you@draftr.app");
    withViewTransition(() => router.push("/onboarding"));
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
        withViewTransition(() => router.push("/notes"));
      } else {
        const { data, error } = await supa.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() || email.split("@")[0] }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          withViewTransition(() => router.push("/onboarding"));
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
    <Phone>
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--ink)] text-[#fafafa]">
          <Spark size={16} />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em]">Draftr</p>
          <p className="text-xs text-[var(--muted)]">Studio 6</p>
        </div>
      </div>

      <h1 key={mode} className="swap mt-14 text-[40px] font-semibold leading-[0.98] tracking-[-0.055em]">
        {mode === "in" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mt-4 max-w-[38ch] text-sm text-[var(--muted)]">
        {supa
          ? "Sign in with email or Google. Your notes sync across devices."
          : "Sign in with email, Google, or demo. Notes stay on this device until cloud is connected."}
      </p>

      <div className="mt-9">
        <Segmented
          items={[
            { id: "in", label: "Sign in" },
            { id: "up", label: "Create account" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-2.5">
        {mode === "up" && (
          <input className="field swap" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {hint && <p className="text-sm text-[var(--muted)]">{hint}</p>}
        <button type="submit" className="btn w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={onGoogle}
        className="card mt-3 flex min-h-12 w-full items-center justify-center gap-2 text-sm"
      >
        <GoogleMark /> Continue with Google
      </button>
      <button type="button" onClick={() => go("Demo", "demo@draftr.app")} className="btn-ghost mt-1 w-full">
        Continue in demo mode
      </button>
    </Phone>
  );
}
