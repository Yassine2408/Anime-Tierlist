"use client";

import { useState } from "react";
import Image from "next/image";
import { submitAnimeFeedback, submitEpisodeFeedback } from "@/lib/feedback";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Anime } from "@/types/anime";

type Props = {
  anime: Anime | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function QuickRateModal({ anime, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"anime" | "episode">("anime");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [episode, setEpisode] = useState<number | "">("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { supabase, user } = useAuth();

  if (!anime) return null;

  const handleSubmit = async () => {
    if (!user) {
      showToast("Login required to rate", "error");
      return;
    }

    if (rating === 0) {
      showToast("Pick a rating first", "error");
      return;
    }

    if (mode === "episode" && episode === "") {
      showToast("Enter episode number", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "anime") {
        await submitAnimeFeedback(supabase, {
          anime_id: anime.id,
          rating,
          comment: comment.trim() || null,
        });
        showToast("Series rating posted to feed", "success");
      } else {
        await submitEpisodeFeedback(supabase, {
          anime_id: anime.id,
          episode: Number(episode),
          rating,
          comment: comment.trim() || null,
        });
        showToast(`Episode ${episode} rating posted to feed`, "success");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to submit rating", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[3rem] border border-border bg-surface p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-6">
          {anime.imageUrl && (
            <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-2 shadow-xl">
              <Image src={anime.imageUrl} alt={anime.title} fill sizes="96px" className="object-cover" />
            </div>
          )}
          
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-xl font-black leading-tight text-foreground line-clamp-2">{anime.title}</h3>
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand ring-1 ring-brand/20">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-surface hover:text-foreground shadow-inner"
          >
            ✕
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-full border border-border bg-background/50 p-1">
            <button
              onClick={() => setMode("anime")}
              className={`flex-1 rounded-full py-2 text-[10px] font-black uppercase tracking-widest transition ${
                mode === "anime"
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Series
            </button>
            <button
              onClick={() => setMode("episode")}
              className={`flex-1 rounded-full py-2 text-[10px] font-black uppercase tracking-widest transition ${
                mode === "episode"
                  ? "bg-brand-2 text-white shadow-lg shadow-brand-2/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Episode
            </button>
          </div>

          {/* Episode Number (only in episode mode) */}
          {mode === "episode" && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Episode Number</p>
              <input
                type="number"
                min={1}
                value={episode}
                onChange={(e) => setEpisode(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-2xl border border-border bg-surface-2 px-4 py-3 text-center text-lg font-black text-foreground outline-none ring-brand-2/20 transition focus:ring-2"
                placeholder="Enter episode #"
              />
            </div>
          )}

          {/* Star Rating */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Your Rating</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
                >
                  <span
                    className={`text-2xl transition-all ${
                      star <= (hoveredRating || rating)
                        ? "text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        : "text-muted-2"
                    }`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-black text-gold">
                {rating} / 10
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Your Take (Optional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts with the community..."
              className="h-24 resize-none rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium text-foreground outline-none ring-brand/20 transition placeholder:text-muted-2 focus:ring-2"
              maxLength={500}
            />
            <p className="text-right text-[9px] font-bold text-muted-2">{comment.length} / 500</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-brand py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">{submitting ? "SYNCING..." : "POST TO FEED"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
