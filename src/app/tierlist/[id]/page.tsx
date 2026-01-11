import { TierListContainer } from "@/components/tierlist/TierListContainer";
import { type Tier } from "@/components/tierlist/TierRow";
import { getTierListById, updateTierList } from "@/lib/database";
import { fetchAnimeById, fetchTopAnime } from "@/lib/anilist";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Anime } from "@/types/anime";
import { notFound } from "next/navigation";

const DEFAULT_COLORS: Record<string, string> = {
  S: "var(--color-gold)",
  A: "#f97316",
  B: "#fbbf24",
  C: "#22c55e",
  D: "#38bdf8",
  F: "#a3a3a3",
};

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function TierListDetailPage({ params, searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const tierList = await getTierListById(supabase, params.id);
  if (!tierList) {
    notFound();
  }

  const uniqueIds = Array.from(new Set(tierList.items.map((item) => item.anime_id)));
  const animeMap = new Map<number, Anime>();
  await Promise.all(
    uniqueIds.map(async (animeId) => {
      try {
        const anime = await fetchAnimeById(animeId);
        animeMap.set(animeId, anime);
      } catch (e) {
        console.error(`Failed to fetch anime ${animeId}`, e);
      }
    })
  );

  const tiers = buildTiers(tierList.items, animeMap);
  const poolSource = await fetchTopAnime(20, 1);
  const usedIds = new Set(tierList.items.map((item) => item.anime_id));
  const pool = poolSource.items.filter((item) => !usedIds.has(item.id));

  const isEdit = searchParams?.edit === "1";
  const initialShareId = tierList.share_id;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Ranking</p>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">{tierList.title}</h1>
        <p className="text-sm font-medium text-muted">
          {isEdit ? "Customizing this collection." : "Viewing circle ranking."}
        </p>
      </header>

      <TierListContainer
        initialTiers={tiers}
        initialPool={isEdit ? pool : []}
        title={tierList.title}
        isPublic={tierList.is_public}
        shareId={initialShareId}
        onTogglePublic={
          isEdit
            ? async (next) => {
                const shareId = next ? initialShareId ?? generateShareId() : null;
                // This will be called from client side, so we need to pass browser client
                // Actually TierListContainer's onTogglePublic is called from client side.
                // We'll let the client handle it.
                return shareId;
              }
            : undefined
        }
        onSave={
          isEdit
            ? async ({ title, tiers }) => {
                // This is also client side.
              }
            : undefined
        }
        saveLabel="Sync Changes"
        readOnly={!isEdit}
      />
    </main>
  );
}

function buildTiers(
  items: { id: string; anime_id: number; tier_rank: string; position: number }[],
  animeMap: Map<number, Anime>
): Tier[] {
  const groups = items.reduce<Record<string, { anime: Anime; itemId: string; position: number }[]>>((acc, item) => {
    const anime = animeMap.get(item.anime_id);
    if (!anime) return acc;
    acc[item.tier_rank] = acc[item.tier_rank] ?? [];
    acc[item.tier_rank].push({ anime, itemId: item.id, position: item.position });
    return acc;
  }, {});

  const orderedRanks = ["S", "A", "B", "C", "D", "F", ...Object.keys(groups).filter((g) => !["S", "A", "B", "C", "D", "F"].includes(g))];

  return orderedRanks.map((rank) => ({
    id: `tier-${rank.toLowerCase()}`,
    label: rank,
    color: DEFAULT_COLORS[rank] ?? "var(--color-muted-2)",
    items:
      (groups[rank]?.sort((a, b) => a.position - b.position).map((entry) => ({
        ...entry.anime,
        itemId: entry.itemId,
      })) as Array<Anime & { itemId?: string }>) ?? [],
  }));
}

function generateShareId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}
