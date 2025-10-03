# Custom QR Flags Testing Guide

## Sample Test Users

You have these delegates available for testing:

### User 1: Alpha Tester
- **Delegate ID**: `CF2025-ALPHA-7`
- **Phone**: `+919356884366`
- **Email**: `alpha@test.com`
- **Password**: `test123`

### User 2: Beta Tester  
- **Delegate ID**: `CF2025-BETA-12`
- **Phone**: `+919876543210`
- **Email**: `beta@test.com`
- **Password**: `test123`

### User 3: Gamma Tester
- **Delegate ID**: `CF2025-GAMMA-3`
- **Phone**: `+911234567890`
- **Email**: `gamma@test.com`
- **Password**: `test123`

### User 4: Delta Tester
- **Delegate ID**: `CF2025-DELTA-15`
- **Phone**: `+919123456789`
- **Email**: `delta@test.com`
- **Password**: `test123`

### User 5: Echo Tester
- **Delegate ID**: `CF2025-ECHO-22`
- **Phone**: `+919987654321`
- **Email**: `echo@test.com`
- **Password**: `test123`

### User 6: Foxtrot Tester
- **Delegate ID**: `CF2025-FOXTROT-8`
- **Phone**: `+919555666777`
- **Email**: `foxtrot@test.com`
- **Password**: `test123`

### User 7: Golf Tester
- **Delegate ID**: `CF2025-GOLF-33`
- **Phone**: `+919444555666`
- **Email**: `golf@test.com`
- **Password**: `test123`

### User 8: Hotel Tester
- **Delegate ID**: `CF2025-HOTEL-19`
- **Phone**: `+919333444555`
- **Email**: `hotel@test.com`
- **Password**: `test123`

## How Each User Gets Different Custom Flags

When each user registers, the system will:

1. **Generate Unique Flag**: Based on `userId + challengeId + "qr_puzzle"`
   - Alpha user gets: `ctf{hash_of_alpha_user_id_challenge5}`
   - Beta user gets: `ctf{hash_of_beta_user_id_challenge5}`
   - Gamma user gets: `ctf{hash_of_gamma_user_id_challenge5}`

2. **Create Unique QR Code**: Each flag is encoded into a QR code
3. **Distort QR Code**: Remove top-left and top-right finder patterns + apply horizontal stretching
4. **Challenge Users**: Users must analyze bottom-left pattern and reconstruct the missing parts

## Testing Steps

### Step 1: Register Alpha User
1. Go to `/enlist` page
2. Enter: `CF2025-ALPHA-7` and `+919356884366`
3. Click "Verify Identity"
4. Enter: `alpha@test.com` and `test123`
5. Click "Create Account"
6. **Behind the scenes**: Custom QR flag created for challenge5

### Step 2: View Challenge 5
1. Go to `/missions` page
2. Click on Challenge 5 (should show as active)
3. **You should see**: QR Reconstruction Protocol section
4. **Download both images**: Corrupted QR + Pattern Fragment

### Step 3: Reconstruct QR Code
1. Open corrupted QR in image editor (Paint, GIMP, etc.)
2. Copy the pattern fragment to BOTH missing top corners
3. Save reconstructed QR code
4. Scan with phone/QR scanner to get flag like: `ctf{a1b2c3d4e5f6}`

### Step 4: Submit Flag
1. Enter the flag in the terminal below challenge
2. Click submit
3. **Expected**: "Correct! Next question unlocked."

### Step 5: Test Different Users
Repeat with Beta and Gamma users - each will get:
- Different QR codes
- Different flags
- Same puzzle type (missing corners)

## What Makes Each User's Experience Unique

```
Alpha User Flow:
Register → Get QR with flag ctf{abc123} → Reconstruct → Submit ctf{abc123} ✓

Beta User Flow:  
Register → Get QR with flag ctf{def456} → Reconstruct → Submit ctf{def456} ✓

Gamma User Flow:
Register → Get QR with flag ctf{ghi789} → Reconstruct → Submit ctf{ghi789} ✓
```

## Cross-User Testing (Should Fail)
- Alpha user tries to submit Beta's flag → ❌ "Incorrect flag"
- Beta user tries to submit Gamma's flag → ❌ "Incorrect flag"
- Only their own reconstructed flag works → ✅ "Correct!"

## Database Collections Created

After registration, check your Firestore for:

### `customFlagChallenge3` and `customFlagChallenge5` collections:
```javascript
// In customFlagChallenge3 collection:
{
  userId: "alpha_user_uid",
  delegateId: "CF2025-ALPHA-7", 
  challengeId: "challenge3",
  flagData: {
    originalFlag: "ctf{abc123}",
    encryptedFlag: "encrypted_version",
    qrImages: {
      distortedQR: "base64_corrupted_stretched_qr"
    }
  },
  isUsed: false,
  createdAt: timestamp
}

// In customFlagChallenge5 collection:
{
  userId: "alpha_user_uid",
  delegateId: "CF2025-ALPHA-7", 
  challengeId: "challenge5", 
  flagData: {
    originalFlag: "ctf{def456}",
    encryptedFlag: "encrypted_version",
    qrImages: {
      distortedQR: "base64_corrupted_stretched_qr"
    }
  },
  isUsed: false,
  createdAt: timestamp
}
```

This ensures each user has a completely unique, non-shareable challenge experience!
