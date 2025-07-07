
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
} from 'firebase/firestore';
import type { User } from '@/components/collab-surf/types';
import { useChat } from './useChat';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export type RemoteStream = {
  peerId: string;
  stream: MediaStream;
};

export function useWebRTC(sessionId: string, user: User) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { allParticipants } = useChat(sessionId, user);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  }, [localStream]);

  const handleEndConnection = useCallback(async (peerId: string) => {
    peerConnections.current.get(peerId)?.close();
    peerConnections.current.delete(peerId);
    setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    if (peerConnections.current.has(peerId)) {
      return peerConnections.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection(servers);
    
    localStream?.getTracks().forEach(track => {
      if (localStream) {
        pc.addTrack(track, localStream)
      }
    });

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        if (!prev.some(s => s.peerId === peerId)) {
          return [...prev, { peerId, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const iceCandidatesRef = collection(db, 'sessions', sessionId, 'peers', peerId, 'iceCandidates');
        addDoc(iceCandidatesRef, { from: user.id, candidate: event.candidate.toJSON() });
      }
    };
    
    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            handleEndConnection(peerId);
        }
    }

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [localStream, sessionId, user.id, handleEndConnection]);
  

  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getAudioTracks().forEach(track => (track.enabled = false));
        setLocalStream(stream);
        setIsMuted(true);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    startStream();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnections.current.forEach(pc => pc.close());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!localStream || !sessionId || !user.id) return;

    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    const myPeerRef = doc(db, 'sessions', sessionId, 'peers', user.id);
    setDoc(myPeerRef, { id: user.id, name: user.name });
    
    const offersRef = collection(myPeerRef, 'offers');
    const qOffers = query(offersRef);
    const unsubOffers = onSnapshot(qOffers, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, offer } = change.doc.data();
          const pc = createPeerConnection(from);
          if (pc.signalingState !== 'stable') return;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const answerRef = doc(db, 'sessions', sessionId, 'peers', from, 'answers', user.id);
          await setDoc(answerRef, { from: user.id, answer: answer.toJSON() });
          await deleteDoc(change.doc.ref);
        }
      });
    });

    const answersRef = collection(myPeerRef, 'answers');
    const qAnswers = query(answersRef);
    const unsubAnswers = onSnapshot(qAnswers, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, answer } = change.doc.data();
          const pc = peerConnections.current.get(from);
          if (pc?.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          await deleteDoc(change.doc.ref);
        }
      });
    });

    const iceCandidatesRef = collection(myPeerRef, 'iceCandidates');
    const qIce = query(iceCandidatesRef);
    const unsubIce = onSnapshot(qIce, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, candidate } = change.doc.data();
          const pc = peerConnections.current.get(from);
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
           await deleteDoc(change.doc.ref);
        }
      });
    });

    const cleanup = async () => {
      const myDoc = doc(db, 'sessions', sessionId, 'peers', user.id);
      const collections = ['offers', 'answers', 'iceCandidates'];
      const batch = writeBatch(db);
      for (const c of collections) {
        const snapshot = await getDocs(collection(myDoc, c));
        snapshot.forEach((doc) => batch.delete(doc.ref));
      }
      await batch.commit();
      await deleteDoc(myDoc);
    };

    const handleBeforeUnload = () => {
      cleanup();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubOffers();
      unsubAnswers();
      unsubIce();
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Delay the database cleanup to avoid strict mode issues
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanup();
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
      }, 500);
    };

  }, [localStream, sessionId, user.id, user.name, createPeerConnection]);

  useEffect(() => {
    if (!localStream) return;
    
    const otherParticipants = allParticipants.filter(p => p.id !== user.id);
    const connectedPeers = new Set(peerConnections.current.keys());

    otherParticipants.forEach(p => {
      if (!connectedPeers.has(p.id) && user.id > p.id) {
        const pc = createPeerConnection(p.id);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            if (!pc.localDescription) {
              throw new Error("Failed to create offer: localDescription is null");
            }
            const offerRef = doc(db, 'sessions', sessionId, 'peers', p.id, 'offers', user.id);
            setDoc(offerRef, { from: user.id, offer: pc.localDescription.toJSON() });
          })
          .catch(e => console.error("Error creating offer:", e));
      }
    });

    connectedPeers.forEach(peerId => {
        if (!otherParticipants.some(p => p.id === peerId)) {
            handleEndConnection(peerId);
        }
    });

  }, [allParticipants, localStream, user.id, sessionId, createPeerConnection, handleEndConnection]);

  return { remoteStreams, isMuted, toggleMute };
}
