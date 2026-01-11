export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-brand shadow-xl shadow-brand/20">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand animate-pulse">
        Syncing Data...
      </p>
    </div>
  );
}
