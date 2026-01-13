"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchTrendingAnime, type TrendingAnime } from "@/lib/feedback";
import { fetchAnimeById } from "@/lib/anilist";
import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";
import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import type { Anime } from "@/types/anime";

export default function TrendingPage() {
  const [trending, setTrending] = useState<TrendingAnime[]>([]);
  const [animeMap, setAnimeMap] = useState<Map<number, Anime>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch trending anime data
        const trendingData = await fetchTrendingAnime(100);
        if (cancelled) return;

        // Filter to only include completed/aired anime
        // An anime is considered "aired" if:
        // - episodes is null (ongoing, but we'll allow it if it has ratings)
        // - episodes > 0 (completed with known episode count)
        // We'll filter out episodes === 0 (unknown) as those are likely not aired yet
        
        // Fetch anime details for all trending anime
        const animeDetails = new Map<number, Anime>();
        const batchSize = 10;
        
        for (let i = 0; i < trendingData.length; i += batchSize) {
          const batch = trendingData.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (item) => {
              try {
                const anime = await fetchAnimeById(item.anime_id);
                // Only include if anime is completed (episodes > 0) or ongoing (episodes === null)
                // Exclude unknown (episodes === 0)
                if (anime.episodes === null || (anime.episodes != null && anime.episodes > 0)) {
                  animeDetails.set(item.anime_id, anime);
                }
              } catch (e) {
                // Silently skip failed fetches
              }
            })
          );
        }

        if (cancelled) return;

        // Filter trending to only include anime we successfully fetched
        const filteredTrending = trendingData.filter((item) => animeDetails.has(item.anime_id));
        
        setTrending(filteredTrending);
        setAnimeMap(animeDetails);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load trending anime");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTrending();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnimeClick = (animeId: number) => {
    const anime = animeMap.get(animeId);
    if (anime) {
      setSelectedAnime(anime);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-2 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Community</p>
        </div>
        <h1 className="text-5xl font-black tracking-tight text-foreground">Trending Anime</h1>
        <p className="max-w-2xl text-sm font-medium text-muted">
          Top-rated anime based on community votes. Only completed and currently airing series are shown.
        </p>
      </header>

      {error && (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-6 py-4 text-sm font-bold text-red-400 backdrop-blur-md">
          {error}
        </div>
      )}

      {loading ? (
        <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 20 }).map((_, idx) => (
            <AnimeCardSkeleton key={idx} />
          ))}
        </section>
      ) : trending.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-surface/30 px-6 py-20 text-center backdrop-blur-sm">
          <p className="text-sm font-black uppercase tracking-widest text-muted-2">No trending anime yet</p>
          <p className="mt-2 text-xs font-medium text-muted max-w-xs">
            Be the first to rate an anime and help build the trending list!
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {trending.map((item, index) => {
            const anime = animeMap.get(item.anime_id);
            if (!anime) return null;

            return (
              <article
                key={item.anime_id}
                onClick={() => handleAnimeClick(item.anime_id)}
                className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border bg-surface/80 shadow-xl transition-all hover:-translate-y-1 hover:border-brand-2/40 hover:shadow-brand-2/10 cursor-pointer"
              >
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

                  {/* Rank badge */}
                  <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md shadow-lg">
                    #{index + 1}
                  </div>

                  {/* Rating badge */}
                  <div className="absolute right-2 top-2 rounded-full border border-white/10 bg-brand-2/90 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur-md shadow-lg">
                    ★ {item.avg_rating}
                  </div>

                  {/* Votes count overlay on hover */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div className="rounded-full bg-surface/90 backdrop-blur-sm px-3 py-1.5 text-center">
                      <p className="text-[9px] font-black uppercase tracking-wider text-foreground">
                        {item.rating_count} {item.rating_count === 1 ? "vote" : "votes"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-foreground">
                    {anime.title}
                  </h3>

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-2">
                        Community Rating
                      </span>
                      <span className="text-xs font-black text-brand-2">
                        {item.avg_rating.toFixed(1)} ★ ({item.rating_count})
                      </span>
                    </div>
                    {anime.episodes != null && anime.episodes > 0 && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-2">
                          {anime.episodes} Episodes
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {anime.genres.slice(0, 2).map((genre) => (
                      <span
                        key={`${anime.id}-${genre}`}
                        className="rounded-full bg-brand-2/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-brand-2 ring-1 ring-brand-2/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <AnimeDetailModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
    </main>
  );
}
