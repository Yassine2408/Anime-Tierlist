"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type SocialProvider = "google" | "github";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectedFrom") || "/";
  const { supabase, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<SocialProvider | null>(null);

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.push(redirectTo);
  };

  const handleOAuthLogin = async (provider: SocialProvider) => {
    setOauthProvider(provider);
    setError(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthProvider(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[3rem] border border-border bg-surface/80 p-10 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20">
            <span className="text-xl font-black">●</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Sign in to access your circle.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleEmailLogin}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email" type="email" autoComplete="email" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand/30 transition focus:ring-2"
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || isLoading}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="password">
              Secret Key
            </label>
            <input
              id="password" type="password" autoComplete="current-password" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand/30 transition focus:ring-2"
              value={password} onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || isLoading}
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 ring-1 ring-rose-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10">{submitting ? "VERIFYING..." : "ENTER CIRCLE"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-2 whitespace-nowrap">Social Access</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SocialBtn onClick={() => handleOAuthLogin("google")} active={oauthProvider === "google"} label="Google" />
          <SocialBtn onClick={() => handleOAuthLogin("github")} active={oauthProvider === "github"} label="GitHub" />
        </div>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-muted-2">
          First time here?{" "}
          <Link href="/register" className="text-brand hover:text-brand-2 transition-colors underline-offset-4 underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}

function SocialBtn({ onClick, active, label }: { onClick: () => void; active: boolean; label: string }) {
  return (
    <button
      type="button" onClick={onClick} disabled={active}
      className="rounded-full border border-border bg-surface-2 py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition hover:bg-surface hover:border-brand/30 active:scale-95 disabled:opacity-50"
    >
      {active ? "WAIT..." : label}
    </button>
  );
}
