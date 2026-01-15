"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { FilterPanel } from "@/components/anime/FilterPanel";
import { SearchBar } from "@/components/anime/SearchBar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { submitEpisodeFeedback } from "@/lib/feedback";
import { fetchTopAnime, searchAnime } from "@/lib/jikan";
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
            className="group relative flex items-center gap-3 rounded-full bg-surface-2 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground ring-1 ring-border shadow-xl transition-all hover:bg-surface hover:ring-brand active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Loading..." : "Load More"}
            <span className="h-1.5 w-1.5 rounded-full bg-brand group-hover:animate-ping" />
          </button>
        </div>
      )}
    </main>
  );
}

/**
 * AiringCard component for episode rating
 * 
 * NOTE: This component appears to be unused in the current implementation.
 * The main page uses AnimeCard which opens QuickRateModal for rating.
 * 
 * Consider deprecating this component in favor of QuickRateModal for:
 * - Consistent validation logic across the application
 * - Better UX with episode dropdown/selector
 * - Unified error handling and user feedback
 * 
 * If this component is to be kept, ensure validation logic matches QuickRateModal
 * to maintain consistency. Current validation has been updated to match.
 */
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
  const { supabase } = useAuth();

  const avgText = useMemo(() => {
    if (!summary || !summary.count) return "—";
    return summary.avg.toFixed(1);
  }, [summary]);

  const handleEpisodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation order matches QuickRateModal for consistency
    
    // Check rating first (matches QuickRateModal line 115-118)
    if (epRating === "" || Number(epRating) === 0) {
      showToast("Pick a rating first", "error");
      return;
    }

    // Validate rating is a positive integer in expected range (1-10)
    const ratingNum = Number(epRating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      showToast("Rating must be between 1 and 10", "error");
      return;
    }

    // Check episode number (matches QuickRateModal validation)
    if (ep === "" || ep === null) {
      showToast("Enter an episode number", "error");
      return;
    }

    const episodeNum = Number(ep);
    
    // Enhanced validation matching QuickRateModal logic
    // Basic validation: episode must be a positive integer
    if (!Number.isInteger(episodeNum) || episodeNum < 1) {
      showToast("Episode number must be a positive integer (at least 1)", "error");
      return;
    }

    // Basic validation: episode must not exceed reasonable upper limit
    if (episodeNum > 9999) {
      showToast("Episode number cannot exceed 9999", "error");
      return;
    }

    // Advanced validation: check against anime's episode count if available
    // Only validate if anime has a known positive episode count
    // For ongoing anime (episodes === null) or unknown count (episodes === 0), allow submission
    if (anime.episodes != null && typeof anime.episodes === "number" && anime.episodes > 0) {
      if (episodeNum > anime.episodes) {
        showToast(
          `This anime only has ${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}. Episode ${episodeNum} does not exist.`,
          "error"
        );
        return;
      }
    }
    // If episode count is null (ongoing anime) or 0 (unknown), we allow the submission
    // because new episodes may have aired since the last API update
    // The database constraint (episode <= 9999) still provides protection

    setSubmitting(true);
    try {
      await submitEpisodeFeedback(supabase, {
        anime_id: anime.id,
        episode: episodeNum,
        rating: ratingNum,
        comment: epComment.trim() || null,
      });
      showToast(`Episode ${episodeNum} rating posted to feed`, "success");
      setEp("");
      setEpRating("");
      setEpComment("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit rating";
      showToast(errorMessage, "error");
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
            loading="lazy"
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
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold uppercase tracking-wider text-muted-2">
              {anime.episodes != null && anime.episodes > 0 
                ? `${anime.episodes} Episode${anime.episodes === 1 ? "" : "s"}`
                : anime.episodes === 0 
                  ? "Episodes Unknown"
                  : "Ongoing"}
            </span>
            {anime.episodes != null && anime.episodes > 0 && (
              <span className="text-[7px] font-medium text-muted-2 mt-0.5">
                Max: {anime.episodes}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
