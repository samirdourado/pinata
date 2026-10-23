"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { WalletName } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useDetectedWallets,
  useWalletError,
} from "@/components/SolanaProvider";
import { findSupportedWallet, SUPPORTED_WALLETS } from "@/data/solanaWallets";
import { SOLANA_CLUSTER_LABEL } from "@/utils/solana";

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal = ({ onClose }: WalletModalProps) => {
  const { wallet, select, connecting, connected } = useWallet();
  const { walletError, clearWalletError } = useWalletError();

  const detectedWallets = [...useDetectedWallets()].sort(
      (first, second) =>
        Number(Boolean(findSupportedWallet(second.adapter.name))) -
        Number(Boolean(findSupportedWallet(first.adapter.name))),
    );
  const missingWallets = SUPPORTED_WALLETS.filter(
    (supported) =>
      !detectedWallets.some(
        (item) => findSupportedWallet(item.adapter.name) === supported,
      ),
  );

  useEffect(() => {
    if (connected) onClose();
  }, [connected, onClose]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSelect = (walletName: WalletName) => {
    clearWalletError();
    select(walletName);
  };

  // Rendered in <body>: the sticky navbar uses backdrop-filter, which would
  // otherwise become the containing block of this fixed overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 sm:items-center sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-card-border bg-card p-5 text-foreground shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close wallet selection"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-lg text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          ×
        </button>

        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Solana {SOLANA_CLUSTER_LABEL}
        </p>
        <h2
          id="wallet-modal-title"
          className="mt-1 pr-10 text-xl font-black text-foreground"
        >
          Connect a Solana wallet
        </h2>
        <p className="mt-1 text-sm text-muted">
          Only wallets that expose a Solana account are listed.
        </p>

        <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
          Detected in this browser
        </h3>
        {detectedWallets.length ? (
          <ul className="mt-2 space-y-2">
            {detectedWallets.map(({ adapter }) => {
              const isPending = connecting && wallet?.adapter.name === adapter.name;

              return (
                <li key={adapter.name}>
                  <button
                    type="button"
                    onClick={() => handleSelect(adapter.name)}
                    disabled={connecting}
                    className="flex w-full items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-3 text-left transition-colors hover:border-primary disabled:cursor-wait disabled:opacity-70"
                  >
                    <img
                      src={adapter.icon}
                      alt=""
                      className="h-9 w-9 rounded-lg"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {adapter.name}
                    </span>
                    <span className="text-xs font-semibold text-success">
                      {isPending ? "Approve in wallet..." : "Detected"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-card-border px-4 py-5 text-center text-sm text-muted">
            No Solana wallet was found in this browser. Install one of the
            wallets below and reload the page.
          </p>
        )}

        {walletError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {walletError}
          </p>
        )}

        {missingWallets.length > 0 && (
          <>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
              Supported wallets to install
            </h3>
            <ul className="mt-2 divide-y divide-card-border rounded-xl border border-card-border">
              {missingWallets.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-sm font-semibold">{item.name}</span>
                  <a
                    href={item.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Install
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <Link
          href="/wallets"
          onClick={onClose}
          className="mt-5 inline-flex text-sm font-bold text-primary hover:underline"
        >
          Which wallets work with Pinata?
        </Link>
      </section>
    </div>,
    document.body,
  );
};
