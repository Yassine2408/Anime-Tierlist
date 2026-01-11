import { DashboardClient } from "@/components/tierlist/DashboardClient";
import { getUserTierLists } from "@/lib/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const lists = await getUserTierLists(supabase);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardClient initialLists={lists} />
    </main>
  );
}
