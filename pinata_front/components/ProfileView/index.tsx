"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { PinataProgress } from "@/components/PinataProgress";
import { useAuth } from "@/components/AuthProvider";
import { useSocial } from "@/components/SocialProvider";
import { iProfile } from "@/interface/profile";
import { getProfilePinataSol } from "@/utils/pinata";
import { ProfileUpdateInput, profileUpdateSchema } from "@/utils/authStore";
import { sortPosts } from "@/utils/sortPosts";

export const ProfileView = ({
  profile: fallbackProfile,
}: {
  profile: iProfile;
}) => {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { posts: allPosts, profiles, createPost } = useSocial();
  const [postDraft, setPostDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileUpdateInput>({
    displayName: "",
    username: "",
    bio: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const profile =
    profiles.find((entry) => entry.handle === fallbackProfile.handle) ??
    fallbackProfile;
  const posts = sortPosts(
    allPosts.filter((post) => post.handle === profile.handle),
    "score",
  );
  const isOwnProfile = Boolean(user && profile.handle === user.username);
  const balanceSol = getProfilePinataSol(profile, allPosts);
  const balancePercent = Math.min(
    (balanceSol / profile.pinataTargetSol) * 100,
    100,
  );
  const canPop = balanceSol >= profile.pinataTargetSol * 0.6;
  const percentToMinimum = Math.max(0, Math.ceil(60 - balancePercent));

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postDraft.trim()) return;
    createPost(postDraft);
    setPostDraft("");
  };

  const startEditing = () => {
    if (!user) return;
    setProfileDraft({
      displayName: user.displayName,
      username: user.username,
      bio: user.bio,
    });
    setFieldErrors({});
    setFormError("");
    setIsEditing(true);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    const result = profileUpdateSchema.safeParse(profileDraft);
    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateProfile(result.data);
      setIsEditing(false);
      router.replace(`/profile/${updatedUser.username}`);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-8 xl:px-0">
      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-20 w-20 rounded-full border border-card-border bg-background"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-foreground">
              {profile.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted">@{profile.handle}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
              {profile.bio}
            </p>
            <p className="mt-2 text-xs text-muted">
              Joined Pinata in {profile.memberSince}
            </p>
            {isOwnProfile && user && (
              <p className="mt-1 text-xs text-muted">{user.email}</p>
            )}
          </div>
          {isOwnProfile ? (
            <button
              type="button"
              onClick={startEditing}
              className="min-h-11 rounded-xl border border-card-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary"
            >
              Edit profile
            </button>
          ) : (
            <div className="w-full rounded-xl border border-card-border bg-background p-4 sm:w-72">
              <div className="flex items-center gap-3">
                <Image
                  src="/pinataB.png"
                  alt=""
                  width={34}
                  height={34}
                  className="h-8.5 w-8.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="text-foreground">User Piñata</span>
                    <span className="shrink-0 text-primary">
                      {balanceSol.toFixed(2)} /{" "}
                      {profile.pinataTargetSol.toFixed(2)} SOL
                    </span>
                  </div>
                  <PinataProgress
                    valueSol={balanceSol}
                    targetSol={profile.pinataTargetSol}
                    className="mt-2"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {canPop
                  ? "The Piñata can be burst at any time."
                  : `Need ${percentToMinimum}% more to unlock the pinata burst.`}
              </p>
            </div>
          )}
        </div>
      </section>

      {isOwnProfile && isEditing && (
        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Edit profile</h2>
            <p className="mt-1 text-sm text-muted">
              Update the information shown on your public profile.
            </p>
          </div>
          <form
            onSubmit={handleSaveProfile}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="profile-display-name"
                className="text-sm font-semibold text-foreground"
              >
                Display name
              </label>
              <input
                id="profile-display-name"
                value={profileDraft.displayName}
                onChange={(event) =>
                  setProfileDraft((draft) => ({
                    ...draft,
                    displayName: event.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-card-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
                aria-invalid={Boolean(fieldErrors.displayName)}
              />
              {fieldErrors.displayName && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.displayName}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="profile-username"
                className="text-sm font-semibold text-foreground"
              >
                Username
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-card-border bg-background px-3.5 focus-within:border-primary">
                <span className="text-sm text-muted">@</span>
                <input
                  id="profile-username"
                  value={profileDraft.username}
                  onChange={(event) =>
                    setProfileDraft((draft) => ({
                      ...draft,
                      username: event.target.value,
                    }))
                  }
                  className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none"
                  aria-invalid={Boolean(fieldErrors.username)}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.username}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="profile-bio"
                className="text-sm font-semibold text-foreground"
              >
                Bio
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={160}
                value={profileDraft.bio}
                onChange={(event) =>
                  setProfileDraft((draft) => ({
                    ...draft,
                    bio: event.target.value,
                  }))
                }
                className="mt-1.5 w-full resize-y rounded-xl border border-card-border bg-background px-3.5 py-3 text-sm text-foreground outline-none focus:border-primary"
                aria-invalid={Boolean(fieldErrors.bio)}
              />
              {fieldErrors.bio && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted">
                Account email: {user?.email} · Email changes are not available
                in this prototype.
              </p>
            </div>
            {formError && (
              <p
                role="alert"
                className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-11 rounded-xl border border-card-border px-4 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div
        className={
          isOwnProfile
            ? "grid grid-cols-1 items-start gap-6 lg:grid-cols-3"
            : "space-y-6"
        }
      >
        <section className={`space-y-4 ${isOwnProfile ? "lg:col-span-2" : ""}`}>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">Posts</h2>
            <span className="text-xs text-muted">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>
          {posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="rounded-xl border border-dashed border-card-border px-5 py-10 text-center text-sm text-muted">
              No posts here yet.
            </div>
          )}
        </section>

        {isOwnProfile && (
          <aside className="space-y-4 lg:sticky lg:top-24">
            <form
              onSubmit={handleCreatePost}
              className="rounded-2xl border border-card-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">
                  Create a post
                </h2>
              </div>
              <textarea
                value={postDraft}
                onChange={(event) => setPostDraft(event.target.value)}
                rows={4}
                placeholder="Share something with the community..."
                className="w-full resize-none rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted focus:border-primary focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!postDraft.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Publish
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
};
