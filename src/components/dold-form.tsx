import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';

const client = hc<RouteType>('/');

export function DoldForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [loading, setLoading] = useState(false);
  const [sharedURL, setSharedURL] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    setLoading(true);

    const response = await client.api.encrypt.$post({
      json: {
        message: formData.get('message') as string,
      },
    });

    if (response.ok) {
      toast('Message encrypted successfully!');
      setLoading(false);
    }

    const result = await response.json();

    if ('error' in result) {
      setLoading(false);
      return;
    }

    const { id, doldKey } = result;
    const url = new URL(window.location.href);
    url.pathname = `/${id}`;
    url.searchParams.set('doldKey', doldKey);
    setSharedURL(url.toString());
    setLoading(false);
  }, []);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Encrypt your message with Dold</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  required
                  minLength={5}
                  maxLength={500}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Encrypt
                </Button>
              </div>
              {sharedURL && (
                <div className="text-sm text-muted-foreground">
                  Your encrypted message is ready! Share this URL:
                  <div className="mt-2">
                    <a
                      href={sharedURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {sharedURL}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
