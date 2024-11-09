'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const navBackground = 'bg-[#1B1B1B]/80 backdrop-blur-md border-b border-[#343434]';
const gradientText = 'text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]';

export const Navbar = () => {
  return (
    <nav className={`fixed top-0 left-0 right-0 ${navBackground} z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Image 
              src="/favicon.ico"  // or whatever your favicon file name is
              alt="Logo"
              width={40}
              height={40}
              className="opacity-90"
            />
            <h1 className={`text-xl font-bold ${gradientText}`}>
              Solana Token Factory
            </h1>
          </div>
          <div>
            <style jsx global>{`
              .wallet-adapter-button {
                background: linear-gradient(to right, #9945FF, #14F195) !important;
                transition: all 0.2s ease !important;
                padding: 0 1.5rem !important;
                height: 2.5rem !important;
                border-radius: 0.5rem !important;
                font-weight: 600 !important;
              }
              
              .wallet-adapter-button:hover {
                opacity: 0.85 !important;
                transform: translateY(-1px) !important;
              }

              .wallet-adapter-button:not([disabled]):hover {
                background: linear-gradient(to right, #8935EE, #13E085) !important;
              }

              .wallet-adapter-modal-wrapper {
                background: #1B1B1B !important;
                border: 1px solid #343434 !important;
                border-radius: 1rem !important;
              }

              .wallet-adapter-modal-button-close {
                background: #343434 !important;
              }

              .wallet-adapter-modal-title {
                color: white !important;
              }

              .wallet-adapter-modal-list {
                margin: 0 !important;
              }

              .wallet-adapter-modal-list li {
                background: #232323 !important;
                border: 1px solid #343434 !important;
                border-radius: 0.5rem !important;
                margin: 0.5rem 0 !important;
                padding: 0.75rem 1rem !important;
                transition: all 0.2s ease !important;
              }

              .wallet-adapter-modal-list li:hover {
                background: rgba(153, 69, 255, 0.1) !important;
                border-color: rgba(153, 69, 255, 0.3) !important;
              }
            `}</style>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;