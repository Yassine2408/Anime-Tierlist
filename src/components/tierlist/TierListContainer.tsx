"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toPng } from "html-to-image";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { DraggableAnimeCard } from "./DraggableAnimeCard";
import { ShareModal } from "./ShareModal";
import { TierRow, type Tier } from "./TierRow";
import { fetchTopAnime } from "@/lib/anilist";
import { saveTierList, updateTierList } from "@/lib/database";
import type { Anime } from "@/types/anime";
import { useRouter } from "next/navigation";

type TierForm = {
  label: string;
  color: string;
};

const DEFAULT_TIERS: Tier[] = [
  { id: "tier-s", label: "S", color: "var(--color-gold)", items: [] },
  { id: "tier-a", label: "A", color: "#f97316", items: [] },
  { id: "tier-b", label: "B", color: "#fbbf24", items: [] },
  { id: "tier-c", label: "C", color: "#22c55e", items: [] },
  { id: "tier-d", label: "D", color: "#38bdf8", items: [] },
  { id: "tier-f", label: "F", color: "#a3a3a3", items: [] },
];

type TierListContainerProps = {
  tierListId?: string;
  initialTiers?: Tier[];
  initialPool?: Array<Anime & { itemId?: string }>;
  initialTitle?: string;
  isPublic?: boolean;
  shareId?: string | null;
  readOnly?: boolean;
  onTogglePublic?: (next: boolean) => Promise<string | null> | string | null;
  onSave?: (data: { title: string; tiers: Tier[] }) => Promise<void>;
  saveLabel?: string;
};

export function TierListContainer({
  tierListId,
  initialTiers,
  initialPool,
  initialTitle = "Untitled Collection",
  isPublic = false,
  shareId = null,
  readOnly = false,
  onTogglePublic,
  onSave,
  saveLabel = "Save Changes",
}: TierListContainerProps) {
  const [tiers, setTiers] = useState<Tier[]>(initialTiers ?? DEFAULT_TIERS);
  const [pool, setPool] = useState<Array<Anime & { itemId?: string }>>(initialPool ?? []);
  const [loadingPool, setLoadingPool] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localTitle, setLocalTitle] = useState(initialTitle);
  const [newTier, setNewTier] = useState<TierForm>({ label: "New", color: "#a78bfa" });
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [shareIdState, setShareIdState] = useState<string | null>(shareId);
  const [shareOpen, setShareOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ tiers: Tier[]; pool: Array<Anime & { itemId?: string }> }[]>([]);
  
  const { showToast } = useToast();
  const { supabase, user } = useAuth();
  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setIsPublicState(isPublic);
    setShareIdState(shareId);
  }, [isPublic, shareId]);

  useEffect(() => {
    if (readOnly || initialPool?.length) return;
    let cancelled = false;
    const load = async () => {
      setLoadingPool(true);
      setError(null);
      try {
        const data = await fetchTopAnime(20, 1);
        if (cancelled) return;
        setPool(data.items);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to sync anime data.");
      } finally {
        if (!cancelled) setLoadingPool(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [initialPool, readOnly]);

  const { setNodeRef: setPoolRef, isOver: isOverPool } = useDroppable({
    id: "pool",
    data: { type: "pool" },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { type: string; tierId: string; anime: Anime };
    if (activeData?.type !== "anime") return;

    const sourceTierId = activeData.tierId;
    const targetId = over.data.current?.tierId || (over.id as string);

    if (!targetId) return;
    if (sourceTierId === targetId && over.id === active.id) return;

    pushHistory();
    if (targetId === "pool") {
      moveToPool(activeData.anime, sourceTierId);
      return;
    }
    moveToTier(activeData.anime, sourceTierId, targetId, over.id as string);
  };

  const moveToPool = (anime: Anime, sourceTierId: string) => {
    setTiers((prev) =>
      prev.map((tier) =>
        tier.id === sourceTierId ? { ...tier, items: tier.items.filter((i) => i.id !== anime.id) } : tier
      )
    );
    setPool((prev) => {
      if (prev.some((item) => item.id === anime.id)) return prev;
      return [...prev, anime];
    });
  };

  const moveToTier = (anime: Anime, sourceTierId: string, targetTierId: string, overId: string) => {
    setPool((prev) => prev.filter((item) => item.id !== anime.id));
    setTiers((prev) => {
      const next = prev.map((tier) => ({ ...tier, items: [...tier.items] }));
      const sourceTier = next.find((tier) => tier.id === sourceTierId);
      const targetTier = next.find((tier) => tier.id === targetTierId);
      if (!targetTier) return prev;

      if (sourceTier) {
        sourceTier.items = sourceTier.items.filter((item) => item.id !== anime.id);
      }

      const existingIndex = targetTier.items.findIndex((item) => item.id === anime.id);
      if (existingIndex >= 0) targetTier.items.splice(existingIndex, 1);

      const overIndex = targetTier.items.findIndex((item) => item.id.toString() === overId.toString());
      if (overIndex >= 0) {
        targetTier.items.splice(overIndex, 0, anime);
      } else {
        targetTier.items.push(anime);
      }
      return next;
    });
  };

  const pushHistory = () => {
    historyRef.current = [
      { tiers: JSON.parse(JSON.stringify(tiers)), pool: JSON.parse(JSON.stringify(pool)) },
      ...historyRef.current,
    ].slice(0, 50);
  };

  const undo = () => {
    const [last, ...rest] = historyRef.current;
    if (!last) return;
    setTiers(last.tiers);
    setPool(last.pool);
    historyRef.current = rest;
  };

  const addTier = () => {
    if (!newTier.label.trim()) return;
    pushHistory();
    setTiers((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}`,
        label: newTier.label.trim(),
        color: newTier.color,
        items: [],
      },
    ]);
    setNewTier({ label: "New", color: "#a78bfa" });
  };

  const removeTier = (tierId: string) => {
    pushHistory();
    setTiers((prev) => {
      if (prev.length <= 1) return prev;
      const tier = prev.find((t) => t.id === tierId);
      const remaining = prev.filter((t) => t.id !== tierId);
      if (!tier) return prev;
      setPool((poolPrev) => {
        const combined = [...poolPrev, ...tier.items];
        const seen = new Set<number>();
        return combined.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
      return remaining;
    });
  };

  const updateTier = (tierId: string, update: Partial<Pick<Tier, "label" | "color">>) => {
    pushHistory();
    setTiers((prev) => prev.map((tier) => (tier.id === tierId ? { ...tier, ...update } : tier)));
  };

  const handleSave = async () => {
    if (!user) {
      showToast("Please login to save", "error");
      return;
    }
    setSaving(true);
    try {
      if (onSave) {
        await onSave({ title: localTitle, tiers });
        showToast("Ranking synced", "success");
      } else {
        const items = tiers.flatMap((tier) =>
          tier.items.map((item, idx) => ({
            anime_id: item.id,
            tier_rank: tier.label,
            position: idx,
          }))
        );

        if (tierListId) {
          await updateTierList(supabase, {
            id: tierListId,
            title: localTitle,
            items,
            is_public: isPublicState,
            share_id: shareIdState,
          });
          showToast("Ranking synced", "success");
        } else {
          const result = await saveTierList(supabase, {
            title: localTitle,
            items,
            is_public: isPublicState,
            share_id: shareIdState,
          });
          showToast("New collection created", "success");
          router.push(`/tierlist/${result.id}?edit=1`);
        }
      }
    } catch (err) {
      showToast("Failed to save collection", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    const next = !isPublicState;
    let nextShareId = next ? shareIdState ?? generateShareId() : null;
    
    if (onTogglePublic) {
      const result = await onTogglePublic(next);
      nextShareId = result ?? nextShareId;
    }
    
    setIsPublicState(next);
    setShareIdState(nextShareId);

    if (!onTogglePublic && tierListId) {
      try {
        await updateTierList(supabase, {
          id: tierListId,
          is_public: next,
          share_id: nextShareId,
        });
        showToast(next ? "Collection is now public" : "Collection is now private", "success");
      } catch (err) {
        showToast("Failed to update visibility", "error");
      }
    }
    if (!next) setShareOpen(false);
  };

  const shareUrl = useMemo(() => {
    if (!shareIdState) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/tierlist/public/${shareIdState}`;
  }, [shareIdState]);

  const handleExportImage = useCallback(async () => {
    if (!captureRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(captureRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${localTitle || "ranking"}.png`;
      link.href = dataUrl;
      link.click();
      showToast("Exported to Image", "success");
    } finally {
      setExporting(false);
    }
  }, [localTitle, showToast]);

  useEffect(() => {
    if (readOnly) return;
    const handler = (event: KeyboardEvent) => {
      const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z";
      if (isUndo) {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [readOnly, tiers, pool]);

  const tierListContent = (
    <div className="flex flex-col gap-4" ref={captureRef}>
      {tiers.map((tier) => (
        <TierRow key={tier.id} tier={tier} readOnly={readOnly} />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr,320px]">
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            {!readOnly ? (
              <input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                className="w-full max-w-md rounded-2xl border border-border bg-surface/50 px-5 py-2.5 text-lg font-black tracking-tight text-foreground outline-none ring-brand/20 focus:ring-2 backdrop-blur-md"
                placeholder="Name your collection..."
              />
            ) : (
              <h2 className="text-2xl font-black tracking-tight text-foreground">{localTitle}</h2>
            )}
          </div>
          
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSave} disabled={saving}
                className="rounded-full bg-brand px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "SYNCING..." : saveLabel.toUpperCase()}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="rounded-full border border-border bg-surface/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-foreground backdrop-blur-sm transition hover:bg-surface active:scale-95 cursor-pointer"
              >
                SHARE
              </button>
              <button
                onClick={handleExportImage} disabled={exporting}
                className="rounded-full border border-border bg-surface/50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-foreground backdrop-blur-sm transition hover:bg-surface active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {exporting ? "..." : "EXPORT"}
              </button>
            </div>
          )}
        </header>

        {readOnly ? (
          tierListContent
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {tierListContent}

            <div className="mt-6 rounded-[3rem] border border-border bg-surface/30 p-8 backdrop-blur-md">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-2" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Available Titles</h3>
                </div>
                {loadingPool && <span className="text-[10px] font-bold text-brand-2 animate-pulse">SYNCING DATA...</span>}
              </div>
              <SortableContext
                id="pool"
                items={pool.map((item) => item.id.toString())}
                strategy={horizontalListSortingStrategy}
              >
                <div
                  ref={setPoolRef}
                  className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                    isOverPool ? "ring-2 ring-brand-2/40 rounded-3xl" : ""
                  }`}
                >
                  {pool.map((anime) => (
                    <DraggableAnimeCard key={anime.id} anime={anime} parentId="pool" />
                  ))}
                  {pool.length === 0 && !loadingPool && (
                    <div className="col-span-full py-12 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-2 italic">No more titles in pool</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          </DndContext>
        )}
      </section>

      {!readOnly && (
        <aside className="flex flex-col gap-6">
          <div className="rounded-[2.5rem] border border-border bg-surface/80 p-6 shadow-xl backdrop-blur-md">
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand">Configure Tiers</h3>
            
            <div className="flex flex-col gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="group relative flex items-center gap-3"
                >
                  <div className="h-8 w-1 rounded-full" style={{ backgroundColor: tier.color }} />
                  <input
                    value={tier.label}
                    onChange={(e) => updateTier(tier.id, { label: e.target.value })}
                    className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none transition group-hover:text-brand"
                  />
                  <input
                    type="color"
                    value={tier.color.startsWith("var(") ? "#fbbf24" : tier.color}
                    onChange={(e) => updateTier(tier.id, { color: e.target.value })}
                    className="h-6 w-6 cursor-pointer rounded-lg border-none bg-transparent"
                  />
                  <button
                    onClick={() => removeTier(tier.id)}
                    disabled={tiers.length <= 1}
                    className="text-[10px] font-black text-muted transition hover:text-rose-500 disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <input
                  value={newTier.label}
                  onChange={(e) => setNewTier((prev) => ({ ...prev, label: e.target.value }))}
                  className="flex-1 rounded-xl bg-surface-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground outline-none ring-brand/20 focus:ring-2"
                  placeholder="NEW TIER..."
                />
                <input
                  type="color"
                  value={newTier.color}
                  onChange={(e) => setNewTier((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded-lg border-none bg-transparent"
                />
              </div>
              <button
                onClick={addTier}
                className="w-full rounded-full bg-surface-2 py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition hover:bg-brand hover:text-white active:scale-95 shadow-inner cursor-pointer"
              >
                ADD CUSTOM TIER
              </button>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border bg-surface/80 p-6 shadow-xl backdrop-blur-md">
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand">Visibility</h3>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                {isPublicState ? "PUBLIC" : "PRIVATE"}
              </span>
              <button
                onClick={handleTogglePublic}
                className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white transition cursor-pointer ${
                  isPublicState ? "bg-brand shadow-lg shadow-brand/20" : "bg-muted shadow-lg shadow-muted/20"
                }`}
              >
                {isPublicState ? "DISABLE" : "ENABLE"}
              </button>
            </div>
            <p className="mt-3 text-[10px] font-medium text-muted-2 italic">
              {isPublicState ? "Anyone with the link can view." : "Only you can see this collection."}
            </p>
          </div>
        </aside>
      )}

      <ShareModal
        open={shareOpen} onClose={() => setShareOpen(false)}
        shareUrl={shareUrl} isPublic={isPublicState}
        onTogglePublic={handleTogglePublic}
        onCopy={() => {
          if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            showToast("Link copied to clipboard", "success");
          }
        }}
      />
    </div>
  );
}

function generateShareId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}
