import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

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
export const verifyDelegate = functions.https.onCall(async (data: VerifyDelegatePayload, _context: functions.https.CallableContext) => {
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
export const createAccount = functions.https.onCall(async (data: CreateAccountPayload, _context: functions.https.CallableContext) => {
  const {delegateId, email, password, name, phone} = data;
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Write to the 'users' collection with the schema your profile page expects
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      delegateId,
      username: name, // Use 'username' to match the schema
      email,
      phone,
      totalScore: 0, // Use 'totalScore' to match the schema
      solved_logs: [],
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
export const getUserProfile = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
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

