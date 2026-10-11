"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CommentItem } from "@/components/CommentItem";
import { PostActions } from "@/components/PostActions";
import { PostComposer } from "@/components/PostComposer";
import { useSocial } from "@/components/SocialProvider";
import { iPost } from "@/interface/post";

interface PostDetailModalProps {
  postId: string;
  fallbackPost: iPost;
  onClose: () => void;
}

export const PostDetailModal = ({
  postId,
  fallbackPost,
  onClose,
}: PostDetailModalProps) => {
  const { posts } = useSocial();
  const post = posts.find((item) => item.id === postId) ?? fallbackPost;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Publicação de ${post.author}`}
        className="relative grid h-dvh max-h-230 w-full grid-rows-[minmax(230px,42dvh)_minmax(0,1fr)] overflow-hidden bg-card text-foreground sm:h-[min(88vh,920px)] sm:max-w-5xl sm:grid-cols-[minmax(0,1fr)_minmax(20rem,38%)] sm:grid-rows-1 sm:rounded-2xl sm:border sm:border-card-border"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar publicação"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-lg text-white transition-colors hover:bg-black/70"
        >
          ×
        </button>

        <div className="flex min-h-0 flex-col justify-between overflow-y-auto bg-background p-5 sm:p-7">
          <div>
            <div className="flex items-center gap-3 pr-10">
              <img
                src={post.avatar}
                alt=""
                className="h-11 w-11 rounded-full border border-card-border"
              />
              <div className="min-w-0">
                <Link
                  href={`/profile/${post.handle}`}
                  onClick={onClose}
                  className="block truncate text-sm font-bold text-foreground hover:text-primary"
                >
                  {post.author}
                </Link>
                <span className="text-xs text-muted">
                  @{post.handle} · {post.createdAt}
                </span>
              </div>
            </div>
            <p className="mt-8 whitespace-pre-wrap wrap-break-word text-base leading-relaxed text-foreground sm:text-lg">
              {post.content}
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="text-xs font-semibold text-primary">
              {post.commentFeeSol} SOL por comentário
            </div>
            <PostActions post={post} />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col border-t border-card-border bg-card sm:border-l sm:border-t-0">
          <div className="border-b border-card-border px-4 py-3">
            <h2 className="text-sm font-bold text-foreground">
              Comentários{" "}
              <span className="text-muted">({post.comments.length})</span>
            </h2>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {post.comments.length ? (
              post.comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <p className="py-8 text-center text-xs text-muted">
                Seja a primeira pessoa a comentar.
              </p>
            )}
          </div>
          <div className="border-t border-card-border p-4">
            <PostComposer post={post} />
          </div>
        </aside>
      </section>
    </div>
  );
};
