# Cryptic Finds — TechTatva CTF Platform

> Capture The Flag competition platform built for **TechTatva 2025**, Manipal Institute of Technology's annual technical festival. Served **500+ participants** across multiple challenge categories with zero integrity violations reported.

**[Live Platform](https://cryptic-finds.vercel.app/)**

---

## Overview

Cryptic Finds is a full-stack CTF (Capture The Flag) platform designed for large-scale competitive use. It handles concurrent participant sessions, real-time leaderboard updates, and multi-category challenge delivery — all with security and anti-cheat mechanisms built in from the ground up.

---

## Features

- **Secure Flag Validation** — SHA-256 hashed flags with server-side verification; flags never exposed client-side
- **Real-Time Leaderboard** — Sub-second updates using Firebase Firestore listeners across all active sessions
- **Rate Limiting** — Per-user request throttling to prevent brute-force flag submission
- **Session Isolation** — Per-user session management ensuring no cross-contamination between participants
- **Anti-Cheat Mechanisms** — <!-- Describe your specific anti-cheat approach e.g. submission anomaly detection, attempt logging -->
- **Multi-Category Challenges** — Cryptography, Steganography, and OSINT challenge sets with custom problem design
- **<!-- Add any other feature e.g. admin dashboard, hint system, scoreboard freeze -->**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | <!-- e.g. React, Next.js, vanilla JS --> |
| Backend | Firebase (Firestore, Authentication) |
| Hosting | <!-- e.g. Vercel, Firebase Hosting --> |
| Hashing | SHA-256 |
| Real-time | Firebase Firestore Listeners |

---

## Architecture

```
.
├── <!-- src or app folder -->
│   ├── <!-- components/ -->
│   ├── <!-- pages/ or app/ -->
│   ├── <!-- lib/ or utils/ -->
│   └── <!-- firebase config -->
├── <!-- public/ -->
└── <!-- config files -->
```

<!-- Add a brief description of how the codebase is structured if you want -->

---

## Security Design

- Flag values are **never stored or transmitted in plaintext** — all comparisons happen server-side against SHA-256 hashes
- Each user session is **isolated at the Firestore rules level** — participants cannot read each other's submission state
- Rate limiting is enforced at <!-- Firebase rules / API layer --> to prevent automated brute-force attempts
- <!-- Any other security decisions worth calling out -->

---

## Local Setup

```bash
# Clone the repo
git clone https://github.com/Vishy-MK/ttfinal2.0.git
cd ttfinal2.0

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Firebase config values

# Run locally
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

<!-- Remove or adjust the env block to match your actual stack -->

---

## Event Stats

| Metric | Value |
|---|---|
| Total Participants | 500+ |
| Challenge Categories | Cryptography, Steganography, OSINT |
| Integrity Violations | 0 |
| Event Duration | September – October 2025 |
| Leaderboard Update Latency | < 1 second |

---

## Built By

**Vishal Kumar** - [github.com/Vishy-MK](https://github.com/Vishy-MK)
**Siddhant Shivam** - [github.com/sidshivam625](https://github.com/sidshivam625)

Project built for TechTatva 2025, Manipal Institute of Technology.
