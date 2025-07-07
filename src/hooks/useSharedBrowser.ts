'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { BrowserState } from '@/components/collab-surf/types';

const defaultUrl = 'https://www.google.com/search?q=popular+free+movie+streaming+sites';

export function useSharedBrowser(sessionId: string) {
  const [browserState, setBrowserState] = useState<BrowserState>({
    url: 'about:blank',
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setIsInitializing(true);
    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data()?.url) {
        setBrowserState(snapshot.data() as BrowserState);
      } else {
        setDoc(
          sessionRef,
          { url: defaultUrl, createdAt: serverTimestamp() },
          { merge: true }
        );
        setBrowserState({ url: defaultUrl });
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const navigate = useCallback(
    (url: string) => {
      if (!sessionId || !url.trim()) return;

      let finalUrl = url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }

      const sessionRef = doc(db, 'sessions', sessionId);
      setDoc(sessionRef, { url: finalUrl }, { merge: true });
    },
    [sessionId]
  );

  return {
    browserState: isInitializing ? { url: 'about:blank' } : browserState,
    navigate,
  };
}
