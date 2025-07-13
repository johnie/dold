import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCallback } from 'react';
import { toast } from 'sonner';
// import { hc } from 'hono/client';
// import type { InferResponseType } from 'hono/client';
// import type { RouteType } from '@/index';
// import type { AppType } from '@/routes';

// const client = hc<AppType>('/');

export function DoldForm({ className, ...props }: React.ComponentProps<'div'>) {
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: formData.get('message'),
      }),
    });

    if (!response.ok) {
      console.error('Error:', response.statusText);
    } else {
      const data = await response.json();
      console.log('Success:', data);
      toast('Message encrypted successfully!');
    }
  }, []);
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
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
