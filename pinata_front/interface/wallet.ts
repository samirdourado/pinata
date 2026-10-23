export interface iSolanaWallet {
  name: string;
  /** Lowercase fragments matched against the name the wallet registers in the browser. */
  matchNames: string[];
  description: string;
  platforms: string[];
  downloadUrl: string;
}
