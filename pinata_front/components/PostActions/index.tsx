"use client";

import { iPost } from "@/interface/post";
import { useSocial } from "@/components/SocialProvider";

interface PostActionsProps {
  post: iPost;
}

export const PostActions = ({ post }: PostActionsProps) => {
  const { votes, vote } = useSocial();
  const currentVote = votes[post.id];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border pt-3 text-xs text-muted">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Dar upvote, ${post.likes} votos`}
          aria-pressed={currentVote === "up"}
          onClick={() => vote(post.id, "up")}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
            currentVote === "up"
              ? "border-primary bg-primary/10 font-bold text-primary"
              : "border-card-border text-foreground hover:border-primary"
          }`}
        >
          ▲ <span>{post.likes}</span>
        </button>
        <button
          type="button"
          aria-label={`Dar downvote, ${post.dislikes} votos`}
          aria-pressed={currentVote === "down"}
          onClick={() => vote(post.id, "down")}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
            currentVote === "down"
              ? "border-red-500 bg-red-500/10 font-bold text-red-500"
              : "border-card-border text-foreground hover:border-red-500"
          }`}
        >
          ▼ <span>{post.dislikes}</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium">
          💬 {post.comments.length}{" "}
          {post.comments.length === 1 ? "comentário" : "comentários"}
        </span>
        <span className="font-semibold text-primary">
          Piñata {post.pinataPoolSol.toFixed(3)} SOL
        </span>
      </div>
    </div>
  );
};
