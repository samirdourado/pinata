import type { Metadata } from "next";
import { WalletDirectory } from "@/components/WalletDirectory";

export const metadata: Metadata = {
  title: "Supported wallets · Pinata",
  description: "Solana wallets that work with Pinata and how to get Devnet SOL.",
};

export default function WalletsPage() {
  return <WalletDirectory />;
}
