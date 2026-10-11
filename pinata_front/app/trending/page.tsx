"use client";

import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { useSocial } from "@/components/SocialProvider";
import { PostSort, sortPosts } from "@/utils/sortPosts";

export default function TrendingPage() {
  const { posts } = useSocial();
  const [sort, setSort] = useState<PostSort>("score");
  const trendingPosts = sortPosts(posts, sort);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6 sm:px-8 xl:px-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-accent">Comunidade</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">
            Trending Posts
          </h1>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span>Ordenar por</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as PostSort)}
            className="max-w-52 rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="score">Saldo de votos</option>
            <option value="upvotes">Mais upvotes</option>
            <option value="downvotes">Mais downvotes</option>
            <option value="comments-most">Mais comentários</option>
            <option value="comments-least">Menos comentários</option>
            <option value="pinata-full">Piñatas mais cheias</option>
            <option value="pinata-empty">Piñatas mais vazias</option>
          </select>
        </label>
      </header>
      <section aria-label="Publicações em alta" className="space-y-4">
        {trendingPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
    </main>
  );
}
