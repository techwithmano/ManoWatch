import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function BackendSetup() {
  return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle className="font-bold">How CollabSurf Works</AlertTitle>
      <AlertDescription>
        <p className="font-semibold mt-2">This app is powered by Firebase!</p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
          <li>
            <strong>Real-time Sync:</strong> All session data, including the
            browser URL and chat messages, is synchronized in real-time using
            Cloud Firestore.
          </li>
          <li>
            <strong>Shared Browser:</strong> The shared browser is an{' '}
            <code>&lt;iframe&gt;</code>. When one user navigates, the URL is
            updated in Firestore, and all other clients' iframes are updated
            instantly.
          </li>
          <li>
            <strong>Known Limitation:</strong> Not all websites can be loaded in
            the <code>&lt;iframe&gt;</code> due to security policies (e.g.,{' '}
            <code>X-Frame-Options</code> header).
          </li>
           <li>
            <strong>Next Steps:</strong> To use this, create a Firebase project and add your configuration to the <code>.env</code> file.
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}
