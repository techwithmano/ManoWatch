
'use client';
import { useEffect, useRef } from 'react';
import type { RemoteStream } from '@/hooks/useWebRTC';

type AudioPeersProps = {
  remoteStreams: RemoteStream[];
};

export default function AudioPeers({ remoteStreams }: AudioPeersProps) {
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
