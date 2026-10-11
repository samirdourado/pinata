"use client";

import { FormEvent, useState } from "react";
import { useSocial } from "@/components/SocialProvider";
import { iPost } from "@/interface/post";

export const PostComposer = ({ post }: { post: iPost }) => {
  const [content, setContent] = useState("");
  const { addComment } = useSocial();

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) return;
    addComment(post.id, content);
    setContent("");
  };

  return (
    <form onSubmit={submitComment} className="border-t border-card-border pt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Adicione um comentário de alto valor..."
          aria-label="Novo comentário"
          className="min-w-0 flex-1 rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Comentar</span>
          <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
            {post.commentFeeSol} SOL
          </span>
        </button>
      </div>
    </form>
  );
};
