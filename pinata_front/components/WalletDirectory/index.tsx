"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/components/AuthProvider";
import {
  useDetectedWallets,
  useWalletBalance,
} from "@/components/SolanaProvider";
import { WalletButton } from "@/components/WalletButton";
import { findSupportedWallet, SUPPORTED_WALLETS } from "@/data/solanaWallets";
import {
  getExplorerAddressUrl,
  SOLANA_CLUSTER_LABEL,
  SOLANA_FAUCET_URL,
} from "@/utils/solana";

export const WalletDirectory = () => {
  const { wallet, publicKey } = useWallet();
  const { user, isReady } = useAuth();
  const { balanceSol, refresh } = useWalletBalance();
  const networkLabel = SOLANA_CLUSTER_LABEL;
  const address = publicKey?.toBase58();
  const detectedWallets = useDetectedWallets();
  const otherDetectedWallets = detectedWallets.filter(
    (item) => !findSupportedWallet(item.adapter.name),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-8 xl:px-0">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Solana {networkLabel}
          </p>
          <h1 className="mt-1 text-3xl font-black text-foreground">
            Supported wallets
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Pinata connects to Solana wallets through the Solana Wallet
            Adapter. Wallets built only for other networks, such as Ethereum
            or Ronin, are not listed when you click Connect Wallet.
          </p>
        </div>
        {/* Signed-in users already have the wallet button in the navbar. */}
        {isReady && !user && <WalletButton />}
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-foreground">Your connection</h2>
        {address ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Wallet</p>
              <p className="mt-1 font-semibold">{wallet?.adapter.name}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted">Address</p>
              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate font-mono text-xs font-semibold text-primary hover:underline"
              >
                {address}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted">{networkLabel} balance</p>
              <p className="mt-1 font-semibold">
                {balanceSol === null ? "--" : `${balanceSol.toFixed(4)} SOL`}
                <button
                  type="button"
                  onClick={refresh}
                  className="ml-2 text-xs font-bold text-primary hover:underline"
                >
                  Refresh
                </button>
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No wallet connected. {detectedWallets.length} Solana wallet
            {detectedWallets.length === 1 ? "" : "s"} detected in this browser.
          </p>
        )}
      </section>

      <section aria-label="Supported wallets" className="grid gap-4 sm:grid-cols-2">
        {SUPPORTED_WALLETS.map((item) => {
          const detected = detectedWallets.find(
            (candidate) => findSupportedWallet(candidate.adapter.name) === item,
          );

          return (
            <article
              key={item.name}
              className="flex flex-col rounded-2xl border border-card-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {detected ? (
                  <img
                    src={detected.adapter.icon}
                    alt=""
                    className="h-10 w-10 rounded-xl"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-lg font-black text-primary">
                    {item.name[0]}
                  </span>
                )}
                <h2 className="min-w-0 flex-1 text-lg font-bold text-foreground">
                  {item.name}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    detected
                      ? "bg-success/10 text-success"
                      : "bg-background text-muted"
                  }`}
                >
                  {detected ? "Detected" : "Not installed"}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted">
                {item.description}
              </p>
              <p className="mt-2 text-xs text-muted">
                {item.platforms.join(" · ")}
              </p>
              {!detected && (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-10 w-fit items-center rounded-xl border border-card-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary"
                >
                  Install {item.name}
                </a>
              )}
            </article>
          );
        })}
      </section>

      {otherDetectedWallets.length > 0 && (
        <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Other Solana wallets detected
          </h2>
          <p className="mt-1 text-sm text-muted">
            These wallets expose a Solana account, so they also work with
            Pinata.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherDetectedWallets.map(({ adapter }) => (
              <li
                key={adapter.name}
                className="flex items-center gap-2 rounded-xl border border-card-border bg-background px-3 py-2 text-sm font-semibold"
              >
                <img src={adapter.icon} alt="" className="h-5 w-5 rounded" />
                {adapter.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Why is my wallet missing?
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <li>
              Pinata only lists wallets that register a Solana account in the
              browser. EVM-only wallets such as Ronin, or MetaMask without a
              Solana account, do not appear.
            </li>
            <li>
              If you just installed a wallet, unlock it and reload this page.
            </li>
            <li>
              On mobile, open Pinata inside your wallet&apos;s built-in browser.
            </li>
          </ul>
        </article>

        <article className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Get {networkLabel} SOL
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Pinata runs on Solana {networkLabel}. {networkLabel} SOL has no real
            value and is free from the official faucet. Paste your wallet
            address there, then come back and refresh your balance. In Phantom,
            enable Testnet Mode in Settings, Developer Settings to see{" "}
            {networkLabel} funds in the wallet.
          </p>
          <a
            href={SOLANA_FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Open Solana Faucet
          </a>
        </article>
      </section>

      <p className="text-xs text-muted">
        Comment fees and Piñata prizes are still simulated in this prototype.
        Connecting a wallet only reads your public address and balance. Pinata
        does not request signatures or send transactions yet.
      </p>
    </main>
  );
};
