import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

/**
 * Vercel serves the clean URLs in vercel.json; the dev server otherwise 404s on
 * them, so an in-page link to /pid-steering can't be clicked through locally.
 * Keep this table in sync with the "rewrites" block in vercel.json.
 */
const CLEAN_URLS: Record<string, string> = {
  '/resume': '/resume.html',
  '/pid-steering': '/paper.html',
};

const cleanUrlsInDev = (): Plugin => ({
  name: 'clean-urls-in-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const path = req.url?.split('?')[0] ?? '';
      if (CLEAN_URLS[path]) req.url = CLEAN_URLS[path] + (req.url?.slice(path.length) ?? '');
      next();
    });
  },
});

export default defineConfig({
  plugins: [tailwindcss(), cleanUrlsInDev()],
  // Single source of truth for the "Last updated" stamp in the footer.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        resume: resolve(__dirname, 'resume.html'),
        paper: resolve(__dirname, 'paper.html'),
      },
    },
  },
});
