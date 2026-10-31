import type { NoeudDroitDto } from '../types/roles';
import type { CibleHabilitationDto, NoeudHabilitationDto } from '../types/utilisateurs';
import { basculerNoeud, structurerArbre, toutCocher, type StructureArbre } from './arbreDroits';

const cle = (n: CibleHabilitationDto) => `${n.type}:${n.id}`;

export interface ArbreHabilitations {
  structure: StructureArbre;
  figees: Set<string>;
  initiaux: Set<string>;
}

/** Arbre à plat (profondeur d'abord) pour réutiliser la cascade par plage d'indices de `arbreDroits.ts`. */
export function aplatirHabilitations(racines: NoeudHabilitationDto[]): ArbreHabilitations {
  const plats: NoeudDroitDto[] = [];
  const figees = new Set<string>();
  const initiaux = new Set<string>();
  const parcourir = (noeuds: NoeudHabilitationDto[], profondeur: number) => {
    for (const n of noeuds) {
      plats.push({ code: cle(n), description: n.libelle, profondeur, type: n.type });
      if (n.figee) figees.add(cle(n));
      if (n.coche || n.figee) initiaux.add(cle(n));
      parcourir(n.enfants, profondeur + 1);
    }
  };
  parcourir(racines, 0);
  return { structure: structurerArbre(plats), figees, initiaux };
}

/** Un nœud figé reste coché : la cascade d'un parent ne le décoche pas. */
function garderFigees(coches: Set<string>, figees: ReadonlySet<string>): Set<string> {
  for (const f of figees) coches.add(f);
  return coches;
}

export function basculerHabilitation(a: ArbreHabilitations, coches: ReadonlySet<string>, indice: number, valeur: boolean): Set<string> {
  return garderFigees(basculerNoeud(a.structure, coches, indice, valeur), a.figees);
}

export const toutCocherHabilitations = (a: ArbreHabilitations): Set<string> => toutCocher(a.structure);

export const toutDecocherHabilitations = (a: ArbreHabilitations): Set<string> => garderFigees(new Set(), a.figees);

/** Nœuds cochés à envoyer ; les figés sont ignorés par le serveur et donc omis. */
export function ciblesCochees(a: ArbreHabilitations, coches: ReadonlySet<string>): CibleHabilitationDto[] {
  return a.structure.noeuds
    .filter((n) => coches.has(n.code) && !a.figees.has(n.code))
    .map((n) => ({ type: n.type as CibleHabilitationDto['type'], id: n.code.slice((n.type ?? '').length + 1) }));
}

/** Nombre de projets cochés : sert l'avertissement « plus de restriction ». */
export function projetsCoches(a: ArbreHabilitations, coches: ReadonlySet<string>): number {
  return a.structure.noeuds.filter((n) => n.type === 'PROJET' && coches.has(n.code)).length;
}
