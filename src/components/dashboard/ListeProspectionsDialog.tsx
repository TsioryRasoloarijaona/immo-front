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

/**
 * La liste complète d'un couloir du tableau de bord, dans un dialogue — ce que
 * « Voir tout » ouvrait auparavant en quittant l'écran.
 *
 * **Les filtres sont ceux du couloir, mot pour mot** : le total annoncé ici
 * doit être le compte affiché sur le couloir. Ni période ni commercial par
 * défaut, contrairement à l'écran Prospections — ce dialogue prolonge le
 * couloir, il ne remplace pas la liste.
 *
 * Même grille que les écrans de liste (`ProspectionTable`, colonnes par défaut
 * du catalogue) : mêmes badges, même fond rouge sur une relance en retard.
 *
 * Cliquer une ligne ouvre la fiche **par-dessus**, sans fermer la liste : le
 * dialogue de fiche est rendu dans les enfants de celui-ci.
 */
export default function ListeProspectionsDialog({
  titre,
  pre,
  filtres,
  onClose,
}: {
  titre: string;
  /** `true` : le couloir Pré-prospection — autre endpoint, autre habillage. */
  pre: boolean;
  filtres: ProspectionFilterParams;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);

  const catalogue = useColonnesProspections();
  /* Les groupes ACTIVITE et CONVERSION viennent d'une vue qui exclut les
     pré-prospections — voir PreProspectionsList, même filtre. */
  const catalogueUtile = pre
    ? catalogue.data.filter((c) => c.groupe !== 'ACTIVITE' && c.groupe !== 'CONVERSION')
    : catalogue.data;
  const colonnes = useColonnesVisibles(
    pre ? 'dashboard-pre-prospections' : 'dashboard-prospections',
    catalogueUtile,
    DISPOSITION_PROSPECTIONS,
  );

  /* Même tri que les couloirs : propriété d'entité (`docDate`), départagée par
     `id` pour que la pagination soit stable. */
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
            {data.content.length === 0 ? (
              <EmptyState title="Rien à afficher" message={`Aucune ${entite} dans ce couloir.`} />
            ) : colonnes.colonnes.length > 0 ? (
              <ProspectionTable
                cleOrdre={pre ? 'dashboard-pre-prospections' : 'dashboard-prospections'}
                rows={data.content}
                colonnes={colonnes.colonnes}
                entite={entite}
                onOuvrir={(id) => setFiche({ id, pre })}
                bandeauRegroupement={false}
              />
            ) : catalogue.error ? (
              <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
            ) : (
              <LoadingState />
            )}
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
