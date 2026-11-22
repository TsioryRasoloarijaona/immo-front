import type {
  LigneSaisieDecaissementDto,
  ModuleTresorerie,
  SaisieDecaissementDto,
  StatutSaisieDecaissement,
  TypeDecaissementDto,
} from '../types/tresorerie';

export const STATUTS_SAISIE: { value: StatutSaisieDecaissement; label: string }[] = [
  { value: 'IN_WORK', label: 'En cours' },
  { value: 'POINTED', label: 'Pointé(e)' },
  { value: 'NOTPAYED', label: 'Impayé(e)' },
];

export function brouillonVide(societeId: string | null): SaisieDecaissementDto {
  return { societeId, typeId: null, fournisseurId: null, montant: 0, statut: 'IN_WORK', lignes: [] };
}

const auCentime = (x: number) => Math.round(x * 100) / 100;

export function totalAffecte(lignes: LigneSaisieDecaissementDto[]): number {
  return auCentime(lignes.reduce((somme, l) => somme + (l.montant || 0), 0));
}

/** Part déjà affectée par des lignes que la saisie ne montre pas (0 en création). */
export function partMasquee(montantAffecte: number | null | undefined, lignesVisibles: LigneSaisieDecaissementDto[]): number {
  return Math.max(0, auCentime((montantAffecte ?? 0) - totalAffecte(lignesVisibles)));
}

export function resteAAffecter(saisie: SaisieDecaissementDto, masquee = 0): number {
  return auCentime(saisie.montant - totalAffecte(saisie.lignes) - masquee);
}

/** Première erreur bloquante, ou null. */
export function verifier(saisie: SaisieDecaissementDto, type: TypeDecaissementDto | undefined, masquee = 0): string | null {
  if (!saisie.societeId) return 'La société est obligatoire.';
  if (!saisie.typeId) return 'Le type est obligatoire.';
  if (!saisie.fournisseurId) return 'Le fournisseur est obligatoire.';
  if (saisie.montant <= 0) return 'Le montant doit être supérieur à 0.';
  if (type?.referenceObligatoire && !saisie.reference?.trim()) return 'La référence est obligatoire pour ce type.';
  if (type?.notaireObligatoire && !saisie.notaireId) return 'Le notaire est obligatoire pour ce type.';
  if (saisie.statut === 'CANCELED') return 'Un décaissement annulé ne peut pas être enregistré.';
  const pointe = saisie.statut === 'POINTED';
  if (pointe && !saisie.dateDecaissement) return 'La date de pointage est obligatoire pour un décaissement pointé.';
  if (!pointe && saisie.dateDecaissement) return 'La date de pointage n’est permise que pour un décaissement pointé.';
  if (resteAAffecter(saisie, masquee) < 0) return 'Le montant affecté dépasse le montant du décaissement.';
  return null;
}

export function versRequete(saisie: SaisieDecaissementDto, module: ModuleTresorerie | null): SaisieDecaissementDto {
  return module ? { ...saisie, module } : saisie;
}
