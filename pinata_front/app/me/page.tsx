"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function MePage() {
  const router = useRouter();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    router.replace(user ? `/profile/${user.username}` : "/login");
  }, [isReady, router, user]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <p role="status" className="text-sm text-muted">
        Opening your profile...
      </p>
    </main>
  );
}
