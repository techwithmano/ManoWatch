'use client';

import { useEffect, useState } from 'react';
import CollabSurf from '@/components/collab-surf/CollabSurf';
import NameInputForm from '@/components/collab-surf/NameInputForm';
import type { User } from '@/components/collab-surf/types';

const SESSION_STORAGE_KEY = 'watch-party-user';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUserJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedUserJson) {
      try {
        const savedUser = JSON.parse(savedUserJson);
        if (savedUser && savedUser.id && savedUser.name) {
          setUser(savedUser);
        }
      } catch (e) {
        console.error('Failed to parse user from session storage', e);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const handleJoin = (name: string) => {
    const newUser = { name, id: crypto.randomUUID() };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <NameInputForm onJoin={handleJoin} />
      </main>
    );
  }

  return <CollabSurf user={user} sessionId="default-session" />;
}
