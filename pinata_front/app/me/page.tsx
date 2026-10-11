import { ProfileView } from "@/components/ProfileView";
import { INITIAL_POSTS, PROFILES } from "@/data/mockData";

const CURRENT_HANDLE = "samirdourado";
const currentProfile = PROFILES.find(
  (profile) => profile.handle === CURRENT_HANDLE,
)!;

export default function MePage() {
  const ownPosts = INITIAL_POSTS.filter(
    (post) => post.handle === CURRENT_HANDLE,
  );

  return <ProfileView profile={currentProfile} posts={ownPosts} isOwnProfile />;
}
