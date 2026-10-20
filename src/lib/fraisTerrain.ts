import { texteBrut } from './format';
import type { ColonneOnglet } from './ongletsTranche';
import type { ReferentielItemDto } from '../types';
import type { LigneReferentiel } from '../types/referentielsAdmin';
import type { LigneFraisTerrainDto } from '../types/terrains';

/** Lignes d'un référentiel administrable (`code`, `description`) en choix de liste. */
export const choixDepuisLignes = (lignes: LigneReferentiel[] = []): ReferentielItemDto[] =>
  lignes.map((l) => ({ id: l.id ?? '', code: texteBrut(l.code), description: texteBrut(l.description) }));

/** Le choix de la ligne elle-même (libellés du serveur) complète la liste : un frais validé s'affiche sans elle. */
function avecPropre(liste: ReferentielItemDto[], id: string | null | undefined, code?: string | null, description?: string | null) {
  if (!id || liste.some((c) => c.id === id)) return liste;
  return [...liste, { id, code: code ?? undefined, description: description ?? undefined }];
}

/** Grille des frais d'un terrain ; `types` et `fournisseurs` sont vides hors Administrateur (lecture seule). */
export function colonnesFrais(types: ReferentielItemDto[], fournisseurs: ReferentielItemDto[]): ColonneOnglet<LigneFraisTerrainDto>[] {
  return [
    { nom: 'date', libelle: 'Date', type: 'date' },
    { nom: 'montant', libelle: 'Montant', type: 'montant' },
    { nom: 'typeFraisId', libelle: 'Type de frais', type: 'choix',
      choix: (l) => avecPropre(types, l.typeFraisId, l.typeFraisCode, l.typeFraisDescription) },
    { nom: 'fournisseurId', libelle: 'Fournisseur', type: 'choix', facultatif: true,
      choix: (l) => avecPropre(fournisseurs, l.fournisseurId, null, l.fournisseurDescription) },
    { nom: 'notes', libelle: 'Notes', type: 'texte' },
    { nom: 'valide', libelle: 'Validé', type: 'case', calcule: () => true },
    { nom: 'factureCode', libelle: 'Facture', type: 'texte', calcule: () => true },
  ];
}

/** Le frais s'envoie en `YYYY-MM-DD` (date seule), pas en date-heure comme les dates des fiches. */
export const normaliserFrais = (ligne: LigneFraisTerrainDto): LigneFraisTerrainDto =>
  ({ ...ligne, date: texteBrut(ligne.date).slice(0, 10) });

/** Nouveau frais : le fournisseur du terrain par défaut (modifiable). */
export const nouveauFrais = (fournisseurId?: string): LigneFraisTerrainDto =>
  ({ date: '', montant: 0, notes: '', typeFraisId: '', fournisseurId: fournisseurId ?? null });
