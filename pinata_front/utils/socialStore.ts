import { INITIAL_POSTS, PROFILE_WINNERS, PROFILES, CURRENT_USER_HANDLE } from "@/data/mockData";
import { iComment } from "@/interface/comment";
import { iPost } from "@/interface/post";
import { iProfile, iProfileWinner } from "@/interface/profile";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

type Vote = "up" | "down";

interface SocialState {
  posts: iPost[];
  votes: Record<string, Vote>;
  profiles: iProfile[];
  profileWinners: Record<string, iProfileWinner[]>;
}

const STORAGE_KEY = "pinata-social-state-v1";
const initialState: SocialState = {
  posts: INITIAL_POSTS,
  votes: {},
  profiles: PROFILES,
  profileWinners: PROFILE_WINNERS,
};

function parseStoredState(value: string | null): SocialState {
  if (!value) return initialState;
  try {
    const parsed = JSON.parse(value) as Partial<SocialState>;
    return {
      posts: Array.isArray(parsed.posts) ? parsed.posts : INITIAL_POSTS,
      votes: parsed.votes ?? {},
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : PROFILES,
      profileWinners: parsed.profileWinners ?? PROFILE_WINNERS,
    };
  } catch {
    return initialState;
  }
}

let state =
  typeof window === "undefined"
    ? initialState
    : parseStoredState(window.localStorage.getItem(STORAGE_KEY));
const listeners = new Set<() => void>();

function publish(nextState: SocialState) {
  state = nextState;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep the in-memory store usable when browser storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

export function getSocialSnapshot() {
  return state;
}

export function getInitialSocialSnapshot() {
  return initialState;
}

export function subscribeSocial(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = parseStoredState(event.newValue);
    listeners.forEach((notify) => notify());
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function vote(postId: string, direction: Vote) {
  const previousVote = state.votes[postId];
  const nextVote = previousVote === direction ? undefined : direction;
  const votes = { ...state.votes };
  if (nextVote) votes[postId] = nextVote;
  else delete votes[postId];

  publish({
    ...state,
    votes,
    posts: state.posts.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        likes:
          post.likes +
          (previousVote === "up" ? -1 : 0) +
          (nextVote === "up" ? 1 : 0),
        dislikes:
          post.dislikes +
          (previousVote === "down" ? -1 : 0) +
          (nextVote === "down" ? 1 : 0),
        voteUpdatedAt: Date.now(),
      };
    }),
  });
}

export function addComment(postId: string, content: string) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post || !content.trim()) return;

  const author = state.profiles.find(
    (profile) => profile.handle === CURRENT_USER_HANDLE,
  );
  const createdAt = new Date().toISOString();
  const comment: iComment = {
    id: `comment-${crypto.randomUUID()}`,
    author: author?.name ?? "Samir Dourado",
    handle: CURRENT_USER_HANDLE,
    avatar:
      author?.avatar ?? "https://api.dicebear.com/7.x/bottts/svg?seed=Samir",
    content: content.trim(),
    paidAmountSol: post.commentFeeSol,
    createdAt,
    timestamp: formatRelativeTime(createdAt),
  };

  publish({
    ...state,
    posts: state.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            comments: [comment, ...item.comments],
            pinataPoolSol: item.pinataPoolSol + item.commentFeeSol * 0.4,
          }
        : item,
    ),
    profiles: state.profiles.map((profile) =>
      profile.handle === post.handle
        ? {
            ...profile,
            pinataBalanceSol:
              profile.pinataBalanceSol + post.commentFeeSol * 0.4,
          }
        : profile,
    ),
  });
}

export function popProfilePinata(handle: string) {
  const profile = state.profiles.find((item) => item.handle === handle);
  if (!profile || profile.pinataBalanceSol < profile.pinataTargetSol * 0.6) {
    return null;
  }

  const eligibleCommenters = state.posts
    .filter((post) => post.handle === handle)
    .flatMap((post) => post.comments)
    .filter((comment) => {
      const commenterHandle =
        comment.handle ??
        state.profiles.find((item) => item.name === comment.author)?.handle;
      return commenterHandle !== handle;
    });
  if (eligibleCommenters.length === 0) return null;

  const winnerComment =
    eligibleCommenters[Math.floor(Math.random() * eligibleCommenters.length)];
  const winnerProfile = state.profiles.find(
    (item) =>
      item.handle === winnerComment.handle || item.name === winnerComment.author,
  );
  const winner: iProfileWinner = {
    id: `winner-${crypto.randomUUID()}`,
    name: winnerProfile?.name ?? winnerComment.author,
    handle: winnerProfile?.handle ?? winnerComment.handle ?? "comentarista",
    avatar: winnerProfile?.avatar ?? winnerComment.avatar,
    prizeSol: profile.pinataBalanceSol,
    createdAt: new Date().toISOString(),
  };

  publish({
    ...state,
    profiles: state.profiles.map((item) =>
      item.handle === handle ? { ...item, pinataBalanceSol: 0 } : item,
    ),
    profileWinners: {
      ...state.profileWinners,
      [handle]: [winner, ...(state.profileWinners[handle] ?? [])].slice(0, 5),
    },
  });

  return winner;
}