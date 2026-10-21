"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { PinataProgress } from "@/components/PinataProgress";
import { useSocial } from "@/components/SocialProvider";
import { authUserToProfile } from "@/utils/authStore";
import { getProfilePinataSol } from "@/utils/pinata";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const { posts, votes, profiles, profileWinners, popProfilePinata } =
    useSocial();
  const [pinataMessage, setPinataMessage] = useState("");
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    if (isReady && !user) router.replace("/login");
  }, [isReady, router, user]);

  if (!isReady || !user) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <p role="status" className="text-sm text-muted">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  const profile =
    profiles.find((item) => item.handle === user.username) ??
    authUserToProfile(user);
  const balanceSol = getProfilePinataSol(profile, posts);
  const targetSol = profile.pinataTargetSol;
  const canPop = balanceSol >= targetSol * 0.6;
  const userPosts = posts.filter((post) => post.handle === user.username);
  const userComments = posts.flatMap((post) =>
    post.comments
      .filter((comment) => comment.handle === user.username)
      .map((comment) => ({ comment, post })),
  );
  const contributedSol = userComments.reduce(
    (total, entry) => total + entry.comment.paidAmountSol,
    0,
  );
  const activityPosts = posts
    .filter(
      (post) =>
        post.handle === user.username ||
        post.comments.some((comment) => comment.handle === user.username) ||
        Boolean(votes[post.id]),
    )
    .sort(
      (first, second) =>
        (second.voteUpdatedAt ?? 0) - (first.voteUpdatedAt ?? 0),
    )
    .slice(0, 5);
  const recentWinners = profileWinners[user.username] ?? [];

  const handlePopPinata = () => {
    if (!canPop || isPopping) return;
    setIsPopping(true);
    const winner = popProfilePinata(user.username);
    setPinataMessage(
      winner
        ? `${winner.name} received ${winner.prizeSol.toFixed(2)} SOL.`
        : "There are no eligible commenters for this Piñata yet.",
    );
    setIsPopping(false);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-8 xl:px-0">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Community overview
          </p>
          <h1 className="mt-1 text-3xl font-black text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            Welcome back, {user.displayName}. Here is your Pinata activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/trending"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-card-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary"
          >
            Browse trending
          </Link>
          <Link
            href={`/profile/${user.username}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            View profile
          </Link>
        </div>
      </section>

      <section
        aria-label="Your activity summary"
        className="grid gap-4 sm:grid-cols-3"
      >
        <article className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">Posts published</p>
          <p className="mt-2 text-3xl font-black text-foreground">
            {userPosts.length}
          </p>
        </article>
        <article className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">Paid comments</p>
          <p className="mt-2 text-3xl font-black text-foreground">
            {userComments.length}
          </p>
        </article>
        <article className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">Comment value</p>
          <p className="mt-2 text-3xl font-black text-foreground">
            {contributedSol.toFixed(3)} <span className="text-base">SOL</span>
          </p>
        </article>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Recent activity
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Posts where you published, commented, or voted
                </p>
              </div>
              <Link
                href={`/profile/${user.username}`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                All your posts
              </Link>
            </div>
            {activityPosts.length ? (
              <ul className="mt-4 divide-y divide-card-border">
                {activityPosts.map((post) => {
                  const commentCount = post.comments.filter(
                    (comment) => comment.handle === user.username,
                  ).length;
                  const activityLabel =
                    post.handle === user.username
                      ? "You published this post"
                      : commentCount
                        ? `You added ${commentCount} comment${commentCount === 1 ? "" : "s"}`
                        : "You voted on this post";

                  return (
                    <li key={post.id} className="py-4 first:pt-3 last:pb-1">
                      <p className="text-[11px] font-semibold text-primary">
                        {activityLabel}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground">
                        {post.content}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        By {post.author} · {post.likes - post.dislikes} vote
                        balance
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-card-border px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">
                  No activity yet
                </p>
                <p className="mt-1 text-xs text-muted">
                  Browse the feed to join a conversation.
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-flex text-sm font-bold text-primary hover:underline"
                >
                  Open home feed
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <Image src="/pinataA.png" alt="" width={34} height={34} />
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Recent rewards
                </h2>
                <p className="text-xs text-muted">Your Piñata draws</p>
              </div>
            </div>
            {recentWinners.length ? (
              <ul className="mt-3 divide-y divide-card-border">
                {recentWinners.map((winner) => (
                  <li
                    key={winner.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {winner.name} won
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(winner.createdAt).toLocaleDateString("en-US")}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-success">
                      {winner.prizeSol.toFixed(2)} SOL
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Your Piñata has no draws yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <Image src="/pinataB.png" alt="" width={38} height={38} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  Your Piñata
                </h2>
                <p className="text-xs text-muted">Creator rewards progress</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-primary">
                {balanceSol.toFixed(2)} / {targetSol.toFixed(2)} SOL
              </span>
            </div>
            <PinataProgress
              valueSol={balanceSol}
              targetSol={targetSol}
              className="mt-4"
            />
            <p className="mt-2 text-xs text-muted">
              {canPop
                ? "Your Piñata has reached the reward threshold."
                : `${Math.max(0, Math.ceil(60 - (balanceSol / targetSol) * 100))}% more to reach the burst threshold.`}
            </p>
            <button
              type="button"
              onClick={handlePopPinata}
              disabled={!canPop || isPopping}
              className="mt-4 min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPopping ? "Processing..." : "Burst Piñata"}
            </button>
            {pinataMessage && (
              <p
                role="status"
                className="mt-3 text-sm font-semibold text-success"
              >
                {pinataMessage}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-foreground">Quick links</h2>
            <nav aria-label="Dashboard shortcuts" className="mt-3 grid gap-2">
              <Link
                href="/"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
              >
                Home feed
              </Link>
              <Link
                href="/trending"
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
              >
                Trending posts
              </Link>
              <Link
                href={`/profile/${user.username}`}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
              >
                Edit your profile
              </Link>
            </nav>
          </section>
        </aside>
      </section>
    </main>
  );
}
