import { TierListContainer } from "@/components/tierlist/TierListContainer";
import { type Tier } from "@/components/tierlist/TierRow";
import { getTierListByShareId } from "@/lib/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAnimeById } from "@/lib/anilist";
import type { Anime } from "@/types/anime";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

type PageProps = {
  params: { shareId: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createSupabaseServerClient();
  const tierList = await getTierListByShareId(supabase, params.shareId);
  if (!tierList) {
    return { title: "Collection not found" };
  }

  const title = `${tierList.title} | Anime Circle`;
  const description = `View this anime collection on Anime Circle.`;
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = host ? `${protocol}://${host}/tierlist/public/${params.shareId}` : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicTierListPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const tierList = await getTierListByShareId(supabase, params.shareId);
  if (!tierList) {
    notFound();
  }

  const uniqueIds = Array.from(new Set(tierList.items.map((item) => item.anime_id)));
  const animeMap = new Map<number, Anime>();
  await Promise.all(
    uniqueIds.map(async (animeId) => {
      const anime = await fetchAnimeById(animeId);
      animeMap.set(animeId, anime);
    })
  );

  const tiers = buildTiers(tierList.items, animeMap);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Shared Collection</p>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">{tierList.title}</h1>
        <p className="text-sm font-medium text-muted">A curated community ranking.</p>
      </header>
      <TierListContainer initialTiers={tiers} initialPool={[]} initialTitle={tierList.title} readOnly isPublic />
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
  const colors: Record<string, string> = {
    S: "var(--color-gold)",
    A: "#f97316",
    B: "#fbbf24",
    C: "#22c55e",
    D: "#38bdf8",
    F: "#a3a3a3",
  };

  return orderedRanks.map((rank) => ({
    id: `tier-${rank.toLowerCase()}`,
    label: rank,
    color: colors[rank] ?? "var(--color-muted-2)",
    items:
      (groups[rank]?.sort((a, b) => a.position - b.position).map((entry) => ({
        ...entry.anime,
        itemId: entry.itemId,
      })) as Array<Anime & { itemId?: string }>) ?? [],
  }));
}
