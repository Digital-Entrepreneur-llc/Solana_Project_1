'use client';

import { useState } from 'react';
import { Transaction, Keypair } from '@solana/web3.js';
import { useWallet } from '@hooks/useWallet';
import { TransactionResponse } from '@/app/types/wallet';

export const useTransaction = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signAndSendTransaction, connection } = useWallet();

  const sendTransaction = async (
    transaction: Transaction,
    additionalSigners: Keypair[] = []
  ): Promise<TransactionResponse | null> => {
    try {
      console.log('Starting transaction process...');
      setIsProcessing(true);
      setError(null);
  
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
  
      // Get latest blockhash
      console.log('Getting latest blockhash...');
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      
      // Set transaction parameters
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Have additional signers (like mint) sign first
      console.log('Adding additional signatures:', additionalSigners.length);
      if (additionalSigners.length > 0) {
        transaction.partialSign(...additionalSigners);
      }

      // Use the wallet adapter's sendTransaction which returns the signature directly
      console.log('Sending transaction through wallet adapter...');
      const signature = await signAndSendTransaction(transaction);
      console.log('Got signature:', signature);

      // Instead of using signatureSubscribe, use getSignatureStatus with retry
      let status = null;
      let retries = 30; // 30 attempts, 1 second apart

      while (retries > 0 && status?.value?.confirmationStatus !== 'confirmed') {
        try {
          status = await connection.getSignatureStatus(signature);
          
          if (status?.value?.err) {
            throw new Error(`Transaction failed: ${status.value.err.toString()}`);
          }

          if (status?.value?.confirmationStatus === 'confirmed') {
            console.log('Transaction confirmed:', signature);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        } catch {
          console.log('Retrying confirmation check...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
        }
      }

      if (!status?.value?.confirmationStatus) {
        throw new Error('Transaction confirmation timeout');
      }

      // Cast the status to match TransactionResponse type
      const confirmedStatus: "confirmed" | "failed" = 
        status.value.err ? "failed" : "confirmed";

      return {
        signature,
        status: confirmedStatus
      };

    } catch (err) {
      console.log('Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });

      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      console.error('Transaction error:', errorMessage);
      return null;

    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendTransaction,
    isProcessing,
    error,
  };
};