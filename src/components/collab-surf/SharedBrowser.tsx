'use client';
import { useRef } from 'react';
import { CardContent } from '@/components/ui/card';
import Toolbar from './Toolbar';
import BackendSetup from './BackendSetup';
import { useSharedBrowser } from '@/hooks/useSharedBrowser';

type SharedBrowserProps = {
  sessionId: string;
};

export default function SharedBrowser({ sessionId }: SharedBrowserProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { browserState, navigate } = useSharedBrowser(sessionId);

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

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <BackendSetup />
          </div>
        </div>
      </CardContent>
    </div>
  );
}
