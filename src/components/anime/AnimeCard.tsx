"use client";

import { useState } from "react";
import Image from "next/image";
import { QuickRateModal } from "./QuickRateModal";
import type { Anime } from "@/types/anime";

type Props = {
  anime: Anime;
};

export function AnimeCard({ anime }: Props) {
  const [showRateModal, setShowRateModal] = useState(false);

  return (
    <>
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
            onClick={() => setShowRateModal(true)}
            className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xl shadow-brand/30 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:brightness-110 active:scale-95"
          >
            <span className="text-sm">★</span>
            Rate Now
          </button>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-foreground">
            {anime.title}
          </h3>
          
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
            {anime.genres.slice(0, 2).map((genre) => (
              <span
                key={`${anime.id}-${genre}`}
                className="rounded-full bg-brand/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-brand ring-1 ring-brand/20"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </article>

      <QuickRateModal
        anime={showRateModal ? anime : null}
        onClose={() => setShowRateModal(false)}
      />
    </>
  );
}
