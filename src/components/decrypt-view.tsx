import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconInfoCircle,
} from "@tabler/icons-react";
import { hc } from "hono/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteType } from "@/index";

const client = hc<RouteType>("/");

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; error: string };

export const DecryptView = () => {
  const [state, setState] = useState<State>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (state.status !== "success") {
      return;
    }
    await navigator.clipboard.writeText(state.message);
    setCopied(true);
    toast("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [state]);

  const handleReveal = useCallback(async () => {
    const [, id] = window.location.pathname.split("/m/");

    if (!id) {
      setState({ error: "Invalid link. Missing ID.", status: "error" });
      return;
    }

    setState({ status: "loading" });

    try {
      const response = await client.api.decrypt.$post({
        json: { id },
      });

      const data = await response.json();
      if (response.status === 200) {
        setState({ message: data.message, status: "success" });
      } else {
        setState({
          error: data.error ?? "Failed to decrypt message.",
          status: "error",
        });
      }
    } catch {
      setState({
        error: "Something went wrong. Please try again.",
        status: "error",
      });
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {state.status === "success"
            ? "Decrypted message"
            : "You received a secret message"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "idle" && (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              This message will be permanently deleted after reading.
            </p>
            <Button onClick={handleReveal} className="w-full">
              Reveal message
            </Button>
          </div>
        )}

        {state.status === "loading" && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}

        {state.status === "success" && (
          <div className="flex flex-col gap-4">
            <div className="bg-muted relative rounded-md border p-4 pr-10 text-sm break-words whitespace-pre-wrap">
              {state.message}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2 size-7"
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

        {state.status === "error" && (
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
};
