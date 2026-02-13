import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useCallback, useState } from 'react';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconInfoCircle,
} from '@tabler/icons-react';
import { toast } from 'sonner';

const client = hc<RouteType>('/');

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; error: string };

export function DecryptView() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (state.status !== 'success') return;
    await navigator.clipboard.writeText(state.message);
    setCopied(true);
    toast('Message copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [state]);

  const handleReveal = useCallback(async () => {
    const id = window.location.pathname.split('/m/')[1];

    if (!id) {
      setState({ status: 'error', error: 'Invalid link. Missing ID.' });
      return;
    }

    setState({ status: 'loading' });

    try {
      const response = await client.api.decrypt.$post({
        json: { id },
      });

      if (response.status === 200) {
        const data = await response.json();
        setState({ status: 'success', message: data.message });
      } else {
        const data = await response.json();
        setState({
          status: 'error',
          error: data.error ?? 'Failed to decrypt message.',
        });
      }
    } catch {
      setState({
        status: 'error',
        error: 'Something went wrong. Please try again.',
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {state.status === 'success'
            ? 'Decrypted message'
            : 'You received a secret message'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === 'idle' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This message will be permanently deleted after reading.
            </p>
            <Button onClick={handleReveal} className="w-full">
              Reveal message
            </Button>
          </div>
        )}

        {state.status === 'loading' && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}

        {state.status === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="relative rounded-md border bg-muted p-4 pr-10 text-sm whitespace-pre-wrap break-words">
              {state.message}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <IconCheck className="size-4" />
                ) : (
                  <IconCopy className="size-4" />
                )}
              </Button>
            </div>
            <Alert>
              <IconInfoCircle className="size-4" />
              <AlertDescription>
                This message has been deleted and cannot be viewed again.
              </AlertDescription>
            </Alert>
            <Button variant="ghost" asChild className="w-full">
              <a href="/">Encrypt a new message</a>
            </Button>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col gap-4">
            <Alert variant="destructive">
              <IconAlertTriangle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
            <Button variant="ghost" asChild className="w-full">
              <a href="/">Encrypt a new message</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
