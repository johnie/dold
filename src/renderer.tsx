import { reactRenderer } from '@hono/react-renderer';
import {
  Script,
  Link,
  ViteClient,
  ReactRefresh,
} from 'vite-ssr-components/react';

export const renderer = reactRenderer(({ children }) => {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <ViteClient />
        <ReactRefresh />
        <Link href="/src/style.css" rel="stylesheet" />
        <Script src="/src/client/index.tsx" />
      </head>
      <body>{children}</body>
    </html>
  );
});
