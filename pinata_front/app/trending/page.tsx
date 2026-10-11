import { PostCard } from "@/components/PostCard";
import { INITIAL_POSTS } from "@/data/mockData";

export default function TrendingPage() {
  const trendingPosts = [...INITIAL_POSTS].sort(
    (first, second) => second.likes - first.likes,
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6 sm:px-8 xl:px-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Comunidade</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">
            Trending Posts
          </h1>
        </div>
        <p className="text-xs text-muted">Ordenados por upvotes</p>
      </header>
      <section aria-label="Publicações em alta" className="space-y-4">
        {trendingPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}
