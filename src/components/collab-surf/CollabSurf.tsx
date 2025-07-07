import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import Chat from './Chat';
import SharedBrowser from './SharedBrowser';
import type { User } from './types';
import { useSharedBrowser } from '@/hooks/useSharedBrowser';
import ParticipantList from './VideoFeeds';

type CollabSurfProps = {
  user: User;
  sessionId: string;
};

export default function CollabSurf({ user, sessionId }: CollabSurfProps) {
  const { browserState, navigate } = useSharedBrowser(sessionId);

  return (
    <div className="flex h-screen w-full bg-background font-body">
      <main className="flex-1 flex flex-col p-2 md:p-4 gap-4 overflow-hidden">
        <ParticipantList user={user} sessionId={sessionId} />
        <SharedBrowser
          sessionId={sessionId}
          browserState={browserState}
          navigate={navigate}
        />
      </main>
      <aside className="w-80 lg:w-96 bg-card border-l p-4 flex-col hidden md:flex">
        <Chat user={user} sessionId={sessionId} browserState={browserState} />
      </aside>
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-16 w-16 shadow-lg">
              <MessageSquare className="h-8 w-8" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%] p-4 flex flex-col">
            <Chat user={user} sessionId={sessionId} browserState={browserState} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
