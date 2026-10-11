import { iPost } from "@/interface/post";

export type PostSort =
  | "score"
  | "upvotes"
  | "downvotes"
  | "comments-most"
  | "comments-least"
  | "pinata-full"
  | "pinata-empty";

export function sortPosts(posts: iPost[], sort: PostSort): iPost[] {
  return [...posts].sort((first, second) => {
    let comparison = 0;

    switch (sort) {
      case "upvotes":
        comparison = second.likes - first.likes;
        break;
      case "downvotes":
        comparison = second.dislikes - first.dislikes;
        break;
      case "comments-most":
        comparison = second.comments.length - first.comments.length;
        break;
      case "comments-least":
        comparison = first.comments.length - second.comments.length;
        break;
      case "pinata-full":
        comparison = second.pinataPoolSol - first.pinataPoolSol;
        break;
      case "pinata-empty":
        comparison = first.pinataPoolSol - second.pinataPoolSol;
        break;
      default:
        comparison =
          second.likes -
          second.dislikes -
          (first.likes - first.dislikes);
    }

    return (
      comparison ||
      (second.voteUpdatedAt ?? 0) - (first.voteUpdatedAt ?? 0) ||
      first.id.localeCompare(second.id)
    );
  });
}