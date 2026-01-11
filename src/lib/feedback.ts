import { createSupabaseBrowserClient } from "./supabase";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

type AnimeFeedbackInput = {
  anime_id: number;
  rating?: number | null;
  comment?: string | null;
};

type EpisodeFeedbackInput = AnimeFeedbackInput & {
  episode: number;
};

export async function submitAnimeFeedback(supabase: SupabaseClient<Database>, input: AnimeFeedbackInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  
  const { data, error } = await supabase.from("anime_feedback").insert({
    user_id: user.id,
    anime_id: input.anime_id,
    rating: input.rating ?? null,
    comment: input.comment ?? null,
  });
  if (error) throw error;
  return data;
}

export async function submitEpisodeFeedback(supabase: SupabaseClient<Database>, input: EpisodeFeedbackInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");
  
  const { data, error } = await supabase.from("episode_feedback").insert({
    user_id: user.id,
    anime_id: input.anime_id,
    episode: input.episode,
    rating: input.rating ?? null,
    comment: input.comment ?? null,
  });
  if (error) throw error;
  return data;
}

export async function fetchAnimeFeedbackSummary(animeIds: number[]) {
  const supabase = createSupabaseBrowserClient();
  if (!animeIds.length) return {};
  const { data, error } = await supabase
    .from("anime_feedback")
    .select("anime_id,rating")
    .in("anime_id", animeIds);
  if (error) throw error;
  const summary: Record<
    number,
    {
      avg: number;
      count: number;
    }
  > = {};
  for (const row of data ?? []) {
    const id = row.anime_id;
    const rating = row.rating ?? 0;
    if (!summary[id]) summary[id] = { avg: 0, count: 0 };
    summary[id].avg += rating;
    summary[id].count += row.rating === null ? 0 : 1;
  }
  Object.keys(summary).forEach((key) => {
    const id = Number(key);
    const s = summary[id];
    if (s.count > 0) {
      s.avg = Number((s.avg / s.count).toFixed(1));
    }
  });
  return summary;
}

export async function fetchEpisodeFeedbackSummary(animeId: number) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("episode_feedback")
    .select("episode,rating")
    .eq("anime_id", animeId);
  if (error) throw error;
  const summary: Record<number, { avg: number; count: number }> = {};
  for (const row of data ?? []) {
    const ep = row.episode;
    const rating = row.rating ?? 0;
    if (!summary[ep]) summary[ep] = { avg: 0, count: 0 };
    summary[ep].avg += rating;
    summary[ep].count += row.rating === null ? 0 : 1;
  }
  Object.keys(summary).forEach((key) => {
    const ep = Number(key);
    const s = summary[ep];
    if (s.count > 0) {
      s.avg = Number((s.avg / s.count).toFixed(1));
    }
  });
  return summary;
}

export type CommunityFeedback = {
  id: string;
  user_id: string;
  user_email?: string;
  username?: string;
  display_name?: string;
  anime_id: number;
  rating: number | null;
  comment: string | null;
  created_at: string;
  episode?: number | null;
  type: "anime" | "episode";
};

export async function fetchRecentCommunityFeedback(limit = 50): Promise<CommunityFeedback[]> {
  const supabase = createSupabaseBrowserClient();
  const [animeData, episodeData] = await Promise.all([
    supabase
      .from("anime_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("episode_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const animeFeedback: CommunityFeedback[] =
    animeData.data?.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      anime_id: row.anime_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      type: "anime" as const,
    })) ?? [];

  const episodeFeedback: CommunityFeedback[] =
    episodeData.data?.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      anime_id: row.anime_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      episode: row.episode,
      type: "episode" as const,
    })) ?? [];

  const combined = [...animeFeedback, ...episodeFeedback]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);

  // Get current user to show "You" vs username
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch profiles for all users in the feedback
  const userIds = [...new Set(combined.map((f) => f.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);
  
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  
  return combined.map((f) => {
    const profile = profileMap.get(f.user_id);
    return {
      ...f,
      user_email: f.user_id === user?.id ? user.email : undefined,
      username: profile?.username ?? undefined,
      display_name: profile?.display_name ?? undefined,
    };
  });
}


