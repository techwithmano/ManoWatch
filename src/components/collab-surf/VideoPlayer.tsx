'use client';

import { useEffect, useRef } from 'react';
import type { PlayerState } from './types';
import { CardContent } from '@/components/ui/card';
import { Film } from 'lucide-react';

type VideoPlayerProps = {
  playerState: PlayerState;
  setPlayerState: (state: PlayerState) => void;
  isHost: boolean;
};

export default function VideoPlayer({
  playerState,
  setPlayerState,
  isHost,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSeeking = useRef(false);

  // Sync local video player with the shared state from Firestore
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sync URL
    if (playerState.videoUrl && video.src !== playerState.videoUrl) {
      video.src = playerState.videoUrl;
    }

    // Sync Play/Pause state
    if (playerState.isPlaying && video.paused) {
      video.play().catch(e => console.error("Video play failed:", e));
    } else if (!playerState.isPlaying && !video.paused) {
      video.pause();
    }

    // Sync current time, but avoid syncing during local seeking
    const timeDifference = Math.abs(video.currentTime - playerState.currentTime);
    if (timeDifference > 1.5 && !isSeeking.current) {
        video.currentTime = playerState.currentTime;
    }
  }, [playerState]);


  const handlePlay = () => {
    if (isHost) {
      setPlayerState({ ...playerState, isPlaying: true });
    }
  };

  const handlePause = () => {
    if (isHost) {
      setPlayerState({ ...playerState, isPlaying: false });
    }
  };

  const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video || !isHost || isSeeking.current) return;

      // Update remote state periodically
      const timeDifference = Math.abs(video.currentTime - playerState.currentTime);
      if(timeDifference > 1) {
          setPlayerState({ ...playerState, currentTime: video.currentTime });
      }
  };
  
  const handleSeek = () => {
      const video = videoRef.current;
      if(video && isHost) {
          setPlayerState({ ...playerState, currentTime: video.currentTime });
      }
      isSeeking.current = false;
  };

  if (!playerState.videoUrl) {
    return (
      <CardContent className="flex-1 p-0 relative flex flex-col items-center justify-center bg-muted/20">
        <Film className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {isHost ? "Paste a video URL above to start the party!" : "Waiting for the host to select a video..."}
        </p>
      </CardContent>
    );
  }

  return (
    <CardContent className="flex-1 p-0 relative flex flex-col bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={() => isSeeking.current = true}
        onSeeked={handleSeek}
        controls={isHost}
      />
    </CardContent>
  );
}
