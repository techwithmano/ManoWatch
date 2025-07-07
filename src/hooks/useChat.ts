'use client';
import type { Message, User } from '@/components/collab-surf/types';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

export function useChat(sessionId: string, user: User) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allParticipants, setAllParticipants] = useState<User[]>([]);

  // Listener for messages
  useEffect(() => {
    if (!sessionId) return;
    const messagesCol = collection(db, 'sessions', sessionId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        author: doc.data().author as User,
        text: doc.data().text,
        timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Listener for participants
  useEffect(() => {
    if (!sessionId) return;
    const peersRef = collection(db, 'sessions', sessionId, 'peers');
    const unsubscribe = onSnapshot(peersRef, (snapshot) => {
      const currentParticipants = snapshot.docs.map(doc => doc.data() as User);
      setAllParticipants(currentParticipants);
    });
    return () => unsubscribe();
  }, [sessionId]);


  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user) return;
      const messagesCol = collection(db, 'sessions', sessionId, 'messages');
      await addDoc(messagesCol, {
        author: { id: user.id, name: user.name },
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
    },
    [sessionId, user]
  );

  return { messages, allParticipants, sendMessage };
}
