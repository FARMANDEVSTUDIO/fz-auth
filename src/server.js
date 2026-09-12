require('dotenv').config();
const Fastify = require('fastify');
const rateLimit = require('@fastify/rate-limit');
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');
const clientRoutes = require('./routes/client');
const adminRoutes = require('./routes/admin');

const app = Fastify({ logger: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function main() {
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  app.get('/', async () => ({ name: 'FZ Auth', status: 'online', version: '1.0' }));

  app.get('/health', async (req, reply) => {
    try {
      await pool.query('SELECT 1');
      return { ok: true, db: 'connected' };
    } catch (e) {
      reply.code(500);
      return { ok: false, db: 'error', message: e.message };
    }
  });

  const webRoot = path.join(__dirname, '..', 'web');

  app.get('/panel', async (req, reply) => reply.redirect('/panel/'));

  app.get('/panel/*', async (req, reply) => {
    let filePath = req.url.replace(/^\/panel\/?/, '').split('?')[0];
    if (!filePath) filePath = 'index.html';
    const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(webRoot, safePath);
    if (!full.startsWith(webRoot)) return reply.code(403).send('Forbidden');
    const ext = path.extname(full);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    try {
      const content = fs.readFileSync(full);
      return reply.type(mime).send(content);
    } catch {
      return reply.code(404).send('Not found');
    }
  });

  await app.register(clientRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/admin' });

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  app.log.info(`FZ Auth API running on http://${host}:${port}`);
  app.log.info(`Web panel: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/panel/`);
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
