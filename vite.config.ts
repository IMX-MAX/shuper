import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Proxy for Tavily API
        '/api/tavily': {
          target: 'https://api.tavily.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/tavily/, ''),
          secure: true,
        },
        // Proxy for Scira API
        '/api/scira': {
          target: 'https://api.scira.ai',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/scira/, ''),
          secure: true,
        },
        // Proxy for Exa API
        '/api/exa': {
          target: 'https://api.exa.ai',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/exa/, ''),
          secure: true,
        },
        // Proxy for OpenRouter API
        '/api/openrouter': {
          target: 'https://openrouter.ai',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/openrouter/, ''),
          secure: true,
        },
        // Proxy for Routeway API
        '/api/routeway': {
          target: 'https://api.routeway.ai',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/routeway/, ''),
          secure: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
