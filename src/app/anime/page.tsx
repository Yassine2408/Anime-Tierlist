"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { FilterPanel } from "@/components/anime/FilterPanel";
import { SearchBar } from "@/components/anime/SearchBar";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchTopAnime, searchAnime } from "@/lib/anilist";
import type { Anime } from "@/types/anime";

type FilterState = {
  genre: string;
  year: string;
  minScore: string;
};

const PAGE_SIZE = 25;

export default function AnimePage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({ genre: "", year: "", minScore: "" });
  const [anime, setAnime] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredAnime = useMemo(() => {
    return anime.filter((item) => {
      const matchesGenre =
        !filters.genre ||
        item.genres.some((g) => g.toLowerCase() === filters.genre.toLowerCase());
      const matchesYear = !filters.year || item.year === Number(filters.year);
      const matchesScore = !filters.minScore || (item.score ?? 0) >= Number(filters.minScore);
      return matchesGenre && matchesYear && matchesScore;
    });
  }, [anime, filters]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = query
          ? await searchAnime(query, PAGE_SIZE, 1)
          : await fetchTopAnime(PAGE_SIZE, 1);
        if (cancelled) return;
        setAnime(data.items);
        setPage(1);
        setHasNext(data.hasNextPage);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to sync library.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loadMore = async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const data = query
        ? await searchAnime(query, PAGE_SIZE, nextPage)
        : await fetchTopAnime(PAGE_SIZE, nextPage);
      setAnime((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasNext(data.hasNextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Discover</p>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground">Anime Library</h1>
          <p className="max-w-2xl text-sm font-medium text-muted">
            Explore thousands of titles, rate your favorites, and share with your circle.
          </p>
        </div>
        
        <div className="flex flex-col gap-5">
          <SearchBar onSearch={(value) => setQuery(value)} />
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>
      </header>

      {error && (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-bold text-red-400 backdrop-blur-md">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading && filteredAnime.length === 0
          ? Array.from({ length: 15 }).map((_, idx) => <AnimeCardSkeleton key={idx} />)
          : filteredAnime.map((item) => <AnimeCard key={item.id} anime={item} />)}
        
        {!loading && filteredAnime.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-surface/30 px-6 py-20 text-center backdrop-blur-sm">
            <p className="text-sm font-black uppercase tracking-widest text-muted-2">No matches found</p>
            <p className="mt-2 text-xs font-medium text-muted max-w-xs">Try adjusting your filters or search query.</p>
          </div>
        )}
      </section>

      {hasNext && filteredAnime.length > 0 && (
        <div className="flex items-center justify-center pb-8 pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group relative flex items-center gap-3 rounded-full bg-surface-2 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground ring-1 ring-border shadow-xl transition-all hover:bg-surface hover:ring-brand active:scale-95 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
            <span className="h-1.5 w-1.5 rounded-full bg-brand group-hover:animate-ping" />
          </button>
        </div>
      )}
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
  const [ep, setEp] = useState<number | "">("");
  const [epRating, setEpRating] = useState<number | "">("");
  const [epComment, setEpComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const avgText = useMemo(() => {
    if (!summary || !summary.count) return "—";
    return summary.avg.toFixed(1);
  }, [summary]);

  const handleEpisodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (ep === "" || epRating === "") {
      showToast("Fill episode # and rating", "error");
      return;
    }
    setSubmitting(true);
    try {
      await submitEpisodeFeedback({
        anime_id: anime.id,
        episode: Number(ep),
        rating: Number(epRating),
        comment: epComment.trim() || null,
      });
      showToast(`Ep ${ep} synced to feed`, "success");
      setEp("");
      setEpRating("");
      setEpComment("");
    } catch (err) {
      showToast("Login required", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
          Rate Series
        </button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-foreground">
          {anime.title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-2">Community</span>
            <span className="text-xs font-black text-brand-2">{avgText} ★</span>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wider text-muted-2">
            {anime.episodes ?? "?"} Episodes
          </span>
        </div>
      </div>
    </article>
  );
}
