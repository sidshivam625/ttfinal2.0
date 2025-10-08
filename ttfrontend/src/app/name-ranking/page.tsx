"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2 } from "lucide-react";
import Link from "next/link";
import CTFButton from "@/utils/CTFButton";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, ChartLegend);

interface PlayerHistory {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  pointsOverTime: { time: number; score: number }[];
}

interface LeaderboardEntry {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  solvedCount: number;
}

interface FrozenSnapshot {
  timestamp: number;
  fullLeaderboard: LeaderboardEntry[];
  topTenHistory: PlayerHistory[];
}

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
];

function buildChartJsData(players: PlayerHistory[]) {
  if (!players || players.length === 0) {
    return { labels: [] as string[], datasets: [] as any[] };
  }
  const allTimePoints = new Set<number>();
  players.forEach((p) => p.pointsOverTime.forEach((pt) => allTimePoints.add(pt.time)));
  const sortedTimes = Array.from(allTimePoints).sort((a, b) => a - b);
  const labels = sortedTimes.map((t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const datasets = players.map((p, index) => {
    const data = sortedTimes.map((time) => {
      const relevant = p.pointsOverTime.filter((pt) => pt.time <= time);
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

export default function RankingPage() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<FrozenSnapshot | null>(null);

  useEffect(() => {
    try {
      const active = localStorage.getItem("freezeLeaderboardActive") === "true";
      const raw = localStorage.getItem("frozenLeaderboard");
      if (!active || !raw) {
        router.replace("/rankings");
        return;
      }
      const snap = JSON.parse(raw) as FrozenSnapshot;
      setSnapshot(snap);
    } catch {
      router.replace("/rankings");
    }
  }, [router]);

  const chart = useMemo(() => {
    const { labels, datasets } = buildChartJsData(snapshot?.topTenHistory || []);
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { grid: { color: "#522546" }, ticks: { color: "#d9bfc6", font: { size: 12 } } },
        y: { beginAtZero: true, grid: { color: "#522546" }, ticks: { color: "#d9bfc6", font: { size: 12 } } },
      },
    } as const;
    return { data: { labels, datasets }, options };
  }, [snapshot]);

  if (!snapshot) {
    return null;
  }

  const capturedAt = new Date(snapshot.timestamp).toLocaleString();

  return (
    <div className="min-h-screen bg-black/40 text-white">
      <div className="relative z-10 p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-4 mb-6 border-b border-[#7a2f49]">
          <BarChart2 size={40} className="text-[#ef3b57]" />
          <h1 className="font-vt323 text-4xl text-[#ffdcdc] tracking-widest">RANKING (FROZEN)</h1>
        </header>

        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded mb-6 font-vt323">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Rankings are frozen for the current operation (isCustom2). Snapshot captured at {capturedAt}.</span>
            <span className="text-xs opacity-80">Refresh is disabled until you complete this mission.</span>
          </div>
        </div>

        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg mb-8">
          <h3 className="font-vt323 text-2xl text-[#ef3b57] mb-4">// TOP 10 SCORE PROGRESSION (SNAPSHOT)</h3>
          <div style={{ width: "100%", height: 400 }}>
            <Line data={chart.data} options={chart.options} />
          </div>
        </div>

        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full font-vt323 text-left">
              <thead className="border-b-2 border-[#7a2f49]">
                <tr>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-center w-16">Rank</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57]">Operative</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-center">Missions Solved</th>
                  <th className="p-3 text-xs font-press-start-2p text-[#ef3b57] text-right">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.fullLeaderboard.map((player, index) => (
                  <tr key={player.uid} className="border-b border-[#522546]/50">
                    <td
                      className="p-3 text-center text-2xl font-vt323"
                      style={{ color: index < 10 ? PALETTE[index % PALETTE.length] : "#d9bfc6" }}
                    >
                      {player.rank}
                    </td>
                    <td className="p-3 text-lg font-bold text-gray-200">{player.username}</td>
                    <td className="p-3 text-lg text-center text-gray-300">{player.solvedCount}</td>
                    <td className="p-3 text-xl text-right font-bold text-yellow-300">
                      {player.totalScore.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/missions">
            <CTFButton text="Return to Missions" />
          </Link>
        </div>
      </div>
    </div>
  );
}


