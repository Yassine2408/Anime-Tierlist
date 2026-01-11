import type { Database } from "./supabase";

export type TierListRow = Database["public"]["Tables"]["tier_lists"]["Row"];
export type TierListItemRow = Database["public"]["Tables"]["tier_list_items"]["Row"];

export interface TierListWithItems extends TierListRow {
  items: TierListItemRow[];
}

export interface SaveTierListPayload {
  title: string;
  is_public?: boolean;
  share_id?: string | null;
  items: Array<{
    anime_id: number;
    tier_rank: string;
    position: number;
  }>;
}

export interface UpdateTierListPayload {
  id: string;
  title?: string;
  is_public?: boolean;
  share_id?: string | null;
  items?: Array<{
    id?: string;
    anime_id: number;
    tier_rank: string;
    position: number;
  }>;
}

