import { Hono } from 'hono';
import type { Handler } from 'hono';
import { renderer } from '@/renderer';
import { secureHeaders } from 'hono/secure-headers';
import { csrf } from 'hono/csrf';
import { titleTemplate } from '@/lib/utils';
import type { DoldApp } from '@/types';
import encryptRoute from '@/routes/encrypt';
import decryptRoute from '@/routes/decrypt';

const app = new Hono<DoldApp>();

app.use('*', secureHeaders());
app.use('*', csrf());
app.use(renderer);

const renderShell: Handler<DoldApp> = (c) => {
  return c.render(<div id="root"></div>, {
    title: titleTemplate('Home'),
    description: 'Welcome to Dold, your secure message encryption service.',
  });
};

app.get('/', renderShell);
app.get('/m/:id', renderShell);

const routes = app
  .route('/api/encrypt', encryptRoute)
  .route('/api/decrypt', decryptRoute);

export type RouteType = typeof routes;

export default app;
