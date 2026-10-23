"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import {
  useDetectedWallets,
  useIsHydrated,
} from "@/components/SolanaProvider";
import { findSupportedWallet, SUPPORTED_WALLETS } from "@/data/solanaWallets";

export const WalletStatusCard = () => {
  const isHydrated = useIsHydrated();
  const detectedWallets = useDetectedWallets();
  const { wallet, connected } = useWallet();
  const { user } = useAuth();
  const detectedNames = detectedWallets.map(
    ({ adapter }) => findSupportedWallet(adapter.name)?.name ?? adapter.name,
  );

  let title = "Checking this browser...";
  let detail = "Looking for compatible Solana wallets.";
  let statusClassName = "bg-muted";

  if (isHydrated && connected && wallet) {
    title = `Connected with ${wallet.adapter.name}`;
    detail = "Your wallet is ready for Pinata on Devnet.";
    statusClassName = "bg-success";
  } else if (isHydrated && detectedNames.length) {
    title =
      detectedNames.length === 1
        ? `${detectedNames[0]} detected`
        : `${detectedNames.length} compatible wallets detected`;
    detail = user
      ? "Click Connect Wallet at the top to use it."
      : "Sign in and click Connect Wallet to use it.";
    statusClassName = "bg-success";
  } else if (isHydrated) {
    title = "No compatible wallet detected";
    detail = `Install a wallet such as ${SUPPORTED_WALLETS[0].name} or ${SUPPORTED_WALLETS[1].name} to connect.`;
    statusClassName = "bg-accent";
  }

  return (
    <Link
      href="/wallets"
      className="group block rounded-2xl bg-card border border-card-border p-5 shadow-sm space-y-3 transition-all hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <h4 className="font-bold text-sm text-foreground">👛 Solana wallets</h4>

      <div className="flex items-start gap-3">
        {isHydrated && detectedWallets.length > 0 ? (
          <div className="flex shrink-0 -space-x-2">
            {detectedWallets.slice(0, 3).map(({ adapter }) => (
              <img
                key={adapter.name}
                src={adapter.icon}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-card bg-background"
              />
            ))}
          </div>
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-base">
            🔍
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${statusClassName}`}
            />
            <span role="status">{title}</span>
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {detail}
          </p>
        </div>
      </div>

      <span className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        See supported wallets
        <span
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
  );
};
