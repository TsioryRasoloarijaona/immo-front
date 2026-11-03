import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import DataGrid from '../DataGrid';
import Pagination from '../Pagination';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { oublierLecturesRecentes } from '../../lib/api';
import { listerOngletTiers } from '../../lib/apiOngletsTiers';
import { cheminLien, type DefinitionOnglet } from '../../lib/ongletsTiers';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { FamilleTiers } from '../../types/administration';

const TAILLE_PAGE = 50;

/** Onglet de lecture seule de la fiche tiers : grille paginée côté serveur, date décroissante. */
export default function OngletLectureTiers({ famille, tiersId, onglet }: Readonly<{
  famille: FamilleTiers;
  tiersId: UUID;
  onglet: DefinitionOnglet;
}>) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, loading, error, refetch } = useApi(
    () => listerOngletTiers(famille, tiersId, onglet.id, page, TAILLE_PAGE),
    [famille, tiersId, onglet.id, page],
  );
  const rows = data?.content ?? [];

  function ouvrir(id: string) {
    const ligne = rows.find((r) => r.id === id);
    const chemin = ligne ? cheminLien(ligne) : null;
    if (chemin) void navigate(chemin);
  }

  function reessayer() {
    oublierLecturesRecentes();
    void refetch();
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {loading && !data && <LoadingState />}
      {error && (
        <div className="flex flex-col items-center gap-2">
          <ErrorState message={error} />
          <Button type="button" variant="outline" size="sm" onClick={reessayer}>
            <RotateCw data-icon="inline-start" /> Réessayer
          </Button>
        </div>
      )}
      {!error && data && rows.length === 0 && <EmptyState title={onglet.aucun} />}
      {!error && data && rows.length > 0 && (
        <>
          <DataGrid cleOrdre={`tiers-onglet-${onglet.id}`} rows={rows} colonnes={onglet.colonnes} onOuvrir={ouvrir} />
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
