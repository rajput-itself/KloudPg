import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PROJECT_ROOT = path.resolve(__dirname);
const API_ROOT = path.resolve(PROJECT_ROOT, 'src/app/api');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }
      return [fullPath];
    })
  );
  return files.flat();
}

function parseSegment(segment) {
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const name = segment.slice(1, -1);
    return { type: 'dynamic', value: name };
  }
  return { type: 'static', value: segment };
}

async function loadRouteTable() {
  const allFiles = await walk(API_ROOT);
  const routeFiles = allFiles.filter((file) => file.endsWith(`${path.sep}route.js`));

  const routes = routeFiles.map((file) => {
    const relativeDir = path.relative(API_ROOT, path.dirname(file));
    const rawSegments = relativeDir === '' ? [] : relativeDir.split(path.sep).filter(Boolean);
    const segments = rawSegments.map(parseSegment);
    const dynamicCount = segments.filter((s) => s.type === 'dynamic').length;

    return {
      file,
      segments,
      dynamicCount,
    };
  });

  return routes.sort((a, b) => {
    if (a.dynamicCount !== b.dynamicCount) return a.dynamicCount - b.dynamicCount;
    return b.segments.length - a.segments.length;
  });
}

function matchApiRoute(routeTable, pathname) {
  const pathWithoutPrefix = pathname.replace(/^\/api\/?/, '');
  const incoming = pathWithoutPrefix === '' ? [] : pathWithoutPrefix.split('/').filter(Boolean);

  for (const route of routeTable) {
    if (route.segments.length !== incoming.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < route.segments.length; i += 1) {
      const routeSegment = route.segments[i];
      const incomingSegment = incoming[i];

      if (routeSegment.type === 'static') {
        if (routeSegment.value !== incomingSegment) {
          matched = false;
          break;
        }
      } else {
        params[routeSegment.value] = decodeURIComponent(incomingSegment);
      }
    }

    if (matched) {
      return { route, params };
    }
  }

  return null;
}

function buildWebRequest(req) {
  const headers = new Headers();

  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  });

  const origin = `http://${req.headers.host || 'localhost:5173'}`;
  const url = new URL(req.url || '/', origin);

  const init = {
    method: req.method,
    headers,
  };

  const method = (req.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    init.body = req;
    init.duplex = 'half';
  }

  return new Request(url.toString(), init);
}

async function writeWebResponse(nodeRes, webResponse) {
  nodeRes.statusCode = webResponse.status;

  if (typeof webResponse.headers.getSetCookie === 'function') {
    const cookies = webResponse.headers.getSetCookie();
    if (cookies.length > 0) {
      nodeRes.setHeader('Set-Cookie', cookies);
    }
  }

  webResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      nodeRes.setHeader(key, value);
    }
  });

  const bodyBuffer = Buffer.from(await webResponse.arrayBuffer());
  nodeRes.end(bodyBuffer);
}

function nextApiAdapter() {
  let routeTable = [];
  let routeTablePromise = null;

  async function refreshRouteTable() {
    routeTablePromise = loadRouteTable();
    routeTable = await routeTablePromise;
    return routeTable;
  }

  async function apiMiddleware(req, res, next, loadModule) {
    if (!req.url) {
      next();
      return;
    }

    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/api')) {
      next();
      return;
    }

    if (routeTablePromise) {
      await routeTablePromise;
    }

    let matched = matchApiRoute(routeTable, pathname);

    if (!matched) {
      await refreshRouteTable();
      matched = matchApiRoute(routeTable, pathname);
    }

    if (!matched) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }

    try {
      const routeModule = await loadModule(matched.route.file);
      const method = (req.method || 'GET').toUpperCase();
      const handler = routeModule[method];

      if (!handler) {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: `Method ${method} not allowed` }));
        return;
      }

      const request = buildWebRequest(req);
      const context = { params: Promise.resolve(matched.params) };
      const result = await handler(request, context);

      if (!(result instanceof Response)) {
        const fallback = new Response(JSON.stringify(result ?? null), {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        });
        await writeWebResponse(res, fallback);
        return;
      }

      await writeWebResponse(res, result);
    } catch (error) {
      console.error('API adapter error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  return {
    name: 'next-api-adapter',
    async configureServer(server) {
      await refreshRouteTable();
      server.watcher.on('add', async (file) => {
        if (file.startsWith(API_ROOT) && file.endsWith(`${path.sep}route.js`)) {
          await refreshRouteTable();
        }
      });
      server.watcher.on('unlink', async (file) => {
        if (file.startsWith(API_ROOT) && file.endsWith(`${path.sep}route.js`)) {
          await refreshRouteTable();
        }
      });
      server.middlewares.use((req, res, next) => {
        void apiMiddleware(req, res, next, (id) => server.ssrLoadModule(id));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nextApiAdapter()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.(js|jsx)$/, 
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(PROJECT_ROOT, 'src'),
      'next/link': path.resolve(PROJECT_ROOT, 'src/shims/next-link.js'),
      'next/navigation': path.resolve(PROJECT_ROOT, 'src/shims/next-navigation.js'),
      'next/server': path.resolve(PROJECT_ROOT, 'src/shims/next-server.js'),
    },
  },
});
