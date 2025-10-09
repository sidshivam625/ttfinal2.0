import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import corsLib from 'cors';
// QRCode import removed - now using qrcode-generator in separate file

const cors = corsLib({ origin: true });

// Admin endpoint to (re)generate custom flags for a given user (for debugging/backfill)
export const triggerCustomFlags = functions.region('asia-south1').https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const app = initAdmin()

      const authHeader = req.headers.authorization || ''
      const idToken = authHeader.replace('Bearer ', '')
      if (!idToken) return res.status(401).json({ error: 'Missing token' })
      const decoded = await app.auth().verifyIdToken(idToken)
      const callerUid = (decoded as any).uid

      const { userId, delegateId } = req.body || {}
      if (!userId || !delegateId) return res.status(400).json({ error: 'Missing userId or delegateId' })

      console.log('[triggerCustomFlags] Triggered by', { callerUid, targetUser: userId })
      await createCustomFlagsForUser(userId, delegateId)
      return res.status(200).json({ success: true })
    } catch (e: any) {
      console.error('[triggerCustomFlags] Error', e)
      return res.status(500).json({ success: false, error: e?.message || String(e) })
    } 
    
    
  })
}) 
export const triggerCustom1Flags = functions.region('asia-south1').https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const app = initAdmin()

      const authHeader = req.headers.authorization || ''
      const idToken = authHeader.replace('Bearer ', '')
      if (!idToken) return res.status(401).json({ error: 'Missing token' })
      const decoded = await app.auth().verifyIdToken(idToken)
      const callerUid = (decoded as any).uid

      const { userId, delegateId } = req.body || {}
      if (!userId || !delegateId) return res.status(400).json({ error: 'Missing userId or delegateId' })

      console.log('[triggerCustom1Flags] Triggered by', { callerUid, targetUser: userId })
      await createCustom1FlagsForUser(userId, delegateId)
      return res.status(200).json({ success: true })
    } catch (e: any) {
      console.error('[triggerCustom1Flags] Error', e)
      return res.status(500).json({ success: false, error: e?.message || String(e) })
    }
  })
}) 


function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.app();
  // Prefer FIREBASE_SERVICE_ACCOUNT for local/CI; otherwise fall back to default credentials
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envJson) {
    const svc = JSON.parse(envJson as string) as any;
    if (typeof svc.private_key === 'string') svc.private_key = svc.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({ credential: admin.credential.cert(svc) });
  } else {
    admin.initializeApp();
  }
  return admin.app();
}

// Initialize Admin SDK once to avoid re-initialization
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
// helper near the top (after `const db = admin.firestore();`)
async function getEventFlags(): Promise<{ hasstarted: boolean; hasended: boolean }> {
  const snap = await db.collection('event').doc('status').get();
  const data = snap.exists ? (snap.data() as any) : {};
  return { hasstarted: !!data.hasstarted, hasended: !!data.hasended };
}

//
// Types
//
interface DelegateRecord {
  delegateId: string;
  phone: string;
}
interface VerifyDelegatePayload {
  delegateId: string;
  phoneNumber: string;
}
interface CreateAccountPayload {
  delegateId: string;
  email: string;
  password: string;
  name: string;
  phone: string;
}

//
// 1) VERIFY DELEGATE (no name prefill)
//
export const verifyDelegate = functions.region('asia-south1').https.onCall(async (data: VerifyDelegatePayload, _context: functions.https.CallableContext) => {
  const {delegateId, phoneNumber} = data;
  if (!delegateId || !phoneNumber) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Delegate ID and Phone Number are required.",
    );
  }

  const delegates = await new Promise<DelegateRecord[]>((resolve, reject) => {
    const results: DelegateRecord[] = [];
    const filePath = path.join(__dirname, "data", "delegates.csv");

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (d: DelegateRecord) => results.push(d))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
  });

  const foundDelegate = delegates.find(
      (record) => record.delegateId === delegateId && record.phone === phoneNumber,
  );

  if (!foundDelegate) {
    throw new functions.https.HttpsError(
        "not-found",
        "No matching delegate found with the provided details.",
    );
  }

  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("delegateId", "==", delegateId).limit(1).get();

  if (!snapshot.empty) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "This delegate has already registered an account.",
    );
  }

  return {
    success: true,
    message: "Delegate verified successfully.",
    delegate: {
      name: "", // do not prefill; user will choose a handle
      phone: foundDelegate.phone,
      delegateId: foundDelegate.delegateId,
    },
  };
});

//
// 2) CHECK USERNAME AVAILABILITY (case-insensitive)
//
export const checkUsernameAvailable = functions.region('asia-south1').https.onCall(async (data: { username: string }, _ctx) => {
  const raw = String(data?.username || '').trim();
  if (!raw) throw new functions.https.HttpsError('invalid-argument', 'username is required');
  const usernameLower = raw.toLowerCase();

  // Primary: normalized field
  const q = await db.collection('users').where('usernameLower', '==', usernameLower).limit(1).get();
  if (!q.empty) return { success: true, available: false };

  // Legacy fallbacks
  const [q2, q3] = await Promise.all([
    db.collection('users').where('username', '==', raw).limit(1).get(),
    db.collection('users').where('name', '==', raw).limit(1).get(),
  ]);
  const legacyTaken = !q2.empty || !q3.empty;
  return { success: true, available: !legacyTaken };
});

//
// 3) CREATE ACCOUNT (enforce unique username, store usernameLower)
//
export const createAccount = functions.region('asia-south1').https.onCall(async (data: CreateAccountPayload, _context: functions.https.CallableContext) => {
  const {delegateId, email, password, name, phone} = data;
  try {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      throw new functions.https.HttpsError('invalid-argument', 'Username is required.');
    }
    const usernameLower = trimmedName.toLowerCase();
    const existing = await db.collection('users').where('usernameLower', '==', usernameLower).limit(1).get();
    if (!existing.empty) {
      throw new functions.https.HttpsError('already-exists', 'This username is already taken.');
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: trimmedName,
      emailVerified: false,
    });

    // Build a solved_logs scaffold with 29 entries so mission logic has a predictable shape
    const solved_logs: any[] = [];
    for (let i = 1; i <= 32; i++) {
      solved_logs.push({
        challengeId: `challenge${i}`,
        solvedAt: '',
        attempts: 0,
        penalty: 0,
        positivePoints: 0,
        actualScore: 0,
      });
    }

    // Write to the 'users' collection with the schema your profile page expects
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      delegateId,
      username: trimmedName,
      usernameLower,
      email,
      phone,
      totalScore: 0,
      solved_logs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create custom flags for challenges with isCustom / isCustom1 (non-blocking in case of failure)
    console.log('[createAccount] Starting custom flag generation', { uid: userRecord.uid, delegateId });
    await createCustomFlagsForUser(userRecord.uid, delegateId).catch((e) => console.warn('createCustomFlagsForUser (ignored):', e?.message || e));
    await createCustom1FlagsForUser(userRecord.uid, delegateId).catch((e) => console.warn('createCustom1FlagsForUser (ignored):', e?.message || e));
    console.log('[createAccount] Finished custom flag generation', { uid: userRecord.uid });

    return {success: true, uid: userRecord.uid};
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError(
          "already-exists",
          "This email address is already in use.",
      );
    }
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
        "internal",
        error?.message || "An unexpected error occurred during account creation.",
    );
  }
});

//
// 4) GET USER PROFILE (legacy-compatible)
//
export const getUserProfile = functions.region('asia-south1').https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to view your profile.",
    );
  }

  const uid = context.auth.uid;
  const userDoc = await db.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
        "not-found",
        "User profile data not found.",
    );
  }
  const userData = userDoc.data() as admin.firestore.DocumentData;
  const solvedLogs: {actualScore: number}[] = Array.isArray(userData?.solved_logs) ? userData.solved_logs : [];
  const solvedQuestionsCount = solvedLogs.filter((log) => Number(log?.actualScore || 0) > 0).length;

  return {
    success: true,
    profile: {
      name: userData.username || userData.name || "N/A",
      email: userData.email,
      delegateId: userData.delegateId,
      phone: userData.phone,
      points: Number(userData.totalScore ?? userData.totalPoints ?? 0),
      solvedQuestions: solvedQuestionsCount,
      unsolvedQuestions: Math.max(0, solvedLogs.length - solvedQuestionsCount),
    },
  };
});

//
// 5) GET USER RANK (global rank)
//
export const getUserRank = functions.region('asia-south1').https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;

  const meDoc = await db.collection('users').doc(uid).get();
  if (!meDoc.exists) throw new functions.https.HttpsError('not-found', 'Profile not found');

  const myScore = Number(meDoc.data()?.totalScore || 0);

  // Rank = 1 + number of users with strictly higher score
  const higherSnap = await db.collection('users').where('totalScore', '>', myScore).get();
  const rank = higherSnap.size + 1;

  return { success: true, rank };
});

//
// Missions progress / admin submit handlers (adapted)
//
export const missionsProgress = functions.region('asia-south1').https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const app = initAdmin()
      const db = app.firestore()
      const { hasstarted, hasended } = await getEventFlags()
      if (!hasstarted) return res.status(403).json({ success: false, message: 'Event has not started' })
      if (hasended) return res.status(403).json({ success: false, message: 'Event has ended' })

      const authHeader = req.headers.authorization || ''
      const idToken = authHeader.replace('Bearer ', '')
      if (!idToken) return res.status(401).json({ error: 'Missing token' })

      const decoded = await app.auth().verifyIdToken(idToken)
      const uid = (decoded as any).uid

      const userDoc = await db.collection('users').doc(uid).get()
      const data = userDoc.exists ? (userDoc.data() as any) : {}
      const solvedLogs: any[] = Array.isArray(data?.solved_logs) ? data.solved_logs : []

      const challengesSnap = await db.collection('challenges').get()
      const challenges: any[] = []
      challengesSnap.forEach(doc => challenges.push({ id: doc.id, ...doc.data() }))
      challenges.sort((a, b) => {
        const numA = parseInt((a.challengeId || a.id).replace(/[^\d]/g, ''), 10)
        const numB = parseInt((b.challengeId || b.id).replace(/[^\d]/g, ''), 10)
        return numA - numB
      })

      const solvedMap: Record<string, boolean> = {}
      solvedLogs.forEach((entry) => {
        const cid = entry?.challengeId
        const solved = !!entry?.solvedAt && String(entry.solvedAt).length > 0
        if (cid) solvedMap[cid] = solved
      })

      const progress: Record<string, string> = {}
      let firstActiveIndex = -1
      challenges.forEach((challenge, idx) => {
        const cid = challenge.challengeId || challenge.id
        const isSolved = solvedMap[cid] || false
        if (isSolved) progress[cid] = 'done'
        else if (firstActiveIndex === -1) { progress[cid] = 'active'; firstActiveIndex = idx }
        else progress[cid] = 'locked'
      })

      return res.status(200).json({ uid, progress, solved_logs: solvedLogs, firstActiveIndex, challenges: challenges.map(c => ({ id: c.id, challengeId: c.challengeId })) })
    } catch (e: any) {
      return res.status(401).json({ error: 'Unauthorized', details: e?.message || String(e) })
    }
  })
}) 

export const getUserCustom1Flags = functions.region('asia-south1').https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = context.auth.uid;
  const specificChallengeId = typeof data?.challengeId === 'string' && data.challengeId ? String(data.challengeId) : null;

  try {
    const results: Array<{ challengeId: string; flag: string }> = [];

    if (specificChallengeId) {
      const collectionName = `custom1challenge${String(specificChallengeId).replace('challenge', '')}`;
      const snap = await db.collection(collectionName)
        .where('userId', '==', uid)
        .where('challengeId', '==', specificChallengeId)
        .limit(1)
        .get();

      if (!snap.empty) {
        const d = snap.docs[0].data() as any;
        results.push({ challengeId: specificChallengeId, flag: d.flagData?.originalFlag });
      } else {
        // Optional: lazy-create if missing
        const userDoc = await db.collection('users').doc(uid).get();
        const delegateId = (userDoc.data() as any)?.delegateId || '';
        const flag = generateCustom1Flag(uid, specificChallengeId);
        const record = {
          userId: uid,
          delegateId,
          challengeId: specificChallengeId,
          flagData: { originalFlag: flag, encryptedFlag: encryptFlag(flag) },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isUsed: false,
        };
        await db.collection(collectionName).add(record);
        results.push({ challengeId: specificChallengeId, flag });
      }
    } else {
      // Return all isCustom1 challenge flags
      const challengesSnap = await db.collection('challenges')
        .where('isCustom1', '==', true)
        .get();

      for (const doc of challengesSnap.docs) {
        const c = doc.data() as any;
        const challengeId = c.challengeId || doc.id;
        const collectionName = `custom1challenge${String(challengeId).replace('challenge', '')}`;
        const snap = await db.collection(collectionName)
          .where('userId', '==', uid)
          .where('challengeId', '==', challengeId)
          .limit(1)
          .get();

        if (!snap.empty) {
          const d = snap.docs[0].data() as any;
          results.push({ challengeId, flag: d.flagData?.originalFlag });
        } else {
          // Optional lazy-create
          const userDoc = await db.collection('users').doc(uid).get();
          const delegateId = (userDoc.data() as any)?.delegateId || '';
          const flag = generateCustom1Flag(uid, challengeId);
          const record = {
            userId: uid,
            delegateId,
            challengeId,
            flagData: { originalFlag: flag, encryptedFlag: encryptFlag(flag) },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isUsed: false,
          };
          await db.collection(collectionName).add(record);
          results.push({ challengeId, flag });
        }
      }
    }

    return { success: true, flags: results };
  } catch (error) {
    console.error('[getUserCustom1Flags] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch custom1 flags');
  }
});

export const adminSubmitFlag = functions.region('asia-south1').https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
      const app = initAdmin()
      const db = app.firestore()

      const { userId, challengeId, flag, token } = req.body || {}
      if (!challengeId || !flag) return res.status(400).json({ error: 'Missing challengeId or flag' })

      let uid = userId as string | undefined
      if (token) {
        try {
          const decoded = await app.auth().verifyIdToken(token)
          uid = (decoded as any).uid
        } catch (e) {
          return res.status(401).json({ error: 'Invalid token' })
        }
      }

      // Check if this is a custom challenge first (for validation only)
      const challengeRefTop = db.collection('challenges').doc(challengeId)
      const challengeSnapTop = await challengeRefTop.get()
      const challengeDataTop = challengeSnapTop.exists ? challengeSnapTop.data() : {}
      const submitted = String(flag ?? '').trim()
      let isCorrect = false

      if ((challengeDataTop as any)?.isCustom && uid) {
        // Handle custom flag validation
        const collectionName = `customFlagChallenge${String(challengeId).replace('challenge', '')}`;
        const customFlagsSnap = await db.collection(collectionName)
          .where('userId', '==', uid)
          .where('challengeId', '==', challengeId)
          .limit(1)
          .get()
        if (!customFlagsSnap.empty) {
          const customFlagData = customFlagsSnap.docs[0].data()
          isCorrect = submitted === (customFlagData as any).flagData.originalFlag
          if (isCorrect) {
            await customFlagsSnap.docs[0].ref.update({ isUsed: true })
          }
        } else {
          return res.status(404).json({ success: false, message: 'Custom flag not found for this user.' })
        }
      } else if ((challengeDataTop as any)?.isCustom1 && uid) {
        // Handle custom1 (cookie-based) flag validation
        const collectionName = `custom1challenge${String(challengeId).replace('challenge', '')}`;
        const custom1Snap = await db.collection(collectionName)
          .where('userId', '==', uid)
          .where('challengeId', '==', challengeId)
          .limit(1)
          .get()
        if (!custom1Snap.empty) {
          const custom1Data = custom1Snap.docs[0].data()
          isCorrect = submitted === (custom1Data as any).flagData.originalFlag
          if (isCorrect) {
            await custom1Snap.docs[0].ref.update({ isUsed: true })
          }
        } else {
          return res.status(404).json({ success: false, message: 'Custom1 flag not found for this user.' })
        }
      } else if ((challengeDataTop as any)?.isCustom2 && uid) {
        // Handle custom2 (freezed leaderboard + sequence) flag validation
        const collectionName = `custom2challenge${String(challengeId).replace('challenge', '')}`;
        const custom2Snap = await db.collection(collectionName)
          .where('userId', '==', uid)
          .where('challengeId', '==', challengeId)
          .limit(1)
          .get();
        if (!custom2Snap.empty) {
          const custom2Data = custom2Snap.docs[0].data();
          isCorrect = submitted === (custom2Data as any).flagData.originalFlag;
          if (isCorrect) {
            await custom2Snap.docs[0].ref.update({ isUsed: true });
          }
        } else {
          return res.status(404).json({ success: false, message: 'Custom2 flag not found for this user.' });
        }



      } else {
        // Handle regular flag validation
        const candidates: string[] = Array.from(new Set([
          String(challengeId),
          String(challengeId).trim(),
          String(challengeId).replace(/\s+/g, ''),
          String(challengeId).toLowerCase(),
          String(challengeId).toLowerCase().replace(/\s+/g, ''),
        ]))
        let flagDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | null = null
        for (const cid of candidates) {
          const d = await db.collection('flags').doc(cid).get()
          if (d.exists) { flagDoc = d; break }
        }
        if (!flagDoc || !flagDoc.exists) return res.status(404).json({ success: false, message: 'Flag not found.' })

        const flagData = flagDoc.data() as any
        const storedHash = flagData?.flagHash || flagData?.hash
        const storedPlain = flagData?.flag
        if (storedHash) {
          const crypto = await import('crypto')
          if (String(storedHash).startsWith('$argon2')) {
            const argon2 = await import('argon2')
            try { isCorrect = await argon2.default.verify(String(storedHash), submitted) } catch { isCorrect = false }
          } else {
            const submittedHash = crypto.createHash('sha256').update(submitted).digest('hex')
            isCorrect = submittedHash === String(storedHash).trim().toLowerCase()
          }
        } else if (storedPlain) {
          isCorrect = submitted === String(storedPlain).trim()
        }
      }

      // Helper: load challenge scoring config inside transactions
      const loadChallengeConfig = async (tx: FirebaseFirestore.Transaction, cid: string) => {
        const cRef = db.collection('challenges').doc(cid)
        const cSnap = await tx.get(cRef)
        const cData = cSnap.exists ? cSnap.data() as any : {}
        const points = Number(cData?.points || cData?.positivePoints || 100)
        const free = Number(cData?.totalAttempts ?? 1000)   // free attempts
        const unlimited = free >= 1000                      // treat >=1000 as unlimited
        const penaltyPer = Number(cData?.penaltyPerExtraAttempt ?? 10)
        return { points, free, unlimited, penaltyPer }
      }

      if (isCorrect) {
        // Do NOT penalize the correct attempt itself; only prior wrong attempts
        let responsePenalty = 0
        let responseActualScore = 0

        if (uid) {
          const userRef = db.collection('users').doc(uid)
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(userRef)
            const data = (snap.exists ? snap.data() : {}) as any
            const logs: any[] = Array.isArray(data?.solved_logs) ? data.solved_logs : []
            const cid = challengeId
            const idx = logs.findIndex((e) => (e?.challengeId || '').toLowerCase().replace(/\s+/g,'') === String(cid).toLowerCase().replace(/\s+/g,''))
            const nowIso = new Date().toISOString()

            if (idx >= 0) {
              const entry = { ...logs[idx] }
              const attemptsBefore = Number(entry.attempts || 0)
              const attempts = attemptsBefore + 1

              if (!entry.solvedAt || entry.solvedAt === '') {
                const { points, free, unlimited, penaltyPer } = await loadChallengeConfig(tx, cid)
                const extraAttempts = unlimited ? 0 : Math.max(0, attemptsBefore - free) // exclude the correct attempt
                const penalty = extraAttempts * penaltyPer
                const prevActual = Number(entry.actualScore || 0)
                const actualScore = points - penalty

                logs[idx] = { ...entry, attempts, solvedAt: nowIso, positivePoints: points, penalty, actualScore }
                const delta = actualScore - prevActual
                tx.set(userRef, { totalScore: admin.firestore.FieldValue.increment(delta) }, { merge: true })

                responsePenalty = penalty
                responseActualScore = actualScore
              } else {
                // Already solved: just track attempts; do not change score or penalty
                logs[idx] = { ...entry, attempts }
              }
            } else {
              // First record for this challenge; attempts=1 includes this correct attempt
              const { points, free, unlimited, penaltyPer } = await loadChallengeConfig(tx, cid)
              const attemptsBefore = 0
              const attempts = 1
              const extraAttempts = unlimited ? 0 : Math.max(0, attemptsBefore - free)
              const penalty = extraAttempts * penaltyPer
              const actualScore = points - penalty

              logs.push({ challengeId: cid, attempts, solvedAt: nowIso, positivePoints: points, penalty, actualScore })
              tx.set(userRef, { totalScore: admin.firestore.FieldValue.increment(actualScore) }, { merge: true })

              responsePenalty = penalty
              responseActualScore = actualScore
            }

            tx.set(userRef, { solved_logs: logs }, { merge: true })
          })
        }

        return res.status(200).json({
          success: true,
          message: 'Correct! Next question unlocked.',
          penalty: responsePenalty,
          actualScore: responseActualScore
        })
      }

      // incorrect
      // For limited challenges (<1000), include attempts left and cumulative total penalty in response
      let freeAttemptsLeft: number | null = null
      let currentPenalty: number = 0

      // Check for cheating on incorrect submissions - if they submitted someone else's custom flag
      let cheatedUserIds: string[] = [];
      let currentUserCheated = false;
      if (uid) {
        cheatedUserIds = await checkForCheating(db, challengeId, submitted, uid);
        if (cheatedUserIds.length > 0) {
          console.log('[adminSubmitFlag] Cheating detected on incorrect submission:', { 
            challengeId, 
            submittedFlag: submitted, 
            currentUser: uid, 
            cheatedUsers: cheatedUserIds 
          });
          currentUserCheated = true;
        }
      }

      if (uid) {
        const userRef = db.collection('users').doc(uid)
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(userRef)
          const data = (snap.exists ? snap.data() : {}) as any
          const logs: any[] = Array.isArray(data?.solved_logs) ? data.solved_logs : []
          const cid = challengeId
          const idx = logs.findIndex((e) => (e?.challengeId || '').toLowerCase().replace(/\s+/g,'') === String(cid).toLowerCase().replace(/\s+/g,''))

          const { free, unlimited, penaltyPer } = await loadChallengeConfig(tx, cid)

          if (idx >= 0) {
            const entry = { ...logs[idx] }
            const attempts = Number(entry.attempts || 0) + 1

            if (!entry.solvedAt || entry.solvedAt === '') {
              // Count this wrong attempt in penalty
              const extraAttempts = unlimited ? 0 : Math.max(0, attempts - free)
              const penalty = extraAttempts * penaltyPer
              currentPenalty = penalty
              freeAttemptsLeft = unlimited ? null : Math.max(0, free - attempts)

              logs[idx] = { ...entry, attempts, penalty }
            } else {
              // Already solved: only track attempts; no further penalty after solve
              logs[idx] = { ...entry, attempts }
            }
          } else {
            const attempts = 1
            const extraAttempts = unlimited ? 0 : Math.max(0, attempts - free)
            const penalty = extraAttempts * penaltyPer
            currentPenalty = penalty
            freeAttemptsLeft = unlimited ? null : Math.max(0, free - attempts)

            logs.push({ challengeId: cid, attempts, solvedAt: '', actualScore: 0, penalty, positivePoints: 0 })
          }

          tx.set(userRef, { solved_logs: logs }, { merge: true })
        })
        
        // Mark current user as cheated if they submitted someone else's custom flag (outside transaction)
        if (currentUserCheated) {
          // Find and update the current user's custom flag record
          const collections = [
            `customFlagChallenge${String(challengeId).replace('challenge', '')}`,
            `custom1challenge${String(challengeId).replace('challenge', '')}`,
            `custom2challenge${String(challengeId).replace('challenge', '')}`
          ];
          
          for (const collectionName of collections) {
            const customFlagSnap = await db.collection(collectionName)
              .where('userId', '==', uid)
              .where('challengeId', '==', challengeId)
              .limit(1)
              .get();
            
            if (!customFlagSnap.empty) {
              await customFlagSnap.docs[0].ref.update({ hasCheated: true });
              break; // Found and updated, no need to check other collections
            }
          }
        }
      }

      const incorrectMsg = freeAttemptsLeft == null
        ? 'Incorrect flag.'
        : `Incorrect flag. Attempts left: ${freeAttemptsLeft}. Total penalty: ${currentPenalty}`

      return res.status(200).json({
        success: false,
        message: incorrectMsg,
        attemptsLeft: freeAttemptsLeft,
        freeAttemptsLeft,
        totalPenalty: freeAttemptsLeft == null ? null : currentPenalty
      })
    } catch (err: any) {
      console.error('adminSubmitFlag error', err)
      return res.status(500).json({ success: false, error: 'Server error', details: err?.message || String(err) })
    }
  })
})
// --- QR CODE GENERATION FUNCTIONS ---

// QR Code generation using qrcode-generator with quadrant swap/rotate (no trapezoid warp)
async function generateDistortedQRCode(flag: string): Promise<{ distortedQR: string; distortedQRType: 'svg' }> {
  try {
    const svgSize = 400;
    const marginModules = 4; // quiet zone in modules
    const ecc = 'H';

    const qrcode = require('qrcode-generator');
    const qr = qrcode(0, ecc);
    qr.addData(flag);
    qr.make();
    const moduleCount = qr.getModuleCount();

    const totalModules = moduleCount + marginModules * 2;
    const moduleSize = svgSize / totalModules;
    const quietZonePx = marginModules * moduleSize;
    const half = svgSize / 2;

    // Buckets for quadrants: 1=TL, 2=TR, 3=BL, 4=BR
    const q1: string[] = [];
    const q2: string[] = [];
    const q3: string[] = [];
    const q4: string[] = [];

    // Helper to classify by center point
    const bucket = (el: string, cx: number, cy: number) => {
      if (cx < half && cy < half) q1.push(el);
      else if (cx >= half && cy < half) q2.push(el);
      else if (cx < half && cy >= half) q3.push(el);
      else q4.push(el);
    };

    // 1) Draw inverted modules (white on black), classified into quadrants
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = quietZonePx + c * moduleSize;
          const y = quietZonePx + r * moduleSize;
          const el = `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#fff" />`;
          bucket(el, x + moduleSize / 2, y + moduleSize / 2);
        }
      }
    }

    // 2) Remove finder patterns by covering with black rects, also bucketed
    const finderSizeModules = 7;
    const finderPx = finderSizeModules * moduleSize;
    const positions: Array<[number, number]> = [
      [0, 0],
      [moduleCount - finderSizeModules, 0],
      [0, moduleCount - finderSizeModules],
    ];
    positions.forEach(([cxModules, cyModules]) => {
      const px = quietZonePx + cxModules * moduleSize;
      const py = quietZonePx + cyModules * moduleSize;
      const el = `<rect x="${px}" y="${py}" width="${finderPx}" height="${finderPx}" fill="#000"/>`;
      bucket(el, px + finderPx / 2, py + finderPx / 2);
    });

    // 3) Light noise overlay, bucketed by center
    for (let i = 0; i < 15; i++) {
      const nx = Math.random() * svgSize;
      const ny = Math.random() * svgSize;
      const r = Math.random() * (moduleSize * 2);
      const el = `<circle cx="${nx}" cy="${ny}" r="${r}" fill="rgba(255,255,255,0.08)"/>`;
      bucket(el, nx, ny);
    }

    // 4) Assemble final SVG with background black and quadrant groups
    const svgParts: string[] = [];
    svgParts.push(`<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`);
    svgParts.push(`<rect width="100%" height="100%" fill="#000"/>`);

    // Swap positions of 1 and 4 and rotate both 180° around center
    svgParts.push(`<g id="Q4_to_TL" transform="rotate(180, ${half}, ${half})">${q4.join('\n')}</g>`);
    svgParts.push(`<g id="Q2_stay">${q2.join('\n')}</g>`);
    svgParts.push(`<g id="Q3_stay">${q3.join('\n')}</g>`);
    svgParts.push(`<g id="Q1_to_BR" transform="rotate(180, ${half}, ${half})">${q1.join('\n')}</g>`);

    svgParts.push(`</svg>`);
    const svg = svgParts.join('\n');
    const base64 = Buffer.from(svg).toString('base64');
    return { distortedQR: base64, distortedQRType: 'svg' };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new functions.https.HttpsError('internal', 'QR code generation failed');
  }
}

// Generate custom flag for user-challenge combination
function generateCustomFlag(userId: string, challengeId: string): string {
  const crypto = require('crypto');
  const seed = `${userId}_${challengeId}_qr_puzzle`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Take first 12 characters for a shorter flag
  const flagContent = hash.substring(0, 12);
  return `cryptic{${flagContent}}`;
}

// Generate custom1 (cookie-based) flag for user-challenge combination
function generateCustom1Flag(userId: string, challengeId: string): string {
  const crypto = require('crypto');
  const seed = `${userId}_${challengeId}_cookie_puzzle`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const flagContent = hash.substring(0, 12);
  return `cryptic{${flagContent}}`;
} 

// Generate custom2 (freezed leaderboard) flag for user-challenge combination
function generateCustom2Flag(userId: string, challengeId: string): string {
  const crypto = require('crypto');
  const seed = `${userId}_${challengeId}_freeze_puzzle`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  const flagContent = hash.substring(0, 12);
  return `cryptic{${flagContent}}`;
}

// Encrypt flag for storage
function encryptFlag(flag: string): string {
  const crypto = require('crypto');
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const cipher = crypto.createCipher('aes192', key);
  let encrypted = cipher.update(flag, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Check for cheating: see if submitted flag matches another user's flag for the same challenge
async function checkForCheating(db: admin.firestore.Firestore, challengeId: string, submittedFlag: string, currentUserId: string): Promise<string[]> {
  const cheatedUserIds: string[] = [];
  
  try {
    // Check all custom flag collections for this challenge
    const collections = [
      `customFlagChallenge${String(challengeId).replace('challenge', '')}`,
      `custom1challenge${String(challengeId).replace('challenge', '')}`,
      `custom2challenge${String(challengeId).replace('challenge', '')}`
    ];
    
    for (const collectionName of collections) {
      const snap = await db.collection(collectionName)
        .where('challengeId', '==', challengeId)
        .get();
      
      for (const doc of snap.docs) {
        const data = doc.data() as any;
        const storedFlag = data?.flagData?.originalFlag;
        const userId = data?.userId;
        
        // If flag matches another user's flag and it's not the current user
        if (storedFlag === submittedFlag && userId !== currentUserId) {
          cheatedUserIds.push(userId);
          // Mark this user as cheated
          await doc.ref.update({ hasCheated: true });
        }
      }
    }
  } catch (error) {
    console.error('[checkForCheating] Error:', error);
  }
  
  return cheatedUserIds;
}

// Create custom flags for a user
async function createCustomFlagsForUser(userId: string, delegateId: string) {
  try {
    console.log('[createCustomFlagsForUser] Fetching isCustom challenges for user', { userId, delegateId });
    const challengesSnap = await db.collection('challenges')
      .where('isCustom', '==', true)
      .get();
    console.log('[createCustomFlagsForUser] Challenges found', { count: challengesSnap.size });
    
    const customFlagPromises: Promise<any>[] = [];
    
    for (const doc of challengesSnap.docs) {
      const challengeData = doc.data();
      const challengeId = (challengeData as any).challengeId || doc.id;
      console.log('[createCustomFlagsForUser] Processing challenge', { challengeId, docId: doc.id });
      
      const customFlag = generateCustomFlag(userId, challengeId);
      const qrData = await generateDistortedQRCode(customFlag);
      
      const customFlagDoc = {
        userId: userId,
        delegateId: delegateId,
        challengeId: challengeId,
        flagData: {
          originalFlag: customFlag,
          encryptedFlag: encryptFlag(customFlag),
          qrImages: qrData
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isUsed: false,
        hasCheated: false
      };
      
      const collectionName = `customFlagChallenge${String(challengeId).replace('challenge', '')}`;
      console.log('[createCustomFlagsForUser] Writing custom flag doc', { collectionName, userId, challengeId });
      customFlagPromises.push(
        db.collection(collectionName).add(customFlagDoc)
      );
    }
    
    await Promise.all(customFlagPromises);
    console.log('[createCustomFlagsForUser] Created custom flags', { created: customFlagPromises.length, userId });
  } catch (error) {
    console.error('[createCustomFlagsForUser] Error creating custom flags:', error);
    // Don't throw error to prevent account creation failure
  }
} 

// Create cookie-based custom1 flags for a user
async function createCustom1FlagsForUser(userId: string, delegateId: string) {
  try {
    console.log('[createCustom1FlagsForUser] Fetching isCustom1 challenges for user', { userId, delegateId });
    const challengesSnap = await db.collection('challenges')
      .where('isCustom1', '==', true)
      .get();

    console.log('[createCustom1FlagsForUser] Challenges found', { count: challengesSnap.size });
    const writes: Promise<any>[] = [];

    for (const doc of challengesSnap.docs) {
      const data = doc.data() as any;
      const challengeId = data.challengeId || doc.id;
      console.log('[createCustom1FlagsForUser] Processing challenge', { challengeId, docId: doc.id });

      const customFlag = generateCustom1Flag(userId, challengeId);

      const record = {
        userId,
        delegateId,
        challengeId,
        flagData: {
          originalFlag: customFlag,
          encryptedFlag: encryptFlag(customFlag),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isUsed: false,
        hasCheated: false,
      };

      // Collection naming for cookies, e.g. custom1challenge5
      const collectionName = `custom1challenge${String(challengeId).replace('challenge', '')}`;
      writes.push(db.collection(collectionName).add(record));
    }

    await Promise.all(writes);
    console.log('[createCustom1FlagsForUser] Created custom1 flags', { created: writes.length, userId });
  } catch (error) {
    console.error('[createCustom1FlagsForUser] Error creating custom1 flags:', error);
  }
}



// Get user's custom QR codes
export const getUserQRCodes = functions.region('asia-south1').https.onCall(async (data: {challengeId: string}, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = context.auth.uid;
  const {challengeId} = data;

  if (!challengeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Challenge ID is required');
  }

  try {
    console.log('[getUserQRCodes] Fetching QR for user', { uid, challengeId });
    const collectionName = `customFlagChallenge${String(challengeId).replace('challenge', '')}`;
    const customFlagsSnap = await db.collection(collectionName)
      .where('userId', '==', uid)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();

    if (customFlagsSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'No custom flag found for this challenge');
    }

    const customFlagData = customFlagsSnap.docs[0].data();
    console.log('[getUserQRCodes] Found custom flag doc', { docId: customFlagsSnap.docs[0].id, collectionName });
    
    return {
      distortedQR: (customFlagData as any).flagData.qrImages.distortedQR,
      type: (customFlagData as any).flagData.qrImages.distortedQRType || 'svg',
      challengeId: challengeId
    };
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch QR codes');
  }
}); 

// Custom2: initialize frozen leaderboard and persist 10-digit sequence for the user
export const getUserCustom2Freeze = functions.region('asia-south1').https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = context.auth.uid;
  const challengeId = typeof data?.challengeId === 'string' && data.challengeId ? String(data.challengeId) : null;
  if (!challengeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Challenge ID is required');
  }

  try {
    const collectionName = `custom2challenge${String(challengeId).replace('challenge', '')}`;

    // If already frozen for this user, do not return DB snapshot (we only store minimal top10 in DB)
    const existingSnap = await db.collection(collectionName)
      .where('userId', '==', uid)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return { success: true, challengeId, snapshot: null };
    }

    // Build full leaderboard snapshot (top 50)
    const fullSnap = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(50)
      .get();
    const fullLeaderboard: Array<{ rank: number; uid: string; username: string; totalScore: number; solvedCount: number }> = [];
    {
      let r = 1;
      fullSnap.forEach((doc) => {
        const d = doc.data() as any;
        const username = d.username || d.name || 'Anonymous';
        const totalScore = Number(d.totalScore ?? 0);
        const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
        const solvedCount = solvedLogs.filter((e) => Number(e?.actualScore || 0) > 0).length;
        fullLeaderboard.push({ rank: r++, uid: doc.id, username, totalScore, solvedCount });
      });
    }

    // Build top-10 progression history
    const top10Snap = await db.collection('users')
      .orderBy('totalScore', 'desc')
      .limit(10)
      .get();
    const topTenHistory: Array<{ rank: number; uid: string; username: string; totalScore: number; pointsOverTime: { time: number; score: number }[] }> = [];
    {
      let r = 1;
      for (const doc of top10Snap.docs) {
        const d = doc.data() as any;
        const username = d.username || d.name || 'Anonymous';
        const totalScore = Number(d.totalScore ?? 0);
        const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
        const startTime = d.createdAt?.toMillis?.() || Date.now();
        const pointsOverTime: { time: number; score: number }[] = [];
        let cumulativeScore = 0;

        pointsOverTime.push({ time: startTime, score: 0 });
        const sortedSolved = solvedLogs
          .filter((e) => e?.solvedAt && String(e.solvedAt).length > 0 && Number(e?.actualScore || 0) > 0)
          .sort((a, b) => new Date(a.solvedAt).getTime() - new Date(b.solvedAt).getTime());
        sortedSolved.forEach((log) => {
          cumulativeScore += Number(log.actualScore || 0);
          const solveTime = new Date(log.solvedAt).getTime();
          if (solveTime > pointsOverTime[pointsOverTime.length - 1].time) {
            pointsOverTime.push({ time: solveTime, score: cumulativeScore });
          } else {
            pointsOverTime[pointsOverTime.length - 1].score = cumulativeScore;
          }
        });

        topTenHistory.push({ rank: r++, uid: doc.id, username, totalScore, pointsOverTime });
      }
    }

    // 10-digit sequence based on top-10 usernames: even letter count => '0', odd => '1'
    const toBit = (name: string) => {
      const lettersOnly = String(name || '').replace(/[^A-Za-z]/g, '');
      return (lettersOnly.length % 2 === 0) ? '0' : '1';
    };
    const sequence = topTenHistory.map((p) => toBit(p.username)).join('');

    // Assemble record and persist
    const userDoc = await db.collection('users').doc(uid).get();
    const delegateId = (userDoc.data() as any)?.delegateId || '';
    const flag = generateCustom2Flag(uid, challengeId);

    const snapshot = {
      timestamp: Date.now(),
      fullLeaderboard,
      topTenHistory,
    };

    // Minimal top-10 to persist in DB (avoid storing full snapshot)
    const uidToSolvedCount: Record<string, number> = {};
    for (const entry of fullLeaderboard) {
      uidToSolvedCount[entry.uid] = entry.solvedCount;
    }
    const top10Minimal = topTenHistory.map((p) => ({
      rank: p.rank,
      uid: p.uid,
      username: p.username,
      totalScore: p.totalScore,
      solvedCount: uidToSolvedCount[p.uid] ?? 0,
    }));

    const record = {
      userId: uid,
      delegateId,
      challengeId,
      flagData: { originalFlag: flag, encryptedFlag: encryptFlag(flag) },
      frozen: {
        sequence,
        top10: top10Minimal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isUsed: false,
      hasCheated: false,
    };

    await db.collection(collectionName).add(record);

    // Return full snapshot to the client for local storage, but only minimal data is persisted in DB
    return { success: true, challengeId, snapshot };
  } catch (error) {
    console.error('[getUserCustom2Freeze] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initialize or fetch custom2 freeze');
  }
}); 

// Custom2: validate 10-digit sequence and reveal user's custom2 flag
export const getCustom2FlagFromSequence = functions.region('asia-south1').https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const uid = context.auth.uid;
  const challengeId = typeof data?.challengeId === 'string' && data.challengeId ? String(data.challengeId) : null;
  const sequenceInput = typeof data?.sequence === 'string' ? String(data.sequence).trim() : '';
  if (!challengeId || !sequenceInput) {
    throw new functions.https.HttpsError('invalid-argument', 'challengeId and sequence are required');
  }

  try {
    const collectionName = `custom2challenge${String(challengeId).replace('challenge', '')}`;
    let snap = await db.collection(collectionName)
      .where('userId', '==', uid)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();

    // If missing, lazily create a freeze (persist only minimal top-10)
    if (snap.empty) {
      // Reuse freeze init logic (inline for clarity)
      const fullSnap = await db.collection('users')
        .orderBy('totalScore', 'desc')
        .limit(50)
        .get();
      const fullLeaderboard: Array<{ rank: number; uid: string; username: string; totalScore: number; solvedCount: number }> = [];
      {
        let r = 1;
        fullSnap.forEach((doc) => {
          const d = doc.data() as any;
          const username = d.username || d.name || 'Anonymous';
          const totalScore = Number(d.totalScore ?? 0);
          const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
          const solvedCount = solvedLogs.filter((e) => Number(e?.actualScore || 0) > 0).length;
          fullLeaderboard.push({ rank: r++, uid: doc.id, username, totalScore, solvedCount });
        });
      }

      const top10Snap = await db.collection('users')
        .orderBy('totalScore', 'desc')
        .limit(10)
        .get();
      const topTenHistory: Array<{ rank: number; uid: string; username: string; totalScore: number; pointsOverTime: { time: number; score: number }[] }> = [];
      {
        let r = 1;
        for (const doc of top10Snap.docs) {
          const d = doc.data() as any;
          const username = d.username || d.name || 'Anonymous';
          const totalScore = Number(d.totalScore ?? 0);
          const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
          const startTime = d.createdAt?.toMillis?.() || Date.now();
          const pointsOverTime: { time: number; score: number }[] = [];
          let cumulativeScore = 0;
          pointsOverTime.push({ time: startTime, score: 0 });
          const sortedSolved = solvedLogs
            .filter((e) => e?.solvedAt && String(e.solvedAt).length > 0 && Number(e?.actualScore || 0) > 0)
            .sort((a, b) => new Date(a.solvedAt).getTime() - new Date(b.solvedAt).getTime());
          sortedSolved.forEach((log) => {
            cumulativeScore += Number(log.actualScore || 0);
            const solveTime = new Date(log.solvedAt).getTime();
            if (solveTime > pointsOverTime[pointsOverTime.length - 1].time) {
              pointsOverTime.push({ time: solveTime, score: cumulativeScore });
            } else {
              pointsOverTime[pointsOverTime.length - 1].score = cumulativeScore;
            }
          });
          topTenHistory.push({ rank: r++, uid: doc.id, username, totalScore, pointsOverTime });
        }
      }
      const toBit = (name: string) => {
        const lettersOnly = String(name || '').replace(/[^A-Za-z]/g, '');
        return (lettersOnly.length % 2 === 0) ? '0' : '1';
      };
      const sequence = topTenHistory.map((p) => toBit(p.username)).join('');

      const userDoc = await db.collection('users').doc(uid).get();
      const delegateId = (userDoc.data() as any)?.delegateId || '';
      const flag = generateCustom2Flag(uid, challengeId);
      // Minimal top-10 to persist in DB
      const uidToSolvedCount: Record<string, number> = {};
      for (const entry of fullLeaderboard) {
        uidToSolvedCount[entry.uid] = entry.solvedCount;
      }
      const top10Minimal = topTenHistory.map((p) => ({
        rank: p.rank,
        uid: p.uid,
        username: p.username,
        totalScore: p.totalScore,
        solvedCount: uidToSolvedCount[p.uid] ?? 0,
      }));

      const record = {
        userId: uid,
        delegateId,
        challengeId,
        flagData: { originalFlag: flag, encryptedFlag: encryptFlag(flag) },
        frozen: {
          sequence,
          top10: top10Minimal,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isUsed: false,
        hasCheated: false,
      };
      await db.collection(collectionName).add(record);
      snap = await db.collection(collectionName)
        .where('userId', '==', uid)
        .where('challengeId', '==', challengeId)
        .limit(1)
        .get();
    }

    const d = snap.docs[0].data() as any;
    const expected = String(d?.frozen?.sequence || '');
    if (sequenceInput === expected) {
      return { success: true, flag: d?.flagData?.originalFlag };
    }
    return { success: false, message: 'Incorrect sequence' };
  } catch (error) {
    console.error('[getCustom2FlagFromSequence] Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to validate sequence');
  }
});

//
// Leaderboards
//
export const leaderboard = functions.region("asia-south1").https.onCall(async () => {
  const limit = 50;
  const usersSnap = await db.collection('users')
    .orderBy('totalScore', 'desc')
    .limit(limit)
    .get();

  const results: Array<{ rank: number; uid: string; username: string; totalScore: number; solvedCount: number; delegateId?: string }>= [];
  let rank = 1;
  usersSnap.forEach((doc) => {
    const d = doc.data() as any;
    const username = d.username || d.name || 'Anonymous';
    const totalScore = Number(d.totalScore ?? 0);
    const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
    const solvedCount = solvedLogs.filter((e) => Number(e?.actualScore || 0) > 0).length;
    results.push({ rank: rank++, uid: doc.id, username, totalScore, solvedCount, delegateId: d.delegateId });
  });

  return { success: true, leaderboard: results };
});

export const getLeaderboardWithHistory = functions.region("asia-south1").https.onCall(async (data, context) => {
    const limit = 10; // We only need the top 10 for the chart

    // This query is efficient: it only fetches the top 10 users by score.
    const usersSnap = await db.collection('users')
        .orderBy('totalScore', 'desc')
        .limit(limit)
        .get();

    const results: Array<{
        rank: number;
        uid: string;
        username: string;
        totalScore: number;
        // The `time` property will now be a real timestamp in milliseconds
        pointsOverTime: { time: number; score: number }[];
    }> = [];

    let rank = 1;
    for (const doc of usersSnap.docs) {
        const d = doc.data() as any;
        const username = d.username || d.name || 'Anonymous';
        const totalScore = Number(d.totalScore ?? 0);
        const solvedLogs: any[] = Array.isArray(d?.solved_logs) ? d.solved_logs : [];
        
        // Get the user's creation time as the "time zero" for their graph
        const startTime = d.createdAt?.toMillis() || Date.now();

        const pointsOverTime: { time: number; score: number }[] = [];
        let cumulativeScore = 0;

        // Add a starting point in time for the chart
        pointsOverTime.push({ time: startTime, score: 0 });

        // Filter for solved challenges and sort them by when they were solved
        const sortedSolved = solvedLogs
            .filter((e) => e?.solvedAt && String(e.solvedAt).length > 0 && Number(e?.actualScore || 0) > 0)
            .sort((a, b) => new Date(a.solvedAt).getTime() - new Date(b.solvedAt).getTime());

        // Create a time-series of score accumulation
        sortedSolved.forEach((log) => {
            cumulativeScore += Number(log.actualScore || 0);
            const solveTime = new Date(log.solvedAt).getTime();
            
            // Only add point if time has passed, to avoid vertical lines on chart
            if (solveTime > pointsOverTime[pointsOverTime.length - 1].time) {
                 pointsOverTime.push({ time: solveTime, score: cumulativeScore });
            } else {
                // If two solves happened at the exact same millisecond, just update the score
                pointsOverTime[pointsOverTime.length - 1].score = cumulativeScore;
            }
        });

        results.push({
            rank: rank++,
            uid: doc.id,
            username,
            totalScore,
            pointsOverTime,
        });
    }

    return { success: true, leaderboard: results };
});