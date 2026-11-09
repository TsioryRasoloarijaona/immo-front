import type { ConfigEcran, DefReferentiel, Ligne } from './types';

/** Référentiel Code / Description (+ colonnes en plus) : une déclaration, aucun écran dédié. */
export function configReferentiel(def: DefReferentiel): ConfigEcran {
  const extras = def.extras ?? [];
  const champs = [{ nom: 'code', libelle: 'Code' }, { nom: 'description', libelle: 'Description' }, ...extras];
  const lignes = def.lignes.map((valeurs, i) => {
    const ligne: Ligne = { id: String(i + 1), code: valeurs[0], description: valeurs[1] };
    extras.forEach((e, k) => {
      ligne[e.nom] = valeurs[k + 2];
    });
    return ligne;
  });
  return {
    titre: def.titre,
    unite: def.unite,
    nature: def.nature,
    colonnes: champs.map((c) => ({ ...c, largeur: c.nom === 'description' ? 20 : 12 })),
    lignes,
    recherche: 'Code, description…',
    champs,
    titreFiche: (l) => `${l.code} — ${l.description}`,
    outils: ['nouveau', 'supprimer', 'imprimer', 'exporter', 'rafraichir'],
  };
}
