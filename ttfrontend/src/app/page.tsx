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
          <p className="font-vt323 text-xl sm:text-2xl text-[#ff98a8] max-w-3xl mx-auto">
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
              Welcome, player. My name is Dr. (ramdom name idk). For the past
              decade I have worked tirelessly on an artificial intelligence
              project designed not to replace us, but to amplify us. Its name is
              (AI name), and it was born from my deepest hope: to solve the
              problems we cannot solve alone. Hunger. Disease. Corruption.
              Chaos. With (AI name), I’ve built something that can think faster,
              adapt better, and help guide humanity to a better future. But it
              is still learning. It needs bright and curious minds capable of
              understanding patterns and seeing hidden meaning, like you. Before
              you join our core team, you’ll need to complete a few challenges
              designed to measure your skill. Think of them as a gateway into
              something greater. If you succeed, you won’t just witness the
              future, you’ll help shape it.
            </p>
          </div>
          {/* This now renders the button dynamically */}
          <CallToActionButton />
        </section>
        <section className="relative py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl text-[#ffdcdc] mb-8">
              OSINT Challenge
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xl text-[#ff98a8] mb-6">
                  Master the art of Open-Source Intelligence
                </p>
                <ul className="space-y-4 text-[#d9bfc6]">
                  <li className="flex items-start">
                    <span className="mr-3 text-[#ef3b57]">➜</span>
                    <span>
                      Track digital footprints across social platforms
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#ef3b57]">➜</span>
                    <span>
                      Analyze metadata and discover hidden connections
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#ef3b57]">➜</span>
                    <span>Decrypt encoded messages and solve mysteries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-[#ef3b57]">➜</span>
                    <span>Navigate the deep web for critical intelligence</span>
                  </li>
                </ul>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="/missions"
                    className="inline-block px-6 py-3 bg-[#ef3b57] text-white font-vt323 rounded hover:bg-[#ef3b57]/90 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase"
                  >
                    View Missions
                  </a>
                  <a
                    href="/protocols"
                    className="inline-block px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase"
                  >
                    Read Protocols
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-[#2b0f1a] rounded-lg overflow-hidden border border-[#7a2f49]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-3/4 grid grid-cols-2 grid-rows-2 gap-4 opacity-80">
                      <div className="bg-[#ef3b57]/20 border border-[#ef3b57]/30 rounded animate-pulse"></div>
                      <div className="bg-[#7a2f49]/20 border border-[#7a2f49]/30 rounded animate-pulse delay-100"></div>
                      <div className="bg-[#7a2f49]/20 border border-[#7a2f49]/30 rounded animate-pulse delay-200"></div>
                      <div className="bg-[#ef3b57]/20 border border-[#ef3b57]/30 rounded animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer className="w-full text-center p-6 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-3">
            <span>Hosted by TechTatva</span>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            © {new Date().getFullYear()} TechTatva · Be kind, play fair.
          </div>
        </footer>
      </main>
    </div>
  );
}
