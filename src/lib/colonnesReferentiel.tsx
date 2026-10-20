import type { ColonneGrille } from '../components/DataGrid';
import { PastilleCouleur } from '../components/configuration/SelecteurCouleur';
import { texteBrut } from './format';
import { itemsDe, type LigneAvecId } from './referentielsAdmin';
import type { Choix } from './saisiePatrimoine';
import type { ChampReferentielDto } from '../types/referentielsAdmin';

function colonneDe(c: ChampReferentielDto, choix: Record<string, Choix>): ColonneGrille<LigneAvecId> {
  const base = { nom: c.nom, libelle: c.libelle, largeur: 12 };
  switch (c.type) {
    case 'ENTIER':
    case 'DECIMAL':
      return { ...base, type: 'NOMBRE' };
    case 'FRACTION':
      return { ...base, type: 'POURCENTAGE' };
    case 'BOOLEEN':
      return { ...base, type: 'BOOLEEN' };
    case 'LIGNES':
      return { ...base, type: 'NOMBRE', valeur: (l) => (l[c.nom] as unknown[] | undefined)?.length ?? 0 };
    case 'COULEUR':
      return {
        ...base,
        rendu: (l) => {
          const nom = l[c.nom];
          return typeof nom === 'string' && nom !== '' ? (
            <span className="flex items-center gap-1.5"><PastilleCouleur nom={nom} />{nom}</span>
          ) : <span className="text-muted-foreground">—</span>;
        },
      };
    case 'REFERENCE':
    case 'OPERATEUR': {
      const items = itemsDe(c, choix);
      return { ...base, valeur: (l) => items.find((i) => i.value === texteBrut(l[c.nom]))?.label ?? '' };
    }
    default:
      return base;
  }
}

/** Colonnes de la grille d'un référentiel, une par champ du descripteur. */
export function colonnesReferentiel(champs: ChampReferentielDto[], choix: Record<string, Choix>): ColonneGrille<LigneAvecId>[] {
  return champs.map((c) => colonneDe(c, choix));
}
