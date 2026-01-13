export type SeasonName = "winter" | "spring" | "summer" | "fall";

export interface Anime {
  id: number;
  title: string;
  japaneseTitle?: string | null;
  synopsis?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  score?: number | null;
  rank?: number | null;
  popularity?: number | null;
  episodes?: number | null;
  status?: string | null;
  type?: string | null;
  season?: SeasonName | null;
  year?: number | null;
  genres: string[];
  url?: string | null;
}

export interface AnimeListResult {
  items: Anime[];
  hasNextPage: boolean;
  currentPage: number;
}

export interface Episode {
  mal_id: number;
  title: string;
  aired: string | null;
  filler: boolean;
  recap: boolean;
}
