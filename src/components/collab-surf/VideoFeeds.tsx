
'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User } from './types';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { MicOff, VideoOff } from 'lucide-react';

type VideoFeedsProps = {
  user: User;
  sessionId: string;
};

export default function VideoFeeds({ user, sessionId }: VideoFeedsProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { participants } = useChat(sessionId, user);

    const allParticipants = Array.from(new Set([user, ...participants].map(p => p.name)))
    .map(name => {
        return [user, ...participants].find(p => p.name === name)!
    });

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

  return (
    <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Local User Video */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {user.name} (You)
                </div>
                 {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                       <VideoOff className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">No Camera</p>
                    </div>
                )}
            </div>

            {/* Remote Users Placeholder */}
            {allParticipants.filter(p => p.name !== user.name).map(p => (
                 <div key={p.name} className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl">{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                     </div>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {p.name}
                    </div>
                     <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                        <MicOff className="h-4 w-4 text-white" />
                    </div>
                </div>
            ))}
        </div>
         {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera and Microphone Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera and microphone access to participate in the video call. You may need to change permissions in your browser's settings.
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
