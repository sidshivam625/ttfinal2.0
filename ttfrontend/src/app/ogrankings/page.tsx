'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { BarChart2, Download } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, ChartLegend);

// Types matching the frozen JSON schema
 type PlayerHistory = {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  pointsOverTime: { time: number; score: number }[];
};

 type LeaderboardEntry = {
  rank: number;
  uid: string;
  username: string;
  totalScore: number;
  solvedCount: number;
  delegateId?: string;
};

 type Snapshot = {
  capturedAt: string;
  leaderboard: LeaderboardEntry[];
  top10: PlayerHistory[];
};

const PALETTE = [ '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef' ];

function buildChartJsData(players: PlayerHistory[]) {
  if (!players || players.length === 0) return { labels: [] as string[], datasets: [] as any[] };
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

export default function OriginalFrozenLeaderboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load static snapshot from public/ (frozen forever until file replaced)
        const res = await fetch('/data/og_leaderboard.json', { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to load snapshot: ${res.status}`);
        const data = (await res.json()) as Snapshot;
        setSnapshot(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load frozen leaderboard');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen font-press-start-2p flex flex-col items-center justify-center text-[#ef3b57] p-4">
        <h2 className="text-2xl m-8 font-bold">Error</h2>
        <p className="mt-2 m-8 text-center">{error}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-[#1b1b1b]/50 flex items-center justify-center">
        <div className="text-center z-10">
          <div className="animate-pulse text-gray-400">Loading frozen leaderboard…</div>
        </div>
      </div>
    );
  }

  const { leaderboard, top10, capturedAt } = snapshot;
  const { labels, datasets } = buildChartJsData(top10);
  const chartJsData = { labels, datasets };
  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { color: '#522546' }, ticks: { color: '#d9bfc6', font: { size: 12 } } },
      y: { beginAtZero: true, grid: { color: '#522546' }, ticks: { color: '#d9bfc6', font: { size: 12 } } },
    },
  } as const;

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Rank', 'UID', 'Delegate ID', 'Username', 'Missions Solved', 'Total Score'];
      const rows = leaderboard.map(p => [
        p.rank,
        p.uid || '',
        p.delegateId || '',
        `"${p.username.replace(/\"/g, '""')}"`,
        p.solvedCount,
        p.totalScore,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leaderboard_frozen_${new Date(capturedAt).toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/40 text-white">
      <div className="relative z-10 p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto">
        <header className="flex items-center gap-4 pb-8 mb-8">
          <BarChart2 size={40} className="text-[#ef3b57]" />
          <div>
            <h1 className="font-vt323 text-4xl text-[#ffdcdc] tracking-widest">ORIGINAL LEADERBOARD SNAPSHOT</h1>
            <p className="text-sm text-gray-400">Captured at: {new Date(capturedAt).toLocaleString()}</p>
          </div>
        </header>

        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg mb-8">
          <h3 className="font-vt323 text-2xl text-[#ef3b57] mb-4">// TOP 10 SCORE PROGRESSION (Frozen)</h3>
          <div style={{ width: '100%', height: 400 }}>
            <Line data={chartJsData} options={chartJsOptions} />
          </div>
        </div>

        <div className="bg-[#2b0f1a]/50 p-6 rounded-xl border border-[#7a2f49] shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-vt323 text-2xl text-[#ef3b57]">// FULL LEADERBOARD (Frozen)</h3>
            <button
              onClick={exportToCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#ef3b57] hover:bg-[#d12b47] text-white rounded-md transition-colors font-vt323 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {isExporting ? 'Exporting...' : 'Export as CSV'}
            </button>
          </div>
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
                {leaderboard.map((player, index) => (
                  <tr key={player.uid} className="border-b border-[#522546]/50">
                    <td className="p-3 text-center text-2xl font-vt323" style={{ color: index < 10 ? PALETTE[index % PALETTE.length] : '#d9bfc6' }}>
                      {player.rank}
                    </td>
                    <td className="p-3 text-lg font-bold text-gray-200">{player.username}</td>
                    <td className="p-3 text-lg text-center text-gray-300">{player.solvedCount}</td>
                    <td className="p-3 text-xl text-right font-bold text-yellow-300">{player.totalScore.toLocaleString()}</td>
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
