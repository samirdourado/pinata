export const PageSkeleton = ({ profile = false }: { profile?: boolean }) => (
  <main
    className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6 sm:px-8 xl:px-0"
    aria-busy="true"
    aria-label="Carregando conteúdo"
  >
    {profile && (
      <div className="h-40 animate-pulse rounded-xl border border-card-border bg-card" />
    )}
    {[0, 1, 2].map((item) => (
      <div
        key={item}
        className="space-y-4 rounded-xl border border-card-border bg-card p-5"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-card-border" />
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-card-border" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-card-border" />
          </div>
        </div>
        <div className="h-12 animate-pulse rounded bg-card-border/70" />
        <div className="h-8 w-36 animate-pulse rounded bg-card-border/70" />
      </div>
    ))}
  </main>
);
