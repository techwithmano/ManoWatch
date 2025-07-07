'use client';
import { useChat } from '@/hooks/useChat';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles } from 'lucide-react';
import type { User, BrowserState } from './types';
import { useToast } from '@/hooks/use-toast';
import { answerQuestionAboutUrl } from '@/ai/flows/ai-chat-assistant';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type ChatProps = {
  user: User;
  sessionId: string;
  browserState: BrowserState;
};

const AI_USER: User = { name: 'AI Assistant', id: 'ai-assistant' };

export default function Chat({ user, sessionId, browserState }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, allParticipants: participants, sendMessage } = useChat(sessionId, user);
  const { toast } = useToast();

  const allParticipants = useMemo(() => {
    const currentParticipants = [...participants];
    const aiParticipantIsActive = messages.some(m => m.author.id === AI_USER.id);
    if(aiParticipantIsActive && !currentParticipants.some(p => p.id === AI_USER.id)) {
      currentParticipants.push(AI_USER);
    }
    return currentParticipants;
  }, [messages, participants]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isProcessingAi) return;

    sendMessage(text);
    setNewMessage('');

    if (text.toLowerCase().startsWith('@ai')) {
      setIsProcessingAi(true);
      const question = text.substring(3).trim();
      const messagesCol = collection(db, 'sessions', sessionId, 'messages');

      const sendAiResponse = async (responseText: string) => {
         await addDoc(messagesCol, {
            author: AI_USER,
            text: responseText,
            timestamp: serverTimestamp(),
        });
      };
      
      try {
        if (!question) {
          await sendAiResponse("Please provide a question after '@ai'.");
          return;
        }

        if (!browserState.url || browserState.url === 'about:blank' || !browserState.url.startsWith('http')) {
          await sendAiResponse("I can't answer questions until you navigate to a valid webpage.");
          return;
        }

        const result = await answerQuestionAboutUrl({ url: browserState.url, question });
        await sendAiResponse(result.answer);

      } catch (error) {
        console.error('AI Chat Error:', error);
        toast({
          variant: 'destructive',
          title: 'AI Error',
          description: 'The AI assistant could not be reached. Please try again later.',
        });
      } finally {
        setIsProcessingAi(false);
      }
    }
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
                    <Avatar key={p.id} className="border-2 border-card h-8 w-8">
                      <AvatarFallback className={p.id === AI_USER.id ? 'bg-accent/80' : ''}>
                        {p.id === AI_USER.id ? <Sparkles className="w-4 h-4 text-accent-foreground"/> : p.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
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
              className={`flex items-start gap-3 ${msg.author.id === user.id ? 'justify-end' : ''}`}
            >
              {msg.author.id !== user.id && (
                <Avatar className="h-8 w-8">
                   <AvatarFallback className={msg.author.id === AI_USER.id ? 'bg-accent/80' : ''}>
                    {msg.author.id === AI_USER.id ? <Sparkles className="w-4 h-4 text-accent-foreground"/> : msg.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[75%] rounded-lg p-3 text-sm ${
                  msg.author.id === user.id
                    ? 'bg-primary text-primary-foreground'
                    : msg.author.id === AI_USER.id 
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.author.id !== user.id && <p className="font-semibold mb-1">{msg.author.name}</p>}
                <p>{msg.text}</p>
              </div>
              {msg.author.id === user.id && (
                 <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.author.name.charAt(0).toUpperCase()}</AvatarFallback>
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
          placeholder="Ask @ai about the page..."
          autoComplete="off"
          disabled={isProcessingAi}
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={isProcessingAi}>
          {isProcessingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
