import { z } from "zod";
import { PROFILES } from "@/data/mockData";
import { iProfile } from "@/interface/profile";

const USERS_KEY = "pinata-auth-users-v1";
const SESSION_KEY = "pinata-auth-session-v1";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be 20 characters or fewer.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(12, "Password must be 12 characters or fewer.");

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: passwordSchema,
});

export const registrationSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(60, "Name must be 60 characters or fewer."),
    username: usernameSchema,
    email: z.string().trim().email("Enter a valid email address.").transform((value) => value.toLowerCase()),
    bio: z.string().trim().max(160, "Bio must be 160 characters or fewer."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name must be 60 characters or fewer."),
  username: usernameSchema,
  bio: z.string().trim().max(160, "Bio must be 160 characters or fewer."),
});

const accountSchema = z.object({
  id: z.string(),
  username: usernameSchema,
  displayName: z.string(),
  email: z.string().email(),
  bio: z.string(),
  createdAt: z.string(),
  passwordSalt: z.string(),
  passwordHash: z.string(),
});

type StoredAccount = z.infer<typeof accountSchema>;

export type AuthUser = Omit<StoredAccount, "passwordSalt" | "passwordHash">;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export function authUserToProfile(user: AuthUser): iProfile {
  return {
    name: user.displayName,
    handle: user.username,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
    bio: user.bio,
    memberSince: new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    pinataTargetSol: 1,
  };
}

function getAccounts(): StoredAccount[] {
  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    if (!stored) return [];
    const parsed = z.array(accountSchema).safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
}

function toAuthUser(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    email: account.email,
    bio: account.bio,
    createdAt: account.createdAt,
  };
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  );
}

async function hashPassword(password: string, salt: Uint8Array) {
  const cryptoSalt = new Uint8Array(salt.byteLength);
  cryptoSalt.set(salt);
  const key = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const digest = await window.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: cryptoSalt, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(digest));
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const sessionId = window.localStorage.getItem(SESSION_KEY);
  const account = getAccounts().find((item) => item.id === sessionId);
  return account ? toAuthUser(account) : null;
}

export interface AuthSnapshot {
  user: AuthUser | null;
  isReady: boolean;
}

const AUTH_CHANGE_EVENT = "pinata-auth-change";
const SERVER_AUTH_SNAPSHOT: AuthSnapshot = { user: null, isReady: false };
let authSnapshot: AuthSnapshot | null = null;

/** Current session for useSyncExternalStore, cached until the session changes. */
export function getAuthSnapshot(): AuthSnapshot {
  authSnapshot ??= { user: getStoredAuthUser(), isReady: true };
  return authSnapshot;
}

/** The server has no localStorage, so it always renders the signed-out state. */
export function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_AUTH_SNAPSHOT;
}

function notifyAuthChange() {
  authSnapshot = null;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export async function registerUser(input: RegistrationInput): Promise<AuthUser> {
  const validated = registrationSchema.parse(input);
  const accounts = getAccounts();
  if (accounts.some((account) => account.email === validated.email)) {
    throw new Error("An account with this email already exists.");
  }
  if (accounts.some((account) => account.username === validated.username)) {
    throw new Error("This username is already taken.");
  }
  if (PROFILES.some((profile) => profile.handle === validated.username)) {
    throw new Error("This username is reserved for a demo profile.");
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const account: StoredAccount = {
    id: window.crypto.randomUUID(),
    username: validated.username,
    displayName: validated.displayName,
    email: validated.email,
    bio: validated.bio,
    createdAt: new Date().toISOString(),
    passwordSalt: bytesToHex(salt),
    passwordHash: await hashPassword(validated.password, salt),
  };

  saveAccounts([...accounts, account]);
  window.localStorage.setItem(SESSION_KEY, account.id);
  notifyAuthChange();
  return toAuthUser(account);
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const validated = loginSchema.parse(input);
  const identifier = validated.identifier.toLowerCase();
  const account = getAccounts().find(
    (item) => item.email === identifier || item.username === identifier,
  );

  if (!account) throw new Error("Invalid email, username, or password.");

  const suppliedHash = await hashPassword(
    validated.password,
    hexToBytes(account.passwordSalt),
  );
  if (suppliedHash !== account.passwordHash) {
    throw new Error("Invalid email, username, or password.");
  }

  window.localStorage.setItem(SESSION_KEY, account.id);
  notifyAuthChange();
  return toAuthUser(account);
}

export function updateAccountProfile(
  accountId: string,
  input: ProfileUpdateInput,
): AuthUser {
  const validated = profileUpdateSchema.parse(input);
  const accounts = getAccounts();
  const account = accounts.find((item) => item.id === accountId);
  if (!account) throw new Error("Your local account could not be found.");
  if (
    accounts.some(
      (item) => item.id !== accountId && item.username === validated.username,
    )
  ) {
    throw new Error("This username is already taken.");
  }
  if (
    validated.username !== account.username &&
    PROFILES.some((profile) => profile.handle === validated.username)
  ) {
    throw new Error("This username is reserved for a demo profile.");
  }

  const updatedAccount: StoredAccount = { ...account, ...validated };
  saveAccounts(
    accounts.map((item) => (item.id === accountId ? updatedAccount : item)),
  );
  notifyAuthChange();
  return toAuthUser(updatedAccount);
}

export function logoutUser() {
  window.localStorage.removeItem(SESSION_KEY);
  notifyAuthChange();
}

export function subscribeAuth(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== USERS_KEY && event.key !== SESSION_KEY) return;
    authSnapshot = null;
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
  };
}