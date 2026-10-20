import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from '../DataGrid';
import { grilleDepuisCatalogue } from '../../lib/colonnes';
import { DISPOSITION_SUIVI_AFFECTATIONS } from '../../lib/dispositions';
import { encaissementEtatTone } from '../../lib/domain';
import { canonicalStatusLabel } from '../../lib/dossierStatus';
import { toneStatutVente } from '../../lib/etatVentes';
import { LIBELLES_ETAT_PIECE, libelleSens } from '../../lib/suiviAffectations';
import type { TotauxServeurGrille } from '../../lib/totauxServeur';
import type { ColonneDto, LigneSuiviAffectationsDto } from '../../types';

export type LigneAffectation = LigneSuiviAffectationsDto;

const libelleEtat = (r: LigneAffectation) => LIBELLES_ETAT_PIECE[r.etatPiece ?? ''] ?? '—';

/** La fiche encaissement renvoie 404 sauf pour `IsCredit = 1` : le serveur le dit dans `pieceOuvrable`. */
function lienPiece(r: LigneAffectation, texte: string | null | undefined): ReactNode {
  if (!r.pieceOuvrable || !r.pieceId || !texte) return <>{texte}</>;
  return (
    <Link
      to={`/encaissements/${r.pieceId}`}
      onClick={(e) => e.stopPropagation()}
      className="text-(--brand) hover:underline"
      title="Ouvrir la pièce d'encaissement"
    >
      {texte}
    </Link>
  );
}

const RENDUS: Record<string, (r: LigneAffectation) => ReactNode> = {
  sens: (r) => <Badge tone={r.sens === 'DEBIT' ? 'warning' : 'success'}>{libelleSens(r.sens)}</Badge>,
  etatPiece: (r) => <Badge tone={encaissementEtatTone(r.etatPiece)}>{libelleEtat(r)}</Badge>,
  statutDossierLibelle: (r) => (
    <Badge tone={toneStatutVente(r.statutDossierCode, r.statutDossierLibelle)}>{canonicalStatusLabel(r.statutDossierLibelle)}</Badge>
  ),
  pieceLibelle: (r) => lienPiece(r, r.pieceLibelle),
  pieceReference: (r) => lienPiece(r, r.pieceReference),
};

// Sans elles, tri et filtre comparent le code brut (`IN_WORK`) et non le libellé affiché.
const VALEURS: Record<string, (r: LigneAffectation) => unknown> = {
  sens: (r) => libelleSens(r.sens),
  etatPiece: libelleEtat,
  statutDossierLibelle: (r) => canonicalStatusLabel(r.statutDossierLibelle),
};

function grille(colonnes: ColonneDto[]): ColonneGrille<LigneAffectation>[] {
  return grilleDepuisCatalogue<LigneAffectation>(colonnes, DISPOSITION_SUIVI_AFFECTATIONS.poids, 'montantAffecte').map((c) => ({
    ...c,
    rendu: RENDUS[c.nom],
    valeur: VALEURS[c.nom],
  }));
}

export default function AffectationsTable({
  rows,
  colonnes,
  onOuvrir,
  groupes,
  totauxServeur,
}: Readonly<{
  rows: LigneAffectation[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  groupes?: GroupementGrille<LigneAffectation>;
  totauxServeur?: TotauxServeurGrille;
}>) {
  const colonnesGrille = useMemo(() => grille(colonnes), [colonnes]);
  return (
    <DataGrid
      cleOrdre="suivi-affectations"
      rows={rows}
      colonnes={colonnesGrille}
      onOuvrir={onOuvrir}
      libelleLigne={(r) => `Ouvrir le dossier ${r.dossierCode ?? r.id}`}
      bandeauRegroupement={false}
      groupes={groupes}
      totauxServeur={totauxServeur}
    />
  );
}
