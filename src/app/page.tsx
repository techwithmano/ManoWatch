'use client';

import { useState } from 'react';
import CollabSurf from '@/components/collab-surf/CollabSurf';
import NameInputForm from '@/components/collab-surf/NameInputForm';
import type { User } from '@/components/collab-surf/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleJoin = (name: string) => {
    const newUser = { name, id: crypto.randomUUID() };
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
