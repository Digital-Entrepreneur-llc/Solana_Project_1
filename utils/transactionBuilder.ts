'use client';

import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import { createMetadataInstructionData } from './createMetadataInstructionData';

const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TREASURY_ADDRESS = new PublicKey('6GajTk6SYnxMBXmyi3ekkZnKyePfX6XnDmmad6tau3CC');
const COMPUTE_UNIT_LIMIT = 100_000;
const COMPUTE_UNIT_PRICE = 1.67;

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

export class TokenTransactionBuilder {
  private connection: Connection;
  private payer: PublicKey;  // ✓ Correctly using PublicKey
  private mint: Keypair;
  private config: TokenConfig;

  constructor(connection: Connection, payer: PublicKey, config: TokenConfig) {
    this.connection = connection;
    this.payer = payer;
    this.mint = config.mintKeypair;
    this.config = config;
  }

  async buildTransaction(): Promise<{ transaction: Transaction; mint: Keypair }> {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    
    // Calculate total cost including rent and fees
    const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);
    const totalCost = mintRent + this.calculateFee();
    
    // Check payer balance
    const payerBalance = await this.connection.getBalance(this.payer);
    if (payerBalance < totalCost) {
      throw new Error(
        `Insufficient balance. Required: ${totalCost / LAMPORTS_PER_SOL} SOL, ` +
        `Found: ${payerBalance / LAMPORTS_PER_SOL} SOL`
      );
    }

    const transaction = new Transaction({
      feePayer: this.payer,  // ✓ Correct fee payer
      blockhash,
      lastValidBlockHeight,
    });

    // Add compute budget instructions
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.floor(COMPUTE_UNIT_PRICE * 1_000_000),
      })
    );

    // Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.payer,
        newAccountPubkey: this.mint.publicKey,
        space: 82,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID,
      })
    );

    // Initialize mint
    transaction.add(
      createInitializeMintInstruction(
        this.mint.publicKey,
        this.config.decimals,
        this.payer,  // mint authority
        this.payer   // freeze authority
      )
    );

    // Get associated token account
    const associatedTokenAccount = await this.getAssociatedTokenAccount();

    // Create associated token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        this.payer,  // payer
        associatedTokenAccount,
        this.payer,  // owner
        this.mint.publicKey
      )
    );

    // Mint tokens
    transaction.add(
      createMintToInstruction(
        this.mint.publicKey,
        associatedTokenAccount,
        this.payer,  // mint authority
        this.config.amount
      )
    );

    // Create metadata
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        this.mint.publicKey.toBuffer(),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );

    const createMetadataInstruction = new TransactionInstruction({
      programId: MPL_TOKEN_METADATA_PROGRAM_ID,
      keys: [
        { pubkey: metadataAddress, isSigner: false, isWritable: true },
        { pubkey: this.mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: this.payer, isSigner: true, isWritable: false },
        { pubkey: this.payer, isSigner: true, isWritable: false },
        { pubkey: this.payer, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: createMetadataInstructionData(
        this.config.name,
        this.config.symbol,
        this.config.uri
      )
    });

    transaction.add(createMetadataInstruction);

    // Handle authorities
    if (this.config.revokeFreezeAuthority) {
      transaction.add(
        createSetAuthorityInstruction(
          this.mint.publicKey,
          this.payer,
          AuthorityType.FreezeAccount,
          null
        )
      );
    }

    if (this.config.revokeMintAuthority) {
      transaction.add(
        createSetAuthorityInstruction(
          this.mint.publicKey,
          this.payer,
          AuthorityType.MintTokens,
          null
        )
      );
    }

    // Add treasury transfer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.payer,
        toPubkey: TREASURY_ADDRESS,
        lamports: this.calculateFee(),
      })
    );

    return { transaction, mint: this.mint };
  }

  private calculateFee(): number {
    const baseFee = 0.25 * LAMPORTS_PER_SOL;
    const authorityFee = 0.05 * LAMPORTS_PER_SOL;
    return baseFee +
      (this.config.revokeFreezeAuthority ? authorityFee : 0) +
      (this.config.revokeMintAuthority ? authorityFee : 0);
  }

  private async getAssociatedTokenAccount(): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [
        this.payer.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        this.mint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
  }
}