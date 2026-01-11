"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { fetchSeasonalAnime } from "@/lib/anilist";
import { submitEpisodeFeedback, fetchAnimeFeedbackSummary } from "@/lib/feedback";
import { QuickRateModal } from "@/components/anime/QuickRateModal";
import { useToast } from "@/components/ui/ToastProvider";
import type { Anime } from "@/types/anime";

export default function AiringPage() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<number, { avg: number; count: number }>>({});
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSeasonalAnime();
      setAnime(data.items);
      const ids = data.items.map((a) => a.id);
      const agg = await fetchAnimeFeedbackSummary(ids);
      setSummaries(agg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync airing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const refreshSummaries = async () => {
    const ids = anime.map((a) => a.id);
    const agg = await fetchAnimeFeedbackSummary(ids);
    setSummaries(agg);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-2 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Live Season</p>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Currently Airing</h1>
          <p className="text-sm font-medium text-muted">Rate shows as they drop—your circle sees it instantly.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-border bg-surface/50 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-foreground backdrop-blur-sm transition hover:bg-surface disabled:opacity-50 active:scale-95"
        >
          {loading ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-medium text-red-400 backdrop-blur-md">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading && anime.length === 0
          ? Array.from({ length: 15 }).map((_, idx) => (
              <div key={idx} className="aspect-[3/4] animate-pulse rounded-[2rem] border border-border bg-surface/30" />
            ))
          : anime.map((item) => (
              <AiringCard
                key={item.id}
                anime={item}
                summary={summaries[item.id]}
                onRate={() => setSelectedAnime(item)}
              />
            ))}
      </section>

      <QuickRateModal
        anime={selectedAnime}
        onClose={() => setSelectedAnime(null)}
        onSuccess={refreshSummaries}
      />
    </main>
  );
}

function AiringCard({
  anime,
  summary,
  onRate,
}: {
  anime: Anime;
  summary?: { avg: number; count: number };
  onRate: () => void;
}) {
  const avgText = useMemo(() => {
    if (!summary || !summary.count) return "—";
    return summary.avg.toFixed(1);
  }, [summary]);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-surface/80 shadow-xl transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-brand/10">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-2">
        {anime.imageUrl ? (
          <Image
            src={anime.imageUrl}
            alt={anime.title}
            fill
            sizes="(min-width: 1280px) 180px, (min-width: 1024px) 200px, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-all duration-700 group-hover:scale-110"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-2">
            No Image
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {typeof anime.score === "number" && (
          <div className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md shadow-lg">
            ★ {anime.score.toFixed(1)}
          </div>
        )}

        <button
          onClick={onRate}
          className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xl shadow-brand/30 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:brightness-110 active:scale-95"
        >
          <span className="text-sm">★</span>
          Rate Now
        </button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-foreground transition-colors group-hover:text-brand">
          {anime.title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-2">Circle Avg</span>
            <span className="text-xs font-black text-brand-2">{avgText}</span>
          </div>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-foreground ring-1 ring-border">
            {anime.episodes ?? "?"} Eps
          </span>
        </div>
      </div>
    </article>
  );
}
