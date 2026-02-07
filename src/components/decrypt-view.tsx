import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallback, useState } from 'react';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';

const client = hc<RouteType>('/');

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; error: string };

export function DecryptView() {
  const [state, setState] = useState<State>({ status: 'idle' });

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
          <p className="text-sm text-muted-foreground">Decrypting...</p>
        )}

        {state.status === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border bg-muted p-4 text-sm whitespace-pre-wrap break-words">
              {state.message}
            </div>
            <p className="text-sm text-muted-foreground">
              This message has been deleted and cannot be viewed again.
            </p>
            <Button variant="ghost" asChild className="w-full">
              <a href="/">Encrypt a new message</a>
            </Button>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-destructive">{state.error}</p>
            <Button variant="ghost" asChild className="w-full">
              <a href="/">Encrypt a new message</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
