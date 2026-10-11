"use client";

import { RelativeTime } from "@/components/RelativeTime";
import { iComment } from "@/interface/comment";

export const CommentItem = ({ comment }: { comment: iComment }) => {
  return (
    <article className="rounded-xl border border-card-border bg-background p-3.5">
      <div className="flex items-start gap-2.5">
        <img
          src={comment.avatar}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full border border-card-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-bold text-foreground">
              {comment.author}
            </span>
            <RelativeTime
              value={comment.createdAt ?? comment.timestamp}
              fallback={comment.timestamp}
              className="text-[10px] text-muted"
            />
          </div>
          <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-foreground">
            {comment.content}
          </p>
          <span className="mt-2 inline-block text-[10px] font-mono font-semibold text-success">
            ✓ Paid: {comment.paidAmountSol} SOL
          </span>
        </div>
      </div>
    </article>
  );
};
