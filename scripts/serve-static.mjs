import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.env.PORT || '4173');
const root = resolve('.');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send404(res) {
  res.statusCode = 404;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = normalize(decoded).replace(/^\/+/, '');
  let filePath = join(root, clean || 'index.html');

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath) && clean && !extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (existsSync(htmlPath)) filePath = htmlPath;
  }

  if (!filePath.startsWith(root)) return null;
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return filePath;
}

const server = createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const path = resolvePath(req.url || '/');
  if (!path) {
    send404(res);
    return;
  }

  const type = contentTypes[extname(path)] || 'application/octet-stream';
  res.setHeader('content-type', type);

  if (method === 'HEAD') {
    res.statusCode = 200;
    res.end();
    return;
  }

  createReadStream(path).on('error', () => send404(res)).pipe(res);
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
});
