import type { Anime, AnimeListResult, SeasonName } from "@/types/anime";

const ANILIST_API = "https://graphql.anilist.co";

type PageInfo = {
  currentPage?: number | null;
  hasNextPage?: boolean | null;
};

type Media = {
  id: number;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  } | null;
  description?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
  } | null;
  averageScore?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  genres?: string[] | null;
  siteUrl?: string | null;
};

async function fetchGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!response.ok || json.errors) {
    const message = json.errors?.map((e) => e.message).join("; ") ?? `HTTP ${response.status}`;
    throw new Error(`AniList request failed: ${message}`);
  }

  if (!json.data) {
    throw new Error("AniList response missing data");
  }

  return json.data;
}

function stripHtml(input?: string | null) {
  if (!input) return null;
  return input.replace(/<\/?[^>]+(>|$)/g, "");
}

function mapMedia(media: Media): Anime {
  const title = media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
  return {
    id: media.id,
    title,
    japaneseTitle: media.title?.native ?? null,
    synopsis: stripHtml(media.description),
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium || null,
    coverImageUrl: media.coverImage?.large || media.coverImage?.medium || null,
    score: media.averageScore ? media.averageScore / 10 : null, // AniList is /100
    rank: null,
    popularity: media.popularity ?? null,
    episodes: media.episodes ?? null,
    status: media.status ?? null,
    type: null,
    season: media.season ? media.season.toLowerCase() as SeasonName : null,
    year: media.seasonYear ?? null,
    genres: media.genres ?? [],
    url: media.siteUrl ?? null,
  };
}

export async function fetchTopAnime(limit = 20, page = 1): Promise<AnimeListResult> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        media(type: ANIME, sort: [SCORE_DESC], status_in: [RELEASING, FINISHED]) {
          id
          title { romaji english native }
          description
          coverImage { extraLarge large medium }
          averageScore
          popularity
          episodes
          status
          season
          seasonYear
          genres
          siteUrl
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { pageInfo?: PageInfo | null; media?: Media[] | null } }>(query, {
    page,
    perPage: limit,
  });
  const list = data.Page.media ?? [];
  const info = data.Page.pageInfo;
  return {
    items: list.map(mapMedia),
    hasNextPage: Boolean(info?.hasNextPage),
    currentPage: info?.currentPage ?? page,
  };
}

export async function searchAnime(queryText: string, limit = 10, page = 1): Promise<AnimeListResult> {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        media(search: $search, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
          id
          title { romaji english native }
          description
          coverImage { extraLarge large medium }
          averageScore
          popularity
          episodes
          status
          season
          seasonYear
          genres
          siteUrl
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { pageInfo?: PageInfo | null; media?: Media[] | null } }>(query, {
    search: queryText,
    page,
    perPage: limit,
  });
  const list = data.Page.media ?? [];
  const info = data.Page.pageInfo;
  return {
    items: list.map(mapMedia),
    hasNextPage: Boolean(info?.hasNextPage),
    currentPage: info?.currentPage ?? page,
  };
}

export async function fetchAnimeById(id: number): Promise<Anime> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        description
        coverImage { extraLarge large medium }
        averageScore
        popularity
        episodes
        status
        season
        seasonYear
        genres
        siteUrl
      }
    }
  `;
  const data = await fetchGraphQL<{ Media: Media }>(query, { id });
  if (!data.Media) {
    throw new Error("Anime not found");
  }
  return mapMedia(data.Media);
}

export async function fetchSeasonalAnime(
  year?: number,
  season?: SeasonName,
  limit = 20,
  page = 1
): Promise<AnimeListResult> {
  const now = new Date();
  const seasonEnum = season ? season.toUpperCase() : getSeasonFromMonth(now.getUTCMonth());
  const seasonYear = year ?? now.getUTCFullYear();

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { currentPage hasNextPage }
        media(
          type: ANIME,
          season: $season,
          seasonYear: $seasonYear,
          sort: [POPULARITY_DESC]
        ) {
          id
          title { romaji english native }
          description
          coverImage { extraLarge large medium }
          averageScore
          popularity
          episodes
          status
          season
          seasonYear
          genres
          siteUrl
        }
      }
    }
  `;
  const data = await fetchGraphQL<{ Page: { pageInfo?: PageInfo | null; media?: Media[] | null } }>(query, {
    season: seasonEnum,
    seasonYear,
    page,
    perPage: limit,
  });
  const list = data.Page.media ?? [];
  const info = data.Page.pageInfo;
  return {
    items: list.map(mapMedia),
    hasNextPage: Boolean(info?.hasNextPage),
    currentPage: info?.currentPage ?? page,
  };
}

function getSeasonFromMonth(month: number): "WINTER" | "SPRING" | "SUMMER" | "FALL" {
  if (month <= 1 || month === 11) return "WINTER";
  if (month <= 4) return "SPRING";
  if (month <= 7) return "SUMMER";
  return "FALL";
}

