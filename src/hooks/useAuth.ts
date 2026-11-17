import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '../config/firebase';
import {
  completeRedirectSignIn,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
} from '../services/authService';

export const PASSCODE_VALUE = '1673674991';
export const LOCAL_USER_ID = 'local-passcode-user';
const PASSCODE_STORAGE_KEY = 'linkvault-passcode-unlocked';

const LOCAL_PASSCODE_USER = {
  uid: LOCAL_USER_ID,
  displayName: 'LinkVault Owner',
  email: 'Passcode Unlocked',
  photoURL: null,
} as unknown as User;

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  unlockWithPasscode: (code: string) => boolean;
  signOut: () => Promise<void>;
}

function isPasscodeUnlocked(): boolean {
  try {
    return localStorage.getItem(PASSCODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(() =>
    isPasscodeUnlocked() ? LOCAL_PASSCODE_USER : null
  );
  const [loading, setLoading] = useState(() => !isPasscodeUnlocked());
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    completeRedirectSignIn().catch((err: unknown) => {
      if (!mounted) return;
      const message = err instanceof Error ? err.message : 'Redirect sign-in failed.';
      setError(message);
    });

    const unsubscribe = subscribeToAuthState((nextUser) => {
      if (!mounted) return;
      if (nextUser) {
        setUser(nextUser);
      } else if (isPasscodeUnlocked()) {
        setUser(LOCAL_PASSCODE_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const unlockWithPasscode = useCallback((code: string): boolean => {
    if (code === PASSCODE_VALUE) {
      try {
        localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
      } catch {
        // ignore storage errors
      }
      setError(null);
      setUser(LOCAL_PASSCODE_USER);
      return true;
    }
    return false;
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in with Google.');
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      localStorage.removeItem(PASSCODE_STORAGE_KEY);
    } catch {
      // ignore
    }
    await signOutUser();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    signingIn,
    error,
    signIn,
    unlockWithPasscode,
    signOut,
  };
}
