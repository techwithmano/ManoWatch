import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, RotateCw, Lock } from 'lucide-react';

export default function Toolbar() {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/50 rounded-t-lg">
      <Button variant="ghost" size="icon" disabled>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled>
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled>
        <RotateCw className="h-4 w-4" />
      </Button>
      <div className="relative flex-1">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-background"
          defaultValue="https://collabsurf.dev/session"
          disabled
        />
      </div>
      <Button disabled>Go</Button>
    </div>
  );
}
