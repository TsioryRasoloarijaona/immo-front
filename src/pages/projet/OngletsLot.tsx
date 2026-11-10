import { useNavigate } from 'react-router-dom';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { getDocumentsAchat } from '../../lib/apiAchat';
import { getReglementsProjet } from '../../lib/apiDepensesProjet';
import { getBordereauLot, getDecomptesLot } from '../../lib/apiProjet';
import { formatCurrency } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { LigneBordereauDto } from '../../types/projet';
import { COLONNES_DECOMPTES } from './colonnesDecomptes';
import { COLONNES_FACTURES_LOT } from './colonnesFacturesProjet';
import { COLONNES_REGLEMENTS_LOT, classeReglement } from './colonnesReglementsProjet';

/** Un lot porte quelques dizaines de pièces : une page suffit. */
const TAILLE_ONGLET = 200;

const COLONNES_SANS_LOT = COLONNES_DECOMPTES.filter((c) => !['projetCode', 'lotCode', 'fournisseurNom'].includes(c.nom));

const COLONNES_BORDEREAU: ColonneGrille<LigneBordereauDto>[] = [
  { nom: 'groupe', libelle: 'Groupe', largeur: 10 },
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'designation', libelle: 'Désignation', largeur: 20 },
  { nom: 'unite', libelle: 'Unité', largeur: 4 },
  { nom: 'quantite', libelle: 'Qté', type: 'NOMBRE', largeur: 6 },
  { nom: 'prixUnitaireHT', libelle: 'PU HT', type: 'MONTANT', largeur: 9 },
  { nom: 'tauxTVA', libelle: 'TVA %', type: 'NOMBRE', largeur: 4 },
  { nom: 'totalHT', libelle: 'Total HT', type: 'MONTANT', largeur: 9 },
  { nom: 'totalTTC', libelle: 'Total TTC', type: 'MONTANT', largeur: 9 },
];

export function OngletDecomptes({ lotId }: Readonly<{ lotId: string }>) {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(() => getDecomptesLot(lotId), [lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (data.length === 0) return <EmptyState title="Aucun décompte pour ce lot" />;
  return (
    <DataGrid rows={data} colonnes={COLONNES_SANS_LOT} cleOrdre="projet-lot-decomptes" onOuvrir={(id) => void navigate(`/projet/decomptes/${id}`)} bandeauRegroupement={false} />
  );
}

export function OngletFactures({ lotId }: Readonly<{ lotId: string }>) {
  const navigate = useNavigate();
  const { data, loading, error } = useApi(() => getDocumentsAchat({ natures: ['INVOICE'], lotId }, { page: 0, size: TAILLE_ONGLET }), [lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (data.content.length === 0) return <EmptyState title="Aucune facture pour ce lot" />;
  return (
    <DataGrid
      rows={data.content}
      colonnes={COLONNES_FACTURES_LOT}
      cleOrdre="projet-lot-factures"
      onOuvrir={(id) => void navigate(`/projet/depenses/factures/${id}`)}
      bandeauRegroupement={false}
    />
  );
}

export function OngletReglements({ lotId }: Readonly<{ lotId: string }>) {
  const { data, loading, error } = useApi(() => getReglementsProjet({ lotId }, { page: 0, size: TAILLE_ONGLET }), [lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (data.content.length === 0) return <EmptyState title="Aucun règlement pour ce lot" />;
  return <DataGrid rows={data.content} colonnes={COLONNES_REGLEMENTS_LOT} cleOrdre="projet-lot-reglements" classeLigne={classeReglement} bandeauRegroupement={false} />;
}

export function OngletBordereau({ lotId }: Readonly<{ lotId: string }>) {
  const { data, loading, error } = useApi(() => getBordereauLot(lotId), [lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (data.lignes.length === 0) return <EmptyState title="Bordereau non saisi — montant forfaitaire" />;
  const { totalHT, totalTVA, totalTTC } = data.totaux;
  return (
    <div className="flex flex-col gap-2">
      <DataGrid rows={data.lignes} colonnes={COLONNES_BORDEREAU} cleOrdre="projet-lot-bordereau" bandeauRegroupement={false} />
      <p className="text-right text-body text-muted-foreground">
        Total HT <b className="text-foreground">{formatCurrency(totalHT)}</b> · TVA <b className="text-foreground">{formatCurrency(totalTVA)}</b> · TTC{' '}
        <b className="text-foreground">{formatCurrency(totalTTC)}</b>
      </p>
    </div>
  );
}
