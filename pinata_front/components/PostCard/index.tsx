"use client";

import { useState } from "react";
import Link from "next/link";
import { CommentItem } from "@/components/CommentItem";
import { PostActions } from "@/components/PostActions";
import { PostComposer } from "@/components/PostComposer";
import { PostDetailModal } from "@/components/PostDetailModal";
import { useSocial } from "@/components/SocialProvider";
import { iPost } from "@/interface/post";

interface PostCardProps {
  post: iPost;
}

export const PostCard = ({ post: fallbackPost }: PostCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { posts } = useSocial();
  const post =
    posts.find((item) => item.id === fallbackPost.id) ?? fallbackPost;

  return (
    <article className="w-full space-y-4 rounded-2xl border border-card-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={post.avatar}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full border border-card-border bg-background"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5">
              <Link
                href={`/profile/${post.handle}`}
                className="truncate text-sm font-bold text-foreground hover:text-primary"
              >
                {post.author}
              </Link>
              <span className="text-xs text-muted">@{post.handle}</span>
            </div>
            <span className="text-xs text-muted">{post.createdAt}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          Open comment · min. 0.005 SOL
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="block w-full whitespace-pre-wrap wrap-break-word text-left text-sm leading-relaxed text-foreground hover:text-primary md:text-base"
        aria-label={`Open post by ${post.author}`}
      >
        {post.content}
      </button>

      <PostActions post={post} />

      {post.comments.length > 0 && (
        <div className="space-y-2 border-t border-card-border pt-3">
          {post.comments.slice(0, 2).map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          {post.comments.length > 2 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-primary hover:bg-primary/5"
              aria-label={`Read more ${post.comments.length - 2} comments`}
            >
              <span>↓</span>
              <span>View more {post.comments.length - 2} comments</span>
            </button>
          )}
        </div>
      )}

      <PostComposer post={post} />

      {isModalOpen && (
        <PostDetailModal
          postId={post.id}
          fallbackPost={post}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </article>
  );
};
