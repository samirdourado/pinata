"use client";

import { ReactNode, useSyncExternalStore } from "react";
import {
  addPaidComment,
  getInitialSocialSnapshot,
  getSocialSnapshot,
  popProfilePinata,
  subscribeSocial,
  vote,
} from "@/utils/socialStore";

export function SocialProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSocial() {
  const state = useSyncExternalStore(
    subscribeSocial,
    getSocialSnapshot,
    getInitialSocialSnapshot,
  );

  return { ...state, addPaidComment, popProfilePinata, vote };
}
