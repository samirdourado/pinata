import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/ProfileView";
import { INITIAL_POSTS, PROFILES } from "@/data/mockData";

async function PublicProfileContent({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = PROFILES.find((entry) => entry.handle === handle);

  if (!profile) notFound();

  const userPosts = INITIAL_POSTS.filter((post) => post.handle === handle);

  return (
    <ProfileView profile={profile} posts={userPosts} isOwnProfile={false} />
  );
}

function ProfileFallback() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-8 xl:px-0">
      <div className="h-40 animate-pulse rounded-2xl border border-card-border bg-card" />
      <div className="h-64 animate-pulse rounded-2xl border border-card-border bg-card" />
    </main>
  );
}

export default function PublicProfilePage(
  props: PageProps<"/profile/[handle]">,
) {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <PublicProfileContent params={props.params} />
    </Suspense>
  );
}
