import {} from 'hono';
import type { Meta } from '@/types';

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props: Meta):
      | Response
      | Promise<Response>;
  }
}

declare module '@hono/react-renderer' {
  interface Props extends Meta {
    clientScript?: string;
  }
}
