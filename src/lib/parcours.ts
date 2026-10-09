import { getProspection } from './api';
import type { ToastOptions } from './toastContext';
import type { HistoriqueDto, ProspectionDetailDto } from '../types';

export const CODE_PRE_PROSPECTION = 'ComPreProspection';
export const CODE_PROSPECTION = 'ComProspection';

/** Route de la fiche d'une prospection selon son **code** de type, jamais son
 * libellé. Code absent ou autre (location…) : la route `defaut`. */
export function routeFicheProspection(
  id: string,
  typeProspectionCode: string | null | undefined,
  defaut: 'prospection' | 'pre-prospection' = 'prospection',
): string {
  if (typeProspectionCode === CODE_PRE_PROSPECTION) return `/pre-prospections/${id}`;
  if (typeProspectionCode === CODE_PROSPECTION) return `/prospections/${id}`;
  return defaut === 'pre-prospection' ? `/pre-prospections/${id}` : `/prospections/${id}`;
}

export type StatutEtapeParcours = 'faite' | 'courante' | 'a-venir' | 'sautee';

export interface EtapeParcours {
  cle: 'pre' | 'prospect' | 'prospection' | 'dossier';
  libelle: string;
  libelleCourt: string;
  statut: StatutEtapeParcours;
  date: string | null;
  /** Fiche ouverte en aperçu (dialogue) au clic — jamais une navigation. */
  cible: CibleEtapeParcours | null;
}

export interface CibleEtapeParcours {
  type: 'prospect' | 'dossier';
  id: string;
  libelle: string;
  /** Code du dossier, pour l'`aria-label` ; `null` pour un prospect. */
  code: string | null;
}

// Débuts des descriptions écrites par ProspectionService.enregistrerHistorique.
const PREFIXES = {
  pre: ['Pré-prospection créée : '],
  prospect: ['Prospect créé et lié : ', 'Prospect existant rattaché : '],
  prospection: ['Transformée en prospection : ', 'Prospection créée : '],
} as const;

/** Le plus ancien événement dont la description commence par l'un des
 * préfixes (l'historique arrive du plus récent au plus ancien). */
function dateEvenement(historique: readonly HistoriqueDto[], prefixes: readonly string[]): string | null {
  let trouvee: string | null = null;
  for (const h of historique) {
    const d = h.description ?? '';
    if (h.date && prefixes.some((pr) => d.startsWith(pr))) trouvee = h.date;
  }
  return trouvee;
}

/** Les quatre étapes du parcours de vente d'une fiche, ou `null` quand la
 * barre ne s'affiche pas (type `null`, location ou autre — R9). */
export function calculerParcours(
  fiche: {
    typeProspectionCode?: string | null;
    prospectId?: string | null;
    dossierId?: string | null;
    dossierCode?: string | null;
  },
  historique: readonly HistoriqueDto[] | null | undefined,
): EtapeParcours[] | null {
  const code = fiche.typeProspectionCode;
  if (code !== CODE_PRE_PROSPECTION && code !== CODE_PROSPECTION) return null;
  const h = historique ?? [];

  const datePre = dateEvenement(h, PREFIXES.pre);
  const preFaite = datePre !== null || code === CODE_PRE_PROSPECTION;
  // R7 : seul ce CRM écrit l'historique — sans événement d'origine, une fiche
  // OMRAN a une origine inconnue et l'étape n'est pas montrée.
  const creeeDirectement = dateEvenement(h, ['Prospection créée : ']) !== null;
  const brut: (Omit<EtapeParcours, 'statut'> & { faite: boolean })[] = [
    {
      cle: 'pre',
      libelle: 'Pré-prospection',
      libelleCourt: 'Pré-prosp.',
      faite: preFaite,
      date: datePre,
      cible: null,
    },
    {
      cle: 'prospect',
      libelle: 'Prospect',
      libelleCourt: 'Prospect',
      faite: !!fiche.prospectId,
      date: fiche.prospectId ? dateEvenement(h, PREFIXES.prospect) : null,
      cible: fiche.prospectId ? { type: 'prospect', id: fiche.prospectId, libelle: 'Voir', code: null } : null,
    },
    {
      cle: 'prospection',
      libelle: 'Prospection',
      libelleCourt: 'Prosp.',
      faite: code === CODE_PROSPECTION,
      date: code === CODE_PROSPECTION ? dateEvenement(h, PREFIXES.prospection) : null,
      cible: null,
    },
    {
      cle: 'dossier',
      libelle: 'Dossier',
      libelleCourt: 'Dossier',
      faite: !!fiche.dossierId,
      date: null,
      cible: fiche.dossierId
        ? { type: 'dossier', id: fiche.dossierId, libelle: fiche.dossierCode || 'Voir', code: fiche.dossierCode || null }
        : null,
    },
  ];

  const affichees = preFaite || creeeDirectement ? brut : brut.slice(1);
  let derniere = -1;
  affichees.forEach((e, i) => { if (e.faite) derniere = i; });

  // Une étape non faite *avant* l'étape courante a été sautée (grisée « — »).
  return affichees.map(({ faite, ...e }, i) => ({
    ...e,
    statut: statutEtape(i, derniere, faite),
  }));
}

function statutEtape(i: number, derniere: number, faite: boolean) {
  if (i === derniere) return 'courante' as const;
  if (faite) return 'faite' as const;
  return i < derniere ? ('sautee' as const) : ('a-venir' as const);
}

/** Toast après « Transformer en prospect » (création ou rattachement). Le
 * `prospectId` vient de la réponse ; s'il manque, la fiche est relue. */
export async function toastProspectLie(
  nom: string,
  maj: ProspectionDetailDto,
  mode: 'cree' | 'rattache',
): Promise<ToastOptions> {
  const prospectId = maj.prospectId ?? (await getProspection(maj.id)).prospectId;
  return {
    texte: mode === 'cree' ? `${nom} est maintenant un prospect.` : `${nom} est rattaché au prospect existant.`,
    action: prospectId ? { libelle: 'Ouvrir le prospect →', vers: `/prospects/${prospectId}` } : undefined,
  };
}

export function texteProspectionTransformee(nom: string, maj: Pick<ProspectionDetailDto, 'code'>): string {
  return maj.code ? `${nom} est maintenant une prospection (${maj.code}).` : `${nom} est maintenant une prospection.`;
}
