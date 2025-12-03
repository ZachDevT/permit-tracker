# Production Setup Guide - Permit Tracker

## ✅ Current Status

- ✅ Firebase project configured: `permit-tracker-8f6bb`
- ✅ Firestore rules deployed
- ✅ Dependencies installed
- ✅ Playwright browsers installed
- ✅ Build successful
- ⚠️ Service account credentials needed (see below)

## 🔧 Required Setup Steps

### 1. Firebase Service Account Setup

To enable server-side Firebase Admin operations, you need to create a service account:

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/permit-tracker-8f6bb/settings/serviceaccounts/adminsdk
   ```

2. **Generate New Private Key:**
   - Click "Generate new private key"
   - Confirm the dialog
   - A JSON file will be downloaded

3. **Extract Credentials:**
   Open the downloaded JSON file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

4. **Update `.env.local`:**
   ```env
   FIREBASE_PROJECT_ID=permit-tracker-8f6bb
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@permit-tracker-8f6bb.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
   ```

   **Important:** The `FIREBASE_PRIVATE_KEY` must:
   - Be wrapped in quotes
   - Include the `\n` characters (they will be converted to actual newlines)

### 2. Verify Environment Variables

Check that `.env.local` contains all required variables:

```bash
# Client-side (already configured)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDf4_rbJHKKBL1xV4zqH-hJ2GW8lYI4QdQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=permit-tracker-8f6bb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=permit-tracker-8f6bb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=403751183886
NEXT_PUBLIC_FIREBASE_APP_ID=1:403751183886:web:638cba1021c64aad887e5f

# Server-side (needs service account)
FIREBASE_PROJECT_ID=permit-tracker-8f6bb
FIREBASE_CLIENT_EMAIL=<from service account>
FIREBASE_PRIVATE_KEY=<from service account>
FIREBASE_STORAGE_BUCKET=permit-tracker-8f6bb.firebasestorage.app
```

### 3. Test the Setup

```bash
# Start development server
npm run dev

# In another terminal, test the build
npm run build
```

### 4. Firestore Security Rules

Current rules allow all access (for development). For production, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // Allow read/write for authenticated users
      allow read, write: if request.auth != null;
      
      // Or implement custom logic based on user roles
    }
  }
}
```

Then deploy:
```bash
firebase deploy --only firestore:rules
```

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Redeploy

4. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install && npx playwright install chromium`

### Option 2: Self-Hosted

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "permit-tracker" -- start
   pm2 save
   pm2 startup
   ```

## 🔒 Security Checklist

- [ ] Service account credentials configured
- [ ] `.env.local` is in `.gitignore` (should be)
- [ ] Firestore rules restrict access appropriately
- [ ] Environment variables set in production platform
- [ ] API routes have proper error handling
- [ ] Rate limiting configured (if needed)
- [ ] CORS configured (if needed)

## 📊 Monitoring

### Firebase Console
- Monitor Firestore usage: https://console.firebase.google.com/project/permit-tracker-8f6bb/firestore
- Check job documents in the `jobs` collection
- Monitor API usage and quotas

### Application Logs
- Check server logs for errors
- Monitor job processing times
- Track success/failure rates

## 🐛 Troubleshooting

### Build Errors

**Error: Firebase Admin credentials missing**
- Solution: Complete service account setup (Step 1)

**Error: Playwright browsers not found**
- Solution: Run `npx playwright install chromium`

### Runtime Errors

**Error: Firestore permission denied**
- Solution: Check Firestore rules and deploy updated rules

**Error: Job processing fails**
- Solution: Check server logs, verify BDES portal accessibility
- Check Playwright browser installation

### Performance Issues

**Slow job processing**
- Increase delay between requests in scraper
- Consider parallel processing for large batches
- Monitor Firebase quotas

## 📝 Next Steps

1. ✅ Complete service account setup
2. ✅ Test with a small batch of companies
3. ✅ Verify results accuracy
4. ✅ Deploy to production
5. ✅ Monitor initial runs
6. ✅ Set up error alerts (optional)

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/permit-tracker-8f6bb
- Firestore Database: https://console.firebase.google.com/project/permit-tracker-8f6bb/firestore
- Service Accounts: https://console.firebase.google.com/project/permit-tracker-8f6bb/settings/serviceaccounts/adminsdk
- BDES Portal: https://bdes.spw.wallonie.be/portal/web/guest/app/-/consultation/carte

---

**Project Status:** ✅ Ready for production (after service account setup)
**Last Updated:** 2024

