// Chargeurs de chunk des pages atteignables depuis la barre latérale.
//
// Pourquoi cette carte existe : `App.tsx` déclare les routes en `React.lazy`,
// donc un clic dans le menu était toujours un départ à froid — résoudre le
// chunk, le télécharger, télécharger ses sous-chunks, *puis seulement* lancer
// la première requête de données de la page (`DossierDetail` fait 56 ko et
// 21 dépendances). En exposant les mêmes fabriques ici, `Layout.tsx` peut
// lancer l'import au survol ou au focus du lien : le registre de modules
// dédoublonne, donc l'import du clic se résout depuis le cache.
//
// `App.tsx` consomme cette carte plutôt que de redéclarer ses propres
// `import()` : deux specifiers pour le même module resteraient un seul chunk,
// mais dériveraient à la première page déplacée. Les pages de détail
// (`/dossiers/:id`…) ne sont atteignables par aucun lien de menu, donc elles
// gardent leur `lazy()` en ligne dans `App.tsx` et n'ont pas d'entrée ici.
//
// Les specifiers doivent rester des littéraux statiques pour que le bundler
// puisse les analyser (règle `bundle-analyzable-paths`).
export const ROUTE_MODULES = {
  '/': () => import('../pages/Dashboard'),
  '/hotline': () => import('../pages/hotline/Hotline'),
  '/calendrier': () => import('../pages/calendrier/Calendrier'),
  '/prospections': () => import('../pages/prospections/ProspectionsList'),
  '/pre-prospections': () => import('../pages/prospections/PreProspectionsList'),
  '/prospects': () => import('../pages/prospects/ProspectsList'),
  '/clients': () => import('../pages/clients/ClientsList'),
  '/dossiers': () => import('../pages/dossiers/DossiersList'),
  '/offres': () => import('../pages/prospections/OffresList'),
  '/encaissements': () => import('../pages/encaissements/EncaissementsList'),
  '/projets': () => import('../pages/projets/ProjetsList'),
  '/tranches': () => import('../pages/tranches/TranchesList'),
  '/articles': () => import('../pages/articles/ArticlesList'),
  '/profil': () => import('../pages/profil/Profil'),
  '/utilisateurs': () => import('../pages/utilisateurs/UtilisateursList'),
  '/utilisateurs/nouveau': () => import('../pages/utilisateurs/NouvelUtilisateur'),
  '/utilisateurs/reinitialiser-mot-de-passe': () => import('../pages/utilisateurs/ReinitialiserMotDePasse'),
} as const;

export type RoutePath = keyof typeof ROUTE_MODULES;

/** Précharge le chunk d'une route. Sans effet (et sans erreur) pour un chemin
 * absent de la carte, pour qu'un lien vers une page de détail ou vers
 * `/bientot/:slug` puisse appeler la fonction sans condition côté appelant.
 * L'échec est volontairement avalé : un préchargement raté n'est pas une
 * erreur visible, le clic retentera l'import et affichera l'ErrorBoundary si
 * besoin. */
export function preloadRoute(path: string): void {
  const load = ROUTE_MODULES[path as RoutePath];
  if (load) void load().catch(() => {});
}
