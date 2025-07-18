import { use, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const client = hc<RouteType>('/');

const fetchMessage = async () => {
  const currentUrl = new URL(window.location.href);
  const id = currentUrl.pathname.split('/')[1];
  const doldKey = currentUrl.searchParams.get('doldKey') || '';

  if (!id || !doldKey) {
    throw new Error('ID and Dold Key are required');
  }
  const response = await client.api.decrypt.$post({
    json: {
      id,
      doldKey,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch message');
  }

  const result = await response.json();

  return result;
};

export function DecryptMessage({
  promise,
}: {
  promise: Promise<{ message: string }>;
}) {
  const { message } = use(promise);

  return (
    <pre className="p-2 whitespace-pre-wrap break-words bg-accent rounded border">
      {message}
    </pre>
  );
}

export function DecryptPage() {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <div className="text-red-500">
          <h2>Error: {error.message}</h2>
        </div>
      )}
    >
      <Card>
        <CardContent>
          <Suspense
            fallback={
              <pre className="p-2 whitespace-pre-wrap break-words bg-accent rounded border">
                Loading...
              </pre>
            }
          >
            <DecryptMessage promise={fetchMessage()} />
          </Suspense>
        </CardContent>
        <CardFooter>
          This message will be deleted after decryption for security.
          <a href="/" className="text-blue-500 hover:underline">
            Go back to home
          </a>
        </CardFooter>
      </Card>
    </ErrorBoundary>
  );
}
export default DecryptPage;
