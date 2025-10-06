'use client';

import React, { useState, useEffect } from "react";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebaseClient";
import { Loader2, BarChart2 } from "lucide-react";
import { Loader } from "@/utils/Loader";
import CTFButton from "@/utils/CTFButton";
import Link from "next/link";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, ChartLegend);

// --- TYPE DEFINITIONS ---
// For the chart (Top 10 with detailed history)
interface PlayerHistory {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  pointsOverTime: { time: number; score: number }[];
}

// For the main table (all users, simpler data)
interface LeaderboardEntry {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  solvedCount: number;
}

interface LeaderboardHistoryResponse {
  success: boolean;
  leaderboard: PlayerHistory[];
}

interface FullLeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}


// --- DATA TRANSFORMATION FOR CHART.JS ---
function buildChartJsData(players: PlayerHistory[]) {
  if (!players || players.length === 0) {
    return { labels: [] as string[], datasets: [] as any[] };
  }

  const allTimePoints = new Set<number>();
  players.forEach(p => p.pointsOverTime.forEach(pt => allTimePoints.add(pt.time)));
  const sortedTimes = Array.from(allTimePoints).sort((a, b) => a - b);

  const labels = sortedTimes.map(t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const datasets = players.map((p, index) => {
    const data = sortedTimes.map(time => {
      const relevant = p.pointsOverTime.filter(pt => pt.time <= time);
      return relevant.length > 0 ? relevant[relevant.length - 1].score : 0;
    });
    return {
      label: p.username,
      data,
      borderColor: PALETTE[index % PALETTE.length],
      backgroundColor: PALETTE[index % PALETTE.length],
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
      pointHitRadius: 10,
    };
  });

  return { labels, datasets };
}

const PALETTE = [ "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef" ];

// --- MAIN LEADERBOARD COMPONENT ---
export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // State for the full leaderboard table
  const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardEntry[]>([]);
  // State for the top 10 chart data
  const [topTenHistory, setTopTenHistory] = useState<PlayerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/enlist');
      } else if (!user.emailVerified) {
        router.push('/profile');
      } else {
        const fetchAllLeaderboardData = async () => {
          try {
            const getFullLeaderboard = httpsCallable<void, FullLeaderboardResponse>(functions, 'leaderboard');
            const getHistoryLeaderboard = httpsCallable<void, LeaderboardHistoryResponse>(functions, 'getLeaderboardWithHistory');
            const [fullResult, historyResult] = await Promise.all([
              getFullLeaderboard(),
              getHistoryLeaderboard()
            ]);
            if (fullResult.data.success) {
              setFullLeaderboard(fullResult.data.leaderboard);
            } else {
              setError("Failed to fetch full leaderboard data.");
            }
            if (historyResult.data.success) {
              setTopTenHistory(historyResult.data.leaderboard);
            } else {
              setError("Failed to fetch chart data.");
            }
          } catch (err: any) {
            setError(err.message || "An error occurred fetching leaderboard data.");
          } finally {
            setLoading(false);
          }
        };
        fetchAllLeaderboardData();
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-[#1b1b1b]/50 flex items-center justify-center">

=======
      <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center">
>>>>>>> siddhant4
        <div className="text-center z-10">
          <Loader/>
          <p className="font-press-start-2p text-lg text-gray-400 mt-4">Deriving Leaderboard Data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen font-press-start-2p flex flex-col items-center justify-center text-[#ef3b57] p-4">
        <h2 className="text-2xl m-8 font-bold">Error</h2>
        <p className="mt-2 m-8 text-center">{error}</p>
        <Link href={'/missions'}>
          <CTFButton text="Return to Missions"/>
        </Link>
      </div>
    );
  }

  const { labels, datasets } = buildChartJsData(topTenHistory);
  const chartJsData = { labels, datasets };
  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { color: '#522546' },
        ticks: { color: '#d9bfc6', font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#522546' },
        ticks: { color: '#d9bfc6', font: { size: 12 } },
      },
    },
  } as const;

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-black/40 text-white">

=======
    <div className="min-h-screen  text-white">
>>>>>>> siddhant4
      <div className="relative z-10 p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-8 mb-8">
          <BarChart2 size={40} className="text-[#ef3b57]" />
          <h1 className="font-vt323 text-4xl text-[#ffdcdc] tracking-widest">
            LEADERBOARD
          </h1>
        </header>

        {/* --- CHART AREA (for Top 10) --- */}
        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg mb-8">
          <h3 className="font-vt323 text-2xl text-[#ef3b57] mb-4">// TOP 10 SCORE PROGRESSION</h3>
          <div style={{ width: '100%', height: 400 }}>
            <Line data={chartJsData} options={chartJsOptions} />
          </div>
        </div>

        {/* --- LEADERBOARD TABLE (for All Users) --- */}
        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full font-vt323  text-left">
              <thead className="border-b-2 border-[#7a2f49]">
                <tr>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-center w-16">Rank</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57]">Operative</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-center">Missions Solved</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-right">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {fullLeaderboard.map((player, index) => (
                  <tr 
                    key={player.uid} 
                    className={`border-b border-[#522546]/50 ${player.uid === user?.uid ? 'bg-[#ef3b57]/20' : ''}`}
                  >
                    <td className="p-3 text-center text-2xl font-vt323" style={{ color: index < 10 ? PALETTE[index % PALETTE.length] : '#d9bfc6' }}>
                      {player.rank}
                    </td>
                    <td className="p-3 text-lg font-bold text-gray-200">
                      {player.username}
                    </td>
                    <td className="p-3 text-lg text-center text-gray-300">
                      {player.solvedCount}
                    </td>
                    <td className="p-3 text-xl text-right font-bold text-yellow-300">
                      {player.totalScore.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}