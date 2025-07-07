'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PlayerState } from '@/components/collab-surf/types';

const defaultPlayerState: PlayerState = {
  videoUrl: '',
  isPlaying: false,
  currentTime: 0,
};

export function useWatchParty(sessionId: string, userId: string, setIsHost: (isHost: boolean) => void) {
  const [playerState, setPlayerState] = useState<PlayerState>(defaultPlayerState);
  const [hostId, setHostId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const currentHostId = data.hostId;
        setHostId(currentHostId);

        // Determine host
        if (!currentHostId) {
          await setDoc(sessionRef, { hostId: userId }, { merge: true });
          setIsHost(true);
        } else {
          setIsHost(currentHostId === userId);
        }
        
        // Sync player state, but ignore updates we just sent
        if (data.playerState && data.playerState.lastUpdatedBy !== userId) {
            setPlayerState(data.playerState);
        }
      } else {
        // New session, this user is the host
        await setDoc(sessionRef, { 
            createdAt: serverTimestamp(),
            hostId: userId,
            playerState: defaultPlayerState
        });
        setIsHost(true);
        setHostId(userId);
        setPlayerState(defaultPlayerState);
      }
    });
    return () => unsubscribe();
  }, [sessionId, userId, setIsHost]);

  const updateRemoteState = useCallback(
    (newState: Partial<PlayerState>) => {
      if (!sessionId) return;
      const sessionRef = doc(db, 'sessions', sessionId);
      const updatedState = { ...playerState, ...newState, lastUpdatedBy: userId };
      setPlayerState(updatedState); // optimistically update local state
      setDoc(sessionRef, { playerState: updatedState }, { merge: true });
    },
    [sessionId, playerState, userId]
  );
  
  const setVideoUrl = useCallback((url: string) => {
    updateRemoteState({ videoUrl: url, isPlaying: false, currentTime: 0 });
  }, [updateRemoteState]);

  const setPlayerStateCallback = useCallback((newState: PlayerState) => {
      updateRemoteState(newState);
  }, [updateRemoteState]);

  return {
    playerState,
    setVideoUrl,
    setPlayerState: setPlayerStateCallback,
    hostId,
  };
}
