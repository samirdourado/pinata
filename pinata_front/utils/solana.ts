import { WalletReadyState } from "@solana/wallet-adapter-base";
import { clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";

const SOLANA_CLUSTER = "devnet";

export const SOLANA_CLUSTER_LABEL = "Devnet";

export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_CLUSTER);

export const SOLANA_FAUCET_URL = "https://faucet.solana.com";

export function lamportsToSol(lamports: number) {
  return lamports / LAMPORTS_PER_SOL;
}

export function shortenAddress(address: string, visibleChars = 4) {
  if (address.length <= visibleChars * 2 + 3) return address;
  return `${address.slice(0, visibleChars)}...${address.slice(-visibleChars)}`;
}

export function getExplorerAddressUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`;
}

export function isWalletDetected(readyState: WalletReadyState) {
  return (
    readyState === WalletReadyState.Installed ||
    readyState === WalletReadyState.Loadable
  );
}
