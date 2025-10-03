"use client";

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebaseClient';

interface QRPuzzleProps {
  challengeId: string;
}

export default function QRPuzzle({ challengeId }: QRPuzzleProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const getUserQRCodes = httpsCallable(functions, 'getUserQRCodes');
      const result = await getUserQRCodes({ challengeId });
      setQrData(result.data);
    } catch (err: any) {
      console.error('Error fetching QR code:', err);
      setError('Failed to load QR puzzle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, [challengeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6467]"></div>
        <span className="ml-3 text-[#FF6467]">Loading QR puzzle...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500 rounded-lg bg-red-500/10">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={fetchQRCode}
          className="mt-2 px-4 py-2 bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!qrData) return null;

  return (
    <div className="mt-6 p-6 border-2 border-[#522546] rounded-lg bg-black/50">
      <div className="mb-4">
        <h3 className="text-xl font-vt323 text-[#FF6467] mb-2 tracking-wider">
          QR CODE RECONSTRUCTION PROTOCOL
        </h3>
        <p className="text-[#D1D5DC] font-vt323 text-sm leading-relaxed">
          The QR code below has been severely corrupted with multiple distortions. The finder patterns have been destroyed, 
          colors are inverted, the shape is warped into a trapezoid, and visual noise has been added. Multiple reconstruction 
          steps are required to restore functionality.
        </p>
      </div>

      <div className="flex justify-center">
        {/* Distorted QR Code */}
        <div className="space-y-3 max-w-md">
          <h4 className="text-[#FF6467] font-vt323 text-lg tracking-wide text-center">
            SEVERELY DISTORTED QR CODE
          </h4>
          <div className="border border-[#FF6467] rounded p-6 bg-black/30">
            <img 
              src={`data:image/png;base64,${qrData.distortedQR}`} 
              alt="Corrupted and Distorted QR Code"
              className="w-full max-w-[300px] mx-auto"
              style={{ imageRendering: 'pixelated', width: '300px', height: '300px', objectFit: 'contain' }}
            />
          </div>
          <p className="text-xs text-[#99A1AF] font-vt323 text-center">
            STATUS: TRAPEZOID WARP + INVERTED + NOISE + MISSING FINDERS
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 border border-[#89304E] rounded bg-[#89304E]/10">
        <h4 className="text-[#89304E] font-vt323 text-lg mb-3 tracking-wide">
          RECONSTRUCTION PROTOCOL
        </h4>
        <div className="space-y-2 text-sm text-[#D1D5DC] font-vt323">
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[1]</span>
            <span>Download the severely distorted QR code (right-click → Save image as...)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[2]</span>
            <span>Open in a vector graphics editor (Inkscape, Illustrator) to handle SVG format</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[3]</span>
            <span>Remove the trapezoid clipping path to restore rectangular shape</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[4]</span>
            <span>Invert colors: change background from black to white, modules from white to black</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[5]</span>
            <span>Remove or hide the 15 random noise circles scattered across the image</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[6]</span>
            <span>Research QR finder pattern structure and recreate the three missing corner patterns</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[7]</span>
            <span>Export as PNG/JPG and scan the fully reconstructed QR code to extract your flag</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#FF6467]">[8]</span>
            <span>Submit the flag in the terminal below</span>
          </div>
        </div>
      </div>

      {/* Download button for convenience */}
      <div className="mt-4 flex justify-center">
        <a
          href={`data:image/png;base64,${qrData.distortedQR}`}
          download={`corrupted_qr_${challengeId}.png`}
          className="px-6 py-2 bg-[#FF6467]/20 border border-[#FF6467] rounded text-[#FF6467] hover:bg-[#FF6467]/30 font-vt323 text-sm transition-colors"
        >
          DOWNLOAD DISTORTED QR CODE (PNG)
        </a>
      </div>
    </div>
  );
}
