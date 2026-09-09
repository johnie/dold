import type { Meta } from "@/types";

declare module "@hono/react-renderer" {
  interface Props extends Meta {
    title: string;
  }
}
