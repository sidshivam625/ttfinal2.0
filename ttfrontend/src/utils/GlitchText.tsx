import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  // CSS for the animations is now embedded directly in the component.
  const styles = `
    @keyframes glitch-left {
      0%, 9%, 11%, 24%, 26%, 49%, 51%, 74%, 76%, 100% { transform: translate(0, 0); opacity: 0; }
      10% { transform: translate(-6px, 0); opacity: 0.85; }
      10.5% { transform: translate(-8px, 0); opacity: 0.9; }
      25% { transform: translate(0, -6px); opacity: 0.85; }
      25.5% { transform: translate(0, -8px); opacity: 0.9; }
      50% { transform: translate(6px, 0); opacity: 0.85; }
      50.5% { transform: translate(8px, 0); opacity: 0.9; }
      75% { transform: translate(0, 6px); opacity: 0.85; }
      75.5% { transform: translate(0, 8px); opacity: 0.9; }
    }

    @keyframes glitch-right {
      0%, 9%, 11%, 24%, 26%, 49%, 51%, 74%, 76%, 100% { transform: translate(0, 0); opacity: 0; }
      10% { transform: translate(6px, 0); opacity: 0.85; }
      10.5% { transform: translate(8px, 0); opacity: 0.9; }
      25% { transform: translate(0, 6px); opacity: 0.85; }
      25.5% { transform: translate(0, 8px); opacity: 0.9; }
      50% { transform: translate(-6px, 0); opacity: 0.85; }
      50.5% { transform: translate(-8px, 0); opacity: 0.9; }
      75% { transform: translate(0, -6px); opacity: 0.85; }
      75.5% { transform: translate(0, -8px); opacity: 0.9; }
    }

    /*
      Since Tailwind is not processing these keyframes,
      we must also manually define the animation classes.
    */
    .animate-glitch-left {
        animation: glitch-left 8s infinite;
    }

    .animate-glitch-right {
        animation: glitch-right 8s infinite;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <h1 className={`relative ${className}`}>
        {/* Glitch layer 1 (cyan) */}
        <span
          className="absolute top-0 left-0 w-full h-full text-red-200 animate-glitch-left"
          aria-hidden="true"
        >
          {text}
        </span>
        
        {/* Original text */}
        {text}
        
        {/* Glitch layer 2 (magenta) */}
        <span
          className="absolute top-0 left-0 w-full h-full text-red-300 animate-glitch-right"
          aria-hidden="true"
        >
          {text}
        </span>
      </h1>
    </>
  );
};

export default GlitchText;

