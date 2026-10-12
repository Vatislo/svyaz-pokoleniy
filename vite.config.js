import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Для GitHub Pages сайт лежит в подкаталоге https://<user>.github.io/<repo>/,
// поэтому нужен base с именем репозитория. Локально base = '/', чтобы dev/preview
// работали с корня. В CI передаётся через VITE_BASE (см. .github/workflows/deploy.yml).
const repoBase = process.env.VITE_BASE || '/';

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    reporters: ['default'],
  },
});
