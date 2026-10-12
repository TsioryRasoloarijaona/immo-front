// Kanban des prospections (FEATURE-parcours-commercial.md §4) : colonnes, prochaine action, phrase de confirmation.
import { formatJourSemaine, jourISO } from './format';
import type { ReferentielItemDto, ResultatInteractionDto } from '../types';

/** Au plus ce nombre de cartes chargées par colonne ; au-delà, « + N autres ». */
export const CARTES_PAR_COLONNE = 200;

/** Colonnes demandées à `GET /api/prospections` pour une carte. `projetCode` est une colonne de vue (lente) : la tranche suffit. */
export const COLONNES_CARTE = [
  'id', 'code', 'prospectNom', 'tempDescription', 'commercialId', 'commercialNom', 'origine', 'etape',
  'telephone', 'mobileProspect', 'indicatifMobile', 'derniereAlerteDate', 'derniereAlerteMessage', 'trancheCode',
];

export interface ColonneKanban {
  etape: ReferentielItemDto;
  libelle: string;
  /** « À rappeler » et « Affaires à suivre » : repliées par défaut. */
  repliee: boolean;
  /** Les lignes sans étape sont rangées dans la première colonne. */
  recoitSansEtape: boolean;
}

/** Les codes d'étape se comparent sans casse ni espaces doublés (« AFFAIRES  A SUIVRE » en base). */
function normaliser(code: string | undefined): string {
  return (code ?? '').replaceAll(/\s+/g, ' ').trim().toUpperCase();
}

const LIBELLES_REPLIEES: Record<string, string> = {
  'A RAPPELER PAR LE COMMERCIAL': 'À rappeler',
  'AFFAIRES A SUIVRE': 'Affaires à suivre',
};

/** Étapes numérotées 1 → 5 dans l'ordre, puis les deux colonnes de côté ; les autres codes sont ignorés. */
export function colonnesKanban(etapes: readonly ReferentielItemDto[]): ColonneKanban[] {
  const numerotees = etapes
    .filter((e) => /^[1-5]\s/.test(normaliser(e.code)))
    .sort((a, b) => normaliser(a.code).localeCompare(normaliser(b.code), 'fr'));
  const principales = numerotees.map((etape, i) => ({
    etape,
    libelle: etape.description || etape.code || etape.id,
    repliee: false,
    recoitSansEtape: i === 0,
  }));
  const repliees = etapes
    .filter((e) => normaliser(e.code) in LIBELLES_REPLIEES)
    .map((etape) => ({ etape, libelle: LIBELLES_REPLIEES[normaliser(etape.code)], repliee: true, recoitSansEtape: false }));
  return [...principales, ...repliees];
}

/** Arriver en « 4 APRES VISITES » déclenche le remerciement de visite côté serveur (comme `PATCH /etape`). */
export function declencheRemerciement(etape: ReferentielItemDto): boolean {
  return normaliser(etape.code) === '4 APRES VISITES';
}

export type TypeProchaineAction ='appel' | 'whatsapp' | 'visite';

interface ModeleAction {
  libelle: string;
  /** `ComActionMessageType.Code` de l'action écrite. */
  typeCode: string;
  /** `ComActionMessageSubCategory.Code` : c'est lui qui porte l'intention (§2). */
  resultatCode: string;
}

export const ACTIONS_PROCHAINES: Record<TypeProchaineAction, ModeleAction> = {
  appel: { libelle: 'Appel', typeCode: 'Téléphone Sortant', resultatCode: 'A rappeler par le commercial' },
  whatsapp: { libelle: 'WhatsApp', typeCode: 'Message sortant', resultatCode: 'A rappeler par le commercial' },
  visite: { libelle: 'Visite', typeCode: 'Téléphone Sortant', resultatCode: 'Rendez vous pris' },
};

function memeCode(a: string | undefined, b: string): boolean {
  return normaliser(a) === normaliser(b);
}

/** Identifiants du référentiel pour un modèle ; `null` si la base ne les porte pas (choix désactivé). */
export function resoudreAction(
  type: TypeProchaineAction,
  types: readonly ReferentielItemDto[],
  resultats: readonly ResultatInteractionDto[],
): { typeId: string; sousCategorieId: string } | null {
  const modele = ACTIONS_PROCHAINES[type];
  const typeId = types.find((t) => memeCode(t.code, modele.typeCode))?.id;
  const sousCategorieId = resultats.find((r) => memeCode(r.code, modele.resultatCode))?.id;
  return typeId && sousCategorieId ? { typeId, sousCategorieId } : null;
}

/** `YYYY-MM-DDT10:00` à `jours` d'aujourd'hui, pour un champ `datetime-local`. */
export function dansJours(jours: number): string {
  const d = new Date();
  return `${jourISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + jours))}T10:00`;
}

export const RACCOURCIS_DATE: readonly { libelle: string; jours: number }[] = [
  { libelle: 'Demain', jours: 1 },
  { libelle: 'Dans 3 jours', jours: 3 },
  { libelle: 'Dans 1 semaine', jours: 7 },
];

/** « Prochaine action : visite le mardi 13/10. Elle s'ajoute à votre journée et à votre calendrier. » */
export function phraseProchaineAction(type: TypeProchaineAction, date: string): string {
  const quoi = ACTIONS_PROCHAINES[type].libelle.toLowerCase();
  const ou = type === 'visite' ? 'à votre journée et à votre calendrier' : 'à votre journée';
  return `Prochaine action : ${quoi} le ${formatJourSemaine(date)}. Elle s'ajoute ${ou}.`;
}

export type VueProspections = 'liste' | 'kanban';

const CLE_VUE = 'arpent.prospections.vue';

/** Vue mémorisée par navigateur ; stockage indisponible (navigation privée) = liste. */
export function lireVueProspections(): VueProspections {
  try {
    return globalThis.localStorage.getItem(CLE_VUE) === 'kanban' ? 'kanban' : 'liste';
  } catch {
    return 'liste';
  }
}

export function memoriserVueProspections(vue: VueProspections): void {
  try {
    globalThis.localStorage.setItem(CLE_VUE, vue);
  } catch {
    // Sans stockage, la vue n'est simplement pas retenue.
  }
}

/** Initiales du commercial, montrées au chef et à l'administration. */
export function initiales(nom: string | null | undefined): string {
  const parties = (nom ?? '').trim().split(/\s+/).filter(Boolean);
  return parties.slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}
