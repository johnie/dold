import { Hono } from 'hono';
import { renderer } from '@/renderer';
import { cors } from 'hono/cors';
import router from '@/routes';
import type { DoldApp } from '@/types';
import { titleTemplate } from './lib/utils';

const app = new Hono<DoldApp>();

app.use('*', cors());

app.use(renderer);

app.get('/', (c) => {
  return c.render(<div id="root"></div>, {
    title: titleTemplate('Home'),
    description: 'Welcome to Dold, your secure message encryption service.',
  });
});

const apiRoutes = app.route('/api', router);

export type RouteType = typeof apiRoutes;

export default app;
