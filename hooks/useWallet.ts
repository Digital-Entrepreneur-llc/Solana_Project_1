'use client';

import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useCallback, useMemo } from 'react';
import { Transaction, SendOptions } from '@solana/web3.js';

export const useWallet = () => {
  const { 
    publicKey,
    connecting,
    connected,
    disconnect,
    wallet,
    sendTransaction: walletAdapterSendTransaction,
    select,
  } = useSolanaWallet();
  
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const connectWallet = useCallback(() => {
    if (!wallet) {
      setVisible(true);
    } else {
      select(wallet.adapter.name);
    }
  }, [wallet, setVisible, select]);

  const signAndSendTransaction = async (transaction: Transaction, options?: SendOptions) => {
    if (!wallet || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    return await walletAdapterSendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5,
      ...options
    });
  };

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  const walletAddress = useMemo(() => {
    if (!base58) return '';
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [base58]);

  return {
    connectWallet,
    disconnectWallet: disconnect,
    walletAddress,
    connecting,
    connected,
    publicKey,
    wallet,
    signAndSendTransaction,
    connection
  };
};