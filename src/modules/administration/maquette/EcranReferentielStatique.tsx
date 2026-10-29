import { useMemo } from 'react';
import EcranListeStatique from './EcranListeStatique';
import type { DefReferentiel } from './referentiels';
import type { ConfigEcran, Ligne } from './types';

function configDe(def: DefReferentiel): ConfigEcran {
  const extras = def.extras ?? [];
  const champs = [{ nom: 'code', libelle: 'Code' }, { nom: 'description', libelle: 'Description' }, ...extras.map((e) => ({ nom: e.nom, libelle: e.libelle }))];
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
    filtres: extras.filter((e) => e.nom === 'pays' || e.nom === 'type').map((e) => e.nom),
    champs,
    titreFiche: (l) => `${l.code} — ${l.description}`,
    outils: ['nouveau', 'supprimer', 'imprimer', 'exporter', 'rafraichir'],
  };
}

/** Référentiel Code / Description (+ colonnes en plus) : une déclaration, aucun écran dédié. */
export default function EcranReferentielStatique({ def, racine }: Readonly<{ def: DefReferentiel; racine: string }>) {
  const config = useMemo(() => configDe(def), [def]);
  return <EcranListeStatique config={config} racine={racine} />;
}
