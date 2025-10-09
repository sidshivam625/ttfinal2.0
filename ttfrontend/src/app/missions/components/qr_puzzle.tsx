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
        <span className="ml-3 text-[#FF6467]">Loading...</span>
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

  const mime = qrData?.type === 'svg' ? 'image/svg+xml' : 'image/png';
  const ext = qrData?.type === 'svg' ? 'svg' : 'png';
  // Sanitize possible malformed SVG base64 payloads where xmlns is wrapped like [http://...]
  let dataBase64: string = qrData.distortedQR || '';
  if (qrData?.type === 'svg' && dataBase64) {
    try {
      const svgText = atob(dataBase64);
      let fixed = svgText;
      // Replace markdown link style and bracketed variants with plain URI
      fixed = fixed.replace(/\[http:\/\/www\.w3\.org\/2000\/svg\]\(http:\/\/www\.w3\.org\/2000\/svg\)/g, 'http://www.w3.org/2000/svg');
      fixed = fixed.replace(/\[http:\/\/www\.w3\.org\/2000\/svg\]/g, 'http://www.w3.org/2000/svg');
      // If the xmlns attribute exists and looks wrong, normalize it
      fixed = fixed.replace(/xmlns="[^"]*"/, (m) => {
        if (m.includes('w3.org') || m.includes('[') || m.includes('(')) {
          return 'xmlns="http://www.w3.org/2000/svg"';
        }
        return m;
      });
      if (fixed !== svgText) {
        dataBase64 = btoa(fixed);
      }
    } catch {}
  }

  return (
    <div className="mt-6 p-6 border-2 border-[#522546] rounded-lg bg-black/50">
      
      <div className="flex justify-center">
        {/* Distorted QR Code */}
        <div className="space-y-3 max-w-md">
          
          <div className="border border-[#FF6467] rounded p-6 bg-black/30">
            <img 
              src={`data:${mime};base64,${dataBase64}`} 
              alt="Corrupted and Distorted QR Code"
              className="w-full max-w-[300px] mx-auto"
              style={{ imageRendering: 'pixelated', width: '300px', height: '300px', objectFit: 'contain' }}
            />
          </div>
     
        </div>
      </div>

    

      {/* Download button for convenience */}
      <div className="mt-4 flex justify-center">
        <a
          href={`data:${mime};base64,${dataBase64}`}
          download="4231.svg"
          className="px-6 py-2 bg-[#FF6467]/20 border border-[#FF6467] rounded text-[#FF6467] hover:bg-[#FF6467]/30 font-vt323 text-sm transition-colors"
        >
          DOWNLOAD ({ext.toUpperCase()})
        </a>
      </div>
    </div>
  );
}
