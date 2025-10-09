"use client";
import QuestionGrid from "./components/question_grid";
import CTFCard from "./components/question_box";
import Terminal from "./components/terminal";
import IntelFiles from "./components/downloadFiles";
import QRPuzzle from "./components/qr_puzzle";
import { auth, db, functions } from "../../../lib/firebaseClient";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useState } from "react";
import CTFButton from "@/utils/CTFButton";
import Link from "next/link";
import { Loader } from "@/utils/Loader";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";


// Your original, unchanged logic is here
export default function MissionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [statuses, setStatuses] = useState<{[key: number]: "active"|"done"|"locked"}>({});
    const [loading, setLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState<boolean | null>(null);
    const [hasEnded, setHasEnded] = useState<boolean | null>(null);

    // Check authentication and email verification
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/enlist');
            } else if (!user.emailVerified) {
                router.push('/profile');
            }
        }
    }, [user, authLoading, router]);

    // Event gate: listen to event/status in Firestore
    useEffect(() => {
        const ref = doc(db, 'event', 'status');
        const unsubscribe = onSnapshot(ref, (snap) => {
            const data = (snap.data() as any) || {};
            setHasStarted(!!data?.hasstarted);
            setHasEnded(!!data?.hasended);
        });
        return () => unsubscribe();
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
            if (!user || challenges.length === 0) return;
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
                    if (firstActive >= 0) {
                        setCurrentIdx(firstActive);
                        // Ensure freeze state reflects current active challenge on load
                        try {
                            const activeChallenge = challenges[firstActive];
                            if (activeChallenge?.isCustom2) {
                                const alreadyFrozen = typeof window !== 'undefined' && localStorage.getItem('freezeLeaderboardActive') === 'true' && localStorage.getItem('frozenLeaderboard');
                                if (!alreadyFrozen) {
                                    try {
                                        const initFreeze: any = httpsCallable(functions, 'getUserCustom2Freeze');
                                        const r = await initFreeze({ challengeId: activeChallenge.challengeId || activeChallenge.id });
                                        const snapshot = (r?.data as any)?.snapshot;
                                        if (snapshot) {
                                            localStorage.setItem('frozenLeaderboard', JSON.stringify(snapshot));
                                            localStorage.setItem('freezeLeaderboardActive', 'true');
                                            if (typeof window !== 'undefined') {
                                                window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                            }
                                        } else {
                                            // Fallback: derive from current public leaderboards
                                            const getFullLeaderboard: any = httpsCallable(functions, 'leaderboard');
                                            const getHistoryLeaderboard: any = httpsCallable(functions, 'getLeaderboardWithHistory');
                                            const [fullResult, historyResult] = await Promise.all([
                                                getFullLeaderboard(),
                                                getHistoryLeaderboard(),
                                            ]);
                                            const fallback = {
                                                timestamp: Date.now(),
                                                fullLeaderboard: (fullResult?.data as any)?.leaderboard ?? [],
                                                topTenHistory: (historyResult?.data as any)?.leaderboard ?? [],
                                            };
                                            localStorage.setItem('frozenLeaderboard', JSON.stringify(fallback));
                                            localStorage.setItem('freezeLeaderboardActive', 'true');
                                            if (typeof window !== 'undefined') {
                                                window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                            }
                                        }
                                    } catch (err) {
                                        console.warn('getUserCustom2Freeze failed, using fallback:', err);
                                        const getFullLeaderboard: any = httpsCallable(functions, 'leaderboard');
                                        const getHistoryLeaderboard: any = httpsCallable(functions, 'getLeaderboardWithHistory');
                                        const [fullResult, historyResult] = await Promise.all([
                                            getFullLeaderboard(),
                                            getHistoryLeaderboard(),
                                        ]);
                                        const snapshot = {
                                            timestamp: Date.now(),
                                            fullLeaderboard: (fullResult?.data as any)?.leaderboard ?? [],
                                            topTenHistory: (historyResult?.data as any)?.leaderboard ?? [],
                                        };
                                        localStorage.setItem('frozenLeaderboard', JSON.stringify(snapshot));
                                        localStorage.setItem('freezeLeaderboardActive', 'true');
                                        if (typeof window !== 'undefined') {
                                            window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                        }
                                    }
                                }
                            } else {
                                localStorage.removeItem('frozenLeaderboard');
                                localStorage.removeItem('freezeLeaderboardActive');
                                if (typeof window !== 'undefined') {
                                    window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: false } }));
                                }
                            }
                        } catch (e) {
                            console.warn('Freeze state initialization failed:', e);
                        }
                    }
                }
            } catch (e) { console.error('Error fetching progress:', e); }
        }
        fetchProgress();
    }, [user, challenges]);

    // Initialize freeze when entering an isCustom2 challenge (runs every render, safe with early returns below)
    useEffect(() => {
        const c = challenges[currentIdx];
        if (!c || !c.isCustom2) return;
        try {
            const alreadyFrozen = typeof window !== 'undefined' && localStorage.getItem('freezeLeaderboardActive') === 'true' && localStorage.getItem('frozenLeaderboard');
            if (!alreadyFrozen) {
                (async () => {
                    try {
                        const initFreeze: any = httpsCallable(functions, 'getUserCustom2Freeze');
                        const r = await initFreeze({ challengeId: c.challengeId || c.id });
                        const snapshot = (r?.data as any)?.snapshot;
                        if (snapshot) {
                            localStorage.setItem('frozenLeaderboard', JSON.stringify(snapshot));
                            localStorage.setItem('freezeLeaderboardActive', 'true');
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                            }
                        }
                    } catch (e) {
                        // optional: fallback omitted here to avoid double-calling other effects
                    }
                })();
            }
        } catch {}
    }, [challenges, currentIdx]);

    // Expose DevTools helper submitSequence(seq) while on an isCustom2 challenge
    useEffect(() => {
        const c = challenges[currentIdx];
        if (!c || !c.isCustom2) {
            try { delete (window as any).submitSequence; } catch {}
            return;
        }
        const challengeId = c.challengeId || c.id;
        (window as any).submitSequence = async (seq: string) => {
            try {
                const getFlag: any = httpsCallable(functions, 'getCustom2FlagFromSequence');
                const r = await getFlag({ challengeId, sequence: String(seq || '').trim() });
                const data: any = r?.data || {};
                if (data.success && data.flag) {
                    console.log(data.flag);
                } else {
                    console.log('Incorrect sequence');
                }
            } catch (e) {
                console.log('Error validating sequence');
            }
        };
        return () => { try { delete (window as any).submitSequence; } catch {} };
    }, [challenges, currentIdx]);

    async function validateFlag(flag: string): Promise<{ success: boolean; message: string }> {
        if (!challenges.length) return { success: false, message: "No challenge loaded." };
        if (!user) return { success: false, message: "User not authenticated." };
        const challenge = challenges[currentIdx];
        try {
            const token = await auth.currentUser?.getIdToken();
            const base = (process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || '').replace(/\/+$/, '');
            const url = `${base}/adminSubmitFlag`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, challengeId: challenge.challengeId || challenge.id, flag, token })
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
                    if (nextActive >= 0) {
                        setCurrentIdx(nextActive);
                        // Freeze leaderboard if the next active challenge is isCustom2
                        try {
                            const nextChallenge = challenges[nextActive];
                            if (nextChallenge?.isCustom2) {
                                const alreadyFrozen = typeof window !== 'undefined' && localStorage.getItem('freezeLeaderboardActive') === 'true' && localStorage.getItem('frozenLeaderboard');
                                if (!alreadyFrozen) {
                                    try {
                                        const initFreeze: any = httpsCallable(functions, 'getUserCustom2Freeze');
                                        const r = await initFreeze({ challengeId: nextChallenge.challengeId || nextChallenge.id });
                                        const snapshot = (r?.data as any)?.snapshot;
                                        if (snapshot) {
                                            localStorage.setItem('frozenLeaderboard', JSON.stringify(snapshot));
                                            localStorage.setItem('freezeLeaderboardActive', 'true');
                                            if (typeof window !== 'undefined') {
                                                window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                            }
                                        } else {
                                            const getFullLeaderboard: any = httpsCallable(functions, 'leaderboard');
                                            const getHistoryLeaderboard: any = httpsCallable(functions, 'getLeaderboardWithHistory');
                                            const [fullResult, historyResult] = await Promise.all([
                                                getFullLeaderboard(),
                                                getHistoryLeaderboard(),
                                            ]);
                                            const fallback = {
                                                timestamp: Date.now(),
                                                fullLeaderboard: (fullResult?.data as any)?.leaderboard ?? [],
                                                topTenHistory: (historyResult?.data as any)?.leaderboard ?? [],
                                            };
                                            localStorage.setItem('frozenLeaderboard', JSON.stringify(fallback));
                                            localStorage.setItem('freezeLeaderboardActive', 'true');
                                            if (typeof window !== 'undefined') {
                                                window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                            }
                                        }
                                    } catch (err) {
                                        console.warn('getUserCustom2Freeze failed, using fallback:', err);
                                        const getFullLeaderboard: any = httpsCallable(functions, 'leaderboard');
                                        const getHistoryLeaderboard: any = httpsCallable(functions, 'getLeaderboardWithHistory');
                                        const [fullResult, historyResult] = await Promise.all([
                                            getFullLeaderboard(),
                                            getHistoryLeaderboard(),
                                        ]);
                                        const snapshot = {
                                            timestamp: Date.now(),
                                            fullLeaderboard: (fullResult?.data as any)?.leaderboard ?? [],
                                            topTenHistory: (historyResult?.data as any)?.leaderboard ?? [],
                                        };
                                        localStorage.setItem('frozenLeaderboard', JSON.stringify(snapshot));
                                        localStorage.setItem('freezeLeaderboardActive', 'true');
                                        if (typeof window !== 'undefined') {
                                            window.dispatchEvent(new CustomEvent('frozenLeaderboardChange', { detail: { active: true } }));
                                        }
                                    }
                                }
                            } else {
                                localStorage.removeItem('frozenLeaderboard');
                                localStorage.removeItem('freezeLeaderboardActive');
                            }
                        } catch (e) {
                            console.warn('Freeze leaderboard snapshot failed:', e);
                        }
                    }
                }
            }
            return { success: data.success, message: data.message };
        } catch (e) {
            console.error('validateFlag error', e);
            return { success: false, message: "Server error. Please try again." };
        }
    }

    // If event hasn't started or has ended, lock this page
    if (hasStarted === false || hasEnded === true) return (
        <main className="min-h-screen text-[#ffdcdc] p-6 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-[#2b0f1a]/60 p-8 rounded-xl border border-[#7a2f49] shadow-lg text-center">
                <h2 className="font-press-start-2p text-xl mb-3">{hasEnded ? '// OPERATION COMPLETE' : '// OPERATION LOCKED'}</h2>
                <p className="font-vt323 text-lg text-[#d9bfc6]">
                    {hasEnded ? 'The event has ended. Thanks for participating.' : 'The event has not started yet. Stand by for activation.'}
                </p>
            </div>
        </main>
    );

    if (authLoading || loading) return (
        <main className="min-h-screen text-[#ef3b57] font-press-start-2p p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader/>
                <span className="text-lg font-bold ">Loading missions..</span>
            </div>
        </main>
    );
    
    if (!user) {
        return (
            <main className="min-h-screen font-press-start-2p text-[#ef3b57] p-6 flex items-center justify-center text-center">
                <div>
                    <p className="mb-4 text-lg">Please sign in to access missions.</p>
                    <Link  href="/enlist"><CTFButton text="Go to Enlist"/></Link>
                </div>
            </main>
        );
    }

    if (!user.emailVerified) {
        return (
            <main className="min-h-screen font-press-start-2p text-[#ef3b57] p-6 flex items-center justify-center text-center">
                <div>
                    <p className="mb-4 text-lg">Please verify your email to access missions.</p>
                    <Link href="/profile"><CTFButton text="Go to Profile"/></Link>
                </div>
            </main>
        );
    }

    if (!challenges.length) return <div className="text-[#ef3b57] font-press-start-2p flex justify-center items-center">No missions found.</div>;

    const currentChallenge = challenges[currentIdx];

    // This is the new UI layout that arranges your components
    return (
        <div className="min-h-screen bg-[#0d0d0d]/60 text-white">
            <div className="relative z-10 p-4 sm:p-8 lg:p-12">
                <header className="flex items-center gap-6 pb-8 border-b-2 border-[#522546] mb-8">
                    <h1 className="font-vt323 text-4xl text-white tracking-widest">
                        MISSION NO.{String(currentChallenge?.questionNumber || currentIdx + 1).padStart(2, '0')}
                    </h1>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#522546] to-transparent"></div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    {/* Left Column (70%) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        {currentChallenge ? (
                            <>
                                <CTFCard
                                    title={currentChallenge.title || `Challenge ${currentIdx + 1}`}
                                    description={currentChallenge.description || "No description."}
                                    chips={[
                                        { label: currentChallenge.Level || 'N/A', color: '#FFDDC7', border: '#89304E', bg: '#522546' },
                                        { label: `${currentChallenge.points || 0} PTS`, color: '#FFDDC7', border: '#89304E', bg: '#522546' }
                                    ]}
                                    briefingLabel="CLASSIFIED.BRIEFING"
                                    customContent={currentChallenge?.isCustom ? (
                                      <QRPuzzle challengeId={currentChallenge.challengeId || currentChallenge.id} />
                                    ) : null}
                                />
                                {statuses[currentIdx] !== 'done' && (
                                    <Terminal onSubmit={validateFlag} />
                                )}
                            </>
                        ) : (
                             <div className="text-center text-gray-400 font-vt323 text-xl p-8 bg-[#2b0f1a]/50 rounded-xl border border-[#7a2f49]">All missions complete, Operative. Well done.</div>
                        )}
                    </div>

                    {/* Right Column (30%) */}
                    <div className="lg:col-span-3 flex flex-col gap-8">
                        <QuestionGrid
                            total={challenges.length}
                            columns={5}
                            cellSize="auto"
                            initialStatuses={statuses}
                            onCellClick={setCurrentIdx}
                            activeIndex={currentIdx}
                            title="GRID.STATUS"
                        />
                        {currentChallenge && <IntelFiles links={currentChallenge.links} />}
                    </div>
                </main>
            </div>
        </div>
    );
}