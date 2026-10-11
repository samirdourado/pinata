"use client";

import { FormEvent, useState } from "react";
import { useSocial } from "@/components/SocialProvider";
import { iPost } from "@/interface/post";
import { MIN_COMMENT_SOL } from "@/utils/pinata";

interface PostComposerProps {
  post: iPost;
  layout?: "inline" | "stacked";
}

export const PostComposer = ({
  post,
  layout = "inline",
}: PostComposerProps) => {
  const [content, setContent] = useState("");
  const [amount, setAmount] = useState(post.commentFeeSol.toString());
  const { addPaidComment } = useSocial();
  const amountSol = Number(amount);
  const isValidAmount =
    Number.isFinite(amountSol) && amountSol >= MIN_COMMENT_SOL;

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim() || !isValidAmount) return;
    addPaidComment(post.id, content, amountSol);
    setContent("");
  };

  return (
    <form onSubmit={submitComment} className="border-t border-card-border pt-3">
      <div
        className={
          layout === "stacked" ? "space-y-2" : "flex flex-col gap-2 sm:flex-row"
        }
      >
        {layout === "stacked" ? (
          <textarea
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Adicione um comentário de alto valor..."
            aria-label="Novo comentário"
            className="w-full resize-y rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
          />
        ) : (
          <input
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Adicione um comentário de alto valor..."
            aria-label="Novo comentário"
            className="min-w-0 flex-1 rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
          />
        )}
        <div
          className={layout === "stacked" ? "flex w-full gap-2" : "contents"}
        >
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-card-border bg-background px-3 text-xs text-muted">
            SOL
            <input
              type="number"
              min={MIN_COMMENT_SOL}
              step="0.001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Valor do comentário em SOL"
              className="w-24 bg-transparent py-2.5 text-sm font-semibold text-foreground outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={!content.trim() || !isValidAmount}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Comentar</span>
            <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
              {isValidAmount ? amountSol : MIN_COMMENT_SOL} SOL
            </span>
          </button>
        </div>
      </div>
      {amount.length > 0 && !isValidAmount && (
        <p className="mt-2 text-xs text-red-500">
          O valor mínimo por comentário é {MIN_COMMENT_SOL} SOL.
        </p>
      )}
    </form>
  );
};
