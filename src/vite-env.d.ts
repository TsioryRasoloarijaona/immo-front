/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base url du backend. Nom sans préfixe `VITE_` (contrainte Vercel) —
   * exposé grâce à `envPrefix` dans `vite.config.ts`. */
  readonly back_end_url?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
