"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AuthUser,
  LoginInput,
  loginUser,
  logoutUser,
  registerUser,
  RegistrationInput,
  subscribeAuth,
  getStoredAuthUser,
  authUserToProfile,
  ProfileUpdateInput,
  updateAccountProfile,
} from "@/utils/authStore";
import { updateSocialProfile, upsertProfile } from "@/utils/socialStore";

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegistrationInput) => Promise<AuthUser>;
  updateProfile: (input: ProfileUpdateInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const refreshUser = () => {
      const storedUser = getStoredAuthUser();
      if (storedUser) upsertProfile(authUserToProfile(storedUser));
      setUser(storedUser);
      setIsReady(true);
    };

    refreshUser();
    return subscribeAuth(refreshUser);
  }, []);

  const login = async (input: LoginInput) => {
    const nextUser = await loginUser(input);
    upsertProfile(authUserToProfile(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const register = async (input: RegistrationInput) => {
    const nextUser = await registerUser(input);
    upsertProfile(authUserToProfile(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const updateProfile = async (input: ProfileUpdateInput) => {
    if (!user) throw new Error("Sign in to update your profile.");
    const previousHandle = user.username;
    const nextUser = updateAccountProfile(user.id, input);
    updateSocialProfile(authUserToProfile(nextUser), previousHandle);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isReady, login, register, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
