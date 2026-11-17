import { useEffect, useRef, useState } from 'react';
import { Delete, Eye, EyeOff, Link2, Lock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { isFirebaseConfigured } from '../config/firebase';
import { PASSCODE_VALUE } from '../hooks/useAuth';

interface LoginPageProps {
  signingIn: boolean;
  error: string | null;
  onSignIn: () => void;
  onUnlockPasscode: (code: string) => boolean;
}

const PIN_LENGTH = PASSCODE_VALUE.length; // 10

export function LoginPage({
  signingIn,
  error,
  onSignIn,
  onUnlockPasscode,
}: LoginPageProps) {
  const [pin, setPin] = useState('');
  const [showDigits, setShowDigits] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const tryUnlock = (nextPin: string) => {
    if (nextPin.length === PIN_LENGTH) {
      const ok = onUnlockPasscode(nextPin);
      if (!ok) {
        setPinError('Incorrect passcode. Please try again.');
        setShakeKey((k) => k + 1);
        setTimeout(() => {
          setPin('');
        }, 320);
      }
    }
  };

  const handlePinChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPinError(null);
    setPin(digitsOnly);
    tryUnlock(digitsOnly);
  };

  const handlePadDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPinError(null);
    setPin(next);
    tryUnlock(next);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setPinError(null);
    setPin((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setPinError(null);
    setPin('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-8 text-content">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-surface-elevated p-6 shadow-card sm:p-7"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <Link2 className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-content">LinkVault</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-content-secondary">
            <Lock className="h-3.5 w-3.5 text-accent" />
            Enter your 10-digit passcode to unlock
          </p>
        </div>

        {/* PIN Input & Dots (tapping focuses numeric keyboard) */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative mt-6 cursor-text"
        >
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            aria-label="Passcode input"
            className="absolute inset-0 h-full w-full opacity-0"
          />

          <motion.div
            key={shakeKey}
            animate={pinError ? { x: [-6, 6, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-10 gap-1.5"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
              const char = pin[idx];
              const isFilled = Boolean(char);
              const isActive = idx === pin.length;
              return (
                <div
                  key={idx}
                  className={`flex h-10 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                    pinError
                      ? 'border-red-500/60 bg-red-500/10 text-red-500'
                      : isActive
                        ? 'border-accent bg-accent-soft/50 ring-2 ring-accent/25'
                        : isFilled
                          ? 'border-accent/60 bg-surface text-content'
                          : 'border-border bg-surface text-content-muted'
                  }`}
                >
                  {isFilled ? (showDigits ? char : '•') : ''}
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          <span className="text-red-500">{pinError ?? ''}</span>
          <button
            type="button"
            onClick={() => setShowDigits((s) => !s)}
            className="inline-flex items-center gap-1 font-medium text-content-secondary hover:text-content"
          >
            {showDigits ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showDigits ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* On-Screen Numeric Keypad */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handlePadDigit(digit)}
              className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-lg font-bold text-content transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-xs font-semibold text-content-secondary transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handlePadDigit('0')}
            className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-lg font-bold text-content transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="flex h-12 items-center justify-center rounded-2xl border border-border bg-surface text-content-secondary transition-all hover:border-border-strong hover:bg-surface-muted active:scale-95"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isFirebaseConfigured && (
          <div className="mt-5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onSignIn}
              disabled={signingIn}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-content-secondary transition-colors hover:border-border-strong hover:text-content disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>{signingIn ? 'Signing in...' : 'Or sign in with Google (Cloud Sync)'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
