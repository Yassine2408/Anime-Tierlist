"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
  delayMs?: number;
};

export function SearchBar({
  onSearch,
  initialQuery = "",
  placeholder = "Search for a title...",
  delayMs = 350,
}: Props) {
  const [value, setValue] = useState(initialQuery);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (next: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(next.trim());
        timeoutRef.current = null;
      }, delayMs);
    },
    [delayMs, onSearch]
  );

  useEffect(() => {
    debouncedSearch(value);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative group flex w-full items-center gap-3 rounded-full border border-border bg-surface/50 px-5 py-3 shadow-xl backdrop-blur-md transition-all hover:border-brand/30 hover:bg-surface active:scale-[0.99]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-4 w-4 text-brand transition-transform group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path d="m21 21-4.35-4.35" />
        <circle cx="11" cy="11" r="7" />
      </svg>
      <input
        type="search"
        className="flex-1 bg-transparent text-sm font-bold tracking-tight text-foreground outline-none placeholder:font-medium placeholder:text-muted-2"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          debouncedSearch(next);
        }}
        autoComplete="off"
      />
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand/5 to-brand-2/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
