"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ConnectionProvider,
  useConnection,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { Adapter, WalletError } from "@solana/wallet-adapter-base";
import {
  isWalletDetected,
  lamportsToSol,
  SOLANA_RPC_URL,
} from "@/utils/solana";

// Only Wallet Standard wallets are listed, so wallets that do not register a
// Solana account (EVM-only wallets such as Ronin) never appear.
const LEGACY_ADAPTERS: Adapter[] = [];
const WALLET_STORAGE_KEY = "pinata-wallet-name-v1";

interface WalletErrorContextValue {
  walletError: string;
  clearWalletError: () => void;
}

const WalletErrorContext = createContext<WalletErrorContextValue | null>(null);

function getWalletErrorMessage(error: WalletError) {
  const message = error.error?.message ?? error.message;
  if (/reject|denied|cancel/i.test(message)) {
    return "The connection request was rejected in the wallet.";
  }
  if (error.name === "WalletNotReadyError") {
    return "This wallet is not available in your browser. Install it and reload the page.";
  }
  return message || "Could not connect to the wallet. Please try again.";
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [walletError, setWalletError] = useState("");

  const handleError = useCallback((error: WalletError) => {
    setWalletError(getWalletErrorMessage(error));
  }, []);

  const clearWalletError = useCallback(() => setWalletError(""), []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider
        wallets={LEGACY_ADAPTERS}
        autoConnect
        localStorageKey={WALLET_STORAGE_KEY}
        onError={handleError}
      >
        <WalletErrorContext.Provider value={{ walletError, clearWalletError }}>
          {children}
        </WalletErrorContext.Provider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletError() {
  const context = useContext(WalletErrorContext);
  if (!context) {
    throw new Error("useWalletError must be used inside SolanaProvider.");
  }
  return context;
}

const subscribeToNothing = () => () => {};

/** False during server rendering and hydration, true once running in the browser. */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Wallets installed in this browser. Empty during server rendering and
 * hydration, because browser extensions are only visible on the client.
 */
export function useDetectedWallets() {
  const { wallets } = useWallet();
  const isHydrated = useIsHydrated();
  return isHydrated
    ? wallets.filter((item) => isWalletDetected(item.readyState))
    : [];
}

interface BalanceState {
  address: string;
  sol: number | null;
  failed: boolean;
}

export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<BalanceState | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const address = publicKey?.toBase58() ?? null;

  useEffect(() => {
    if (!publicKey) return;
    const owner = publicKey.toBase58();
    let isActive = true;

    connection
      .getBalance(publicKey, "confirmed")
      .then((lamports) => {
        if (isActive) {
          setState({ address: owner, sol: lamportsToSol(lamports), failed: false });
        }
      })
      .catch(() => {
        if (isActive) setState({ address: owner, sol: null, failed: true });
      });

    const subscriptionId = connection.onAccountChange(
      publicKey,
      (account) => {
        setState({ address: owner, sol: lamportsToSol(account.lamports), failed: false });
      },
      { commitment: "confirmed" },
    );

    return () => {
      isActive = false;
      void connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey, refreshCount]);

  const current = state && state.address === address ? state : null;

  return {
    balanceSol: current?.sol ?? null,
    isLoading: Boolean(address) && !current,
    hasError: current?.failed ?? false,
    refresh: () => setRefreshCount((count) => count + 1),
  };
}
