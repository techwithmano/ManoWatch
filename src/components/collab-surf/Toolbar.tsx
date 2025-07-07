'use client';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { summarizeUrl } from '@/ai/flows/summarize-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { BrowserState } from './types';

type ToolbarProps = {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  browserState: BrowserState;
  navigate: (url: string) => void;
};

export default function Toolbar({
  iframeRef,
  browserState,
  navigate,
}: ToolbarProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (browserState.url) {
      setCurrentUrl(browserState.url);
    }
  }, [browserState.url]);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(currentUrl);
  };

  const handleBack = () => {
    iframeRef.current?.contentWindow?.history.back();
  };
  const handleForward = () => {
    iframeRef.current?.contentWindow?.history.forward();
  };
  const handleReload = () => {
    iframeRef.current?.contentWindow?.location.reload();
  };

  const handleSummarize = async () => {
    if (!browserState.url || browserState.url === 'about:blank') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No URL to summarize.',
      });
      return;
    }
    setIsSummarizing(true);
    try {
      const result = await summarizeUrl({ url: browserState.url });
      toast({
        title: 'Summary Complete',
        description: (
          <p className="mt-2 w-full rounded-md p-2">{result.summary}</p>
        ),
        duration: 15000,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate summary.',
      });
      console.error(error);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-2 p-2 border-b bg-muted/50 rounded-t-lg">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleForward}>
          <ArrowRight />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleReload}>
          <RotateCw />
        </Button>
      </div>
      <form
        onSubmit={handleGo}
        className="relative flex-1 flex items-center gap-2 min-w-[200px]"
      >
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-background"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          placeholder="https://example.com"
        />
        <Button type="submit">Go</Button>
      </form>
      <Button
        onClick={handleSummarize}
        disabled={isSummarizing || !browserState.url}
      >
        {isSummarizing ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles />
        )}
        Summarize Page
      </Button>
    </div>
  );
}
