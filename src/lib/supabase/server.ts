import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "../supabase";
import type { Database } from "@/types/supabase";

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          (cookieStore as unknown as { set?: (...args: unknown[]) => void }).set?.({
            name,
            value,
            ...options,
          });
        } catch {
          // Read-only during static rendering; noop.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          (cookieStore as unknown as { delete?: (...args: unknown[]) => void }).delete?.({
            name,
            ...options,
          });
        } catch {
          // Read-only during static rendering; noop.
        }
      },
    },
  });
}

export const createClient = createSupabaseServerClient;

