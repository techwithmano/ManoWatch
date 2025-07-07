import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function BackendSetup() {
  return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle className="font-bold">YOU NEED TO DO THIS STEP</AlertTitle>
      <AlertDescription>
        <p className="font-semibold mt-2">To make CollabSurf fully functional, you need to set up the backend:</p>
        <ol className="list-decimal list-inside space-y-2 mt-2 text-xs">
          <li>
            <strong>Set up a server:</strong> This application requires a long-running Node.js server to manage the headless browser (Puppeteer/Playwright) and the WebSocket connections. Vercel's serverless functions are not suitable for this. Consider services like Render, Fly.io, or a traditional VPS.
          </li>
          <li>
            <strong>Implement the WebSocket server:</strong> Create a WebSocket server (e.g., using the `ws` library) that broadcasts browser events (clicks, scrolls, typing) and chat messages to all connected clients.
          </li>
          <li>
            <strong>Integrate a headless browser:</strong> Use Puppeteer or Playwright on your server to launch a cloud browser. Your WebSocket server will translate client events into browser actions.
          </li>
          <li>
            <strong>Stream the browser view:</strong> Capture the browser viewport (as video or a sequence of images) and stream it to all clients via WebRTC or WebSockets for real-time viewing. Audio also needs to be captured and streamed.
          </li>
          <li>
            <strong>Connect the frontend:</strong> Replace the mock data and functions in the frontend with a real WebSocket client that connects to your server. This would typically involve creating a custom hook (e.g., `useCollabSurfSocket`) to handle real-time data.
          </li>
        </ol>
      </AlertDescription>
    </Alert>
  );
}
