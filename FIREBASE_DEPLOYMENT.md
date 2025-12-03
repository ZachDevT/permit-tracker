# Firebase Hosting Deployment - Complete Guide

## 🎯 Overview

Since your app uses **API routes** (server-side), we have two options:

### Option A: Hybrid Approach (Recommended)
- **Frontend**: Static Next.js export → Firebase Hosting
- **API Routes**: Cloud Functions → Handle `/api/**` requests
- **Database**: Firestore (already configured)

### Option B: Full Next.js on Firebase
- Use Firebase Hosting with custom server (more complex)

## ✅ We'll Use Option A

This keeps everything in Firebase and works well!

## 🚀 Deployment Steps

### 1. Update Frontend to Use Cloud Functions

The frontend needs to call Cloud Functions instead of Next.js API routes. Update API calls:

**Before:**
```typescript
fetch('/api/jobs', { ... })
```

**After (for Firebase):**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
fetch(`${API_URL}/jobs`, { ... })
```

Then set `NEXT_PUBLIC_API_URL` to your Cloud Function URL in production.

### 2. Build Frontend (Static)

```bash
FIREBASE_DEPLOY=1 npm run build
```

This creates static files in `out/` directory.

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 4. Deploy Hosting

```bash
firebase deploy --only hosting
```

### 5. Or Deploy Everything

```bash
firebase deploy
```

## 📝 Simplified Approach

Actually, there's an even simpler way! Since you're already using Firebase, you can:

1. **Keep Next.js API routes** - They work fine
2. **Deploy frontend to Firebase Hosting** (static)
3. **Deploy API routes as Cloud Functions** (separate)

But the easiest: **Just use Vercel** - it's made for Next.js and handles everything automatically!

## 🤔 Recommendation

**For this project, I recommend:**

1. **Use Vercel** (easiest, best Next.js support)
   - One command: `vercel --prod`
   - Handles API routes automatically
   - Free tier available
   - Made by Next.js team

2. **OR use Firebase Hosting** (if you want everything in Firebase)
   - Requires more setup
   - Need to migrate API routes to Cloud Functions
   - More complex but everything in one place

## 💡 Quick Decision

**Choose Vercel if:**
- ✅ You want the easiest deployment
- ✅ You want best Next.js support
- ✅ You don't mind using a separate service

**Choose Firebase Hosting if:**
- ✅ You want everything in Firebase
- ✅ You're okay with more setup
- ✅ You want to learn Cloud Functions

## 🎯 My Recommendation: Use Vercel

It's literally one command and everything works. But if you really want Firebase Hosting, I can help set it up properly!

---

**Current Status**: Both options are available. Choose what works best for you!

