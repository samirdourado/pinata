"use client";

import { PinataPoolCard } from "@/components/PinataPoolCard";
import { PostCard } from "@/components/PostCard";
import { useSocial } from "@/components/SocialProvider";
import { RECENT_WINNERS } from "@/data/mockData";
import { sortPosts } from "@/utils/sortPosts";

export default function Home() {
  const { posts } = useSocial();
  const trendingPosts = sortPosts(posts, "score").slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 xl:px-0 py-6 space-y-6">
        <PinataPoolCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <section className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
              <span>🔥 Trending Posts</span>
              <span className="text-xs font-normal text-muted">
                Filtered by engagement and votes
              </span>
            </h3>

            {trendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground">
                💡 How does Pinata work?
              </h4>

              <ul className="text-xs text-muted space-y-2 leading-relaxed">
                <li className="flex gap-2">
                  <span>1.</span>
                  <span>
                    <strong>No spam:</strong> pay a small symbolic fee to
                    publish each comment.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>2.</span>
                  <span>
                    <strong>Fair split:</strong> the fee is shared between the
                    post creator, the Piñata Pool, and the platform.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>3.</span>
                  <span>
                    <strong>Reward:</strong> at the end of the week, the pool is
                    drawn among eligible commenters.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-2">
              <h4 className="font-bold text-sm text-foreground">
                📊 Protocol Statistics
              </h4>
              <div className="text-xs text-muted space-y-1">
                <p>
                  Filtered comments:{" "}
                  <strong className="text-foreground">1,420</strong>
                </p>
                <p>
                  Total distributed to creators:{" "}
                  <strong className="text-primary">12.85 SOL</strong>
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground">
                🏆 Recent winners
              </h4>
              <ul className="space-y-3">
                {RECENT_WINNERS.map((winner) => (
                  <li key={winner.handle} className="flex items-center gap-3">
                    <img
                      src={winner.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full border border-card-border bg-background"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {winner.name}
                      </p>
                      <p className="text-[11px] text-muted">@{winner.handle}</p>
                    </div>
                    <span className="text-xs font-bold text-success">
                      {winner.prize} SOL
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
