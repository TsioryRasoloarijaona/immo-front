import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import sonarjs from 'eslint-plugin-sonarjs'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { fixupPluginRules } from '@eslint/compat'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// shadcn généré : config de base seulement (voir FEATURE-outils-qualite-front.md §1).
const GENERE = ['src/components/ui/**']

// jsx-a11y 6.10 ne déclare pas ESLint 10 : fixupPluginRules comble les API de contexte retirées.
const a11y = { ...jsxA11y.flatConfigs.recommended, plugins: { 'jsx-a11y': fixupPluginRules(jsxA11y) } }

export default defineConfig([
  // harness-densite.tsx : banc d'essai local non versionné.
  globalIgnores(['dist', 'src/harness-densite.tsx']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Convention shadcn : les variantes cva et le hook vivent à côté du composant.
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['badgeVariants', 'buttonVariants', 'tabsListVariants', 'useSidebar'] },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: GENERE,
    extends: [tseslint.configs.recommendedTypeChecked, sonarjs.configs.recommended, a11y],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      // 107 cas, tous des gestionnaires JSX async : React ignore leur valeur de retour.
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // `||` sur chaîne/nombre/booléen est voulu ('' et 0 → valeur par défaut) : `??` changerait le rendu.
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true, number: true, boolean: true } },
      ],
    },
  },
  {
    // Déclarations de module : pages `lazy` + un objet exporté, jamais rechargées à chaud.
    files: ['src/modules/*/routes.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // Dette (lot D, découpage des gros écrans) : seuil = complexité mesurée, pour qu'elle ne puisse que baisser.
  ...Object.entries({
    'src/pages/prospections/ProspectionDetail.tsx': 62,
    'src/pages/dossiers/NewDossier.tsx': 40,
    'src/pages/prospects/ProspectDetail.tsx': 35,
    'src/pages/dossiers/DossiersList.tsx': 31,
    'src/pages/actions/SuiviActionsList.tsx': 24,
    'src/pages/encaissements/EncaissementsList.tsx': 24,
    'src/pages/prospections/ProspectionsList.tsx': 23,
    'src/pages/prospections/PreProspectionsList.tsx': 20,
  }).map(([fichier, seuil]) => ({
    files: [fichier],
    rules: { 'sonarjs/cognitive-complexity': ['error', seuil] },
  })),
])
