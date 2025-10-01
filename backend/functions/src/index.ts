import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import corsLib from 'cors';

const cors = corsLib({ origin: true });

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


// --- TYPE DEFINITIONS ---
// Define the shape of data for clarity and type safety

// Structure of a record in your delegates.csv file
interface DelegateRecord {
  delegateId: string;
  phone: string;
}

// Structure of the data payload sent from the frontend for verification
interface VerifyDelegatePayload {
  delegateId: string;
  phoneNumber: string;
}

// Structure of the data payload for account creation
interface CreateAccountPayload {
  delegateId: string;
  email: string;
  password: string;
  name: string;
  phone: string;
}

// ... verifyDelegate and createAccount functions are unchanged ...
/**
 * 1. VERIFY DELEGATE
 * Reads the local delegates.csv file to find a matching delegate, then
 * checks Firestore to ensure they have not already registered.
 */
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
      name: "Verified Delegate", // You can add a 'name' column to your CSV to send back a real name
      phone: foundDelegate.phone,
      delegateId: foundDelegate.delegateId,
    },
  };
});


/**
 * 2. CREATE ACCOUNT (Updated)
 * Creates a user in Firebase Auth and a corresponding profile in Firestore,
 * using the correct schema with 'username' and 'totalScore'.
 */
export const createAccount = functions.region('asia-south1').https.onCall(async (data: CreateAccountPayload, _context: functions.https.CallableContext) => {
  const {delegateId, email, password, name, phone} = data;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Build a solved_logs scaffold with 25 entries so mission logic has a predictable shape
    const solved_logs: any[] = [];
    for (let i = 1; i <= 25; i++) {
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
      username: name, // Use 'username' to match the schema
      email,
      phone,
      totalScore: 0, // Use 'totalScore' to match the schema
      solved_logs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add creation timestamp
      optionalField: "", // Add optional field from schema
    });
    return {success: true, uid: userRecord.uid};
  } catch (error: any) {
    if (error.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError(
          "already-exists",
          "This email address is already in use.",
      );
    }
    throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred during account creation.",
    );
  }
});


/**
 * 3. GET USER PROFILE (Updated with Fallbacks)
 * Securely fetches the profile for the authenticated user and handles both
 * old and new data schemas gracefully.
 */
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
  const solvedLogs: {actualScore: number}[] = userData.solved_logs || [];
  const solvedQuestionsCount = solvedLogs
      .filter((log) => log.actualScore > 0).length;

  // Map your new schema fields with fallbacks for old data
  return {
    success: true,
    profile: {
      // Use 'username' if it exists, otherwise fall back to 'name'
      name: userData.username || userData.name || "N/A",
      email: userData.email,
      delegateId: userData.delegateId,
      phone: userData.phone,
      // Use 'totalScore' if it exists, otherwise fall back to 'totalPoints', then to 0
      points: userData.totalScore ?? userData.totalPoints ?? 0,
      solvedQuestions: solvedQuestionsCount,
      unsolvedQuestions: solvedLogs.length - solvedQuestionsCount,
    },
  };
});

// --- Missions progress / admin submit handlers (adapted from techtatva-site) ---
// saveProfile removed per user request — createAccount now writes the solved_logs scaffold at account creation.

export const missionsProgress = functions.region('asia-south1').https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const app = initAdmin()
      const db = app.firestore()
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

      // Find flag doc
      const candidates: string[] = Array.from(new Set([
        String(challengeId),
        String(challengeId).trim(),
        String(challengeId).replace(/\s+/g, ''),
        String(challengeId).toLowerCase(),
        String(challengeId).toLowerCase().replace(/\s+/g, ''),
      ]))
      let flagDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | null = null
      let matchedId: string | null = null
      for (const cid of candidates) {
        const d = await db.collection('flags').doc(cid).get()
        if (d.exists) { flagDoc = d; matchedId = cid; break }
      }
      if (!flagDoc || !flagDoc.exists) return res.status(404).json({ success: false, message: 'Flag not found.' })

      const flagData = flagDoc.data() as any
      const submitted = String(flag ?? '').trim()
      let isCorrect = false
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

      if (isCorrect) {
        if (uid) {
          const userRef = db.collection('users').doc(uid)
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(userRef)
            const data = (snap.exists ? snap.data() : {}) as any
            const logs: any[] = Array.isArray(data?.solved_logs) ? data.solved_logs : []
            const cid = matchedId || challengeId
            const index = logs.findIndex((e) => (e?.challengeId || '').toLowerCase().replace(/\s+/g,'') === String(cid).toLowerCase().replace(/\s+/g,''))
            const nowIso = new Date().toISOString()
            if (index >= 0) {
              const entry = { ...logs[index] }
              const attempts = Number(entry.attempts || 0) + 1
              if (!entry.solvedAt || entry.solvedAt === '') {
                const challengeRef = db.collection('challenges').doc(cid)
                const challengeSnap = await tx.get(challengeRef)
                const challengeData = challengeSnap.exists ? challengeSnap.data() : {}
                const points = Number((challengeData as any)?.points || (challengeData as any)?.positivePoints || 100)
                logs[index] = { ...entry, attempts, solvedAt: nowIso, actualScore: points, positivePoints: points }
              } else {
                logs[index] = { ...entry, attempts }
              }
            } else {
              const challengeRef = db.collection('challenges').doc(cid)
              const challengeSnap = await tx.get(challengeRef)
              const challengeData = challengeSnap.exists ? challengeSnap.data() : {}
              const points = Number((challengeData as any)?.points || (challengeData as any)?.positivePoints || 100)
              logs.push({ challengeId: cid, attempts: 1, solvedAt: nowIso, actualScore: points, penalty: 0, positivePoints: points })
            }
            tx.set(userRef, { solved_logs: logs }, { merge: true })
          })
        }
        return res.status(200).json({ success: true, message: 'Correct! Next question unlocked.' })
      }

      // incorrect
      if (uid) {
        const userRef = db.collection('users').doc(uid)
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(userRef)
          const data = (snap.exists ? snap.data() : {}) as any
          const logs: any[] = Array.isArray(data?.solved_logs) ? data.solved_logs : []
          const cid = matchedId || challengeId
          const index = logs.findIndex((e) => (e?.challengeId || '').toLowerCase().replace(/\s+/g,'') === String(cid).toLowerCase().replace(/\s+/g,''))
          if (index >= 0) {
            const entry = { ...logs[index] }
            const attempts = Number(entry.attempts || 0) + 1
            logs[index] = { ...entry, attempts }
          } else {
            logs.push({ challengeId: cid, attempts: 1, solvedAt: '', actualScore: 0, penalty: 0, positivePoints: 0 })
          }
          tx.set(userRef, { solved_logs: logs }, { merge: true })
        })
      }
      return res.status(200).json({ success: false, message: 'Incorrect flag.' })
    } catch (err: any) {
      console.error('adminSubmitFlag error', err)
      return res.status(500).json({ success: false, error: 'Server error', details: err?.message || String(err) })
    }
  })
})

