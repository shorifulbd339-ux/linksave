import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

function isLikelyMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID to your environment.'
    );
  }

  await setPersistence(auth, browserLocalPersistence);

  if (isLikelyMobileBrowser()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return credential.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function completeRedirectSignIn(): Promise<User | null> {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
