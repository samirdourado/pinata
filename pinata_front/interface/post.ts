import { iComment } from "./comment";

export interface iPost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  likes: number;
  dislikes: number;
  commentFeeSol: number;
  pinataPoolSol: number;
  comments: iComment[];
  createdAt: string;
};