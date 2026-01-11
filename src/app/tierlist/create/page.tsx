"use client";

import { TierListContainer } from "@/components/tierlist/TierListContainer";

export default function CreateTierListPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-2 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-2">Builder</p>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Tier List Creator</h1>
        <p className="max-w-xl text-sm font-medium text-muted">
          Drag titles into custom tiers and craft your perfect ranking.
        </p>
      </header>
      <TierListContainer />
    </main>
  );
}
