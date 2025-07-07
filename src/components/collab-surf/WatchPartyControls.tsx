'use client';
import { useState } from 'react';
import { Play, Pause, Link as LinkIcon, Forward, Rewind, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PlayerState } from './types';

type WatchPartyControlsProps = {
  setVideoUrl: (url: string) => void;
  playerState: PlayerState;
  setPlayerState: (state: PlayerState) => void;
  isHost: boolean;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
};

export default function WatchPartyControls({
  setVideoUrl,
  playerState,
  setPlayerState,
  isHost,
  onToggleFullscreen,
  isFullscreen,
}: WatchPartyControlsProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setVideoUrl(urlInput);
    }
  };

  const togglePlayPause = () => {
    setPlayerState({ ...playerState, isPlaying: !playerState.isPlaying });
  };

  const handleSeek = (amount: number) => {
    setPlayerState({ ...playerState, currentTime: Math.max(0, playerState.currentTime + amount) });
  };
  
  return (
    <div className="flex items-center flex-wrap gap-4 p-2 border-b bg-muted/50 rounded-t-lg">
      {isHost ? (
        <>
          <form onSubmit={handleUrlSubmit} className="relative flex-1 flex items-center gap-2 min-w-[300px]">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-background"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a direct video URL (.mp4, .webm)..."
            />
            <Button type="submit">Load</Button>
          </form>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleSeek(-10)} disabled={!playerState.videoUrl}>
              <Rewind />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlayPause} disabled={!playerState.videoUrl}>
              {playerState.isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleSeek(10)} disabled={!playerState.videoUrl}>
              <Forward />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1">
          <p className="text-sm text-muted-foreground px-2">Viewing as a guest. The host is in control.</p>
        </div>
      )}

      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToggleFullscreen} disabled={!playerState.videoUrl} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
    </div>
  );
}
