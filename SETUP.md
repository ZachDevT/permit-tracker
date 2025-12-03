# Setup Guide - Permit Tracker

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "permit-tracker")
4. Enable Google Analytics (optional)
5. Click "Create project"

#### Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **production mode** (we'll set up rules later)
4. Choose a location (preferably close to your users)
5. Click "Enable"

#### Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register app with a nickname
5. Copy the Firebase configuration object

#### Create Service Account

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure!** Never commit it to git.

#### Set Environment Variables

Create `.env.local` file in the project root:

```env
# Client-side Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side Firebase Admin (from service account JSON)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
```

**Important**: 
- The `FIREBASE_PRIVATE_KEY` should include the `\n` characters as shown
- Wrap the entire key in quotes
- Use the values from your downloaded service account JSON file

### 4. Firestore Security Rules

Go to Firestore Database > Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    // For development, you can temporarily allow all:
    match /jobs/{jobId} {
      allow read, write: if true; // Change to: if request.auth != null; for production
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the Setup

1. **Test File Upload**: 
   - Create a test Excel file with Company and Address columns
   - Upload it through the UI
   - Check if a job is created

2. **Check Firebase**:
   - Go to Firestore Database in Firebase Console
   - Verify that a "jobs" collection is created
   - Check that job documents are being created

3. **Test Scraping**:
   - Use a known address from Wallonia
   - Monitor the job progress
   - Check if results are generated

## Troubleshooting

### Playwright Issues

If you get Playwright errors:

```bash
# Reinstall browsers
npx playwright install --force chromium

# Or install with system dependencies
npx playwright install --with-deps chromium
```

### Firebase Connection Errors

- Verify all environment variables are set correctly
- Check that `.env.local` is in the project root (not committed to git)
- Ensure Firestore is enabled in Firebase Console
- Verify service account has proper permissions

### Scraping Failures

- Check if BDES portal is accessible: https://bdes.spw.wallonie.be
- Verify the address format matches what the portal expects
- Check browser console for errors
- Review job error messages in Firebase

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

- Ensure Node.js 18+ is available
- Install Playwright browsers in build process
- Set all environment variables
- Configure Firestore security rules for production

## Security Checklist

- [ ] Firestore rules restrict access appropriately
- [ ] Environment variables are not committed to git
- [ ] Service account key is secure
- [ ] API routes have proper validation
- [ ] Rate limiting is configured
- [ ] Error messages don't expose sensitive info

