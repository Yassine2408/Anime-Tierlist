"use client";

import Link from "next/link";
import { useMemo } from "react";

type ShareModalProps = {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  isPublic: boolean;
  onTogglePublic: () => void;
  onCopy?: () => void;
};

export function ShareModal({ open, onClose, shareUrl, isPublic, onTogglePublic, onCopy }: ShareModalProps) {
  const encoded = useMemo(() => encodeURIComponent(shareUrl || ""), [shareUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[3rem] border border-border bg-surface shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Broadcast</h3>
            <p className="text-xs font-medium text-muted">
              {isPublic
                ? "Share your collection with the community."
                : "Make it public to generate a link."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-surface hover:text-foreground shadow-inner cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-2">Visibility</span>
              <span className="text-sm font-black text-foreground">{isPublic ? "Public Access" : "Restricted"}</span>
            </div>
            <button
              onClick={onTogglePublic}
              className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition cursor-pointer ${
                isPublic ? "bg-brand shadow-lg shadow-brand/20" : "bg-muted shadow-lg shadow-muted/20"
              }`}
            >
              {isPublic ? "Disable" : "Enable"}
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-2">Direct Link</p>
            <div className="flex items-center gap-2">
              <input
                value={shareUrl || "Awaiting public status..."}
                readOnly
                className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-foreground outline-none shadow-inner"
              />
              <button
                onClick={() => {
                  if (!shareUrl) return;
                  onCopy?.();
                }}
                disabled={!shareUrl}
                className="rounded-xl bg-brand px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-xl shadow-brand/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-2">Channels</span>
            <SocialButton href={`https://twitter.com/intent/tweet?url=${encoded}`} label="TWITTER" />
            <SocialButton href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} label="FACEBOOK" />
            <SocialButton href={`https://www.reddit.com/submit?url=${encoded}`} label="REDDIT" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="rounded-full border border-border bg-surface-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-foreground transition hover:bg-brand/10 hover:text-brand hover:border-brand/30 shadow-sm cursor-pointer"
    >
      {label}
    </Link>
  );
}
