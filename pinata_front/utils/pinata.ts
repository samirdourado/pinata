import { iComment } from "@/interface/comment";
import { iPost } from "@/interface/post";
import { iProfile } from "@/interface/profile";

export const PINATA_COMMENT_SHARE = 0.4;
export const MIN_COMMENT_SOL = 0.005;

export function getValidComments(
  posts: iPost[],
  ownerHandle: string,
  startedAt?: string,
): iComment[] {
  const startTimestamp = startedAt ? new Date(startedAt).getTime() : 0;

  return posts
    .filter((post) => post.handle === ownerHandle)
    .flatMap((post) => post.comments)
    .filter((comment) => {
      if (
        !Number.isFinite(comment.paidAmountSol) ||
        comment.paidAmountSol < MIN_COMMENT_SOL
      ) {
        return false;
      }
      if (!comment.createdAt) return startTimestamp === 0;
      return new Date(comment.createdAt).getTime() >= startTimestamp;
    });
}

export function getProfilePinataSol(
  profile: iProfile,
  posts: iPost[],
): number {
  return getValidComments(posts, profile.handle, profile.pinataStartedAt).reduce(
    (total, comment) => total + comment.paidAmountSol * PINATA_COMMENT_SHARE,
    0,
  );
}

export function getPostPinataSol(post: iPost): number {
  return post.comments
    .filter(
      (comment) =>
        Number.isFinite(comment.paidAmountSol) &&
        comment.paidAmountSol >= MIN_COMMENT_SOL,
    )
    .reduce(
      (total, comment) => total + comment.paidAmountSol * PINATA_COMMENT_SHARE,
      0,
    );
}