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
import type { PlayerState, User } from '@/components/collab-surf/types';

const defaultPlayerState: PlayerState = {
  videoUrl: '',
  isPlaying: false,
  currentTime: 0,
};

export function useWatchParty(sessionId: string, user: User, setIsHost: (isHost: boolean) => void) {
  const [playerState, setPlayerState] = useState<PlayerState>(defaultPlayerState);
  const [hostId, setHostId] = useState<string | null>(null);
  const { id: userId, name: userName } = user;
  
  useEffect(() => {
    if (!sessionId || !userId) return;
    const sessionRef = doc(db, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let currentHostId = data.hostId;

        // If the user's name is "Abdulrahman", they take over as host.
        if (userName === 'Abdulrahman' && currentHostId !== userId) {
            await setDoc(sessionRef, { hostId: userId }, { merge: true });
            currentHostId = userId;
        } else if (!currentHostId) {
          // If no host is assigned, try to become the host.
          try {
            await runTransaction(db, async (transaction) => {
              const freshDoc = await transaction.get(sessionRef);
              if (freshDoc.exists() && !freshDoc.data().hostId) {
                transaction.update(sessionRef, { hostId: userId });
                currentHostId = userId; // We are the new host
              } else if (freshDoc.exists()) {
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
        // New session, this user is the host.
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
  }, [sessionId, userId, userName, setIsHost]);

  const updateRemoteState = useCallback(
    (newState: Partial<PlayerState>) => {
      if (!sessionId || hostId !== userId) return;
      const sessionRef = doc(db, 'sessions', sessionId);
      const updatedState = { ...playerState, ...newState, lastUpdatedBy: userId };
      setPlayerState(updatedState); // optimistically update local state
      setDoc(sessionRef, { playerState: updatedState }, { merge: true });
    },
    [sessionId, playerState, userId, hostId]
  );
  
  const setVideoUrl = useCallback((url: string) => {
    if(hostId !== userId) return;
    updateRemoteState({ videoUrl: url, isPlaying: false, currentTime: 0 });
  }, [updateRemoteState, userId, hostId]);

  const setPlayerStateCallback = useCallback((newState: PlayerState) => {
      if(hostId !== userId) return;
      updateRemoteState(newState);
  }, [updateRemoteState, userId, hostId]);

  return {
    playerState,
    setVideoUrl,
    setPlayerState: setPlayerStateCallback,
    hostId,
  };
}
