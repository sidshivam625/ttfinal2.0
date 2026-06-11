# TechTatva CTF & Treasure Hunt Platform (v2.0)

A secure, gamified CTF (Capture The Flag) / Treasure Hunt web application built for **TechTatva 2025**. This platform features dynamic, user-specific custom challenges, a real-time leaderboard, and automated flag verification using Firebase Services and a Next.js frontend.

---

## 🚀 Key Features

* **Dynamic Custom Puzzles**: Unique flags and distorted QR code challenges generated per-user based on their `userId` and `challengeId`. Prevents flag-sharing/cheating.
* **QR Reconstruction Puzzles**: Automatic generation and distortion of QR codes (removing top finder patterns and applying horizontal stretch) that players must reconstruct and scan to solve.
* **Real-time Leaderboard**: Instant rank calculations with tie-breaker logic (ranking higher score first, with ties resolved by whoever solved their last score-increasing challenge earliest). Includes administrative flags to hide specific players.
* **Robust Verification**: Secure verification of delegates against an offline CSV database (`delegates.csv`) before letting them register.
* **Firebase Cloud Functions**: Serverless APIs hosted in the `asia-south1` region for accounts registration, checking username availability, profile retrieval, rankings, and flag verification.

---

## 🛠️ Technology Stack

* **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React 19, TypeScript, TailwindCSS v4, Lucide Icons, Chart.js / React-Chartjs-2.
* **Backend**: Firebase Cloud Functions (v1, Node 18, TypeScript), Firebase Admin SDK.
* **Database & Auth**: Firebase Firestore & Firebase Authentication.
* **Testing & Tools**: Firebase Local Emulator Suite.

---

## 📂 Project Structure

```text
ttfinal2.0/
├── backend/
│   ├── functions/             # Firebase Cloud Functions (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts       # Central API endpoints (verifyDelegate, createAccount, adminSubmitFlag, etc.)
│   │   │   ├── data/
│   │   │   │   └── delegates.csv # Database of valid delegate IDs and phone numbers for verification
│   │   │   └── generateDistortedQRCode.js # QR creation, distortion, and canvas editing logic
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── firebase.json          # Firebase Emulator & Deploy configuration
│   └── .firebaserc            # Firebase project targets mapping
│
├── ttfrontend/                # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── enlist/        # Delegate identity verification and signup page
│   │   │   ├── missions/      # Mission board showing locked/active/done challenges & flag submit form
│   │   │   ├── profile/       # User profile details, solved counts, and global rank
│   │   │   ├── rankings/      # Live global leaderboard
│   │   │   ├── protocols/     # Special challenge/puzzle-specific instructional overlays
│   │   │   ├── globals.css    # Tailwind CSS styling configuration
│   │   │   └── page.tsx       # Landing page / Entrance portal
│   │   └── utils/             # Firebase client config & frontend API callers
│   ├── package.json
│   └── tsconfig.json
│
└── test_custom_flags.md       # Step-by-step testing guide for custom QR code reconstruction
```

---

## ⚙️ Local Setup & Development

### 1. Prerequisites
Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or v20 recommended)
* [Firebase CLI](https://firebase.google.com/docs/cli) (`npm install -g firebase-tools`)

---

### 2. Backend & Emulator Setup

Navigate to the `backend/functions` directory:
```bash
cd backend/functions
npm ci
```

To run the Firebase Emulator locally:
```bash
# Build functions and start local emulator
npm run serve
```
This will start Firestore, Auth, and Functions emulators on their default ports.

---

### 3. Frontend Setup

Navigate to the `ttfrontend` directory:
```bash
cd ttfrontend
npm install
```

Create a `.env` or `.env.local` file inside `ttfrontend/` containing your Firebase Web Configuration keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Run the development server with Turbopack:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🧪 Testing Custom QR Puzzles

A walkthrough is available in [test_custom_flags.md](file:///c:/Users/skmis/Desktop/techtatva/ttfinal2.0/test_custom_flags.md) which lists sample users:
1. Register using a sample Delegate ID (e.g., `CF2025-ALPHA-7`) and matching Phone Number (`+919356884366`).
2. Solve challenges sequentially to unlock Challenge 5.
3. Download the corrupted QR code and pattern fragment from the active mission page.
4. Repair the QR code (copying the pattern fragment to the missing corners) and scan it to obtain your user-unique flag.
5. Submit the flag to unlock the next mission.

---

## 🚢 Deployment

### Deploy Backend Functions
Ensure you are logged in and targeting your active Firebase Project:
```bash
firebase login
firebase use <YOUR_PROJECT_ID>

# Build & Deploy
cd backend/functions
npm run build
npm run deploy
```

### Deploy Frontend
To build and export the Next.js optimized production build:
```bash
cd ttfrontend
npm run build
npm run start
```
The frontend can be hosted on Vercel, Firebase Hosting, or any modern cloud provider.


## Built By

**Vishal Kumar** - [github.com/Vishy-MK](https://github.com/Vishy-MK)
**Siddhant Shivam** - [github.com/sidshivam625](https://github.com/sidshivam625)

Project built for TechTatva 2025, Manipal Institute of Technology.
