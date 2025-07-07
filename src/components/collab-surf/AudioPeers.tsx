
'use client';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { User } from './types';
import { useEffect, useRef } from 'react';

type AudioPeersProps = {
  user: User;
  sessionId: string;
};

export default function AudioPeers({ user, sessionId }: AudioPeersProps) {
  const { remoteStreams } = useWebRTC(sessionId, user);
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({});

  useEffect(() => {
    const currentAudioRefs = audioRefs.current;

    remoteStreams.forEach(rs => {
      const audioEl = currentAudioRefs[rs.peerId];
      if (audioEl && audioEl.srcObject !== rs.stream) {
        audioEl.srcObject = rs.stream;
      }
    });

  }, [remoteStreams]);

  return (
    <div>
      {remoteStreams.map(rs => (
        <audio
          key={rs.peerId}
          autoPlay
          playsInline
          ref={el => {
            audioRefs.current[rs.peerId] = el;
          }}
        />
      ))}
    </div>
  );
}
