"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { PostDetailModal } from "@/components/PostDetailModal";
import { PinataProgress } from "@/components/PinataProgress";
import { RelativeTime } from "@/components/RelativeTime";
import { useSocial } from "@/components/SocialProvider";
import { CURRENT_USER_HANDLE } from "@/data/mockData";
import { iPost } from "@/interface/post";
import { iProfile, iProfileWinner } from "@/interface/profile";
import { getProfilePinataSol } from "@/utils/pinata";
import { sortPosts } from "@/utils/sortPosts";

export const ProfileView = ({
  profile: fallbackProfile,
}: {
  profile: iProfile;
}) => {
  const [lastWinner, setLastWinner] = useState<iProfileWinner | null>(null);
  const [selectedPost, setSelectedPost] = useState<iPost | null>(null);
  const {
    posts: allPosts,
    votes,
    profiles,
    profileWinners,
    createPost,
    popProfilePinata,
  } = useSocial();
  const [postDraft, setPostDraft] = useState("");
  const profile =
    profiles.find((entry) => entry.handle === fallbackProfile.handle) ??
    fallbackProfile;
  const posts = sortPosts(
    allPosts.filter((post) => post.handle === profile.handle),
    "score",
  );
  const winners = profileWinners[profile.handle] ?? [];
  const isOwnProfile = profile.handle === CURRENT_USER_HANDLE;
  const interactedPosts = isOwnProfile
    ? allPosts.filter(
        (post) =>
          post.comments.some(
            (comment) => comment.handle === CURRENT_USER_HANDLE,
          ) || Boolean(votes[post.id]),
      )
    : [];
  const balanceSol = getProfilePinataSol(profile, allPosts);
  const balancePercent = Math.min(
    (balanceSol / profile.pinataTargetSol) * 100,
    100,
  );
  const canPop = balanceSol >= profile.pinataTargetSol * 0.6;
  const percentToMinimum = Math.max(0, Math.ceil(60 - balancePercent));

  const handlePopPinata = () => {
    if (!isOwnProfile || !canPop) return;
    setLastWinner(popProfilePinata(profile.handle));
  };

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postDraft.trim()) return;
    createPost(postDraft);
    setPostDraft("");
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-8 xl:px-0">
      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-20 w-20 rounded-full border border-card-border bg-background"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-foreground">
              {profile.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted">@{profile.handle}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
              {profile.bio}
            </p>
            <p className="mt-2 text-xs text-muted">
              Joined Pinata in {profile.memberSince}
            </p>
          </div>
          <div className="w-full rounded-xl border border-card-border bg-background p-4 sm:w-72">
            <div className="flex items-center gap-3">
              <Image
                src="/pinataB.png"
                alt=""
                width={34}
                height={34}
                className="h-8.5 w-8.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-foreground">User Piñata</span>
                  <span className="shrink-0 text-primary">
                    {balanceSol.toFixed(2)} /{" "}
                    {profile.pinataTargetSol.toFixed(2)} SOL
                  </span>
                </div>
                <PinataProgress
                  valueSol={balanceSol}
                  targetSol={profile.pinataTargetSol}
                  className="mt-2"
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {canPop
                ? "The Piñata can be burst at any time."
                : `Need ${percentToMinimum}% more to unlock the pinata burst.`}
            </p>
            {isOwnProfile && (
              <button
                type="button"
                onClick={handlePopPinata}
                disabled={!canPop}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Image
                  src="/pinataB.png"
                  alt=""
                  width={18}
                  height={18}
                  className="h-4.5 w-4.5"
                />
                Burst Piñata
              </button>
            )}
            {lastWinner && (
              <p
                role="status"
                className="mt-3 text-xs font-semibold text-success"
              >
                {lastWinner.name} won {lastWinner.prizeSol.toFixed(2)} SOL!
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground">
            Latest Piñata winners
          </h2>
          <span className="text-xs text-muted">{winners.length} draws</span>
        </div>
        {winners.length ? (
          <ol className="divide-y divide-card-border rounded-xl border border-card-border bg-card px-4">
            {winners.map((winner) => (
              <li key={winner.id} className="flex items-center gap-3 py-3">
                <img
                  src={winner.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full border border-card-border"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${winner.handle}`}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {winner.name}
                  </Link>
                  <RelativeTime
                    value={winner.createdAt}
                    fallback="Recent draw"
                    className="text-[11px] text-muted"
                  />
                </div>
                <span className="text-xs font-bold text-success">
                  {winner.prizeSol.toFixed(2)} SOL
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-card-border px-5 py-8 text-center text-sm text-muted">
            This Piñata has not had winners yet.
          </div>
        )}
      </section>

      <div
        className={`grid grid-cols-1 items-start gap-6 ${
          isOwnProfile ? "lg:grid-cols-3" : ""
        }`}
      >
        <section className={`space-y-4 ${isOwnProfile ? "lg:col-span-2" : ""}`}>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">Posts</h2>
            <span className="text-xs text-muted">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>
          {posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="rounded-xl border border-dashed border-card-border px-5 py-10 text-center text-sm text-muted">
              No posts here yet.
            </div>
          )}
        </section>

        {isOwnProfile && (
          <aside className="space-y-4 lg:sticky lg:top-24">
            <form
              onSubmit={handleCreatePost}
              className="rounded-2xl border border-card-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">
                  Create a post
                </h2>
              </div>
              <textarea
                value={postDraft}
                onChange={(event) => setPostDraft(event.target.value)}
                rows={4}
                placeholder="Share something with the community..."
                className="w-full resize-none rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!postDraft.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Publish
                </button>
              </div>
            </form>

            <div>
              <h2 className="text-lg font-bold text-foreground">
                My interactions
              </h2>
              <p className="text-xs text-muted">
                Posts where you commented or voted
              </p>
            </div>
            {interactedPosts.length ? (
              <ul className="divide-y divide-card-border rounded-xl border border-card-border bg-card px-4">
                {interactedPosts.map((post) => (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="w-full py-3 text-left"
                    >
                      <span className="block truncate text-xs font-semibold text-foreground">
                        {post.author}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs text-muted">
                        {post.content}
                      </span>
                      <span className="mt-2 block text-[10px] text-primary">
                        {
                          post.comments.filter(
                            (comment) => comment.handle === profile.handle,
                          ).length
                        }{" "}
                        comments · {post.likes - post.dislikes} vote balance
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-card-border p-4 text-xs text-muted">
                There are no interactions recorded yet.
              </div>
            )}
          </aside>
        )}
      </div>
      {selectedPost && (
        <PostDetailModal
          postId={selectedPost.id}
          fallbackPost={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </main>
  );
};
