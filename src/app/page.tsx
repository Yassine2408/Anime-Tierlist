"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fetchRecentCommunityFeedback, type CommunityFeedback } from "@/lib/feedback";
import { fetchAnimeById } from "@/lib/anilist";
import type { Anime } from "@/types/anime";

const AVATAR_COLORS = [
  { bg: "bg-violet-500/20", text: "text-violet-400", ring: "ring-violet-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-400", ring: "ring-cyan-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-400", ring: "ring-pink-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/30" },
  { bg: "bg-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/30" },
  { bg: "bg-rose-500/20", text: "text-rose-400", ring: "ring-rose-500/30" },
  { bg: "bg-indigo-500/20", text: "text-indigo-400", ring: "ring-indigo-500/30" },
  { bg: "bg-teal-500/20", text: "text-teal-400", ring: "ring-teal-500/30" },
];

const ADJECTIVES = ["Epic", "Casual", "Hardcore", "Veteran", "Rising", "Elite", "Obsessed", "Devoted"];
const NOUNS = ["Weeb", "Fan", "Otaku", "Watcher", "Critic", "Enthusiast", "Binger", "Collector"];

function getUserStyle(userId: string, isYou: boolean) {
  if (isYou) {
    return {
      name: "You",
      color: { bg: "bg-gold/20", text: "text-gold", ring: "ring-gold/40" },
    };
  }
  
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIdx = hash % AVATAR_COLORS.length;
  const adjIdx = hash % ADJECTIVES.length;
  const nounIdx = Math.floor(hash / 10) % NOUNS.length;
  
  return {
    name: `${ADJECTIVES[adjIdx]} ${NOUNS[nounIdx]}`,
    color: AVATAR_COLORS[colorIdx],
  };
}

export default function Home() {
  const [feedback, setFeedback] = useState<CommunityFeedback[]>([]);
  const [animeCache, setAnimeCache] = useState<Map<number, Anime>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "anime" | "episode">("all");

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchRecentCommunityFeedback(30);
      setFeedback(data);
      
      const uniqueIds = Array.from(new Set(data.map((f) => f.anime_id)));
      const cache = new Map<number, Anime>();
      // Limit concurrent fetches to avoid rate limiting
      const batchSize = 10;
      for (let i = 0; i < Math.min(uniqueIds.length, 20); i += batchSize) {
        const batch = uniqueIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (id) => {
            try {
              const anime = await fetchAnimeById(id);
              cache.set(id, anime);
            } catch (e) {
              // Silently skip failed anime fetches
            }
          })
        );
      }
      setAnimeCache(cache);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return feedback;
    return feedback.filter((f) => f.type === filter);
  }, [feedback, filter]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-2 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Live Activity</p>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Community Feed</h1>
          <p className="max-w-2xl text-sm font-medium text-muted">
            Your circle's latest ratings, episode takes, and discussions.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All Activity" />
            <FilterButton active={filter === "anime"} onClick={() => setFilter("anime")} label="Show Ratings" />
            <FilterButton active={filter === "episode"} onClick={() => setFilter("episode")} label="Episode Takes" />
          </div>
          
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-full border border-border bg-surface/50 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-foreground backdrop-blur-sm transition hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          >
            {refreshing ? "Syncing..." : "Refresh Feed"}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-32 animate-pulse rounded-[2rem] border border-border bg-surface/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-surface/30 px-6 py-24 text-center backdrop-blur-sm">
          <p className="text-sm font-black uppercase tracking-widest text-muted-2">Feed is quiet</p>
          <p className="mt-2 text-xs font-medium text-muted max-w-xs">
            Rate a show or episode to start the conversation.
          </p>
          <Link
            href="/airing"
            className="mt-6 inline-flex rounded-full bg-brand px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-xl shadow-brand/20 transition hover:brightness-110 active:scale-95"
          >
            Rate Current Season
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((item) => (
            <FeedbackCard key={item.id} feedback={item} anime={animeCache.get(item.anime_id)} />
          ))}
        </div>
      )}
    </main>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition cursor-pointer ${
        active
          ? "bg-brand text-white shadow-xl shadow-brand/20"
          : "border border-border bg-surface/50 text-foreground backdrop-blur-sm hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}

function FeedbackCard({ feedback, anime }: { feedback: CommunityFeedback; anime?: Anime }) {
  const timeAgo = formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true });
  const isYou = !!feedback.user_email;
  
  // Use username if available, otherwise fallback to generated name
  const displayName = isYou 
    ? "You" 
    : feedback.username || feedback.display_name || getUserStyle(feedback.user_id, false).name;
  
  const userStyle = getUserStyle(feedback.user_id, isYou);

  return (
    <article className="group flex gap-5 rounded-[2.5rem] border border-border bg-surface/80 p-6 shadow-xl backdrop-blur-md transition-all hover:border-brand/30 hover:shadow-brand/5">
      {anime?.imageUrl && (
        <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-surface-2 shadow-lg ring-1 ring-border">
          <Image
            src={anime.imageUrl}
            alt={anime.title}
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-110"
          />
        </div>
      )}
      
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ring-2 ${userStyle.color.bg} ${userStyle.color.text} ${userStyle.color.ring}`}>
              {displayName[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-black uppercase tracking-wide ${userStyle.color.text}`}>
                {displayName}
              </span>
              <span className="text-[9px] font-bold text-muted-2">{timeAgo}</span>
            </div>
          </div>

          <h3 className="text-lg font-black leading-tight text-foreground transition-colors group-hover:text-brand">
            {anime?.title ?? `Anime #${feedback.anime_id}`}
          </h3>
          
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ring-1 ${
              feedback.type === "anime" 
                ? "bg-brand/10 text-brand ring-brand/20" 
                : "bg-brand-2/10 text-brand-2 ring-brand-2/20"
            }`}>
              {feedback.type === "anime" ? "Series Rating" : `Episode ${feedback.episode}`}
            </span>
            {typeof feedback.rating === "number" && (
              <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 shadow-sm">
                <span className="text-sm font-black text-gold">★</span>
                <span className="text-xs font-black text-gold">{feedback.rating}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gold/60">/ 10</span>
              </div>
            )}
          </div>
        </div>

        {feedback.comment && (
          <div className="rounded-2xl border border-border bg-background/50 p-4 shadow-inner">
            <p className="text-sm font-medium leading-relaxed text-foreground">&ldquo;{feedback.comment}&rdquo;</p>
          </div>
        )}

        {anime && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-2 ring-1 ring-border"
              >
                {genre}
              </span>
            ))}
            {typeof anime.score === "number" && (
              <span className="ml-auto text-[10px] font-bold text-muted-2">
                MAL ★ {anime.score.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
