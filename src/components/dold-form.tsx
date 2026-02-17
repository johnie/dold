import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { hc } from 'hono/client';
import type { RouteType } from '@/index';
import { TTL_OPTIONS } from '@/lib/schemas';
import { IconCopy, IconCheck, IconInfoCircle } from '@tabler/icons-react';

const client = hc<RouteType>('/');

const formSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be at most 5000 characters'),
  ttl: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function DoldForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [selectedTtl, setSelectedTtl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      ttl: 3600,
    },
  });

  const onSubmit = useCallback(async (values: FormValues) => {
    const response = await client.api.encrypt.$post({
      json: {
        message: values.message,
        expirationTtl: values.ttl,
      },
    });

    if (response.ok) {
      const { id } = await response.json();
      const url = `${window.location.origin}/m/${id}`;
      setShareUrl(url);
      setSelectedTtl(
        TTL_OPTIONS.find((o) => o.value === values.ttl)?.label ?? null
      );
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
    setSelectedTtl(null);
    setCopied(false);
    form.reset();
  }, [form]);

  if (shareUrl) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Your secure link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={shareUrl}
                  className="font-mono truncate"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <IconCheck className="size-4" />
                    ) : (
                      <IconCopy className="size-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {selectedTtl && (
                <Badge variant="secondary">Expires in {selectedTtl}</Badge>
              )}
              <Alert>
                <IconInfoCircle className="size-4" />
                <AlertDescription>
                  This message can only be read once. After opening, it will be
                  permanently deleted.
                </AlertDescription>
              </Alert>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ttl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires after</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TTL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Encrypt
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
