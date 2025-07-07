
'use client';

import type { User } from './types';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Mic } from 'lucide-react';

type ParticipantListProps = {
  user: User;
  sessionId: string;
};

export default function ParticipantList({ user, sessionId }: ParticipantListProps) {
  const { allParticipants } = useChat(sessionId, user);

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg bg-card border">
        <h3 className="text-sm font-semibold text-muted-foreground">In Call:</h3>
        <div className="flex items-center gap-3">
            {allParticipants.map(p => (
                 <div key={p.id} className="flex items-center gap-2" title={p.name}>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                     <span className="text-sm font-medium sr-only md:not-sr-only">{p.name}{p.id === user.id ? ' (You)' : ''}</span>
                    <Mic className="h-4 w-4 text-green-500" />
                </div>
            ))}
        </div>
    </div>
  );
}
