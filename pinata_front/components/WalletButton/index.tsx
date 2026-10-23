"use client";

import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletBalance } from "@/components/SolanaProvider";
import { WalletModal } from "@/components/WalletModal";
import { getExplorerAddressUrl, shortenAddress } from "@/utils/solana";

export const WalletButton = () => {
  const { publicKey, wallet, connecting, disconnect } = useWallet();
  const { balanceSol, isLoading, hasError } = useWalletBalance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const address = publicKey?.toBase58();

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const changeWallet = async () => {
    setIsMenuOpen(false);
    await disconnect();
    setIsModalOpen(true);
  };

  if (!address) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={connecting}
          className="px-5 py-2.5 rounded-xl bg-linear-to-r from-primary to-primary-hover text-(--text-primary) text-sm font-bold shadow-md shadow-purple-500/20 hover:opacity-95 transition-all cursor-pointer active:scale-95 disabled:cursor-wait disabled:opacity-70"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
        {isModalOpen && <WalletModal onClose={closeModal} />}
      </>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-card-border text-sm font-semibold">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span>
          {isLoading
            ? "..."
            : hasError || balanceSol === null
              ? "-- SOL"
              : `${balanceSol.toFixed(2)} SOL`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setIsMenuOpen((open) => !open)}
        aria-expanded={isMenuOpen}
        aria-label={`Wallet ${address}`}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-card-border hover:border-primary text-sm font-medium transition-all cursor-pointer"
      >
        {wallet ? (
          <img src={wallet.adapter.icon} alt="" className="h-4 w-4 rounded" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-purple-500" />
        )}
        <span>{shortenAddress(address)}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-card-border bg-card p-2 shadow-xl">
          <p className="px-3 py-2 text-[11px] text-muted">
            Connected with {wallet?.adapter.name ?? "wallet"}
          </p>
          <button
            type="button"
            onClick={copyAddress}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            {copied ? "Address copied" : "Copy address"}
          </button>
          <a
            href={getExplorerAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            View on Explorer
          </a>
          <button
            type="button"
            onClick={changeWallet}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Change wallet
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              void disconnect();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-background"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
