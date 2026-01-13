"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectedFrom") || "/";
  const { supabase, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate username
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    if (username.length > 20) {
      setError("Username must be at most 20 characters long");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setMessage(null);

    // Check if username is already taken
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();

    if (existingProfile) {
      setError("Username is already taken. Please choose another one.");
      setSubmitting(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        data: {
          username: username.toLowerCase(), // Pass username in user metadata
          display_name: username,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Update profile with username after signup
    // The trigger will create the profile, but we need to set username
    if (data.user) {
      // Wait a bit for the trigger to create the profile
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          username: username.toLowerCase(),
          display_name: username 
        })
        .eq("id", data.user.id);

      if (profileError) {
        setError("Failed to set username. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    if (data.session) {
      router.push(redirectTo);
      return;
    }

    setMessage("Success! Check your email for verification.");
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[3rem] border border-border bg-surface/80 p-10 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-2/10 text-brand-2 ring-1 ring-brand-2/20">
            <span className="text-xl font-black">✦</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Create Account</h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Join the community and start tracking.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="username">
              Username / Pseudo Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="username" type="text" autoComplete="username" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand-2/30 transition focus:ring-2"
              value={username} onChange={(e) => {
                const value = e.target.value.toLowerCase();
                // Only allow alphanumeric and underscore
                if (/^[a-z0-9_]*$/.test(value) || value === '') {
                  setUsername(value);
                }
              }}
              disabled={submitting || isLoading}
              placeholder="your_username"
              minLength={3}
              maxLength={20}
            />
            <p className="text-[10px] font-medium text-muted-2">
              3-20 characters, letters, numbers, and underscores only. Must be unique.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email" type="email" autoComplete="email" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand-2/30 transition focus:ring-2"
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || isLoading}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="password">
              Password
            </label>
            <input
              id="password" type="password" autoComplete="new-password" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand-2/30 transition focus:ring-2"
              value={password} onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || isLoading}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-2" htmlFor="confirm">
              Confirm Password
            </label>
            <input
              id="confirm" type="password" autoComplete="new-password" required
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-foreground outline-none ring-brand-2/30 transition focus:ring-2"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting || isLoading}
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 ring-1 ring-rose-500/20">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand-2 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-2/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10">{submitting ? "PREPARING..." : "CREATE ACCOUNT"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-muted-2">
          Already a member?{" "}
          <Link href="/login" className="text-brand-2 hover:text-brand transition-colors underline-offset-4 underline cursor-pointer">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
