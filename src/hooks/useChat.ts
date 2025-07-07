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
  const [participants, setParticipants] = useState<User[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const messagesCol = collection(db, 'sessions', sessionId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        author: doc.data().author,
        text: doc.data().text,
        timestamp: doc.data().timestamp?.toMillis() || Date.now(),
      }));
      setMessages(fetchedMessages);

      const uniqueAuthors = [
        ...new Set(fetchedMessages.map((m) => m.author)),
      ];
      setParticipants(uniqueAuthors.map((name) => ({ name })));
    });

    return () => unsubscribe();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user) return;
      const messagesCol = collection(db, 'sessions', sessionId, 'messages');
      await addDoc(messagesCol, {
        author: user.name,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
    },
    [sessionId, user]
  );

  return { messages, participants, sendMessage };
}
