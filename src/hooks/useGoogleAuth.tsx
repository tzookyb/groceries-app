import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { connectGoogle, disconnectGoogle, ensureToken, loadSavedToken } from '../services/googleAuth';

interface GoogleAuthContextValue {
  connected: boolean;
  connect(): void;
  disconnect(): void;
  ensureToken(callback: () => void): void;
}

const GoogleAuthContext = createContext<GoogleAuthContextValue | null>(null);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (loadSavedToken()) setConnected(true);
  }, []);

  const connect = useCallback(() => {
    connectGoogle(() => setConnected(true));
  }, []);

  const disconnect = useCallback(() => {
    disconnectGoogle();
    setConnected(false);
  }, []);

  const value = useMemo<GoogleAuthContextValue>(() => ({ connected, connect, disconnect, ensureToken }), [connected, connect, disconnect]);

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;
}

export function useGoogleAuth(): GoogleAuthContextValue {
  const ctx = useContext(GoogleAuthContext);
  if (!ctx) throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  return ctx;
}
