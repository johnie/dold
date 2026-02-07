import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';
import { Copy, Check } from 'lucide-react';

const client = hc<RouteType>('/');

const TTL_OPTIONS = [
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
] as const;

export function DoldForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    const response = await client.api.encrypt.$post({
      json: {
        message: formData.get('message') as string,
        expirationTtl: Number(formData.get('ttl')),
      },
    });

    if (response.ok) {
      const { id } = await response.json();
      const url = `${window.location.origin}/m/${id}`;
      setShareUrl(url);
      setCopied(false);
      toast('Message encrypted successfully!');
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleReset = useCallback(() => {
    setShareUrl(null);
    setCopied(false);
  }, []);

  if (shareUrl) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Your secure link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono truncate"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This message can only be read once. After opening, it will be
                permanently deleted.
              </p>
              <Button variant="outline" onClick={handleReset} className="w-full">
                Encrypt another message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <div className="grid gap-3">
                <Label htmlFor="ttl">Expires after</Label>
                <select
                  id="ttl"
                  name="ttl"
                  defaultValue={3600}
                  className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {TTL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
