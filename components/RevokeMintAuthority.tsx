'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWallet } from '@hooks/useWallet';
import { useTransaction } from '@hooks/useTransaction';
import { Transaction, ComputeBudgetProgram, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { createSetAuthorityInstruction, AuthorityType, getMint } from '@solana/spl-token';
import { useEffect } from 'react';

const TREASURY_ADDRESS = new PublicKey('6GajTk6SYnxMBXmyi3ekkZnKyePfX6XnDmmad6tau3CC');
const COMPUTE_UNIT_LIMIT = 100_000;
const COMPUTE_UNIT_PRICE = 1.67;

// Add this with the other styling constants at the top
const gradientBorder = 'border border-transparent bg-gradient-to-r from-[#9945FF]/40 to-[#14F195]/40 p-[1px]';
const glassBackground = 'backdrop-blur-md bg-[#1B1B1B]/90';
const buttonBaseStyle = `w-full px-4 py-3 rounded-lg transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        font-medium text-white`;
const dropdownBaseStyle = `w-full px-4 py-3 rounded-lg bg-[#232323] 
                          border border-[#343434] text-white
                          transition-all duration-200`;  // Add this line

interface TokenInfo {
  address: PublicKey;
  symbol: string;
  name: string;
}

function decodeMetadata(buffer: Buffer): { name: string; symbol: string } {
  try {
      // Metadata layout:
      // 1. Key (1 byte)
      // 2. Update authority (32 bytes)
      // 3. Mint (32 bytes)
      // 4. Name string length (4 bytes)
      // 5. Name string data
      // 6. Symbol string length (4 bytes)
      // 7. Symbol string data
      
      let offset = 1 + 32 + 32; // Skip key, update authority, and mint

      // Read name
      const nameLength = buffer.readUInt32LE(offset);
      offset += 4;
      const name = buffer.slice(offset, offset + nameLength).toString('utf8');
      offset += nameLength;

      // Read symbol
      const symbolLength = buffer.readUInt32LE(offset);
      offset += 4;
      const symbol = buffer.slice(offset, offset + symbolLength).toString('utf8');

      return {
          name: name.replace(/\0/g, '').trim(),
          symbol: symbol.replace(/\0/g, '').trim()
      };
  } catch (error) {
      console.error('Metadata decoding error:', error);
      return {
          name: 'Unknown Token',
          symbol: 'UNKNOWN'
      };
  }
}

export const RevokeMintAuthority = () => {
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const { publicKey, connection } = useWallet();
  const { sendTransaction, isProcessing } = useTransaction();
  const [transactionSignature, setTransactionSignature] = useState<string>('');

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey || !connection) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching tokens for:', publicKey.toString());
        
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        const tokenInfoPromises = tokenAccounts.value.map(async (ta) => {
          try {
            const mintAddress = new PublicKey(ta.account.data.parsed.info.mint);
            const mintInfo = await getMint(connection, mintAddress);
            
            if (mintInfo.mintAuthority?.equals(publicKey)) {
              const [metadataAddress] = PublicKey.findProgramAddressSync(
                [
                  Buffer.from('metadata'),
                  new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
                  mintAddress.toBuffer(),
                ],
                new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
              );

              try {
                const metadataAccount = await connection.getAccountInfo(metadataAddress);
                if (metadataAccount) {
                    console.log('Found metadata for:', mintAddress.toString());
                    const { name, symbol } = decodeMetadata(metadataAccount.data);
                    return {
                        address: mintAddress,
                        name,
                        symbol,
                    };
                }
              } catch (error) {
                console.error('Error fetching metadata:', error);
              }

              // Fallback if metadata fetch fails
              return {
                address: mintAddress,
                name: mintAddress.toString().slice(0, 8) + '...',
                symbol: 'UNKNOWN',
              };
            }
          } catch (error) {
            console.error('Error processing token:', error);
          }
          return null;
        });

        const tokenInfos = (await Promise.all(tokenInfoPromises))
          .filter((token): token is TokenInfo => token !== null);

        console.log('Found tokens:', tokenInfos);
        setTokens(tokenInfos);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setStatus('Error fetching tokens. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [publicKey, connection]);

  const handleRevoke = async () => {
    if (!publicKey || !connection || !selectedToken) return;

    try {
      setStatus('Creating transaction...');
      const token = tokens.find(t => t.address.toString() === selectedToken);
      if (!token) throw new Error('Selected token not found');

      const transaction = new Transaction();

      // Add compute budget instructions
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: Math.floor(COMPUTE_UNIT_PRICE * 1_000_000),
        })
      );

      // Add revoke mint authority instruction
      transaction.add(
        createSetAuthorityInstruction(
          token.address,
          publicKey,
          AuthorityType.MintTokens,
          null
        )
      );

      // Add treasury transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_ADDRESS,
          lamports: 0.05 * LAMPORTS_PER_SOL,
        })
      );

      setStatus('Please approve the transaction...');
      const result = await sendTransaction(transaction);
      
      if (result) {
        setTransactionSignature(result.signature);
        setStatus('success');
        setSelectedToken('');
        setIsDropdownOpen(false);
        setTokens([]);
        setIsLoading(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus(error instanceof Error ? `Error: ${error.message}` : 'An unexpected error occurred');
    }
  };

  if (!publicKey) {
    return (
      <div className="w-full max-w-[640px] mx-auto p-6">
        <div className={`${gradientBorder} rounded-2xl shadow-xl`}>
          <div className={`${glassBackground} rounded-2xl p-8`}>
            <h2 className="text-xl font-semibold text-white/80 mb-4">
              Connect Wallet
            </h2>
            <p className="text-white/60">
              Please connect your wallet to revoke mint authority
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] mx-auto p-6">
      <div className={`${gradientBorder} rounded-2xl shadow-xl`}>
        <div className={`${glassBackground} rounded-2xl p-8`}>
          <div className="mb-6">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#4F6BFF] to-[#14F195] text-transparent bg-clip-text">
              Revoke Mint Authority
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Revoking mint authority ensures no more tokens can be minted, providing security and trust for holders. 
              <span className="text-[#14F195]/70 ml-1">Cost: 0.05 SOL</span>
            </p>
          </div>

          <div className="relative mb-6">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              disabled={isLoading}
              className={`
                ${dropdownBaseStyle}
                ${isHovering && !isLoading ? 'border-[#9945FF]/30' : 'border-[#343434]'}
                ${isDropdownOpen ? 'ring-1 ring-[#9945FF]/30' : ''}
                flex items-center justify-between
              `}
            >
              <span className={selectedToken ? 'text-white' : 'text-white/50'}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading tokens...
                  </span>
                ) : selectedToken ? (
                  tokens.find(t => t.address.toString() === selectedToken)?.name || 'Unknown Token'
                ) : (
                  'Select Token'
                )}
              </span>
              <ChevronDown className={`w-5 h-5 text-white/50 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute w-full mt-2 rounded-lg bg-[#232323] border border-[#343434] shadow-xl backdrop-blur-sm z-10 overflow-hidden">
                {tokens.length === 0 ? (
                  <div className="px-4 py-3 text-white/50">
                    {isLoading ? 'Loading tokens...' : 'No tokens found with mint authority'}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {tokens.map((token) => (
                      <button
                        key={token.address.toString()}
                        className="w-full px-4 py-3 text-left hover:bg-[#9945FF]/10 text-white/90 transition-colors"
                        onClick={() => {
                          setSelectedToken(token.address.toString());
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium">{token.name}</span>
                        <span className="text-white/50 text-sm ml-2">({token.symbol})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRevoke}
            disabled={!selectedToken || isProcessing || isLoading}
            className={`
              ${buttonBaseStyle}
              ${!selectedToken || isProcessing || isLoading
                ? 'bg-[#343434] text-white/50'
                : 'bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-[#8935EE] hover:to-[#13E085] transform hover:-translate-y-0.5'
              }
              h-12 font-semibold tracking-wide
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Revoke Mint Authority'
            )}
          </button>

          {status && status === 'success' ? (
            <div className="mt-4 p-4 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#14F195] text-sm">✨ Successfully revoked mint authority!</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-xs">Transaction:</span>
                  <code className="text-[#14F195] text-xs font-mono">
                    {transactionSignature}
                  </code>
                </div>
                <div>
                  <a 
                    href={`https://explorer.solana.com/tx/${transactionSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#4F6BFF] hover:text-[#14F195] transition-colors duration-200"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            </div>
          ) : status && (
            <div className={`
              mt-4 p-4 rounded-lg text-sm
              ${status.includes('Error') 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'bg-white/5 text-white/70 border border-white/10'
              }
            `}>
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {status}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};