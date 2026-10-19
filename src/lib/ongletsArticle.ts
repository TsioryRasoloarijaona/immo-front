import { getContenancesArticle, putContenancesArticle } from './apiPatrimoine';
import type { ColonneOnglet, SourceLignes } from './ongletsTranche';
import type { ContenanceDto, LigneContenanceDto } from '../types';

const OPTIONS = [1, 2, 3] as const;

export function sourceContenances(articleId: string, presentationId?: string): SourceLignes<LigneContenanceDto> {
  return {
    // La présentation change → le serveur a recopié les contenances : recharger.
    cle: `${articleId}/${presentationId ?? ''}`,
    charger: () => getContenancesArticle(articleId),
    enregistrer: (lignes) => putContenancesArticle(articleId, lignes),
  };
}

/** Grille Contenances : option N cochable si la contenance la définit, quantité si elle l'autorise et qu'elle est cochée. */
export function grilleContenances(contenances: ContenanceDto[]) {
  const de = (l: LigneContenanceDto) => contenances.find((c) => c.id === l.contenanceId);
  const colonnes: ColonneOnglet<LigneContenanceDto>[] = [
    { nom: 'contenanceId', libelle: 'Contenance', type: 'choix', choix: contenances },
    { nom: 'nombre', libelle: 'Nombre', type: 'entier' },
    ...OPTIONS.flatMap((n): ColonneOnglet<LigneContenanceDto>[] => [
      { nom: `avecOption${n}`, libelle: `Option ${n}`, type: 'case', calcule: (l) => !de(l)?.[`option${n}`],
        etiquette: (l) => de(l)?.[`option${n}`] },
      { nom: `quantiteOption${n}`, libelle: `Quantité ${n}`, type: 'entier',
        calcule: (l) => !(de(l)?.[`option${n}AvecQuantite`] && l[`avecOption${n}`]) },
    ]),
  ];
  const normaliser = (ligne: LigneContenanceDto): LigneContenanceDto => {
    const contenance = de(ligne);
    const l = { ...ligne };
    for (const n of OPTIONS) {
      if (!contenance?.[`option${n}`]) l[`avecOption${n}`] = false;
      if (!contenance?.[`option${n}AvecQuantite`] || !l[`avecOption${n}`]) l[`quantiteOption${n}`] = null;
    }
    return l;
  };
  return { colonnes, normaliser };
}
