import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = ['index', 'about', 'services', 'projects', 'project', 'contact', 'terms', 'privacy'];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}.html`)])),
    },
  },
});
