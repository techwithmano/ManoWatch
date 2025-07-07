'use client';
import { useChat } from '@/hooks/useChat';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import type { User } from './types';

type ChatProps = {
  user: User;
  sessionId: string;
};

export default function Chat({ user, sessionId }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, participants, sendMessage } = useChat(sessionId, user);

  const allParticipants = [
    user,
    ...participants.filter((p) => p.name !== user.name),
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
    setNewMessage('');
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-full">
        <div className="pb-4">
            <h2 className="text-xl font-bold font-headline">Chat</h2>
            <div className="flex items-center space-x-2 mt-2">
                <p className="text-sm text-muted-foreground">Participants:</p>
                <div className="flex -space-x-2">
                {allParticipants.map((p) => (
                    <Avatar key={p.name} className="border-2 border-card h-8 w-8">
                      <AvatarFallback>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ))}
                </div>
            </div>
        </div>

      <ScrollArea className="flex-1 -mx-4" ref={scrollAreaRef}>
        <div className="px-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.author === user.name ? 'justify-end' : ''}`}
            >
              {msg.author !== user.name && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-lg p-3 text-sm ${
                  msg.author === user.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.author !== user.name && <p className="font-semibold mb-1">{msg.author}</p>}
                <p>{msg.text}</p>
              </div>
              {msg.author === user.name && (
                 <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="pt-4 flex items-center gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <Button type="submit" size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
