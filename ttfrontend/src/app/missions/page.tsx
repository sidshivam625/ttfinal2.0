"use client";
import CTFCard from "./components/question_box";
import QuestionGrid from "./components/question_grid";
import Terminal from "./components/terminal";
import IntelFiles from "./components/downloadFiles";
import { auth, db } from "../../../lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

// Your original, unchanged logic is here
export default function MissionsPage() {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [statuses, setStatuses] = useState<{[key: number]: "active"|"done"|"locked"}>({});
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState<string | null>(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            setUid(user ? user.uid : null);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        async function fetchChallenges() {
            const snap = await getDocs(collection(db, "challenges"));
            const arr: any[] = [];
            snap.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
            arr.sort((a, b) => {
                const numA = parseInt((a.challengeId || a.id).replace(/[^\d]/g, ""), 10);
                const numB = parseInt((b.challengeId || b.id).replace(/[^\d]/g, ""), 10);
                return numA - numB;
            });
            setChallenges(arr);
            const st: {[key: number]: "active"|"done"|"locked"} = {};
            arr.forEach((c, i) => st[i] = i === 0 ? "active" : "locked");
            setStatuses(st);
            setLoading(false);
        }
        fetchChallenges();
    }, []);

    useEffect(() => {
        async function fetchProgress() {
            if (!uid || challenges.length === 0) return;
            try {
                const token = await auth.currentUser?.getIdToken();
                const base = (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || '').replace(/\/+$/, '');
                const url = `${base}/missionsProgress`;
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data?.progress) {
                    const p = data.progress as Record<string, string>;
                    const st: {[key: number]: "active"|"done"|"locked"} = {};
                    challenges.forEach((c, i) => {
                        const key = c.challengeId || c.id;
                        if (p[key] === 'done') st[i] = 'done';
                        else if (p[key] === 'active') st[i] = 'active';
                        else st[i] = 'locked';
                    });
                    let firstActive = typeof data.firstActiveIndex === 'number' ? data.firstActiveIndex : -1;
                    if (firstActive < 0) {
                        for (let i = 0; i < challenges.length; i++) {
                            if (st[i] !== 'done') { st[i] = 'active'; firstActive = i; break; }
                        }
                    }
                    setStatuses(st);
                    if (firstActive >= 0) setCurrentIdx(firstActive);
                }
            } catch (e) { console.error('Error fetching progress:', e); }
        }
        fetchProgress();
    }, [uid, challenges]);

    async function validateFlag(flag: string): Promise<{ success: boolean; message: string }> {
        if (!challenges.length) return { success: false, message: "No challenge loaded." };
        if (!uid) return { success: false, message: "User not authenticated." };
        const challenge = challenges[currentIdx];
        try {
            const token = await auth.currentUser?.getIdToken();
            const base = (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || '').replace(/\/+$/, '');
            const url = `${base}/adminSubmitFlag`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: uid, challengeId: challenge.challengeId || challenge.id, flag, token })
            });
            const data = await res.json();
            if (data.success) {
                const progressRes = await fetch(`${base}/missionsProgress`, { headers: { Authorization: `Bearer ${token}` } });
                const progressData = await progressRes.json();
                if (progressData?.progress) {
                    const p = progressData.progress as Record<string, string>;
                    const st: {[key: number]: "active"|"done"|"locked"} = {};
                    challenges.forEach((c, i) => {
                        const key = c.challengeId || c.id;
                        if (p[key] === 'done') st[i] = 'done';
                        else if (p[key] === 'active') st[i] = 'active';
                        else st[i] = 'locked';
                    });
                    setStatuses(st);
                    const nextActive = challenges.findIndex((c, i) => st[i] === 'active');
                    if (nextActive >= 0) setCurrentIdx(nextActive);
                }
            }
            return { success: data.success, message: data.message };
        } catch (e) {
            console.error('validateFlag error', e);
            return { success: false, message: "Server error. Please try again." };
        }
    }

    if (loading) return (
        <main className="min-h-screen bg-[#0d0d0d] p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                <span className="text-lg font-bold text-pink-500 font-vt323">Loading missions...</span>
            </div>
        </main>
    );

    if (!challenges.length) return <div className="p-6 text-center text-lg">No missions found.</div>;

    const currentChallenge = challenges[currentIdx];

    // This is the new UI layout that arranges your components
    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white">

            <div className="relative z-10 p-4 sm:p-8 lg:p-12">
                <header className="flex items-center gap-6 pb-8 border-b-2 border-[#522546] mb-8">
                    <h1 className="font-press-start-2p text-4xl text-[#ff5757] tracking-widest">
                        MISSION NO.{String(currentIdx + 1).padStart(2, '0')}
                    </h1>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#522546] to-transparent"></div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    {/* Left Column (70%) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        {currentChallenge && (
                            <>
                                <CTFCard
                                    title={currentChallenge.title || `Challenge ${currentIdx + 1}`}
                                    description={currentChallenge.description || "No description."}
                                    difficulty={currentChallenge.Level || "HARD"}
                                    points={currentChallenge.points || 0}
                                />
                                <Terminal onSubmit={validateFlag} />
                            </>
                        )}
                    </div>

                    {/* Right Column (30%) */}
                    <div className="lg:col-span-3 flex flex-col gap-8">
                        <QuestionGrid
                            total={challenges.length}
                            columns={5}
                            initialStatuses={statuses}
                            onCellClick={setCurrentIdx}
                            cellSize="50px"

                        />
                        {currentChallenge && <IntelFiles links={currentChallenge.links} />}
                    </div>
                </main>
            </div>
        </div>
    );
}