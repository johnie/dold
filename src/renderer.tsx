import { reactRenderer } from '@hono/react-renderer';
import {
  Script,
  Link,
  ViteClient,
  ReactRefresh,
} from 'vite-ssr-components/react';
import { DoldLogo } from '@/components/logo';

export const renderer = reactRenderer(
  ({ children, title, description, clientScript }) => {
    const scriptSrc = clientScript || '/src/client/index.tsx';
    return (
      <html lang="en" className="dark">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{title}</title>
          {description && <meta name="description" content={description} />}
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
          <Script src={scriptSrc} />
        </head>
        <body>
          <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
              <DoldLogo />
              {children}
            </div>
          </div>
        </body>
      </html>
    );
  }
);
