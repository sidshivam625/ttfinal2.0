"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed

import { Bot, Loader2 } from 'lucide-react';
import { Loader } from './Loader';

const baseNavClasses = "text-base md:text-lg px-3 py-1.5 rounded transition-all duration-300 uppercase";
const activeNavClasses = "text-[#ef3b57] shadow-[0_0_20px_rgba(239,59,87,0.15)] bg-[#ef3b57]/5";
const inactiveNavClasses = "text-[#d9bfc6] hover:text-[#ef3b57] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(239,59,87,0.15)] active:translate-y-0 active:shadow-[0_0_10px_rgba(239,59,87,0.25)]";

export default function Navbar() {
  const pathname = usePathname();
  // Get both user and loading state from the context.
  const { user, loading } = useAuth(); 
  const [freezeActive, setFreezeActive] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      try {
        const active = typeof window !== 'undefined' && localStorage.getItem('freezeLeaderboardActive') === 'true' && !!localStorage.getItem('frozenLeaderboard');
        setFreezeActive(!!active);
      } catch {}
    };
    check();
    const handler = (e: Event) => {
      if ((e as CustomEvent)?.detail && typeof (e as CustomEvent).detail.active === 'boolean') {
        setFreezeActive(!!(e as CustomEvent).detail.active);
      } else {
        check();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('frozenLeaderboardChange', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('frozenLeaderboardChange', handler as EventListener);
      }
    };
  }, []);

  const getNavClasses = (path: string) => {
    const isActive = pathname === path;
    return `${baseNavClasses} ${isActive ? activeNavClasses : inactiveNavClasses}`;
  };

    
  // This helper function will decide what to render in the auth section.
  const renderAuthLinks = () => {
    // While the AuthProvider is performing its initial check, render a placeholder.
    // This prevents the "ENLIST" link from flashing on the screen for logged-in users.
    if (loading) {
      return (
        <div className={`${baseNavClasses} text-[#d9bfc6]`}>
          <Loader/>
        </div>
      );
    }

    // If the check is complete and a user exists, show the logged-in links.
    if (user) {
      return (
        <>
          <Link href="/profile" className={`${getNavClasses("/profile")} flex gap-2 `}>
          <Bot/>
          <span>PROFILE</span>
          </Link>
        </>
      );
    }
    
    // If the check is complete and there is no user, show the logged-out link.
    return (
      <>
        <Link href="/enlist" className={getNavClasses("/enlist")}>ENLIST</Link>
      </>
    );
  };

  return (
    <nav
      className="w-full flex flex-col md:flex-row items-center px-4 md:px-6 py-3 bg-[#1b1b1b] border-b border-[#ef3b57]/20 text-[#d9bfc6] font-vt323"
      aria-label="Primary navigation"
    >
      {/* Logo */}
      <Link href="/" className="group">
        <div className="flex-shrink-0 flex items-center justify-center mb-4 md:mb-0" aria-hidden>
          <Image 
            src="/crypticFindsLogo.png" 
            className='group-hover:hidden transition-all duration-300' 
            alt="Logo" 
            width={48} 
            height={48} 
          />
          <Image 
            src="/cfgif.gif" 
            className='hidden group-hover:block transition-all duration-300'
            alt="Hover Logo" 
            width={48} 
            height={48} 
          />
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-end gap-3 md:gap-6 w-full md:ml-auto">
        <Link href="/" className={getNavClasses("/")}>HOME</Link>
        {(() => {
          const href = freezeActive ? "/rɑnkings" : "/rankings";
          return <Link href={href} className={getNavClasses(href)}>RANKINGS</Link>;
        })()}
        <Link href="/missions" className={getNavClasses("/missions")}>MISSIONS</Link>
        <Link href="/protocols" className={getNavClasses("/protocols")}>PROTOCOLS</Link>

        {/* This now calls our robust render function */}
        {renderAuthLinks()}

      </div>
    </nav>
  );
}

