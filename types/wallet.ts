import { Transaction, SendOptions } from '@solana/web3.js';

export interface WalletProvider {
  signAndSendTransaction(transaction: Transaction, options?: SendOptions): Promise<{ signature: string }>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: WalletProvider;
    };
    solflare?: WalletProvider;
  }
}

export interface TransactionResponse {
  signature: string;
  status: 'confirmed' | 'failed';
} 