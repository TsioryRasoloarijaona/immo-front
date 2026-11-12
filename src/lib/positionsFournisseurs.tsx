import type { ColonneGrille } from '../components/DataGrid';
import { Badge } from '../components/ui';
import type { LignePositionDto, PositionFournisseurDto } from '../types/achat';

/** Une ligne de la grille : fournisseur par société, `id` composé pour la sélection. */
export type LignePositionFournisseur = PositionFournisseurDto & { id: string };

export function lignePosition(p: PositionFournisseurDto): LignePositionFournisseur {
  return { ...p, id: `${p.fournisseurId ?? ''}|${p.societeId ?? ''}` };
}

const MONTANT = 'whitespace-nowrap';

export const COLONNES_POSITIONS: ColonneGrille<LignePositionFournisseur>[] = [
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 14, classe: 'font-medium text-foreground' },
  { nom: 'societeCode', libelle: 'Société', largeur: 7 },
  { nom: 'soldeDebut', libelle: 'Solde début', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'netAPayer', libelle: 'Net à payer', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'regle', libelle: 'Réglé', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'soldeFin', libelle: 'Solde fin', type: 'MONTANT', largeur: 9, classe: MONTANT },
];

function estReglement(l: LignePositionDto): boolean {
  return l.type === 'REGLEMENT' || l.type === 'REGLEMENT_NON_RATTACHE';
}

/** Libellé de la ligne : pièce (code, description) ou règlement, rattaché ou non. */
function intitule(l: LignePositionDto): string {
  return [l.code, l.description].filter(Boolean).join(' — ') || '—';
}

export const COLONNES_LIGNES_POSITION: ColonneGrille<LignePositionDto>[] = [
  {
    nom: 'description',
    libelle: 'Description',
    largeur: 16,
    valeur: intitule,
    rendu: (l) => (
      <span className="flex items-center gap-1.5">
        {estReglement(l) && <Badge tone="info">Règlement</Badge>}
        {l.type === 'REGLEMENT_NON_RATTACHE' && <Badge tone="warning">Non rattaché</Badge>}
        {intitule(l)}
      </span>
    ),
  },
  { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 7 },
  { nom: 'dateEcheance', libelle: 'Échéance', type: 'DATE', largeur: 7 },
  { nom: 'montantTTC', libelle: 'TTC', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'retenues', libelle: 'Retenues', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'aPayer', libelle: 'À payer', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'base', libelle: 'Base', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'ras', libelle: 'RAS', type: 'MONTANT', largeur: 9, classe: MONTANT },
  { nom: 'reglement', libelle: 'Règlement', type: 'MONTANT', largeur: 9, classe: MONTANT },
];
