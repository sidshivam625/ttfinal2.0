import React from 'react';

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#1b1b1b]">
      {/* Diamond Grid Container */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          {Array.from({ length: 64 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isOffset = (row + col) % 2 === 0;
            const delay = ((row + col) * 500) % 4000;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '25%',
                  height: '25%',
                  left: `${col * 12.5}%`,
                  top: `${row * 12.5}%`,
                  transform: 'rotate(-45deg)',
                  backgroundColor: isOffset ? 'rgba(239,59,87,0.08)' : 'rgba(122,47,73,0.08)',
                  transition: 'all 2s ease-in-out',
                  animation: `diamondPulse 2s ease-in-out ${delay}ms infinite alternate`,
                }}
                className="hover:bg-[#2f1f2b]/20"
              />
            );
          })}
        </div>
      </div>
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b1b1b] via-transparent to-[#1b1b1b] opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1b1b1b] via-transparent to-[#1b1b1b] opacity-50" />
    </div>
  );
}
