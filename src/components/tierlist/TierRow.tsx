"use client";

import Image from "next/image";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DraggableAnimeCard } from "./DraggableAnimeCard";
import type { Anime } from "@/types/anime";

export type Tier = {
  id: string;
  label: string;
  color: string;
  items: Array<Anime & { itemId?: string }>;
};

type Props = {
  tier: Tier;
  readOnly?: boolean;
};

function StaticAnimeCard({ anime }: { anime: Anime }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-3 shadow-lg backdrop-blur-md transition-all hover:border-brand/30">
      <div className="relative h-12 w-9 overflow-hidden rounded-xl bg-surface-2 shadow-inner">
        {anime.imageUrl ? (
          <Image src={anime.imageUrl} alt={anime.title} fill sizes="40px" className="object-cover transition-transform group-hover:scale-110" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col">
        <p className="line-clamp-1 text-[10px] font-black uppercase tracking-wider text-foreground group-hover:text-brand transition-colors">{anime.title}</p>
        {typeof anime.score === "number" && (
          <span className="text-[9px] font-bold text-gold">★ {anime.score.toFixed(1)}</span>
        )}
      </div>
    </div>
  );
}

export function TierRow({ tier, readOnly }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id, data: { type: "tier" } });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 rounded-[2.5rem] border border-border bg-surface/50 p-6 shadow-xl backdrop-blur-md transition-all ${
        !readOnly && isOver ? "ring-2 ring-brand/40 shadow-brand/10 bg-surface" : ""
      }`}
      style={{ borderLeft: `8px solid ${tier.color}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white shadow-lg"
          style={{ backgroundColor: tier.color, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          {tier.label}
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Tier Status</p>
          <p className="text-[9px] font-bold text-muted-2">
            {tier.items.length} {tier.items.length === 1 ? "Collection" : "Collections"} Indexed
          </p>
        </div>
      </div>

      {readOnly ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tier.items.map((anime) => (
            <StaticAnimeCard key={anime.id} anime={anime} />
          ))}
          {tier.items.length === 0 && (
            <div className="col-span-full py-8 text-center rounded-[2rem] border border-dashed border-border bg-background/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-2 italic">Empty Tier</p>
            </div>
          )}
        </div>
      ) : (
        <SortableContext
          id={tier.id}
          items={tier.items.map((item) => item.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tier.items.map((anime) => (
              <DraggableAnimeCard key={anime.id} anime={anime} parentId={tier.id} />
            ))}
            {tier.items.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-[2rem] border border-dashed border-border bg-background/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-2 italic">Drop titles here</p>
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
