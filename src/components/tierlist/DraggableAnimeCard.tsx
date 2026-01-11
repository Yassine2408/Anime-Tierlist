"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Anime } from "@/types/anime";

type Props = {
  anime: Anime & { itemId?: string };
  parentId: string;
};

export function DraggableAnimeCard({ anime, parentId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: anime.id.toString(),
    data: { type: "anime", tierId: parentId, anime },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex cursor-grab flex-col items-center gap-2 rounded-3xl border border-border bg-surface/80 p-3 shadow-lg backdrop-blur-md transition-all active:cursor-grabbing hover:border-brand/30 hover:bg-surface"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-2 shadow-inner">
        {anime.imageUrl ? (
          <Image
            src={anime.imageUrl}
            alt={anime.title}
            fill
            sizes="80px"
            className="object-cover transition-transform group-hover:scale-110"
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[8px] font-black uppercase tracking-widest text-muted-2">No Image</div>
        )}
        {typeof anime.score === "number" && (
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-black text-white backdrop-blur-md shadow-sm">
            ★{anime.score.toFixed(1)}
          </div>
        )}
      </div>
      <p className="line-clamp-1 w-full text-center text-[9px] font-black uppercase tracking-wider text-foreground">
        {anime.title}
      </p>
    </div>
  );
}
