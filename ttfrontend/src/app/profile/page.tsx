"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { signOut, sendEmailVerification } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../../lib/firebaseClient";
import {
  Mail,
  Hash,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Gem,
  Award,
  LogOut,
  Loader2,
  MailWarning,
} from "lucide-react";
import Background from "../../utils/Background"; // Assuming this component exists
import { Loader } from "@/utils/Loader";

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
interface GetRankResponse {
  success: boolean;
  rank: number;
}

// --- UI COMPONENTS ---
const CARD_HOVER_EFFECT =
  "transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(239,59,87,0.3),_0_0_8px_rgba(239,59,87,0.2)]";
const ProfilePlaceholder = ({ initial }: { initial: string }) => (
  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-full bg-[#2f1f2b] border-4 border-[#ef3b57]">
    {" "}
    <span className="font-vt323 text-5xl text-[#ffdcdc]">
      {initial.toUpperCase()}
    </span>{" "}
    <div
      className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#ef3b57]/50 transition-all duration-300 animate-pulse"
      style={{ animationDuration: "3s" }}
    ></div>{" "}
    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1b1b1b] shadow-md"></div>{" "}
  </div>
);
const UserProfileCard: React.FC<{ user: ProfileData & { title: string } }> = ({
  user,
}) => (
  <div
    className={`group bg-[#2f1f2b]/50 border border-[#ef3b57]/20 text-[#d9bfc6] rounded-lg p-6 sm:p-8 flex flex-col items-center sm:items-start shadow-lg ${CARD_HOVER_EFFECT}`}
  >
    {" "}
    <div className="flex flex-col sm:flex-row items-center w-full">
      {" "}
      <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
        {" "}
        <ProfilePlaceholder
          initial={user.name ? user.name.charAt(0) : "?"}
        />{" "}
      </div>{" "}
      <div className="text-center sm:text-left">
        {" "}
        <h1 className="font-vt323 text-4xl sm:text-5xl text-[#ffdcdc]">
          {user.name}
        </h1>{" "}
        <p className="font-vt323 text-base text-[#d9bfc6]/80 mt-1">
          {user.title}
        </p>{" "}
      </div>{" "}
    </div>{" "}
    <hr className="w-full border-t border-[#ef3b57]/20 my-6" />{" "}
    <div className="w-full">
      {" "}
      <h2 className="font-vt323 text-xl text-[#ef3b57] mb-4">
        CONTACT & ID
      </h2>{" "}
      <div className="space-y-4 text-base font-mono">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <Mail className="w-5 h-5 text-[#ef3b57]/80" />{" "}
          <span className="text-[#d9bfc6] break-all">{user.email}</span>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <Hash className="w-5 h-5 text-[#ef3b57]/80" />{" "}
          <span className="text-[#d9bfc6] font-bold">{user.delegateId}</span>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <Phone className="w-5 h-5 text-[#ef3b57]/80" />{" "}
          <span className="text-[#d9bfc6]">{user.phone}</span>{" "}
        </div>{" "}
      </div>{" "}
    </div>{" "}
  </div>
);
const StatItem: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  isPrimary?: boolean;
}> = ({ label, value, icon, isPrimary = false }) => (
  <div
    className={`bg-[#2f1f2b]/50 border border-[#ef3b57]/20 p-4 rounded-lg text-center flex flex-col justify-center items-center shadow-md ${CARD_HOVER_EFFECT}`}
  >
    {" "}
    <div
      className={`mb-2 ${isPrimary ? "text-[#ef3b57]" : "text-[#d9bfc6]/80"}`}
    >
      {icon}
    </div>{" "}
    <p
      className={`font-vt323 ${
        isPrimary ? "text-5xl text-[#ffdcdc]" : "text-4xl text-[#ffdcdc]"
      }`}
    >
      {value}
    </p>{" "}
    <p className="font-vt323 text-sm text-[#d9bfc6]/80 mt-1 uppercase tracking-wider">
      {label}
    </p>{" "}
  </div>
);

// --- MAIN PAGE LOGIC ---
export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [rank, setRank] = useState<number>(0);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Fetch profile data even if not verified, to show email on prompt screen
        const fetchProfile = async () => {
          setLoading(true);
          try {
            const getUserProfile = httpsCallable<void, GetProfileResponse>(
              functions,
              "getUserProfile"
            );
            const result = await getUserProfile();
            if (result.data.success) {
              setProfile(result.data.profile);
            }
            // Try to fetch rank (works even if not verified)
            try {
              const getUserRank = httpsCallable<void, GetRankResponse>(
                functions,
                "getUserRank"
              );
              const r = await getUserRank();
              if (r.data?.success) setRank(r.data.rank);
            } catch {}
          } catch (err: any) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        };
        fetchProfile();
      } else {
        router.push("/"); // Redirect to homepage if not logged in at all
      }
    }
  }, [user, authLoading, router]);

  // Poll for email verification every 5s when unverified
  useEffect(() => {
    if (user && !user.emailVerified) {
      const id = setInterval(async () => {
        try {
          await user.reload();
          if (auth.currentUser?.emailVerified) {
            router.refresh();
          }
        } catch {}
      }, 5000);
      return () => clearInterval(id);
    }
  }, [user, router]);

  const handleLogout = async () => await signOut(auth);
  const handleResendVerification = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        setVerificationSent(true);
        // Disable button for 30 seconds to prevent spam
        setTimeout(() => setVerificationSent(false), 30000);
      } catch (error) {
        setError("Failed to send verification email.");
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // --- NEW: EMAIL VERIFICATION GATE ---
  if (user && !user.emailVerified) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1b1b1b]">
        <Background />
        <div className="w-full max-w-lg bg-[#2b0f1a]/50 p-8 rounded-xl border border-[#7a2f49] shadow-lg text-center z-10">
          <MailWarning className="mx-auto text-yellow-400 mb-4" size={48} />
          <h2 className="font-vt323 text-3xl text-center text-[#ffdcdc] mb-2">
            // VERIFICATION REQUIRED
          </h2>
          <p className="font-vt323 text-center text-gray-300 mb-6">
            A verification link has been sent to{" "}
            <strong className="text-yellow-400">{user.email}</strong>. Please
            check your inbox (and spam folder) to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleResendVerification}
              disabled={verificationSent}
              className="w-full px-4 py-3 font-vt323 uppercase tracking-wider text-lg text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300"
            >
              {verificationSent ? "SENT!" : "RESEND EMAIL"}
            </button>
            {/* <button onClick={handleLogout} className="">
              <LogOut size={20} className="mr-2"/>
              LOGOUT
            </button> */}
          </div>
        </div>
      </main>
    );
  }

  // This part will only render if the user is verified
  if (error || !profile) {
    return (
      <div className="min-h-screen font-press-start-2p flex flex-col items-center justify-center text-[#ef3b57] p-4">
        <h2 className="text-2xl m-8 font-bold">Error Loading Profile</h2>
        <p className="m-8 text-center">
          {error || "Could not load profile data."}
        </p>
        <button
          onClick={handleLogout}
          className="inline-block hover:cursor-pointer mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const displayStats = {
    rank: rank || 0,
    totalPoints: profile.points,
    challengesSolved: profile.solvedQuestions,
    challengesAttempted: profile.solvedQuestions + profile.unsolvedQuestions,
  };
  const displayUser = { ...profile, title: "Elite Hacker" };

  return (
    <div className="min-h-screen bg-[#1b1b1b] p-4 sm:p-8 lg:p-12">
      <Background />
      <header className="flex justify-between items-center pb-8 border-b border-[#ef3b57]/20 mb-8">
        <h1 className="font-vt323 text-3xl text-[#ef3b57] tracking-widest">
          USER_PROFILE
        </h1>
        <button
          onClick={handleLogout}
          className="font-vt323 text-sm text-[#d9bfc6] flex items-center gap-2 px-3 py-1 border border-transparent rounded-md hover:border-[#ef3b57]/50 hover:bg-[#2f1f2b] transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-5">
          {" "}
          <UserProfileCard user={displayUser} />{" "}
        </div>
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="col-span-2 md:col-span-3">
              {" "}
              <StatItem
                label="Total Points"
                value={displayStats.totalPoints.toLocaleString()}
                icon={<Gem size={32} />}
                isPrimary={true}
              />{" "}
            </div>
            <StatItem
              label="Rank"
              value={`#${displayStats.rank}`}
              icon={<Award size={28} />}
            />
            <StatItem
              label="Solved"
              value={displayStats.challengesSolved}
              icon={<ShieldCheck size={28} />}
            />
            <StatItem
              label="Attempted"
              value={displayStats.challengesAttempted}
              icon={<ShieldAlert size={28} />}
            />
          </div>
        </div>
      </main>
      <footer className="mt-12 pt-6 text-center border-t border-[#ef3b57]/20">
        <p className="font-vt323 text-xs text-[#d9bfc6]/50">
          © {new Date().getFullYear()} CrypticFinds · Be kind, play fair.
        </p>
      </footer>
    </div>
  );
}
