import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

function initializeFirebaseAdmin() {
  if (app) {
    return { app, db: db!, storage: storage! };
  }

  // Check if we have the required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error(
      "Firebase Admin credentials are missing. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET in your environment variables."
    );
  }

  if (!getApps().length) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      storageBucket,
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  storage = getStorage(app);

  return { app, db, storage };
}

// Initialize on import for server-side usage
if (typeof window === "undefined") {
  try {
    const initialized = initializeFirebaseAdmin();
    app = initialized.app;
    db = initialized.db;
    storage = initialized.storage;
  } catch (error) {
    // During build time, credentials might not be available
    // This is okay, we'll initialize when actually needed
    console.warn("Firebase Admin not initialized:", error instanceof Error ? error.message : "Unknown error");
  }
}

export { app, db, storage, initializeFirebaseAdmin };

