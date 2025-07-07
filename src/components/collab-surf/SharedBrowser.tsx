'use client';
import { useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import Toolbar from './Toolbar';
import type { BrowserState } from './types';

type SharedBrowserProps = {
  sessionId: string;
  browserState: BrowserState;
  navigate: (url: string) => void;
};

export default function SharedBrowser({
  sessionId,
  browserState,
  navigate,
}: SharedBrowserProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        const newUrl = iframe.contentWindow.location.href;
        // prevent feedback loop and updates from about:blank
        if (newUrl !== 'about:blank' && newUrl !== browserState.url) {
          navigate(newUrl);
        }
      } catch (error) {
        // This error is expected when the iframe navigates to a cross-origin page.
        // We can't access location.href, but the user's navigation is complete.
        // The shared state will remain on the last accessible URL.
        console.log('Could not access iframe URL due to cross-origin policy.');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border">
      <Toolbar
        browserState={browserState}
        navigate={navigate}
        iframeRef={iframeRef}
      />
      <CardContent className="flex-1 p-0 relative flex flex-col">
        <iframe
          ref={iframeRef}
          src={browserState.url}
          className="w-full h-full border-0"
          title="Shared Browser"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
          onLoad={handleIframeLoad}
        ></iframe>
      </CardContent>
    </div>
  );
}
