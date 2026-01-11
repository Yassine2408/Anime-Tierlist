"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TierListPreview } from "./TierListPreview";
import { TierListPreviewSkeleton } from "./TierListPreviewSkeleton";
import { deleteTierList, getUserTierLists, runOptimistic, saveTierList } from "@/lib/database";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { TierListWithItems } from "@/types/database";

type Props = {
  initialLists: TierListWithItems[];
};

type SortOption = "updated_desc" | "updated_asc" | "created_desc" | "created_asc" | "title_asc";

export function DashboardClient({ initialLists }: Props) {
  const [lists, setLists] = useState<TierListWithItems[]>(initialLists);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");
  const { showToast } = useToast();
  const { supabase } = useAuth();

  const sorted = useMemo(() => {
    const copy = [...lists];
    switch (sortBy) {
      case "updated_asc":
        return copy.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
      case "updated_desc":
        return copy.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      case "created_asc":
        return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
      case "created_desc":
        return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
      case "title_asc":
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return copy;
    }
  }, [lists, sortBy]);

  const refresh = async () => {
    setLoading(true);
    try {
      const updated = await getUserTierLists(supabase);
      setLists(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await runOptimistic({
      applyLocal: () => setLists((prev) => prev.filter((item) => item.id !== id)),
      rollback: refresh,
      action: () => deleteTierList(supabase, id),
    });
    showToast("Tier list removed from circle", "success");
  };

  const handleDuplicate = async (tierList: TierListWithItems) => {
    const orderedItems = [...tierList.items].sort((a, b) => {
      if (a.tier_rank === b.tier_rank) return a.position - b.position;
      return a.tier_rank.localeCompare(b.tier_rank);
    });

    const payload = {
      title: `Copy of ${tierList.title}`,
      items: orderedItems.map((item) => ({
        anime_id: item.anime_id,
        tier_rank: item.tier_rank,
        position: item.position,
      })),
    };
    const newList = await saveTierList(supabase, payload);
    setLists((prev) => [{ ...tierList, id: newList.id, title: payload.title, created_at: newList.created_at, updated_at: newList.updated_at, items: tierList.items }, ...prev]);
    showToast("Community list duplicated", "success");
  };

  const handleShare = async (tierList: TierListWithItems) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl =
      tierList.is_public && tierList.share_id
        ? `${origin}/tierlist/public/${tierList.share_id}`
        : `${origin}/tierlist/${tierList.id}`;
    await navigator.clipboard.writeText(shareUrl);
    showToast("Share link copied", "success");
  };

  return (
    <div className="flex flex-col gap-10 py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">Community Hub</p>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Your Circle</h1>
          <p className="text-sm font-medium text-muted">Manage your rankings and shared collections.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="rounded-full border border-border bg-surface/50 px-4 py-2 text-xs font-bold text-foreground outline-none ring-brand/20 transition focus:ring-2 backdrop-blur-md"
          >
            <option value="updated_desc">Recently Modified</option>
            <option value="updated_asc">Oldest Modified</option>
            <option value="created_desc">Newest Created</option>
            <option value="created_asc">Oldest Created</option>
            <option value="title_asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <TierListPreviewSkeleton key={idx} />
          ))}
        </div>
      )}

      {!loading &&
        (sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border bg-surface/30 px-6 py-24 text-center backdrop-blur-sm">
            <p className="text-sm font-black uppercase tracking-widest text-muted-2">Your circle is empty</p>
            <p className="mt-2 text-xs font-medium text-muted max-w-xs">Start creating tier lists to see them appear here in your community hub.</p>
            <Link
              href="/tierlist/create"
              className="mt-6 inline-flex rounded-full bg-brand px-6 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-xl shadow-brand/20 transition hover:brightness-110 active:scale-95"
            >
              Create First List
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((tierList) => (
              <TierListPreview
                key={tierList.id}
                tierList={tierList}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onShare={handleShare}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
