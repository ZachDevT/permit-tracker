# Deployment Guide

## ✅ Build Status: SUCCESS

The application has been built successfully and is ready for deployment.

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended - Everything in Firebase!)

**Why Firebase Hosting?**
- ✅ Everything in one place (Firebase ecosystem)
- ✅ Integrated with Firestore
- ✅ No need for separate services
- ✅ Free tier available

**Quick Deploy:**
```bash
./deploy-firebase.sh
```

**Manual Deploy:**
```bash
npm run build
cd functions && npm install && cd ..
firebase deploy
```

See `FIREBASE_HOSTING_SETUP.md` for detailed instructions.

### Option 2: Vercel (Alternative)

#### Step 1: Login to Vercel
```bash
vercel login
```

#### Step 2: Link Project
```bash
vercel link
```

#### Step 3: Set Environment Variables
You need to add all environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

**Client-side (NEXT_PUBLIC_*):**
- `NEXT_PUBLIC_FIREBASE_API_KEY` = `AIzaSyDf4_rbJHKKBL1xV4zqH-hJ2GW8lYI4QdQ`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `permit-tracker-8f6bb.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `permit-tracker-8f6bb`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `permit-tracker-8f6bb.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `403751183886`
- `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:403751183886:web:638cba1021c64aad887e5f`

**Server-side (Admin):**
- `FIREBASE_PROJECT_ID` = `permit-tracker-8f6bb`
- `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk-fbsvc@permit-tracker-8f6bb.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY` = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDf/xSRRvafLmUR\nUTs9KNSQGPYWOgMVa1NlRKEwhntfZ7ztmBTCPV9BlkG1h9KDdiE/zHa1GS74CXIA\nlI9xhICWI4YbMau5YwwVJK6/HGeANpQZNBFYB06j295gTaQ/2yiFDlZZNBzEL9t0\n0sMiCmeA8fFYiNpVJaBaiWSs7MvwXlOUm7NvqlvlykJM1WC4lyJHwGntpfV+Ofhp\ndLKwhXoJKFQoRPIDnhevwLWjWyZoJJddrMxgGLzqt6Dpvu74F36r8LhoAh6uUWw0\nc1Y+C3k66L0umXSwhls5wouQvq6idCidBRCpClP36G/7hXDbMKR3dB76yzFmpAYr\nPYsgscDhAgMBAAECggEABB/Dio20jHd7laMp3K1H5ZvKCxx4ElDCrTCDabvuIVJt\nAnBcgHuGCZR5Qvz8UZ6PC+hJLronGNq+qjdSAUhr4CfJCC7kzyHdVvXREFR27N/E\nYAbrA1SGHIL3sAz551GTCEkcaqHInk2VxCu9uz6XC4MY2xUQ9QSfdE9Hht4IvrUL\nDmRyeTMVRfDyJgsLljnCNKN/iWUh2DuTE1QrCkgHqDGHsVibEc4r0H0Q6t7lT8yo\n+AVD1dp4DAoMXqnMS3aN5bz2GgnJ3gixMC+FxJ387x8TSSt4t7/poDmlT57ZaoxS\nRu3J69wiW6uA7Gi+qJ5wjcYiZVDZuFjxsR8ZQtnHuQKBgQD98R7KeOw36r+pqIBb\nnJsmzu/K/DdgiF0LHZSufqtFqzoEP0eNr8mcuOl3NEEXpohYGC+gDdaRIzYfRYCN\nMlCOUL2HhK+dTQurtHiL/Ky9JsFEIlaHfWWJcAJqjM9gnXDA3th5u7LhkjsnHFR9\n+WZPqrpKqUKwmE6GrK/pZvOtKQKBgQDhz9Q+P5T121Ro2tEN20f6OINbUAU4Fq+J\n1uVEyEKnhgQwYJX7FmJxwRwOrzbfe3hjTPiaOP/rA99NI751Bh7o3liXjEeSk4QH\nBEVf9YVWWbA0Vb9bXvcMyv4Ly7RQ4QcnuRF9ulTUAbmR+uwWeX3qkTpB6SZ6ByHN\nPOFoWLI0+QKBgC7ZnF+ofZQ3aBLp9nxwYSOAzDa734+cuOXDGFo1Hm4lD/gWoKHg\nS6bxaolGh7fQTplKJQc3Zl2yjFqqnPPv03LeLIljDm9L9ppAGnlhLZFcJA3o8+Pd\nW61Gj/uObPgbM+Exe+jBm1gIfYdSr7fqGlkaW3JI1ff0sZAhLfc2ukA5AoGBAKgA\njyFM/s+4QeHNQxIzHicNGrW6IFftkOZVqrf04ppuu/keMxffPJjzmqNWOtYkr5n5\nr1BWrhi1BdMHj/DS//YzTuhZpvpnpCfwRokxSuXGzrDxRvB9BANRl5dBFEPEWCV2\nrIvFMM2XBvCUJkhGVadKK3TUORs66SwganfO3a9JAoGBAPlSBOE/oqmHmV9DfpJh\nsRSPg77UijvLe3BtGTGbIVhBHX5dP0H/r8uMAZL2hAG+XS5InQVX5j9CAXHTKsAI\nwm9/bwlI/h+6l2GHfqCxR8lWRgRUA+iiJ6YGJK/7HSSxgRUrtChChrewGPYrMJgv\nppSF2DqB771d1P/r0lozgcQ+\n-----END PRIVATE KEY-----\n`
- `FIREBASE_STORAGE_BUCKET` = `permit-tracker-8f6bb.firebasestorage.app`

**Important:** For `FIREBASE_PRIVATE_KEY`, make sure to:
- Wrap it in quotes
- Keep all the `\n` characters

#### Step 4: Deploy
```bash
vercel --prod
```

### Option 2: Manual Deployment Script

I've created a deployment script. Run:

```bash
./deploy.sh
```

This will:
1. Build the application
2. Check for environment variables
3. Deploy to Vercel (after login)

### Option 3: Firebase Hosting (Alternative)

If you prefer Firebase Hosting:

1. **Update firebase.json:**
```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

2. **Export Next.js app:**
```bash
npm run build
```

3. **Deploy:**
```bash
firebase deploy --only hosting
```

## ✅ Pre-Deployment Checklist

- [x] Build successful
- [x] Environment variables configured
- [x] Firebase service account set up
- [x] Firestore rules deployed
- [ ] Vercel account linked
- [ ] Environment variables added to Vercel
- [ ] Deployment completed

## 🔍 Verify Deployment

After deployment, verify:

1. **Application loads:** Check the deployed URL
2. **File upload works:** Try uploading a test file
3. **Job processing:** Monitor a test job
4. **Results download:** Verify Excel download works
5. **Firebase connection:** Check Firestore for job documents

## 📊 Post-Deployment

1. Monitor application logs in Vercel Dashboard
2. Check Firebase Console for Firestore usage
3. Monitor job processing times
4. Set up error alerts (optional)

---

**Current Status:** ✅ Ready to deploy
**Build:** ✅ Successful
**Environment:** ✅ Configured

