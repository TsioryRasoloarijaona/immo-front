import { useMemo } from 'react';
import { getOffre, listDevis } from './api';
import { useApi } from './useApi';
import type { DevisDto, FicheDevisDto } from '../types';

export interface OffreDeDepart {
  /** Offre qui préremplit le formulaire et devient `offreId` ; null sans offre. */
  devis: DevisDto | null;
  /** Fiche de l'offre de `?offre=` ; null sans paramètre (repli sur la dernière offre de la prospection). */
  fiche: FicheDevisDto | null;
  /** Vrai seulement si `?offre=` désigne une offre lisible. */
  explicite: boolean;
  /** Article de l'offre de `?offre=`, qui remplace la sélection tirée de la prospection ; sinon null. */
  articleId: string | null;
  erreur: string | null;
}

/** Mode de paiement prérempli : celui de l'offre de `?offre=` seulement (sans, il reste à choisir comme avant). */
export function modePaiementDeDepart(offre: OffreDeDepart): string | null {
  return offre.explicite ? (offre.devis?.modePaiementId ?? null) : null;
}

/**
 * Avec `?offre=`, cette offre précise (FEATURE-offre-vers-dossier.md F2) ; sans, la plus récente de la
 * prospection, comportement d'avant inchangé.
 */
export function useOffreDeDepart(prospectionId: string | undefined, offreParam: string | null): OffreDeDepart {
  const fiche = useApi(() => (offreParam ? getOffre(offreParam) : Promise.resolve(null)), [offreParam]);
  const liste = useApi(
    () => (prospectionId && !offreParam ? listDevis(prospectionId, { page: 0, size: 20 }) : Promise.resolve(null)),
    [prospectionId, offreParam],
  );
  const derniere = useMemo(() => {
    const offres = liste.data?.content ?? [];
    if (offres.length === 0) return null;
    return [...offres].sort((a, b) => (b.dateDocument ?? '').localeCompare(a.dateDocument ?? ''))[0];
  }, [liste.data]);

  if (offreParam) {
    const lue = fiche.error ? null : fiche.data;
    return { devis: lue?.offre ?? null, fiche: lue, explicite: !!lue, articleId: lue?.offre.articleId ?? null, erreur: fiche.error };
  }
  return { devis: derniere, fiche: null, explicite: false, articleId: null, erreur: null };
}
