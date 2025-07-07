'use client';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeSelection } from '@/ai/flows/summarize-selection';

type SummarizeTooltipProps = {
  children: ReactNode;
};

export default function SummarizeTooltip({ children }: SummarizeTooltipProps) {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [style, setStyle] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const popoverRef =  useRef<HTMLDivElement>(null);


  const handleMouseUp = useCallback((event: MouseEvent) => {
    // a small delay to allow the selection to be finalized.
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? '';
      
      if (text && text.length > 20) {
        if(popoverRef.current && popoverRef.current.contains(event.target as Node)) {
            return;
        }

        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setStyle({
          position: 'absolute',
          top: `${rect.top + rect.height + window.scrollY + 5}px`,
          left: `${rect.left + window.scrollX + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        });
        setPopoverOpen(true);
      } else {
        setPopoverOpen(false);
      }
    }, 10);
  }, []);

  const handleSummarize = async () => {
    if (!selectedText) return;
    setIsLoading(true);
    try {
      const result = await summarizeSelection({ selectedText });
      toast({
        title: "Summary Complete",
        description: (
          <p className="mt-2 w-full rounded-md p-2">
            {result.summary}
          </p>
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
      setIsLoading(false);
      setPopoverOpen(false);
      window.getSelection()?.removeAllRanges();
    }
  };
  
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);
  
  return (
    <>
      {children}
      <div ref={popoverRef}>
        <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <div style={style} className="z-10" />
          </PopoverTrigger>
          <PopoverContent className="w-auto" align="center" sideOffset={10}>
            <Button onClick={handleSummarize} disabled={isLoading} size="sm">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Summarize
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
