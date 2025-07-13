import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';

const client = hc<RouteType>('/');

export function DoldForm({ className, ...props }: React.ComponentProps<'div'>) {
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    const response = await client.api.encrypt.$post({
      json: {
        message: formData.get('message') as string,
      },
    });

    if (response.ok) {
      toast('Message encrypted successfully!');
    }
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
