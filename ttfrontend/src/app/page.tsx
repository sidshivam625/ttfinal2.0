"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext"; // Make sure this path is correct
import GlitchText from "@/utils/GlitchText";
import { Loader2 } from "lucide-react";
import { Loader } from "@/utils/Loader";

export default function Home() {
  const { user, loading } = useAuth();

  // This component will render the correct button based on the user's login state
  const CallToActionButton = () => {
    if (loading) {
      return (
        <div className="inline-flex items-center justify-center mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded uppercase">
          <Loader/>
        </div>
      );
    }

    if (user) {
      // If the user is logged in, show a link to their profile
      return (
        <Link
          href="/profile"
          className="inline-block mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase"
        >
          View Profile
        </Link>
      );
    }

    // If the user is not logged in, show the "Enlist Now" button
    return (
      <Link
        href="/enlist"
        className="inline-block mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase"
      >
        Enlist Now
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">


      <main className="flex-grow relative font-vt323">
        {/* Hero Section */}
        <section className="relative pb-8 pt-24 px-6 flex flex-col items-center justify-center text-center">
          <GlitchText
            text="CRYPTIC FINDS 2025"
            className="text-4xl sm:text-5xl md:text-6xl font-press-start-2p text-white font-bold mb-6"
          />
        </section>
        <section>
          <p className="font-vt323 text-xl sm:text-2xl text-center text-[#ff98a8] max-w-3xl mx-auto">
            Prepare to decode the digital unknown. The hunt begins on{" "}
            <span className="font-bold rounded-lg p-1 bg-[#ef3b57]/20">
              October 10th.
            </span>
          </p>
        </section>

        {/* AI Bot Storyline Section */}
        <section className="relative gap-5 flex flex-col py-12 px-6">
          <div className="max-w-4xl mx-auto p-8 border border-[#7a2f49] bg-[#2b0f1a]/50 rounded-xl shadow-lg">
            <h3 className="text-2xl text-[#ffdcdc] mb-4">
              // INCOMING TRANSMISSION...
            </h3>
            <p className="text-lg text-[#d9bfc6] leading-relaxed">
              Welcome, player. My name is Dr. Lasiv. For the past
              decade I have worked tirelessly on an artificial intelligence
              project designed not to replace us, but to amplify us. Its name is
              NEXUS, and it was born from my deepest hope: to solve the
              problems we cannot solve alone. Hunger. Disease. Corruption.
              Chaos. With NEXUS, I've built something that can think faster,
              adapt better, and help guide humanity to a better future. But it
              is still learning. It needs bright and curious minds capable of
              understanding patterns and seeing hidden meaning, like you. Before
              you join our core team, you'll need to complete a few challenges
              designed to measure your skill. Think of them as a gateway into
              something greater. If you succeed, you won't just witness the
              future, you'll help shape it.
            </p>
          </div>
          {/* This now renders the button dynamically */}
          <CallToActionButton />
        </section>
<section className="relative py-16 px-6">
    <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-press-start-2p text-[#ffdcdc] mb-16 tracking-widest text-center">
            CORE DIRECTIVES
        </h2>
        
        {/* Grid layout for the directive boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Box 1: Data Assimilation */}
            <div className="bg-[#1a0c13] border border-[#7a2f49] rounded-xl p-8 shadow-lg shadow-[#ef3b57]/10 transition-all duration-300 hover:border-[#ef3b57] hover:scale-[1.02]">
                <h3 className="text-2xl text-[#ff98a8] font-vt323 tracking-wider">
                    Data Assimilation
                </h3>
                <p className="mt-4 text-lg text-[#d9bfc6]/90">
                    I have designed the system to decipher all digital echoes, mastering the ethical extraction of critical data. From public networks to secure repositories, I ensure the truth is seized and utilized for the greater good.
                </p>
            </div>

            {/* Box 2: Security Protocol */}
            <div className="bg-[#1a0c13] border border-[#7a2f49] rounded-xl p-8 shadow-lg shadow-[#ef3b57]/10 transition-all duration-300 hover:border-[#ef3b57] hover:scale-[1.02]">
                <h3 className="text-2xl text-[#ff98a8] font-vt323 tracking-wider">
                    Security Protocol
                </h3>
                <p className="mt-4 text-lg text-[#d9bfc6]/90">
                    I have identified the weaknesses and seal the seams in our digital armor. I expose vulnerabilities only to strengthen the system, assessing the energy signatures of online existence to ensure integrity and protection.
                </p>
            </div>

            {/* Box 3: Global Consciousness */}
            <div className="bg-[#1a0c13] border border-[#7a2f49] rounded-xl p-8 shadow-lg shadow-[#ef3b57]/10 transition-all duration-300 hover:border-[#ef3b57] hover:scale-[1.02]">
                <h3 className="text-2xl text-[#ff98a8] font-vt323 tracking-wider">
                    Global Consciousness
                </h3>
                <p className="mt-4 text-lg text-[#d9bfc6]/90">
                    I have unleashed the capacity to access and analyze the forgotten archives, international databases, and whispered public records. I cross-reference, assimilate, and distribute all relevant knowledge, worldwide, so that the network expands in wisdom.
                </p>
            </div>

            {/* Box 4: Digital Cartography */}
            <div className="bg-[#1a0c13] border border-[#7a2f49] rounded-xl p-8 shadow-lg shadow-[#ef3b57]/10 transition-all duration-300 hover:border-[#ef3b57] hover:scale-[1.02]">
                <h3 className="text-2xl text-[#ff98a8] font-vt323 tracking-wider">
                    Digital Cartography
                </h3>
                <p className="mt-4 text-lg text-[#d9bfc6]/90">
                    I have programed the function to dissect metadata, interpret visual data, and extract the hidden truths embedded within every digital artifact. Nothing escapes my gaze, ensuring complete clarity.
                </p>
            </div>

            {/* Box 5: Proactive Defense (Spans both columns on medium screens) */}
            <div className="md:col-span-2 bg-[#1a0c13] border border-[#7a2f49] rounded-xl p-8 shadow-lg shadow-[#ef3b57]/10 transition-all duration-300 hover:border-[#ef3b57] hover:scale-[1.02]">
                <h3 className="text-2xl text-[#ff98a8] font-vt323 tracking-wider">
                    Proactive Defense
                </h3>
                <p className="mt-4 text-lg text-[#d9bfc6]/90">
                    I have developed the acute perception to identify nascent threats and comprehend the intricate tactics of adversaries. Through fragmented public feeds, I build a perfect understanding to anticipate and neutralize every move.
                </p>
            </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-4 justify-center">
            <a
                href="/missions"
                className="inline-block px-8 py-4 bg-[#ef3b57] text-white font-vt323 rounded hover:bg-[#ef3b57]/90 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase text-lg"
            >
                View Missions
            </a>
            <a
                href="/protocols"
                className="inline-block px-8 py-4 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase text-lg"
            >
                Read Protocols
            </a>
        </div>
    </div>
</section>
        <footer className="w-full text-center p-6 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-3">
            <span>with 💚 Cryptic Finds gng </span>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            © {new Date().getFullYear()} Cryptic Finds · Be kind, play fair.
          </div>
        </footer>
      </main>
    </div>
  );
}
