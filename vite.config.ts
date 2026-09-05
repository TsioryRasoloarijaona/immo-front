import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Vite n'expose à `import.meta.env` que les variables commençant par
  // `VITE_`. La base url du backend s'appelle `back_end_url` (le nom imposé
  // côté Vercel), donc sans ce préfixe supplémentaire elle vaudrait
  // `undefined` dans le bundle et `api.ts` retomberait sur son fallback
  // `https://<hôte-de-la-page>:8080` — c'est-à-dire aucun appel qui aboutit
  // en production. Le préfixe reste étroit : seules les variables
  // `back_end_*` sont exposées, pas l'ensemble de l'environnement de build.
  envPrefix: ['VITE_', 'back_end_'],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    // Bind on 0.0.0.0 (not just localhost) so other devices on the LAN can
    // load the dev server at all — `npm run dev` prints the LAN URL to use.
    host: true,
  },
})
