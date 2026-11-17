import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const DEFAULT_PROJECT_ID = 'plucky-pointer-498903-h2';
const DEFAULT_DATABASE_ID = 'ai-studio-android-linkvaul-411b4436-0a7a-4b03-acbe-c1fa64df7036';

function readEnv(value: string | undefined, fallback = ''): string {
  return (value ?? fallback).trim();
}

export const FIREBASE_CONFIG = {
  apiKey: readEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: readEnv(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    `${DEFAULT_PROJECT_ID}.firebaseapp.com`
  ),
  projectId: readEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID, DEFAULT_PROJECT_ID),
  storageBucket: readEnv(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    `${DEFAULT_PROJECT_ID}.firebasestorage.app`
  ),
  messagingSenderId: readEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, '196745336715'),
  appId: readEnv(import.meta.env.VITE_FIREBASE_APP_ID),
};

export const FIRESTORE_DATABASE_ID = readEnv(
  import.meta.env.VITE_FIREBASE_DATABASE_ID,
  DEFAULT_DATABASE_ID
);

export const isFirebaseConfigured = Boolean(
  FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId && FIREBASE_CONFIG.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});

  try {
    db = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      FIRESTORE_DATABASE_ID
    );
  } catch {
    db = getFirestore(app, FIRESTORE_DATABASE_ID);
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export { app, auth, db };
