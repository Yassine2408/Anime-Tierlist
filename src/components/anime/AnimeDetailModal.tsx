"use client";

import Image from "next/image";
import type { Anime } from "@/types/anime";

type Props = {
  anime: Anime | null;
  onClose: () => void;
};

export function AnimeDetailModal({ anime, onClose }: Props) {
  if (!anime) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-border bg-surface p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-3xl font-black leading-tight text-foreground mb-2">{anime.title}</h2>
            {anime.japaneseTitle && (
              <p className="text-sm font-medium text-muted-2">{anime.japaneseTitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-surface hover:text-foreground shadow-inner cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Image */}
          <div className="flex-shrink-0">
            {anime.imageUrl ? (
              <div className="relative w-full lg:w-64 aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2 shadow-xl">
                <Image
                  src={anime.imageUrl}
                  alt={anime.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 256px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full lg:w-64 aspect-[3/4] flex items-center justify-center rounded-2xl bg-surface-2 text-muted-2 text-sm font-black uppercase tracking-widest">
                No Image
              </div>
            )}
          </div>

          {/* Right side - Details */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Score and basic info */}
            <div className="flex flex-wrap items-center gap-4">
              {typeof anime.score === "number" && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-brand">★</span>
                  <span className="text-xl font-black text-foreground">{anime.score.toFixed(1)}</span>
                </div>
              )}
              {anime.rank && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Rank</span>
                  <span className="text-sm font-black text-foreground">#{anime.rank}</span>
                </div>
              )}
              {anime.popularity && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Popularity</span>
                  <span className="text-sm font-black text-foreground">#{anime.popularity}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {anime.genres.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Genres</span>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full bg-brand/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand ring-1 ring-brand/20"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {anime.synopsis && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Synopsis</span>
                <p className="text-sm font-medium text-muted leading-relaxed">{anime.synopsis}</p>
              </div>
            )}

            {/* Additional info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              {anime.type && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Type</span>
                  <span className="text-sm font-medium text-foreground">{anime.type}</span>
                </div>
              )}
              {anime.episodes != null && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Episodes</span>
                  <span className="text-sm font-medium text-foreground">
                    {anime.episodes > 0 ? anime.episodes : anime.episodes === 0 ? "Unknown" : "Ongoing"}
                  </span>
                </div>
              )}
              {anime.status && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Status</span>
                  <span className="text-sm font-medium text-foreground">{anime.status}</span>
                </div>
              )}
              {anime.year && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Year</span>
                  <span className="text-sm font-medium text-foreground">{anime.year}</span>
                </div>
              )}
              {anime.season && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">Season</span>
                  <span className="text-sm font-medium text-foreground capitalize">{anime.season}</span>
                </div>
              )}
              {anime.url && (
                <div className="flex flex-col gap-1 col-span-2 sm:col-span-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-2">External Link</span>
                  <a
                    href={anime.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand hover:text-brand-2 transition cursor-pointer underline"
                  >
                    View on MyAnimeList
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
