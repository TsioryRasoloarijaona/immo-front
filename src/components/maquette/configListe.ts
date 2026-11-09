import type { ConfigEcran } from './types';

type Base = Partial<ConfigEcran> & Pick<ConfigEcran, 'titre' | 'unite' | 'nature' | 'colonnes' | 'lignes'>;

/** Complète une liste statique : les champs de la fiche sont les colonnes, le titre de la fiche les deux premières. */
export function configListe(base: Base): ConfigEcran {
  const [a, b] = base.colonnes;
  return {
    recherche: 'Rechercher…',
    champs: base.colonnes.map((c) => ({ nom: c.nom, libelle: c.libelle, type: c.type === 'MONTANT' ? 'montant' : undefined })),
    titreFiche: (l) => `${l[a.nom]} — ${l[b.nom]}`,
    outils: ['nouveau', 'supprimer', 'imprimer', 'exporter', 'rafraichir'],
    ...base,
  };
}
