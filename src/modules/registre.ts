import type { ModuleApp } from './types';

// Chaque module déclare ses routes, son menu et ses chemins dans son propre fichier : un lot n'édite jamais une liste centrale.
const declares = import.meta.glob<ModuleApp>('./*/routes.tsx', { eager: true, import: 'default' });

export const MODULES_DECLARES: readonly ModuleApp[] = Object.values(declares).sort((a, b) => a.ordre - b.ordre);
