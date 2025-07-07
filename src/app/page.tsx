'use client';

import { useState } from 'react';
import CollabSurf from '@/components/collab-surf/CollabSurf';
import NameInputForm from '@/components/collab-surf/NameInputForm';
import type { User } from '@/components/collab-surf/types';


export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <NameInputForm onJoin={(name) => setUser({ name })} />
      </main>
    );
  }

  return <CollabSurf user={user} />;
}
