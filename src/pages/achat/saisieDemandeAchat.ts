import type { DatesDemandeAchat, DemandeAchatFiche, SaisieDemandeAchat } from '../../types/demandesAchat';

export const DATES: { cle: keyof DatesDemandeAchat; libelle: string }[] = [
  { cle: 'lancement', libelle: 'Lancement' },
  { cle: 'retraitDossier', libelle: 'Retrait du dossier' },
  { cle: 'echeanceOffres', libelle: 'Échéance des offres' },
  { cle: 'report', libelle: 'Report' },
  { cle: 'ouverturePlis', libelle: 'Ouverture des plis' },
  { cle: 'rapportDepouillement', libelle: 'Rapport de dépouillement' },
  { cle: 'adjudication', libelle: 'Adjudication' },
  { cle: 'signatureMarche', libelle: 'Signature du marché' },
];

export interface Saisie {
  procedureId: string;
  societeId: string;
  projetId: string;
  typeLotId: string;
  moduleId: string;
  date: string;
  description: string;
  descriptionLongue: string;
  tvaDefaut: string;
  prixEstimeHT: string;
  prixEstimeTTC: string;
  delaiPaiement: string;
  notes: string;
  texteLettre: string;
  dates: Record<keyof DatesDemandeAchat, string>;
}
export type CleSaisie = Exclude<keyof Saisie, 'dates'>;
type Choix = { label: string; value: string }[];
export interface Listes { procedures: Choix; societes: Choix; projets: Choix; typesLot: Choix; modules: Choix }

const jour = (v: string | null | undefined) => (v ?? '').slice(0, 10);
const nombre = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
const texteNombre = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const vide = (v: string) => v || null;

export function saisieDepuis(f: DemandeAchatFiche | null): Saisie {
  const dates = Object.fromEntries(DATES.map((d) => [d.cle, jour(f?.dates[d.cle])])) as Saisie['dates'];
  return {
    procedureId: f?.procedure?.id ?? '', societeId: f?.societe?.id ?? '', projetId: f?.projet?.id ?? '',
    typeLotId: f?.typeLot?.id ?? '', moduleId: f?.module?.id ?? '', date: jour(f?.date), description: f?.description ?? '',
    descriptionLongue: f?.descriptionLongue ?? '', tvaDefaut: texteNombre(f?.tvaDefaut),
    prixEstimeHT: texteNombre(f?.prixEstimeHT), prixEstimeTTC: texteNombre(f?.prixEstimeTTC),
    delaiPaiement: texteNombre(f?.delaiPaiement), notes: f?.notes ?? '', texteLettre: f?.texteLettre ?? '', dates,
  };
}

export function corpsDepuis(s: Saisie): SaisieDemandeAchat {
  return {
    procedureId: vide(s.procedureId), societeId: vide(s.societeId), description: vide(s.description.trim()),
    projetId: vide(s.projetId), typeLotId: vide(s.typeLotId), moduleId: vide(s.moduleId), date: vide(s.date),
    descriptionLongue: vide(s.descriptionLongue), tvaDefaut: nombre(s.tvaDefaut), prixEstimeHT: nombre(s.prixEstimeHT),
    prixEstimeTTC: nombre(s.prixEstimeTTC), delaiPaiement: nombre(s.delaiPaiement), notes: vide(s.notes),
    texteLettre: vide(s.texteLettre),
    dates: Object.fromEntries(DATES.map((d) => [d.cle, vide(s.dates[d.cle])])),
  };
}
