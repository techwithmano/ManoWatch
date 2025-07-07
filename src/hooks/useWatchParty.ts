'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  runTransaction,
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
    if (!sessionId || !userId) return;
    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let currentHostId = data.hostId;

        // If no host is assigned, try to become the host atomically
        if (!currentHostId) {
          try {
            await runTransaction(db, async (transaction) => {
              const freshDoc = await transaction.get(sessionRef);
              if (freshDoc.exists() && !freshDoc.data().hostId) {
                transaction.update(sessionRef, { hostId: userId });
                currentHostId = userId; // We are the new host
              } else if (freshDoc.exists()) {
                // Another user became host while we were trying
                currentHostId = freshDoc.data().hostId;
              }
            });
          } catch (e) {
            console.error("Failed to claim host role:", e);
          }
        }
        
        setHostId(currentHostId || null);
        setIsHost(currentHostId === userId);
        
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
      if (!sessionId || !isHost) return;
      const sessionRef = doc(db, 'sessions', sessionId);
      const updatedState = { ...playerState, ...newState, lastUpdatedBy: userId };
      setPlayerState(updatedState); // optimistically update local state
      setDoc(sessionRef, { playerState: updatedState }, { merge: true });
    },
    [sessionId, playerState, userId, isHost]
  );
  
  const setVideoUrl = useCallback((url: string) => {
    if(!isHost) return;
    updateRemoteState({ videoUrl: url, isPlaying: false, currentTime: 0 });
  }, [updateRemoteState, isHost]);

  const setPlayerStateCallback = useCallback((newState: PlayerState) => {
      if(!isHost) return;
      updateRemoteState(newState);
  }, [updateRemoteState, isHost]);

  return {
    playerState,
    setVideoUrl,
    setPlayerState: setPlayerStateCallback,
    hostId,
  };
}
