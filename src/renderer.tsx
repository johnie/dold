import { reactRenderer } from '@hono/react-renderer';
import {
  Script,
  Link,
  ViteClient,
  ReactRefresh,
} from 'vite-ssr-components/react';

export const renderer = reactRenderer(({ children, title, description }) => {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <ViteClient />
        <ReactRefresh />
        <Link href="/src/style.css" rel="stylesheet" />
        <Script src="/src/client/index.tsx" />
      </head>
      <body>{children}</body>
    </html>
  );
});
