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
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useChat(sessionId: string, user: User) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);

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

      const allAuthors = fetchedMessages.map((m) => m.author);
      const uniqueParticipants = Array.from(new Map(allAuthors.map(p => [p.id, p])).values());
      setParticipants(uniqueParticipants.filter(p => p.id !== user.id));
    });

    return () => unsubscribe();
  }, [sessionId, user.id]);

  const allParticipants = useMemo(() => {
    return Array.from(new Map([user, ...participants].map(p => [p.id, p])).values());
  }, [user, participants]);


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

  return { messages, participants, allParticipants, sendMessage };
}
