# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (if not done)
```bash
npm install
npx playwright install chromium
```

### 2. Set Up Firebase Service Account

**Get Service Account Key:**
1. Visit: https://console.firebase.google.com/project/permit-tracker-8f6bb/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file

**Update `.env.local`:**
```bash
# Open the downloaded JSON and copy these values to .env.local:

FIREBASE_CLIENT_EMAIL=<client_email from JSON>
FIREBASE_PRIVATE_KEY="<private_key from JSON with \n>"
```

The client-side Firebase config is already set in `.env.local`.

### 3. Run the Application

```bash
# Development mode
npm run dev

# Open http://localhost:3000
```

### 4. Test with Sample Data

1. Create an Excel file with columns: `Company` and `Address` (or `Ville`)
2. Upload it through the web interface
3. Monitor the job progress
4. Download results when complete

## 📋 Example Input File

Create `test-companies.xlsx`:

| Company | Ville |
|---------|-------|
| Nucléaire de Tihange — S.A. ELECTRABEL | Tihange |
| LANOLINES STELLA SA | Mouscron |

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Playwright installed (`npx playwright install chromium`)
- [ ] Service account configured (`.env.local` updated)
- [ ] Development server runs (`npm run dev`)
- [ ] Can upload a test file
- [ ] Job processing starts
- [ ] Results are generated

## 🆘 Need Help?

- See `SETUP.md` for detailed setup instructions
- See `PRODUCTION_SETUP.md` for production deployment
- See `README.md` for full documentation

---

**Ready to go!** 🎉

