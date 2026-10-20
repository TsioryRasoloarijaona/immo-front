import { Badge } from '../ui';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import { ETATS_DESISTEMENT } from '../../lib/desistements';
import type { DesistementDto } from '../../types';

const MUTED = 'text-muted-foreground';

const COLONNES: ColonneGrille<DesistementDto>[] = [
  { nom: 'code', libelle: 'N° demande', classe: 'tabular-nums font-medium text-foreground' },
  {
    nom: 'etat',
    libelle: 'État',
    rendu: (r) => <Badge tone={ETATS_DESISTEMENT[r.etat].tone}>{ETATS_DESISTEMENT[r.etat].libelle}</Badge>,
    valeur: (r) => ETATS_DESISTEMENT[r.etat].libelle,
  },
  { nom: 'dateDemande', libelle: 'Date demande', type: 'DATE', classe: MUTED },
  { nom: 'dateValidation', libelle: 'Date validation', type: 'DATE', classe: MUTED },
  { nom: 'dateLegalisation', libelle: 'Date légalisation', type: 'DATE', classe: MUTED },
  { nom: 'motifLibelle', libelle: 'Motif', classe: MUTED, titre: (r) => r.motifLibelle ?? undefined },
  { nom: 'dossierCode', libelle: 'Dossier', classe: `tabular-nums ${MUTED}` },
  { nom: 'clientNom', libelle: 'Client', classe: 'font-medium text-foreground', titre: (r) => r.clientNom ?? undefined },
  { nom: 'trancheLibelle', libelle: 'Tranche', classe: MUTED },
  { nom: 'articleCode', libelle: 'Article', classe: `tabular-nums ${MUTED}` },
  { nom: 'prixVente', libelle: 'Prix', type: 'MONTANT' },
  { nom: 'totalRegle', libelle: 'Réglé', type: 'MONTANT', classe: MUTED },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', classe: MUTED },
  { nom: 'taux', libelle: 'Pénalité %', type: 'POURCENTAGE', classe: MUTED },
  { nom: 'remise', libelle: 'Remise %', type: 'POURCENTAGE', classe: MUTED },
  { nom: 'penaliteApresRemise', libelle: 'Pénalité après remise', type: 'MONTANT' },
  { nom: 'resteFraisARegler', libelle: 'Reste frais', type: 'MONTANT', classe: MUTED },
  { nom: 'aRembourser', libelle: 'À rembourser', type: 'MONTANT', classe: 'font-semibold text-foreground' },
];

export default function DesistementTable({
  rows,
  onOuvrir,
}: Readonly<{ rows: DesistementDto[]; onOuvrir: (id: string) => void }>) {
  return (
    <DataGrid
      cleOrdre="desistements"
      rows={rows}
      colonnes={COLONNES}
      onOuvrir={onOuvrir}
      libelleLigne={(r) => `Ouvrir le désistement ${r.code ?? r.id}`}
      bandeauRegroupement={false}
    />
  );
}
