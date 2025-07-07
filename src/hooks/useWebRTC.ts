
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
  getDocs,
  writeBatch,
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

type RemoteStream = {
  peerId: string;
  stream: MediaStream;
};

export function useWebRTC(sessionId: string, user: User) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const { allParticipants } = useChat(sessionId, user);

  // 1. Get user's local audio stream
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
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

  const handleEndConnection = useCallback(async (peerId: string) => {
    peerConnections.current.get(peerId)?.close();
    peerConnections.current.delete(peerId);
    setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
  }, []);

  // 2. Main WebRTC Logic
  useEffect(() => {
    if (!localStream || !sessionId || !user.id) return;

    const myPeerRef = doc(db, 'sessions', sessionId, 'peers', user.id);
    
    // Listen for offers from other peers
    const offersRef = collection(myPeerRef, 'offers');
    const unsubOffers = onSnapshot(offersRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, offer } = change.doc.data();
          
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerRef = doc(db, 'sessions', sessionId, 'peers', from, 'answers', user.id);
          await setDoc(answerRef, { from: user.id, answer });

          // Clean up the offer
          await deleteDoc(change.doc.ref);
        }
      });
    });

    // Listen for answers from other peers
    const answersRef = collection(myPeerRef, 'answers');
    const unsubAnswers = onSnapshot(answersRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, answer } = change.doc.data();
          const pc = peerConnections.current.get(from);
          if (pc?.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          await deleteDoc(change.doc.ref);
        }
      });
    });

    // Listen for ICE candidates from other peers
    const iceCandidatesRef = collection(myPeerRef, 'iceCandidates');
    const unsubIce = onSnapshot(iceCandidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { from, candidate } = change.doc.data();
          const pc = peerConnections.current.get(from);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
           await deleteDoc(change.doc.ref);
        }
      });
    });

    // Clean up my own peer document on unmount
    const cleanup = async () => {
        const myDoc = doc(db, 'sessions', sessionId, 'peers', user.id);
        const collections = ['offers', 'answers', 'iceCandidates'];
        const batch = writeBatch(db);

        for (const c of collections) {
            const snapshot = await getDocs(collection(myDoc, c));
            snapshot.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
    };

    return () => {
      unsubOffers();
      unsubAnswers();
      unsubIce();
      cleanup();
    };

  }, [localStream, sessionId, user.id]);

  // 3. Initiate connections to other participants
  useEffect(() => {
    if (!localStream) return;
    
    const otherParticipants = allParticipants.filter(p => p.id !== user.id);
    const connectedPeers = new Set(peerConnections.current.keys());

    // Connect to new participants
    otherParticipants.forEach(p => {
      if (!connectedPeers.has(p.id) && user.id < p.id) { // Simple initiator check
        const pc = createPeerConnection(p.id);
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            const offerRef = doc(db, 'sessions', sessionId, 'peers', p.id, 'offers', user.id);
            setDoc(offerRef, { from: user.id, offer: pc.localDescription });
          })
          .catch(e => console.error("Error creating offer:", e));
      }
    });

    // Disconnect from participants who left
    connectedPeers.forEach(peerId => {
        if (!otherParticipants.some(p => p.id === peerId)) {
            handleEndConnection(peerId);
        }
    });

  }, [allParticipants, localStream, user.id, sessionId]);

  const createPeerConnection = useCallback((peerId: string) => {
    if (peerConnections.current.has(peerId)) {
      return peerConnections.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection(servers);
    
    localStream?.getTracks().forEach(track => pc.addTrack(track, localStream));

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
        const candidateRef = collection(db, 'sessions', sessionId, 'peers', peerId, 'iceCandidates');
        addDoc(candidateRef, { from: user.id, candidate: event.candidate.toJSON() });
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

  return { remoteStreams };
}
