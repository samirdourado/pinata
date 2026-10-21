"use client";

import { use } from "react";
import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/components/AuthProvider";
import { useSocial } from "@/components/SocialProvider";

export default function PublicProfilePage(
  props: PageProps<"/profile/[handle]">,
) {
  const { handle } = use(props.params);
  const { isReady } = useAuth();
  const { profiles } = useSocial();
  const profile = profiles.find((entry) => entry.handle === handle);

  if (!isReady) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
        <p role="status" className="text-sm text-muted">
          Loading profile...
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-black text-foreground">
          Profile not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          This profile is not available in the local prototype.
        </p>
      </main>
    );
  }

  return <ProfileView profile={profile} />;
}
