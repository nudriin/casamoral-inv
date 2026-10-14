import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-20 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />

      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="h-4 w-1/2 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-3/4 bg-zinc-300/80 dark:bg-zinc-700 rounded" />
            <div className="h-3 w-1/3 bg-zinc-200/60 dark:bg-zinc-800 rounded" />
          </Card>
        ))}
      </div>

      {/* Big Widget Skeleton */}
      <Card className="p-6 space-y-4">
        <div className="h-5 w-1/3 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
        <div className="h-3 w-full bg-zinc-200/60 dark:bg-zinc-800 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-zinc-200/50 dark:bg-zinc-800/50 rounded" />
          ))}
        </div>
      </Card>

      {/* 2 Column Table Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="h-5 w-1/4 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/40 rounded" />
          ))}
        </Card>
        <Card className="p-5 space-y-3">
          <div className="h-5 w-1/4 bg-zinc-200/80 dark:bg-zinc-800 rounded" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800/40 rounded" />
          ))}
        </Card>
      </div>
    </div>
  );
}
