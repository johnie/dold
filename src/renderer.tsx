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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
