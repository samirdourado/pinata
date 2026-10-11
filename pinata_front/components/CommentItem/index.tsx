"use client";

import { useEffect, useState } from "react";
import { iComment } from "@/interface/comment";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

export const CommentItem = ({ comment }: { comment: iComment }) => {
  const [timestamp, setTimestamp] = useState(() =>
    comment.createdAt
      ? formatRelativeTime(comment.createdAt)
      : comment.timestamp,
  );

  useEffect(() => {
    if (!comment.createdAt) return;
    const updateTimestamp = () =>
      setTimestamp(formatRelativeTime(comment.createdAt!));
    const interval = window.setInterval(updateTimestamp, 60_000);
    return () => window.clearInterval(interval);
  }, [comment.createdAt]);

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
            <time className="text-[10px] text-muted">{timestamp}</time>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-foreground">
            {comment.content}
          </p>
          <span className="mt-2 inline-block text-[10px] font-mono font-semibold text-success">
            ✓ Pago: {comment.paidAmountSol} SOL
          </span>
        </div>
      </div>
    </article>
  );
};
