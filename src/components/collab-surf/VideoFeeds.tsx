
'use client';

import type { User } from './types';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Crown, Mic, MicOff } from 'lucide-react';
import { Button } from '../ui/button';

type ParticipantListProps = {
  user: User;
  sessionId: string;
  hostId: string | null;
  isMuted: boolean;
  toggleMute: () => void;
};

export default function ParticipantList({ user, sessionId, hostId, isMuted, toggleMute }: ParticipantListProps) {
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
                    
                    {p.id === hostId && (
                      <Crown className="h-4 w-4 text-yellow-500" title="Host" />
                    )}

                    {p.id === user.id ? (
                        <Button variant="ghost" size="icon" onClick={toggleMute} className="h-6 w-6">
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-green-500" />}
                        </Button>
                    ) : (
                      p.id !== hostId && <Mic className="h-4 w-4 text-green-500" />
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}
