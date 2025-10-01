'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {useAuth} from '../../../context/AuthContext'
import { signOut, sendEmailVerification } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {functions,auth} from '../../../lib/firebaseClient'
import { Award, Gem, Hash, Loader2, LogOut, Mail, Phone, ShieldAlert, ShieldCheck } from 'lucide-react';
import Background from '@/utils/Background';




// --- TYPE DEFINITIONS ---
interface ProfileData {
  name: string;
  email: string;
  delegateId: string;
  phone: string;
  points: number;
  solvedQuestions: number;
  unsolvedQuestions: number;
}

interface GetProfileResponse {
  success: true;
  profile: ProfileData;
}

// --- REUSABLE UI COMPONENTS ---
const CARD_HOVER_EFFECT = 'transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(239,59,87,0.3),_0_0_8px_rgba(239,59,87,0.2)]';
const ProfilePlaceholder = ({ initial }: { initial: string }) => ( <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-full bg-[#2f1f2b] border-4 border-[#ef3b57]"> <span className="font-vt323 text-5xl text-[#ffdcdc]">{initial.toUpperCase()}</span> <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#ef3b57]/50 transition-all duration-300 animate-pulse" style={{ animationDuration: '3s' }}></div> <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1b1b1b] shadow-md"></div> </div> );
const UserProfileCard: React.FC<{ user: ProfileData & { title: string } }> = ({ user }) => ( <div className={`group bg-[#2f1f2b]/50 border border-[#ef3b57]/20 text-[#d9bfc6] rounded-lg p-6 sm:p-8 flex flex-col items-center sm:items-start shadow-lg ${CARD_HOVER_EFFECT}`}> <div className="flex flex-col sm:flex-row items-center w-full"> <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6"> <ProfilePlaceholder initial={user.name ? user.name.charAt(0) : '?'} /> </div> <div className="text-center sm:text-left"> <h1 className="font-vt323 text-4xl sm:text-5xl text-[#ffdcdc]">{user.name}</h1> <p className="font-mono text-base text-[#d9bfc6]/80 mt-1">{user.title}</p> </div> </div> <hr className="w-full border-t border-[#ef3b57]/20 my-6" /> <div className="w-full"> <h2 className="font-vt323 text-xl text-[#ef3b57] mb-4">CONTACT & ID</h2> <div className="space-y-4 text-base font-mono"> <div className="flex items-center gap-3"> <Mail className="w-5 h-5 text-[#ef3b57]/80" /> <span className="text-[#d9bfc6] break-all">{user.email}</span> </div> <div className="flex items-center gap-3"> <Hash className="w-5 h-5 text-[#ef3b57]/80" /> <span className="text-[#d9bfc6] font-bold">{user.delegateId}</span> </div> <div className="flex items-center gap-3"> <Phone className="w-5 h-5 text-[#ef3b57]/80" /> <span className="text-[#d9bfc6]">{user.phone}</span> </div> </div> </div> </div> );
const StatItem: React.FC<{ label: string, value: number | string, icon: React.ReactNode, isPrimary?: boolean }> = ({ label, value, icon, isPrimary = false }) => ( <div className={`bg-[#2f1f2b]/50 border border-[#ef3b57]/20 p-4 rounded-lg text-center flex flex-col justify-center items-center shadow-md ${CARD_HOVER_EFFECT}`}> <div className={`mb-2 ${isPrimary ? 'text-[#ef3b57]' : 'text-[#d9bfc6]/80'}`}>{icon}</div> <p className={`font-vt323 ${isPrimary ? 'text-5xl text-[#ffdcdc]' : 'text-4xl text-[#ffdcdc]'}`}>{value}</p> <p className="font-mono text-sm text-[#d9bfc6]/80 mt-1 uppercase tracking-wider">{label}</p> </div> );

// --- MAIN PAGE COMPONENT ---
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        const fetchProfile = async () => {
          try {
            const getUserProfile = httpsCallable<void, GetProfileResponse>(functions, 'getUserProfile');
            const result = await getUserProfile();
            if (result.data.success) {
              setProfile(result.data.profile);
            }
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
        fetchProfile();
      } else {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => await signOut(auth);
  const handleResendVerification = async () => {
      if (user && !user.emailVerified) {
          try {
            await sendEmailVerification(user);
            setVerificationSent(true);
            setTimeout(() => setVerificationSent(false), 30000);
          } catch (error) {
            setError("Failed to send verification email.");
          }
      }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 size={48} className="animate-spin text-pink-500"/></div>;
  }

  if (error || !profile) {
    return <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-red-400 p-4">
       <h2 className="text-2xl font-bold">Error Loading Profile</h2>
       <p className="mt-2 text-center">{error || "Could not load profile data."}</p>
       <button onClick={handleLogout} className="mt-6 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Go to Login</button>
     </div>;
  }

  const displayStats = { rank: 12, totalPoints: profile.points, challengesSolved: profile.solvedQuestions, challengesAttempted: profile.solvedQuestions + profile.unsolvedQuestions };
  const displayUser = { ...profile, title: "Elite Hacker" };

  return (
    <div className="min-h-screen font-vt323 p-4 sm:p-8 lg:p-12">
        <Background/>
      {user && !user.emailVerified && (
        <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-4 rounded-lg mb-8 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
            <span>Your email is not verified. Please check your inbox.</span>
            <button onClick={handleResendVerification} disabled={verificationSent} className="font-bold underline hover:text-white disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed">
                {verificationSent ? 'Sent' : 'Resend Email'}
            </button>
        </div>
      )}

      <header className="flex justify-between items-center pb-8 border-b border-[#ef3b57]/20 mb-8">
        <h1 className="font-vt323 text-3xl text-[#ef3b57] tracking-widest">USER_PROFILE</h1>
        <button onClick={handleLogout} className="text-[#d9bfc6] border-2 transition-all flex gap-2 items-center p-3 hover:cursor-pointer rounded-lg hover:text-[#ef3b57] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(239,59,87,0.15)] active:translate-y-0 active:shadow-[0_0_10px_rgba(239,59,87,0.25)]">
            <LogOut size={16} /><span>Sign Out</span>
        </button>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-5">
          <UserProfileCard user={displayUser} />
        </div>
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="col-span-2 md:col-span-3">
              <StatItem label="Total Points" value={displayStats.totalPoints.toLocaleString()} icon={<Gem size={32} />} isPrimary={true} />
            </div>
            <StatItem label="Rank" value={`#${displayStats.rank}`} icon={<Award size={28} />} />
            <StatItem label="Solved" value={displayStats.challengesSolved} icon={<ShieldCheck size={28} />} />
            <StatItem label="Attempted" value={displayStats.challengesAttempted} icon={<ShieldAlert size={28} />} />
          </div>
        </div>
      </main>

      <footer className="mt-12 pt-6 text-center border-t border-[#ef3b57]/20">
        <p className="font-mono text-xs text-[#d9bfc6]/50">© {new Date().getFullYear()} CrypticFinds · Be kind, play fair.</p>
      </footer>
    </div>
  );
}

