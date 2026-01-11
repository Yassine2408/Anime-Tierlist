export function AnimeCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-border bg-surface/50 p-3 shadow-xl">
      <div className="aspect-[3/4] w-full animate-pulse rounded-[2rem] bg-surface-2" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <div className="h-5 w-2/3 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-surface-2" />
        </div>
        <div className="mt-auto border-t border-border pt-3">
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
