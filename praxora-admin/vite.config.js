import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.PORT || process.env.PORT || 5000;
  const backendHost = env.BACKEND_HOST || process.env.BACKEND_HOST || '127.0.0.1';
  const target = `http://${backendHost}:${backendPort}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              const url = req?.url || '';
              console.warn(`[Vite Proxy] Warning: Could not forward ${req.method} ${url} to backend at ${options.target} (${err.code || err.message}). Please ensure the backend server is running.`);
              if (res && !res.headersSent && typeof res.writeHead === 'function') {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Bad Gateway: Backend server unreachable. Make sure the backend server is running.',
                  code: err.code || 'ECONNREFUSED',
                  target: options.target,
                }));
              }
            });
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'node',
      fileParallelism: false,
    },
  };
});
