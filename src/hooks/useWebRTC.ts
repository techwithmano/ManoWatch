
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
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

  const endPeerConnection = useCallback((peerId: string) => {
    peerConnections.current.get(peerId)?.close();
    peerConnections.current.delete(peerId);
    setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
  }, []);

  useEffect(() => {
    const startStreams = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(stream);
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    startStreams();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [localStream]);


  const createPeerConnection = useCallback((peerId: string) => {
    if (peerConnections.current.has(peerId)) return peerConnections.current.get(peerId)!;

    const pc = new RTCPeerConnection(servers);
    
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        if (prev.some(s => s.peerId === peerId)) return prev;
        return [...prev, { peerId, stream: event.streams[0] }];
      });
    };

    const peerRef = doc(db, 'sessions', sessionId, 'peers', peerId);
    const iceCandidatesCol = collection(peerRef, 'iceCandidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(iceCandidatesCol, event.candidate.toJSON());
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [localStream, sessionId]);


  useEffect(() => {
    if (!localStream) return;

    const otherParticipants = allParticipants.filter(p => p.id !== user.id);
    const currentPeers = new Set(peerConnections.current.keys());

    // Remove connections for participants who left
    currentPeers.forEach(peerId => {
      if (!otherParticipants.some(p => p.id === peerId)) {
        endPeerConnection(peerId);
      }
    });

    const peerRef = doc(db, 'sessions', sessionId, 'peers', user.id);
    const offersCol = collection(peerRef, 'offers');
    const answersCol = collection(peerRef, 'answers');

    const unsubOffers = onSnapshot(offersCol, snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const { offer, from } = change.doc.data();
          const pc = createPeerConnection(from);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          const answerRef = doc(collection(db, 'sessions', sessionId, 'peers', from), 'answers', user.id);
          await setDoc(answerRef, { answer, from: user.id });

          await deleteDoc(change.doc.ref);
        }
      });
    });

    const unsubAnswers = onSnapshot(answersCol, snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const { answer, from } = change.doc.data();
          const pc = peerConnections.current.get(from);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          await deleteDoc(change.doc.ref);
        }
      });
    });

    const unsubIceCandidates = new Map<string, () => void>();
    
    otherParticipants.forEach(async p => {
      const pc = createPeerConnection(p.id);

      const iceCandidatesRef = collection(db, 'sessions', sessionId, 'peers', user.id, 'iceCandidates');
      const q = query(iceCandidatesRef, where("peerId", "==", p.id));
      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            await pc.addIceCandidate(candidate);
            await deleteDoc(change.doc.ref);
          }
        });
      });
      unsubIceCandidates.set(p.id, unsub);

      // Create offer if we are the "initiator" (e.g., user with lower ID)
      if (user.id < p.id && pc.signalingState === 'stable') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const offerRef = doc(collection(db, 'sessions', sessionId, 'peers', p.id), 'offers', user.id);
        await setDoc(offerRef, { offer, from: user.id });
      }
    });
    
    return () => {
      unsubOffers();
      unsubAnswers();
      unsubIceCandidates.forEach(unsub => unsub());
    };
  }, [allParticipants, localStream, user.id, sessionId, createPeerConnection, endPeerConnection]);

  return { remoteStreams };
}
