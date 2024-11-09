'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useCreateMetadata } from '@utils/createMetadataV3';
import { useWallet } from '@hooks/useWallet';
import { createTokenTransaction } from '@utils/createTokenTransaction';
import { useTransaction } from '@hooks/useTransaction';
import { Keypair } from '@solana/web3.js';

interface FormData {
  name: string;
  symbol: string;
  decimals: string;
  supply: string;
  description: string;
  image: File | null;
  revokeFreezeAuthority: boolean;
  revokeMintAuthority: boolean;
}

interface FormErrors {
  name?: string;
  symbol?: string;
  decimals?: string;
  supply?: string;
  description?: string;
  image?: string;
}

const gradientBorder = 'border border-transparent bg-gradient-to-r from-[#9945FF]/40 to-[#14F195]/40 p-[1px]';
const glassBackground = 'backdrop-blur-md bg-[#1B1B1B]/90';
const buttonBaseStyle = `w-full px-4 py-3 rounded-lg transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        font-medium text-white`;
const inputBaseStyle = `w-full px-4 py-3 rounded-lg bg-[#232323] border border-[#343434] text-white 
                       placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#9945FF]/30 
                       hover:border-[#9945FF]/20 transition-all duration-200`;

export const TokenCreator = () => {
  const { publicKey, connected, connection } = useWallet();
  const { createMetadataV3, isUploading, uploadProgress } = useCreateMetadata();
  const { sendTransaction, isProcessing } = useTransaction();
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<string>('');
  const [mintKeypair, setMintKeypair] = useState(() => Keypair.generate());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mintAddress, setMintAddress] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    decimals: '',
    supply: '',
    description: '',
    image: null,
    revokeFreezeAuthority: true,
    revokeMintAuthority: false
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleToggleFreeze = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      revokeFreezeAuthority: !prev.revokeFreezeAuthority
    }));
  }, []);

  const handleToggleMint = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      revokeMintAuthority: !prev.revokeMintAuthority
    }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length > 8) {
      newErrors.symbol = 'Symbol must be 8 characters or less';
    }

    if (!formData.decimals) {
      newErrors.decimals = 'Decimals is required';
    } else {
      const dec = parseInt(formData.decimals);
      if (dec !== 5 && dec !== 9) {
        newErrors.decimals = 'Decimals must be 5 or 9';
      }
    }

    if (!formData.supply) {
      newErrors.supply = 'Supply is required';
    } else {
      const supply = Number(formData.supply);
      if (isNaN(supply) || supply <= 0) {
        newErrors.supply = 'Supply must be a positive number';
      }
    }

    if (!formData.image) {
      newErrors.image = 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !publicKey || !connected) return;
  
    try {
      setStatus('Preparing your token...');
      if (!formData.image) {
        throw new Error('Image is required');
      }
  
      // Upload metadata
      setStatus('Uploading metadata to IPFS...');
      const { metadataUri } = await createMetadataV3({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        image: formData.image,
      });
  
      if (!metadataUri) {
        throw new Error('Failed to generate metadata URI');
      }
  
      // Build transaction
      setStatus('Building transaction...');
      const decimals = parseInt(formData.decimals);
      const supply = BigInt(Math.floor(Number(formData.supply) * Math.pow(10, decimals)));
      
      if (!supply) {
        throw new Error('Invalid supply calculation');
      }
    
      const { transaction, mint } = await createTokenTransaction(
        connection,
        publicKey,
        {
          name: formData.name,
          symbol: formData.symbol,
          uri: metadataUri,
          decimals,
          amount: supply,
          revokeFreezeAuthority: formData.revokeFreezeAuthority,
          revokeMintAuthority: formData.revokeMintAuthority,
          mintKeypair: mintKeypair,
        }
      );
  
      setStatus('Please approve the transaction...');
      const result = await sendTransaction(transaction, [mintKeypair]);

      if (!result) {
        throw new Error('Transaction failed to send');
      }

      // Store the mint address
      setMintAddress(mint.toString());
      setStatus('success');

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        decimals: '',
        supply: '',
        description: '',
        image: null,
        revokeFreezeAuthority: true,
        revokeMintAuthority: false
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMintKeypair(Keypair.generate());

    } catch (error) {
      console.error('Error:', error);
      setStatus(error instanceof Error ? `Error: ${error.message}` : 'An unexpected error occurred');
    }
  };

  return (
    <div className="w-full max-w-[640px] mx-auto p-6">
      <div className={`${gradientBorder} rounded-2xl shadow-xl`}>
        <div className={`${glassBackground} rounded-2xl p-8`}>
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#4F6BFF] to-[#14F195] text-transparent bg-clip-text">
            Create Your Token
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Name & Symbol */}
              <div>
                <input
                  type="text"
                  placeholder="Token Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`${inputBaseStyle} ${errors.name ? 'ring-2 ring-red-500/50' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Symbol (max 8 chars)"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  className={`${inputBaseStyle} ${errors.symbol ? 'ring-2 ring-red-500/50' : ''}`}
                />
                {errors.symbol && (
                  <p className="mt-1 text-xs text-red-400">{errors.symbol}</p>
                )}
              </div>

              {/* Decimals & Supply */}
              <div>
                <input
                  type="number"
                  placeholder="Decimals (5 or 9)"
                  value={formData.decimals}
                  onChange={(e) => setFormData(prev => ({ ...prev, decimals: e.target.value }))}
                  className={`${inputBaseStyle} ${errors.decimals ? 'ring-2 ring-red-500/50' : ''}`}
                />
                {errors.decimals && (
                  <p className="mt-1 text-xs text-red-400">{errors.decimals}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Initial Supply"
                  value={formData.supply}
                  onChange={(e) => setFormData(prev => ({ ...prev, supply: e.target.value }))}
                  className={`${inputBaseStyle} ${errors.supply ? 'ring-2 ring-red-500/50' : ''}`}
                />
                {errors.supply && (
                  <p className="mt-1 text-xs text-red-400">{errors.supply}</p>
                )}
              </div>
            </div>
            {/* Description */}
            <div>
              <textarea
                placeholder="Token Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`${inputBaseStyle} resize-none min-h-[100px]`}
              />
            </div>

            {/* Image Upload */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                accept="image/*"
              />
              <label
                htmlFor="image-upload"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={`
                  flex items-center justify-center w-full px-4 py-3 rounded-lg
                  ${glassBackground} border border-[#9945FF]/20 cursor-pointer
                  hover:border-[#9945FF]/40 transition-all duration-200
                  ${errors.image ? 'ring-2 ring-red-500/50' : ''}
                `}
              >
                <Upload className={`w-5 h-5 mr-2 transition-colors duration-200 
                  ${isHovering ? 'text-[#14F195]' : 'text-white/70'}`} />
                <span className={`transition-colors duration-200 
                  ${isHovering ? 'text-[#14F195]' : 'text-white/70'}`}>
                  {formData.image ? 'Image Selected' : 'Upload Token Image'}
                </span>
              </label>
              {errors.image && (
                <p className="mt-1 text-xs text-red-400">{errors.image}</p>
              )}
            </div>

            {/* Authority Toggles */}
            <div className="grid grid-cols-2 gap-8 p-4 rounded-lg bg-black/20">
              {/* Freeze Authority */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">Revoke Freeze</span>
                  <span className="text-xs text-[#14F195]">(required)</span>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Required to create a liquidity pool
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleToggleFreeze}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ease-in-out ${
                      formData.revokeFreezeAuthority ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195]' : 'bg-[#343434]'
                    }`}
                  >
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-200 ${
                        formData.revokeFreezeAuthority ? 'left-[calc(100%-1.5rem)]' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-white/50">(0.05 SOL)</span>
                </div>
              </div>

              {/* Mint Authority */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">Revoke Mint</span>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  Prevents future supply increases
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleToggleMint}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ease-in-out ${
                      formData.revokeMintAuthority ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195]' : 'bg-[#343434]'
                    }`}
                  >
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-200 ${
                        formData.revokeMintAuthority ? 'left-[calc(100%-1.5rem)]' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-white/50">(0.05 SOL)</span>
                </div>
              </div>
            </div>
            <button
            type="submit"
            disabled={isUploading || isProcessing || !connected}
            className={`
              ${buttonBaseStyle}
              ${!connected 
                ? 'bg-[#343434] text-white/50'
                : isUploading || isProcessing
                  ? 'bg-gradient-to-r from-[#9945FF]/50 to-[#14F195]/50 cursor-wait'
                  : 'bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-[#8935EE] hover:to-[#13E085] transform hover:-translate-y-0.5'
              }
            `}
          >
              <span className={`
                flex items-center justify-center gap-2
                ${(isUploading || isProcessing) ? 'animate-pulse' : ''}
              `}>
                {!connected ? (
                  'Connect Wallet to Create'
                ) : isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading {uploadProgress.progress}%
                  </>
                ) : isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Token...
                  </>
                ) : (
                  'Create Token'
                )}
              </span>
            </button>

            {/* Replace the existing status message with this: */}
            {status && status.includes('success') ? (
              <div className="mt-4 p-4 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#14F195] text-sm">✨ Token created successfully!</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs">Token Address:</span>
                    <code className="text-[#14F195] text-xs font-mono">
                    {mintAddress}
                    </code>
                  </div>
                  <div>
                    <a 
                      href={`https://explorer.solana.com/address/${mintAddress}`}
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
          </form>
        </div>
      </div>
    </div>
  );
};