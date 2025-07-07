'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import Chat from './Chat';
import type { User } from './types';
import ParticipantList from './VideoFeeds';
import AudioPeers from './AudioPeers';
import { useWatchParty } from '@/hooks/useWatchParty';
import VideoPlayer from './VideoPlayer';
import WatchPartyControls from './WatchPartyControls';
import { useState } from 'react';

type CollabSurfProps = {
  user: User;
  sessionId: string;
};

export default function CollabSurf({ user, sessionId }: CollabSurfProps) {
  const [isHost, setIsHost] = useState(false);
  const { playerState, setPlayerState, setVideoUrl } = useWatchParty(sessionId, user.id, setIsHost);

  return (
    <div className="flex h-screen w-full bg-background font-body">
      <main className="flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-hidden">
        <ParticipantList user={user} sessionId={sessionId} />
        <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border">
          <WatchPartyControls
            setVideoUrl={setVideoUrl}
            playerState={playerState}
            setPlayerState={setPlayerState}
            isHost={isHost}
          />
          <VideoPlayer
            playerState={playerState}
            setPlayerState={setPlayerState}
            isHost={isHost}
          />
        </div>
        <AudioPeers user={user} sessionId={sessionId} />
      </main>
      <aside className="w-80 lg:w-96 bg-card border-l p-4 flex-col hidden md:flex">
        <Chat user={user} sessionId={sessionId} />
      </aside>
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-16 w-16 shadow-lg">
              <MessageSquare className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%] p-4 flex flex-col">
            <Chat user={user} sessionId={sessionId} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
