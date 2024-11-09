'use client';

import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { TokenTransactionBuilder } from './transactionBuilder';

interface TokenConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  amount: bigint;
  revokeFreezeAuthority: boolean;
  revokeMintAuthority: boolean;
  mintKeypair: Keypair;
}

export async function createTokenTransaction(
  connection: Connection,
  payer: PublicKey,
  config: TokenConfig
): Promise<{ transaction: Transaction; mint: PublicKey }> {
  const builder = new TokenTransactionBuilder(
    connection,
    payer,
    config
  );
  const { transaction, mint } = await builder.buildTransaction();
  return { 
    transaction, 
    mint: mint.publicKey
  };
}
