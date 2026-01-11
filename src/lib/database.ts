import type {
  SaveTierListPayload,
  TierListItemRow,
  TierListRow,
  TierListWithItems,
  UpdateTierListPayload,
} from "@/types/database";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<Database>;

function generateShareId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}

export async function saveTierList(supabase: Supabase, payload: SaveTierListPayload) {
  const now = new Date().toISOString();
  const shareId = payload.is_public ? payload.share_id ?? generateShareId() : null;

  const { data, error } = await supabase
    .from("tier_lists")
    .insert({ title: payload.title, is_public: payload.is_public ?? false, share_id: shareId, created_at: now, updated_at: now })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Failed to create tier list");

  if (payload.items.length) {
    const items = payload.items.map((item) => ({
      ...item,
      tier_list_id: data.id,
      created_at: now,
      updated_at: now,
    }));
    const { error: itemsError } = await supabase.from("tier_list_items").insert(items);
    if (itemsError) throw itemsError;
  }

  return data as TierListRow;
}

export async function updateTierList(supabase: Supabase, payload: UpdateTierListPayload) {
  const now = new Date().toISOString();
  const shareId =
    payload.is_public !== undefined && payload.is_public
      ? payload.share_id ?? generateShareId()
      : payload.share_id ?? null;

  const updateData: { title?: string; updated_at: string; is_public?: boolean; share_id?: string | null } = {
    updated_at: now,
  };
  if (payload.title) updateData.title = payload.title;
  if (payload.is_public !== undefined) updateData.is_public = payload.is_public;
  if (payload.is_public !== undefined) updateData.share_id = shareId;

  const { error: updateError } = await supabase
    .from("tier_lists")
    .update(updateData)
    .eq("id", payload.id);
  if (updateError) throw updateError;

  if (payload.items) {
    const { error: deleteError } = await supabase
      .from("tier_list_items")
      .delete()
      .eq("tier_list_id", payload.id);
    if (deleteError) throw deleteError;

    if (payload.items.length) {
      const items = payload.items.map((item) => ({
        tier_list_id: payload.id,
        anime_id: item.anime_id,
        tier_rank: item.tier_rank,
        position: item.position,
        updated_at: now,
      }));
      const { error: insertError } = await supabase.from("tier_list_items").insert(items);
      if (insertError) throw insertError;
    }
  }
}

export async function deleteTierList(supabase: Supabase, id: string) {
  const { error } = await supabase.from("tier_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function getUserTierLists(supabase: Supabase): Promise<TierListWithItems[]> {
  const { data, error } = await supabase
    .from("tier_lists")
    .select("*, tier_list_items(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    ...(row as TierListRow),
    items: ((row as unknown as { tier_list_items: TierListItemRow[] }).tier_list_items) ?? [],
  }));
}

export async function getTierListById(supabase: Supabase, id: string): Promise<TierListWithItems | null> {
  const { data, error } = await supabase
    .from("tier_lists")
    .select("*, tier_list_items(*)")
    .eq("id", id)
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  if (!data) return null;

  return {
    ...(data as TierListRow),
    items: ((data as unknown as { tier_list_items: TierListItemRow[] }).tier_list_items) ?? [],
  };
}

export async function getTierListByShareId(supabase: Supabase, shareId: string): Promise<TierListWithItems | null> {
  const { data, error } = await supabase
    .from("tier_lists")
    .select("*, tier_list_items(*)")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();

  if (error) {
    if ((error as { code?: string }).code === "PGRST116") return null;
    throw error;
  }
  if (!data) return null;

  return {
    ...(data as TierListRow),
    items: ((data as unknown as { tier_list_items: TierListItemRow[] }).tier_list_items) ?? [],
  };
}

export async function runOptimistic<T>({
  applyLocal,
  action,
  rollback,
}: {
  applyLocal: () => void;
  action: () => Promise<T>;
  rollback: () => void;
}): Promise<T> {
  applyLocal();
  try {
    return await action();
  } catch (error) {
    rollback();
    throw error;
  }
}
