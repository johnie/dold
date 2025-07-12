import { Hono } from 'hono';
import encryptRouter from './encrypt';
import decryptRouter from './decrypt';

const router = new Hono();

router.route('/encrypt', encryptRouter);
router.route('/decrypt', decryptRouter);

export default router;
