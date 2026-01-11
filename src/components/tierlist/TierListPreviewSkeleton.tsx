export function TierListPreviewSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[2.5rem] border border-border bg-surface/50 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-3 w-20 animate-pulse rounded-lg bg-surface-2" />
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-2" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-surface-2" />
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4">
        <div className="h-8 animate-pulse rounded-full bg-surface-2" />
        <div className="h-8 animate-pulse rounded-full bg-surface-2" />
        <div className="h-8 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
