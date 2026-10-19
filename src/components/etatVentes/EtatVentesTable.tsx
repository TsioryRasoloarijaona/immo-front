import { useMemo } from 'react';
import { Badge } from '../ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from '../DataGrid';
import { grilleDepuisCatalogue } from '../../lib/colonnes';
import { DISPOSITION_ETAT_VENTES } from '../../lib/dispositions';
import { canonicalStatusLabel } from '../../lib/dossierStatus';
import { toneStatutVente } from '../../lib/etatVentes';
import type { TotauxServeurGrille } from '../../lib/totauxServeur';
import type { ColonneDto, LigneEtatVentesDto } from '../../types';

export type LigneEtatVentes = LigneEtatVentesDto & { id: string };

function grille(colonnes: ColonneDto[]): ColonneGrille<LigneEtatVentes>[] {
  return grilleDepuisCatalogue<LigneEtatVentes>(colonnes, DISPOSITION_ETAT_VENTES.poids, 'articleCode').map((c) =>
    c.nom === 'statutLibelle'
      ? {
          ...c,
          valeur: (r) => canonicalStatusLabel(r.statutLibelle),
          rendu: (r) => <Badge tone={toneStatutVente(r.statutCode, r.statutLibelle)}>{canonicalStatusLabel(r.statutLibelle)}</Badge>,
        }
      : c,
  );
}

export default function EtatVentesTable({
  rows,
  colonnes,
  onOuvrir,
  groupes,
  totauxServeur,
}: Readonly<{
  rows: LigneEtatVentes[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  groupes?: GroupementGrille<LigneEtatVentes>;
  totauxServeur?: TotauxServeurGrille;
}>) {
  const colonnesGrille = useMemo(() => grille(colonnes), [colonnes]);
  return (
    <DataGrid
      cleOrdre="etat-des-ventes"
      rows={rows}
      colonnes={colonnesGrille}
      onOuvrir={onOuvrir}
      libelleLigne={(r) => `Ouvrir l'article ${r.articleCode ?? r.id}`}
      bandeauRegroupement={false}
      groupes={groupes}
      totauxServeur={totauxServeur}
    />
  );
}
