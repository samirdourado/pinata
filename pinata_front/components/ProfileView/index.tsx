"use client";

import Image from "next/image";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { iPost } from "@/interface/post";
import { iProfile } from "@/interface/profile";

interface ProfileViewProps {
  profile: iProfile;
  posts: iPost[];
  isOwnProfile: boolean;
}

export const ProfileView = ({
  profile,
  posts,
  isOwnProfile,
}: ProfileViewProps) => {
  const [isPopping, setIsPopping] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const releaseTarget = profile.pinataTargetSol * 0.5;
  const progress = Math.min(
    (profile.pinataBalanceSol / releaseTarget) * 100,
    100,
  );
  const canPop = profile.pinataBalanceSol >= releaseTarget;
  const missing = Math.max(0, Math.ceil(100 - progress));

  const popPinata = () => {
    setIsPopping(true);
    setShowWinner(false);
    window.setTimeout(() => {
      setIsPopping(false);
      setShowWinner(true);
    }, 900);
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
              Na Pinata desde {profile.memberSince}
            </p>
          </div>
          <div className="w-full rounded-xl border border-card-border bg-background p-4 sm:w-72">
            <div className="flex items-center gap-3">
              <Image
                src="/pinataB.png"
                alt=""
                width={34}
                height={34}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-foreground">Piñata do usuário</span>
                  <span className="shrink-0 text-primary">
                    {profile.pinataBalanceSol.toFixed(2)} /{" "}
                    {profile.pinataTargetSol.toFixed(2)} SOL
                  </span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full border border-card-border bg-card"
                  role="progressbar"
                  aria-label="Progresso para liberar o estouro da Piñata"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div
                    className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <>
                <p className="mt-2 text-[11px] text-muted">
                  {canPop
                    ? "Meta mínima atingida. Você pode sortear entre seus comentaristas."
                    : `Faltam ${missing}% para atingir o mínimo de 50%.`}
                </p>
                <button
                  type="button"
                  onClick={popPinata}
                  disabled={!canPop || isPopping}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Image src="/pinataB.png" alt="" width={18} height={18} />
                  {isPopping ? "Sorteando..." : "Estourar Piñata"}
                </button>
                {showWinner && (
                  <p
                    role="status"
                    className="mt-2 text-xs font-semibold text-success"
                  >
                    Sorteio concluído! Um comentarista foi premiado.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-[11px] text-muted">
                {canPop
                  ? "Meta mínima de 50% atingida"
                  : `Faltam ${missing}% para liberar o estouro da pinata!`}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-bold text-foreground">Postagens</h2>
          <span className="text-xs text-muted">
            {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
          </span>
        </div>
        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="rounded-xl border border-dashed border-card-border px-5 py-10 text-center text-sm text-muted">
            Nenhuma postagem por aqui ainda.
          </div>
        )}
      </section>
    </main>
  );
};
