"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";
import {
  LoginInput,
  loginUser,
  logoutUser,
  registerUser,
  RegistrationInput,
  subscribeAuth,
  getAuthSnapshot,
  getServerAuthSnapshot,
  authUserToProfile,
  ProfileUpdateInput,
  updateAccountProfile,
} from "@/utils/authStore";
import { updateSocialProfile, upsertProfile } from "@/utils/socialStore";

function useAuthSnapshot() {
  return useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
}

async function login(input: LoginInput) {
  const user = await loginUser(input);
  upsertProfile(authUserToProfile(user));
  return user;
}

async function register(input: RegistrationInput) {
  const user = await registerUser(input);
  upsertProfile(authUserToProfile(user));
  return user;
}

async function updateProfile(input: ProfileUpdateInput) {
  const currentUser = getAuthSnapshot().user;
  if (!currentUser) throw new Error("Sign in to update your profile.");
  const user = updateAccountProfile(currentUser.id, input);
  updateSocialProfile(authUserToProfile(user), currentUser.username);
  return user;
}

/** Keeps a social profile in sync with the signed-in account. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSnapshot();

  useEffect(() => {
    if (user) upsertProfile(authUserToProfile(user));
  }, [user]);

  return <>{children}</>;
}

/**
 * Reads the session straight from the auth store, like useSocial(). Each
 * component gets the server snapshot while it hydrates, even late inside a
 * Suspense boundary, so its first render always matches the server HTML.
 */
export function useAuth() {
  const { user, isReady } = useAuthSnapshot();

  return {
    user,
    isReady,
    login,
    register,
    updateProfile,
    logout: logoutUser,
  };
}
