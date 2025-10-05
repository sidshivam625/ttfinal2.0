'use client';

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebaseClient";
import { Loader2, BarChart2 } from "lucide-react";
import { Loader } from "@/utils/Loader";
import CTFButton from "@/utils/CTFButton";
import Link from "next/link";

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


// --- DATA TRANSFORMATION FOR RECHARTS ---
function transformDataForChart(players: PlayerHistory[]) {
  if (!players || players.length === 0) return [];

  const allTimePoints = new Set<number>();
  players.forEach(p => p.pointsOverTime.forEach(pt => allTimePoints.add(pt.time)));

  const sortedTimes = Array.from(allTimePoints).sort((a, b) => a - b);

  return sortedTimes.map(time => {
    const row: { time: number; [key: string]: number } = { time };
    players.forEach(p => {
      const relevantPoints = p.pointsOverTime.filter(pt => pt.time <= time);
      row[p.username] = relevantPoints.length > 0 ? relevantPoints[relevantPoints.length - 1].score : 0;
    });
    return row;
  });
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
            // Create callable functions for both endpoints
            const getFullLeaderboard = httpsCallable<void, FullLeaderboardResponse>(functions, 'leaderboard');
            const getHistoryLeaderboard = httpsCallable<void, LeaderboardHistoryResponse>(functions, 'getLeaderboardWithHistory');

            // Fetch both data sets in parallel for efficiency
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
      <div className="min-h-screen bg-[#1b1b1b] flex items-center justify-center">

        <div className="text-center z-10">
          <Loader/>
          <p className="font-press-start-2p text-lg text-gray-400 mt-4">Deriving Leaderboard Data</p>
        </div>
      </div>
    );
  }

  if (error) {
     return <div className="min-h-screen font-press-start-2p flex flex-col items-center justify-center text-[#ef3b57] p-4">
       <h2 className="text-2xl m-8 font-bold">Error</h2>
       <p className="mt-2 m-8 text-center">{error}</p>
       <Link href={"/missions"}>
       <CTFButton text="Return to Missions"/>
       </Link>
     </div>;
  }

  const chartData = transformDataForChart(topTenHistory);

  return (
    <div className="min-h-screen  text-white">

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
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid stroke="#522546" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#d9bfc6" 
                      tick={{ fill: '#d9bfc6', fontSize: 12 }} 
                      tickMargin={10} 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      label={{ value: 'Time of Solve', position: 'insideBottom', offset: -10, fill: '#9ca3af' }}
                    />
                    <YAxis stroke="#d9bfc6" tick={{ fill: '#d9bfc6', fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{ background: "rgba(13, 13, 13, 0.8)", border: "1px solid #7a2f49", borderRadius: "0.5rem", fontFamily: "monospace" }}
                        labelStyle={{ color: "#ffdcdc", marginBottom: '10px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: number) => `${value.toLocaleString()} pts`}
                        labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
                    />
                    {/* <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }}/> */}
                    {topTenHistory.map((player, index) => (
                        <Line
                            key={player.uid}
                            type="monotone"
                            dataKey={player.username}
                            stroke={PALETTE[index % PALETTE.length]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
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