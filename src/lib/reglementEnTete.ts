import { listPayeurs } from './api';
import { toApiDateTime, todayISO } from './format';
import { montantSaisi } from './repartitionReglement';
import { useBanques, useTypesReglement } from './referentiels';
import { useApi } from './useApi';
import type { CreerReglementRequest } from '../types';

/** En-tête du dialogue « Nouveau règlement », tel que saisi. */
export interface EnTete {
  montant: string;
  dateEcheance: string;
  typeId: string | null;
  banqueId: string | null;
  payeurId: string | null;
  reference: string;
}

export function enTeteVide(): EnTete {
  return { montant: '', dateEcheance: todayISO(), typeId: null, banqueId: null, payeurId: null, reference: '' };
}

/** Référentiels de l'en-tête et ce que le type choisi exige (400 côté serveur sinon). */
export function useReferentielsReglement(dossierId: string, typeId: string | null) {
  const typesReglement = useTypesReglement();
  const banques = useBanques();
  const payeurs = useApi(() => listPayeurs(dossierId), [dossierId]);
  const selectedType = typesReglement.data.find((t) => t.id === typeId);
  return {
    typesReglement,
    banques,
    payeurs,
    banqueRequise: selectedType?.banqueObligatoire ?? false,
    referenceRequise: selectedType?.referenceObligatoire ?? false,
    aucunPayeur: !!payeurs.data && payeurs.data.length === 0,
  };
}

export type ReferentielsReglement = ReturnType<typeof useReferentielsReglement>;

/** Mêmes contrôles d'en-tête que le serveur, pour désactiver l'envoi avant l'aller-retour. */
export function enTeteValide(enTete: EnTete, refs: ReferentielsReglement): boolean {
  const montant = montantSaisi(enTete.montant);
  return (
    montant !== null &&
    montant > 0 &&
    enTete.dateEcheance !== '' &&
    !!enTete.typeId &&
    !!enTete.payeurId &&
    (!refs.banqueRequise || !!enTete.banqueId) &&
    (!refs.referenceRequise || enTete.reference.trim() !== '')
  );
}

/** Appeler seulement si `enTeteValide`. */
export function corpsEnTete(enTete: EnTete, refs: ReferentielsReglement): CreerReglementRequest {
  return {
    montant: montantSaisi(enTete.montant) ?? 0,
    dateEcheance: toApiDateTime(enTete.dateEcheance) ?? null,
    typeId: enTete.typeId ?? '',
    payeurId: enTete.payeurId ?? undefined,
    banqueId: refs.banqueRequise ? enTete.banqueId ?? undefined : undefined,
    reference: enTete.reference || undefined,
  };
}
