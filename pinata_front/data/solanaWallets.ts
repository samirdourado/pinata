import { iSolanaWallet } from "@/interface/wallet";

export const SUPPORTED_WALLETS: iSolanaWallet[] = [
  {
    name: "Phantom",
    matchNames: ["phantom"],
    description: "The most popular Solana wallet, with Devnet support in its developer settings.",
    platforms: ["Chrome", "Brave", "Firefox", "Edge", "iOS", "Android"],
    downloadUrl: "https://phantom.com/download",
  },
  {
    name: "Solflare",
    matchNames: ["solflare"],
    description: "Solana-native wallet with staking and a network switcher for Devnet.",
    platforms: ["Chrome", "Brave", "Firefox", "Edge", "iOS", "Android"],
    downloadUrl: "https://www.solflare.com/download/",
  },
  {
    name: "Backpack",
    matchNames: ["backpack"],
    description: "Multi-chain wallet from the Coral team with first-class Solana support.",
    platforms: ["Chrome", "Brave", "Edge", "iOS", "Android"],
    downloadUrl: "https://backpack.app/downloads",
  },
  {
    name: "Trust Wallet",
    matchNames: ["trust"],
    description: "Multi-chain wallet whose browser extension exposes a Solana account.",
    platforms: ["Chrome", "Brave", "Edge", "iOS", "Android"],
    downloadUrl: "https://trustwallet.com/download",
  },
];

export function findSupportedWallet(walletName: string) {
  const normalizedName = walletName.toLowerCase();
  return SUPPORTED_WALLETS.find((wallet) =>
    wallet.matchNames.some((fragment) => normalizedName.includes(fragment)),
  );
}
