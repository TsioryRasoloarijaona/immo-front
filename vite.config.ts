import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Identité simulée pour le service des virements en développement — lue ici
// via `process.env`, jamais exposée au bundle. Pour essayer un non-admin :
// `VIREMENT_DEV_ROLES=Comptabilité npm run dev`.
const rolesDev = (process.env.VIREMENT_DEV_ROLES || 'Administrateur')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
  // Un rôle par morceau, encodé seul : la virgule reste le séparateur.
  .map((r) => encodeURIComponent(r))
  .join(',')

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
    proxy: {
      // En production, c'est Caddy qui sert `/svc/virement` : il vérifie la
      // session du CRM (`forward_auth`) puis pose lui-même ces en-têtes
      // d'identité. Ce proxy de développement les simule, sans vérifier de
      // session — il n'existe que sous `npm run dev`, absent du build.
      '/svc/virement': {
        target: 'http://127.0.0.1:3010',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/svc\/virement/, '') || '/',
        headers: {
          'X-User-Id': '00000000-0000-4000-8000-000000000001',
          'X-Username': process.env.VIREMENT_DEV_USER || 'dev',
          'X-User-Roles': rolesDev,
          'X-Employee-Id': '',
        },
      },
    },
  },
})
