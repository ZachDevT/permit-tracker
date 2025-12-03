# Firebase Hosting Setup Guide

## ✅ Why Firebase Hosting?

**Advantages:**
- ✅ Everything in one place (Firebase ecosystem)
- ✅ No need for separate hosting service
- ✅ Integrated with Firestore and other Firebase services
- ✅ Free tier available
- ✅ CDN included
- ✅ SSL certificates included

**How it works:**
- **Firebase Hosting**: Serves the static Next.js frontend
- **Cloud Functions**: Handles API routes (server-side)
- **Firestore**: Database (already configured)

## 🚀 Deployment Steps

### 1. Build the Static Frontend

```bash
npm run build
```

This creates an `out` directory with static files.

### 2. Set Up Cloud Functions

```bash
cd functions
npm install
cd ..
```

### 3. Deploy Everything

```bash
# Deploy Firestore rules (if not already done)
firebase deploy --only firestore:rules

# Deploy hosting and functions
firebase deploy --only hosting,functions
```

Or deploy everything at once:

```bash
firebase deploy
```

## 📋 Configuration Files

### `firebase.json`
- Configures hosting to serve from `out` directory
- Rewrites `/api/**` requests to Cloud Functions
- Sets up caching headers

### `next.config.js`
- Set `output: 'export'` for static export
- Images set to `unoptimized: true` for static export

### `functions/`
- Contains Cloud Functions code for API routes
- Handles `/api/jobs` and `/api/jobs/download`

## ⚙️ Environment Variables

Cloud Functions need environment variables. Set them:

```bash
firebase functions:config:set \
  firebase.project_id="permit-tracker-8f6bb" \
  firebase.client_email="firebase-adminsdk-fbsvc@permit-tracker-8f6bb.iam.gserviceaccount.com" \
  firebase.private_key="-----BEGIN PRIVATE KEY-----\n..." \
  firebase.storage_bucket="permit-tracker-8f6bb.firebasestorage.app"
```

Or use `.env` file in functions directory (for local development).

## 🔧 Important Notes

### API Routes Migration

The API routes need to be migrated to Cloud Functions. The current setup:
- Frontend calls `/api/jobs`
- Firebase Hosting rewrites to Cloud Function
- Cloud Function handles the request

### Playwright in Cloud Functions

Cloud Functions support Playwright, but you may need to:
1. Install Playwright in the functions directory
2. Ensure proper memory allocation (set to 2GiB in `functions/index.js`)
3. Increase timeout (set to 540 seconds)

### Cost Considerations

- **Firebase Hosting**: Free tier includes 10 GB storage, 360 MB/day transfer
- **Cloud Functions**: Pay per invocation and compute time
- **Firestore**: Free tier includes 1 GB storage, 50K reads/day

## 🆚 Vercel vs Firebase Hosting

| Feature | Vercel | Firebase Hosting |
|---------|--------|------------------|
| Next.js Support | ✅ Native | ⚠️ Requires static export |
| API Routes | ✅ Built-in | ⚠️ Needs Cloud Functions |
| Setup Complexity | ✅ Simple | ⚠️ More complex |
| Cost | ✅ Free tier | ✅ Free tier |
| Integration | ⚠️ Separate | ✅ Integrated with Firebase |
| CDN | ✅ Included | ✅ Included |
| SSL | ✅ Included | ✅ Included |

## 📝 Quick Deploy Script

Create a `deploy-firebase.sh` script:

```bash
#!/bin/bash
echo "Building Next.js app..."
npm run build

echo "Installing function dependencies..."
cd functions && npm install && cd ..

echo "Deploying to Firebase..."
firebase deploy
```

## 🔍 Troubleshooting

### Build Errors
- Make sure `output: 'export'` is in `next.config.js`
- Check for any server-side only code in components

### Function Errors
- Check Cloud Functions logs: `firebase functions:log`
- Verify environment variables are set
- Ensure Playwright is installed in functions directory

### Routing Issues
- Verify `firebase.json` rewrites are correct
- Check that API routes are properly handled in Cloud Functions

## ✅ After Deployment

1. **Verify hosting URL**: Check Firebase Console → Hosting
2. **Test API routes**: Try uploading a file
3. **Monitor functions**: Check Cloud Functions logs
4. **Monitor costs**: Check Firebase Console → Usage

---

**Status**: ✅ Ready for Firebase Hosting deployment
**Last Updated**: 2024

