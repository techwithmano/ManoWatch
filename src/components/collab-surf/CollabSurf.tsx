import SharedBrowser from './SharedBrowser';
import Chat from './Chat';
import type { User } from './types';

type CollabSurfProps = {
  user: User;
};

export default function CollabSurf({ user }: CollabSurfProps) {
  return (
    <div className="flex h-screen w-full bg-background font-body">
      <main className="flex-1 flex flex-col p-2 md:p-4 gap-4">
        <SharedBrowser />
      </main>
      <aside className="w-80 lg:w-96 bg-card border-l p-4 flex-col hidden md:flex">
        <Chat user={user} />
      </aside>
    </div>
  );
}
