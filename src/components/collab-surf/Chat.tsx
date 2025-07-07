'use client';
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import type { User, Message } from './types';

type ChatProps = {
  user: User;
};

const initialMessages: Message[] = [
  { id: '1', author: 'System', text: 'Welcome to CollabSurf! Start browsing together.', timestamp: Date.now() - 2000 },
  { id: '2', author: 'Alice', text: 'Hey everyone! What should we look at first?', timestamp: Date.now() - 1000 },
];

const participants: User[] = [{ name: 'Alice' }, { name: 'Bob' }];

export default function Chat({ user }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const allParticipants = [user, ...participants];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const msg: Message = {
        id: crypto.randomUUID(),
        author: user.name,
        text: newMessage.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
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
              {msg.author !== user.name && msg.author !== 'System' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-lg p-3 text-sm ${
                  msg.author === user.name
                    ? 'bg-primary text-primary-foreground'
                    : msg.author === 'System' ? 'text-center w-full bg-transparent text-muted-foreground' : 'bg-muted'
                }`}
              >
                {msg.author !== 'System' && msg.author !== user.name && <p className="font-semibold mb-1">{msg.author}</p>}
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
