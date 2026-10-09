import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: env.BACKEND_URL || 'http://100.75.117.118:8080', changeOrigin: true } };
  return { plugins: [react()], base: './', server: { proxy }, preview: { proxy } };
});
