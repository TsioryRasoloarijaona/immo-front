import { useNavigate } from 'react-router-dom';
import DataGrid from '../../components/DataGrid';
import BordereauModifiable from '../../components/projet/sousfenetres/BordereauModifiable';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { getDocumentsAchat } from '../../lib/apiAchat';
import { getReglementsProjet } from '../../lib/apiDepensesProjet';
import { getBordereauLot, getDecomptesLot, putBordereauLot } from '../../lib/apiProjet';
import { useApi } from '../../lib/useApi';
import { COLONNES_DECOMPTES } from './colonnesDecomptes';
import { COLONNES_FACTURES_LOT } from './colonnesFacturesProjet';
import { COLONNES_REGLEMENTS_LOT, classeReglement } from './colonnesReglementsProjet';

/** Un lot porte quelques dizaines de pièces : une page suffit. */
const TAILLE_ONGLET = 200;

const COLONNES_SANS_LOT = COLONNES_DECOMPTES.filter((c) => !['projetCode', 'lotCode', 'fournisseurNom'].includes(c.nom));

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
  if (!data.modifiable && data.lignes.length === 0) return <EmptyState title="Bordereau non saisi — montant forfaitaire" />;
  return (
    <BordereauModifiable source={data} editable={data.modifiable} cleOrdre="projet-lot-bordereau" enregistrer={(corps) => putBordereauLot(lotId, corps)} />
  );
}
