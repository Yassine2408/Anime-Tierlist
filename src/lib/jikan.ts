import type { Anime, AnimeListResult, SeasonName } from "@/types/anime";

const BASE_URL = "https://api.jikan.moe/v4";
const CACHE_TTL_MS = 60_000; // 60 seconds to stay within 60 req/min guideline
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 200;
const MIN_REQUEST_GAP_MS = 1_100; // slightly above 1s to respect 60 req/min

type CacheEntry<T> = { data: T; expiresAt: number };

type JikanRateLimiter = {
  lastRequestTime: number;
  pending: Promise<void>;
};

const globalForJikan = globalThis as unknown as {
  __jikanCache?: Map<string, CacheEntry<unknown>>;
  __jikanRateLimiter?: JikanRateLimiter;
};

const cache = globalForJikan.__jikanCache ??= new Map<string, CacheEntry<unknown>>();
const rateLimiter = globalForJikan.__jikanRateLimiter ??= {
  lastRequestTime: 0,
  pending: Promise.resolve(),
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scheduleRequest() {
  rateLimiter.pending = rateLimiter.pending.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, MIN_REQUEST_GAP_MS - (now - rateLimiter.lastRequestTime));
    if (wait > 0) {
      await delay(wait);
    }
    rateLimiter.lastRequestTime = Date.now();
  });
  await rateLimiter.pending;
}

async function requestWithRetry<T>(path: string, cacheTtlMs = CACHE_TTL_MS): Promise<T> {
  const cacheKey = path;
  const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  await scheduleRequest();

  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Jikan request failed (${response.status}): ${body.slice(0, 200)}`);
      }

      const json = (await response.json()) as JikanResponse<T>;
      if (!json || typeof json !== "object" || !("data" in json)) {
        throw new Error("Unexpected Jikan response shape");
      }

      cache.set(cacheKey, { data: json.data, expiresAt: Date.now() + cacheTtlMs });
      return json.data;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= MAX_RETRIES) break;
      await delay(RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Jikan request failed");
}

type JikanImage = {
  image_url?: string;
  small_image_url?: string;
  large_image_url?: string;
};

type JikanImages = {
  jpg?: JikanImage;
  webp?: JikanImage;
};

type JikanGenre = {
  mal_id: number;
  name: string;
};

type JikanAnime = {
  mal_id: number;
  title: string;
  title_japanese?: string | null;
  synopsis?: string | null;
  images?: JikanImages;
  score?: number | null;
  rank?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  status?: string | null;
  type?: string | null;
  season?: SeasonName | null;
  year?: number | null;
  genres?: JikanGenre[];
  url?: string | null;
};

type JikanPagination = {
  has_next_page?: boolean;
  current_page?: number;
};

type JikanListResponse<T> = {
  data: T[];
  pagination?: JikanPagination;
};

type JikanResponse<T> = {
  data: T;
};

function mapAnime(anime: JikanAnime): Anime {
  return {
    id: anime.mal_id,
    title: anime.title,
    japaneseTitle: anime.title_japanese ?? null,
    synopsis: anime.synopsis ?? null,
    imageUrl: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url || null,
    coverImageUrl: anime.images?.jpg?.large_image_url || anime.images?.webp?.large_image_url || null,
    score: anime.score ?? null,
    rank: anime.rank ?? null,
    popularity: anime.popularity ?? null,
    episodes: anime.episodes ?? null,
    status: anime.status ?? null,
    type: anime.type ?? null,
    season: anime.season ?? null,
    year: anime.year ?? null,
    genres: anime.genres?.map((genre) => genre.name) ?? [],
    url: anime.url ?? null,
  };
}

export async function fetchTopAnime(limit = 25, page = 1): Promise<AnimeListResult> {
  const data = await requestWithRetry<JikanListResponse<JikanAnime>>(
    `/top/anime?limit=${limit}&page=${page}`
  );
  const list = Array.isArray(data.data) ? data.data : [];
  return {
    items: list.map(mapAnime),
    hasNextPage: Boolean(data.pagination?.has_next_page),
    currentPage: data.pagination?.current_page ?? page,
  };
}

export async function fetchAnimeById(id: number): Promise<Anime> {
  const data = await requestWithRetry<JikanAnime>(`/anime/${id}/full`);
  return mapAnime(data);
}

export async function searchAnime(
  query: string,
  limit = 10,
  page = 1
): Promise<AnimeListResult> {
  const searchParams = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
    order_by: "score",
    sort: "desc",
  });
  const data = await requestWithRetry<JikanListResponse<JikanAnime>>(`/anime?${searchParams.toString()}`);
  const list = Array.isArray(data.data) ? data.data : [];
  return {
    items: list.map(mapAnime),
    hasNextPage: Boolean(data.pagination?.has_next_page),
    currentPage: data.pagination?.current_page ?? page,
  };
}

export async function fetchSeasonalAnime(
  year?: number,
  season?: SeasonName,
  limit = 25,
  page = 1
): Promise<AnimeListResult> {
  const now = new Date();
  const currentSeason = season ?? getSeasonFromMonth(now.getUTCMonth());
  const currentYear = year ?? now.getUTCFullYear();

  const data = await requestWithRetry<JikanListResponse<JikanAnime>>(
    `/seasons/${currentYear}/${currentSeason}?page=${page}&limit=${limit}`
  );
  const list = Array.isArray(data.data) ? data.data : [];

  return {
    items: list.map(mapAnime),
    hasNextPage: Boolean(data.pagination?.has_next_page),
    currentPage: data.pagination?.current_page ?? page,
  };
}

function getSeasonFromMonth(month: number): SeasonName {
  if (month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "fall";
}

