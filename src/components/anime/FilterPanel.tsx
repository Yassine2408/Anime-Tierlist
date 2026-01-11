"use client";

import { useMemo } from "react";

type FilterState = {
  genre: string;
  year: string;
  minScore: string;
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
};

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural",
];

export function FilterPanel({ filters, onChange }: Props) {
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 25 }, (_, idx) => String(current - idx));
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 rounded-[2rem] border border-border bg-surface/30 p-6 backdrop-blur-md sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Filter Genre</label>
        <select
          className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-foreground outline-none ring-brand/30 transition focus:ring-2"
          value={filters.genre}
          onChange={(event) => onChange({ ...filters, genre: event.target.value })}
        >
          <option value="">All Categories</option>
          {COMMON_GENRES.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Release Year</label>
        <select
          className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-foreground outline-none ring-brand/30 transition focus:ring-2"
          value={filters.year}
          onChange={(event) => onChange({ ...filters, year: event.target.value })}
        >
          <option value="">Any Season</option>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-2">Minimum Score</label>
        <div className="relative">
          <input
            type="number" min={0} max={10} step={0.1}
            value={filters.minScore}
            onChange={(event) => onChange({ ...filters, minScore: event.target.value })}
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2 text-xs font-bold text-foreground outline-none ring-brand/30 transition focus:ring-2"
            placeholder="e.g. 8.5"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gold">★</span>
        </div>
      </div>
    </div>
  );
}
