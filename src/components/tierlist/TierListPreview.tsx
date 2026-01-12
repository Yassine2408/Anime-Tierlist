"use client";

import { memo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { TierListWithItems } from "@/types/database";

type Props = {
  tierList: TierListWithItems;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (tierList: TierListWithItems) => Promise<void>;
  onShare: (tierList: TierListWithItems) => Promise<void>;
};

export const TierListPreview = memo(function TierListPreview({ tierList, onDelete, onDuplicate, onShare }: Props) {
  const updated = formatDistanceToNow(new Date(tierList.updated_at), { addSuffix: true });
  const tiersSummary = getTierSummary(tierList);

  const handleDelete = async () => {
    if (!window.confirm("Remove this collection?")) return;
    await onDelete(tierList.id);
  };

  return (
    <article className="group flex flex-col gap-4 rounded-[2.5rem] border border-border bg-surface/80 p-6 shadow-xl transition-all hover:-translate-y-1 hover:border-brand/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-black leading-tight text-foreground transition-colors group-hover:text-brand">
            {tierList.title}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-2">Modified {updated}</p>
          {tierList.is_public && tierList.share_id && (
            <span className="mt-1 w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand ring-1 ring-brand/20">
              Public Collection
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/tierlist/${tierList.id}?edit=1`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 transition hover:brightness-110 active:scale-90"
            title="Edit"
          >
            <span className="text-xs">✎</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 py-2">
        {tiersSummary.map((tier) => (
          <div
            key={tier.label}
            className="flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 ring-1 ring-border"
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              {tier.label} · {tier.count}
            </span>
          </div>
        ))}
        {tiersSummary.length === 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-2">Empty Circle</p>
        )}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4">
        <button
          onClick={() => onDuplicate(tierList)}
          className="rounded-full bg-surface-2 py-2 text-[9px] font-black uppercase tracking-wider text-muted transition hover:bg-brand/10 hover:text-brand"
        >
          CLONE
        </button>
        <button
          onClick={() => onShare(tierList)}
          className="rounded-full bg-surface-2 py-2 text-[9px] font-black uppercase tracking-wider text-muted transition hover:bg-brand-2/10 hover:text-brand-2"
        >
          SHARE
        </button>
        <button
          onClick={handleDelete}
          className="rounded-full bg-surface-2 py-2 text-[9px] font-black uppercase tracking-wider text-muted transition hover:bg-rose-500/10 hover:text-rose-500"
        >
          DELETE
        </button>
      </div>
    </article>
  );
});

function getTierSummary(tierList: TierListWithItems) {
  const tierOrder = ["S", "A", "B", "C", "D", "F"];
  const colors: Record<string, string> = {
    S: "var(--color-gold)",
    A: "#f97316",
    B: "#fbbf24",
    C: "#22c55e",
    D: "#38bdf8",
    F: "#a3a3a3",
  };

  const counts = tierList.items.reduce<Record<string, number>>((acc, item) => {
    const rank = item.tier_rank ?? "Unranked";
    acc[rank] = (acc[rank] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([a], [b]) => tierOrder.indexOf(a) - tierOrder.indexOf(b))
    .map(([label, count]) => ({
      label,
      count,
      color: colors[label] ?? "var(--color-muted-2)",
    }));
}
