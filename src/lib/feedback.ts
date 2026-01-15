import { createSupabaseBrowserClient } from "./supabase";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAnimeById } from "./jikan";

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
  
  // ============================================================
  // Server-side validation for episode numbers
  // ============================================================
  // We validate episode numbers here to prevent invalid data from being inserted,
  // even if client-side validation is bypassed or fails.
  //
  // Validation rules:
  // - Episode must be a positive integer (>= 1)
  // - Episode must not exceed reasonable upper limit (<= 9999)
  // - Episode must not exceed the anime's actual episode count (if known)
  //
  // Caching: fetchAnimeById uses Jikan API's built-in caching (60s TTL),
  // which prevents excessive API calls for the same anime.
  // ============================================================
  
  // Basic validation: episode must be a positive integer
  if (!Number.isInteger(input.episode) || input.episode < 1) {
    throw new Error("Episode number must be a positive integer (at least 1)");
  }

  // Basic validation: episode must not exceed reasonable upper limit
  if (input.episode > 9999) {
    throw new Error("Episode number cannot exceed 9999");
  }

  // Advanced validation: check against actual anime episode count
  try {
    const anime = await fetchAnimeById(input.anime_id);
    
    // If anime has a known episode count, validate against it
    if (anime.episodes != null && typeof anime.episodes === "number" && anime.episodes > 0) {
      if (input.episode > anime.episodes) {
        throw new Error(
          `This anime only has ${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}. ` +
          `Episode ${input.episode} does not exist.`
        );
      }
    }
    // Edge cases handled:
    // - If episode count is null (ongoing anime): allow submission
    //   New episodes may have aired since the last API update
    // - If episode count is 0: treat as unknown, allow submission
    //   The database constraint (episode <= 9999) still provides protection
  } catch (error) {
    // Re-throw our validation errors (episode count exceeded)
    if (error instanceof Error && error.message.includes("only has")) {
      throw error;
    }
    // If API call fails (network error, anime not found, rate limit, etc.),
    // we still allow the submission but log a warning
    // This prevents API failures from blocking legitimate submissions
    // The database constraint (episode > 0 AND episode <= 9999) still provides protection
    console.warn(
      `Failed to fetch anime ${input.anime_id} for episode validation:`,
      error instanceof Error ? error.message : String(error)
    );
  }
  
  const { data, error } = await supabase.from("episode_feedback").insert({
    user_id: user.id,
    anime_id: input.anime_id,
    episode: input.episode,
    rating: input.rating ?? null,
    comment: input.comment ?? null,
  });
  
  // Database constraint will also validate episode number, providing defense in depth
  if (error) {
    // Provide more user-friendly error messages for constraint violations
    if (error.code === "23514") {
      throw new Error("Invalid episode number. Episode must be between 1 and 9999.");
    }
    throw error;
  }
  
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

  const animeRows = (animeData.data ?? []) as unknown as Database["public"]["Tables"]["anime_feedback"]["Row"][];
  const episodeRows = (episodeData.data ?? []) as unknown as Database["public"]["Tables"]["episode_feedback"]["Row"][];

  const animeFeedback: CommunityFeedback[] =
    animeRows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      anime_id: row.anime_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      type: "anime" as const,
    })) ?? [];

  const episodeFeedback: CommunityFeedback[] =
    episodeRows.map((row) => ({
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
  
  type ProfileLite = {
    id: string;
    username: string | null;
    display_name: string | null;
  };
  const profileRows = (profiles ?? []) as unknown as ProfileLite[];
  const profileMap = new Map(profileRows.map((p) => [p.id, p]));
  
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

export type TrendingAnime = {
  anime_id: number;
  avg_rating: number;
  rating_count: number;
  total_ratings: number;
};

/**
 * Fetches trending anime based on user ratings
 * Only includes anime with at least 1 rating
 * Results are sorted by average rating (descending), then by rating count (descending)
 */
export async function fetchTrendingAnime(limit = 50): Promise<TrendingAnime[]> {
  const supabase = createSupabaseBrowserClient();
  
  // Get all anime feedback with ratings
  const { data, error } = await supabase
    .from("anime_feedback")
    .select("anime_id, rating")
    .not("rating", "is", null);
  
  if (error) throw error;
  
  // Calculate average ratings per anime
  const ratingMap = new Map<number, { total: number; count: number }>();
  
  for (const row of data ?? []) {
    const animeId = row.anime_id;
    const rating = row.rating ?? 0;
    
    if (!ratingMap.has(animeId)) {
      ratingMap.set(animeId, { total: 0, count: 0 });
    }
    
    const stats = ratingMap.get(animeId)!;
    stats.total += rating;
    stats.count += 1;
  }
  
  // Convert to array and calculate averages
  const trending: TrendingAnime[] = Array.from(ratingMap.entries())
    .map(([anime_id, stats]) => ({
      anime_id,
      avg_rating: Number((stats.total / stats.count).toFixed(1)),
      rating_count: stats.count,
      total_ratings: stats.total,
    }))
    .filter((item) => item.rating_count > 0) // Only include anime with ratings
    .sort((a, b) => {
      // Sort by average rating (descending), then by count (descending)
      if (b.avg_rating !== a.avg_rating) {
        return b.avg_rating - a.avg_rating;
      }
      return b.rating_count - a.rating_count;
    })
    .slice(0, limit);
  
  return trending;
}

