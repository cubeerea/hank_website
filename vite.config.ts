import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

/**
 * The dev server doesn't understand extensionless URLs on its own, so an
 * in-page link to /resume or /pid-steering can't be clicked through locally
 * without this. In production these resolve for free: Vercel's cleanUrls
 * strips the .html from any file whose name already matches the route
 * (resume.html -> /resume, pid-steering.html -> /pid-steering) — no rewrite
 * rule needed, which is exactly why this file is named pid-steering.html and
 * not paper.html. A rewrite pointing at an .html destination collides with
 * cleanUrls' own extension-stripping redirect and 404s; see vercel.json.
 */
const CLEAN_URLS: Record<string, string> = {
  '/resume': '/resume.html',
  '/pid-steering': '/pid-steering.html',
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
        'pid-steering': resolve(__dirname, 'pid-steering.html'),
      },
    },
  },
});
