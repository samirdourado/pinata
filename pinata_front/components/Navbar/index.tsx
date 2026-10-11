"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Trending Posts", href: "/trending" },
  { label: "Profile", href: "/me" },
];

const notifications = [
  { id: 1, title: "Your reply got an upvote", detail: "8 minutes ago" },
  { id: 2, title: "Someone commented on your post", detail: "1 hour ago" },
  {
    id: 3,
    title: "The Piñata Pool is close to its goal",
    detail: "3 hours ago",
  },
];

export const Navbar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState("7Xw3...42a1");
  const [solBalance] = useState(2.45);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pathname = usePathname();

  const toggleWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-(--card)/80 backdrop-blur-md px-4 sm:px-8 xl:px-0 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center text-xl">
            <Image
              alt="Pinata image."
              src="/pinataA.png"
              width={60}
              height={60}
            />
          </div>
          <div>
            <span className="text-xl font-black">Pinata</span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-primary font-medium border border-purple-500/20">
              Devnet
            </span>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto"
        >
          {navigation.map((item) => {
            const isActive =
              item.href === "/me"
                ? pathname === "/me" || pathname === "/profile/samirdourado"
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((open) => !open)}
              aria-expanded={isNotificationsOpen}
              aria-label={`Notifications, ${notifications.length} unread`}
              className="relative flex h-10 items-center justify-center rounded-xl border border-card-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary"
            >
              Notifications
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-card-border bg-card p-2 shadow-xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Notifications
                  </h2>
                  <span className="text-xs text-muted">
                    {notifications.length} new
                  </span>
                </div>
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-background"
                      >
                        <span className="block text-xs font-medium text-foreground">
                          {notification.title}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">
                          {notification.detail}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-card-border text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>{solBalance.toFixed(2)} SOL</span>
              </div>

              <button
                onClick={toggleWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-card-border hover:border-primary text-sm font-medium transition-all cursor-pointer"
                title="Click to simulate disconnect"
              >
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>{walletAddress}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={toggleWallet}
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-primary to-primary-hover text-(--text-primary) text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
