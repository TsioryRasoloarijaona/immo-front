import { useState } from 'react';
import Modal from '../Modal';
import Pagination from '../Pagination';
import ProspectionTable from '../ProspectionTable';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import FicheProspectionLazy, { type FicheOuverte } from './FicheProspectionLazy';
import { DEFAULT_PAGE_SIZE, listPreProspections, listProspections, type ProspectionFilterParams } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { useColonnesProspections } from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';

/** Filtres du couloir mot pour mot, sans défaut de période ni de commercial : le
 * total doit égaler le compte du couloir. La fiche est rendue dans les enfants
 * pour s'ouvrir par-dessus sans fermer la liste. */
export default function ListeProspectionsDialog({
  titre,
  pre,
  filtres,
  onClose,
}: Readonly<{
  titre: string;
  pre: boolean;
  filtres: ProspectionFilterParams;
  onClose: () => void;
}>) {
  const [page, setPage] = useState(0);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);

  const catalogue = useColonnesProspections();
  /* ACTIVITE et CONVERSION viennent d'une vue qui exclut les pré-prospections. */
  const catalogueUtile = pre
    ? catalogue.data.filter((c) => c.groupe !== 'ACTIVITE' && c.groupe !== 'CONVERSION')
    : catalogue.data;
  const colonnes = useColonnesVisibles(
    pre ? 'dashboard-pre-prospections' : 'dashboard-prospections',
    catalogueUtile,
    DISPOSITION_PROSPECTIONS,
  );

  /* Même tri que les couloirs, départagé par `id` pour une pagination stable. */
  const pageable = { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc', 'id,asc'] };
  const liste = useApi(
    () =>
      pre
        ? listPreProspections(filtres, pageable)
        : listProspections(filtres, pageable, { colonnes: colonnes.demandees }),
    [JSON.stringify(filtres), page, pre, colonnes.demandees?.join(',') ?? ''],
  );

  const data = liste.data;
  const entite = pre ? 'pré-prospection' : 'prospection';

  function corpsListe(rows: NonNullable<typeof data>['content']) {
    if (rows.length === 0) {
      return <EmptyState title="Rien à afficher" message={`Aucune ${entite} dans ce couloir.`} />;
    }
    if (colonnes.colonnes.length > 0) {
      return (
        <ProspectionTable
          cleOrdre={pre ? 'dashboard-pre-prospections' : 'dashboard-prospections'}
          rows={rows}
          colonnes={colonnes.colonnes}
          entite={entite}
          onOuvrir={(id) => setFiche({ id, pre })}
          bandeauRegroupement={false}
        />
      );
    }
    if (catalogue.error) return <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />;
    return <LoadingState />;
  }

  return (
    <Modal title={titre} onClose={onClose} width="min(1280px, calc(100vw - 2rem))" pleineHauteur>
      {liste.loading && !data && <LoadingState />}
      {liste.error && <ErrorState message={liste.error} />}
      {!liste.error && data && (
        <ResultsRegion loading={liste.loading}>
          <div className="shrink-0 text-body text-muted-foreground">
            {data.totalElements} {entite}
            {data.totalElements > 1 ? 's' : ''} au total
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
            {corpsListe(data.content)}
          </div>
          <div className="shrink-0">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
            />
          </div>
        </ResultsRegion>
      )}

      <FicheProspectionLazy fiche={fiche} onClose={() => setFiche(null)} />
    </Modal>
  );
}
