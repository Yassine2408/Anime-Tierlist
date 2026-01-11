"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 -z-10 bg-background" />
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
            <span className="text-4xl font-black">!</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">System Interrupt</h2>
            <p className="text-sm font-medium text-muted">
              An unexpected error occurred during the sync process.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-full bg-brand px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition hover:brightness-110 active:scale-95"
            >
              RETRY SYNC
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-full border border-border bg-surface/50 px-8 py-3 text-xs font-black uppercase tracking-widest text-foreground backdrop-blur-sm transition hover:bg-surface active:scale-95"
            >
              ABORT TO HOME
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
