import { Suspense, lazy, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Plus, RotateCcw, Upload, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import { useActionsLigneProspection } from '../../components/ActionsLigneProspection';
import { DEFAULT_PAGE_SIZE, listPreProspections, listPreProspectionsGroupes } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { pluriel } from '../../lib/format';
import EtatColonnes from '../../components/EtatColonnes';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection, useTranchesFiltre } from '../../lib/referentiels';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  hasActiveProspectionFilters,
  ouvertesDepuisArchive,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

const NouvellePreProspectionDialog = lazy(() => import('./NewPreProspection'));

export default function PreProspectionsList({ nouveau }: Readonly<{ nouveau?: boolean }> = {}) {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);
  // `GET /api/pre-prospections` n'accepte pas `?colonnes=`. ACTIVITE et CONVERSION viennent d'une vue
  // légataire qui exclut les pré-prospections (colonnes vides, refusées au groupement) : écartées ici,
  // pas dans la disposition partagée avec les prospections.
  const catalogue = useColonnesProspections();
  const catalogueUtile = catalogue.data.filter((c) => c.groupe !== 'ACTIVITE' && c.groupe !== 'CONVERSION');
  const colonnes = useColonnesVisibles('pre-prospections', catalogueUtile, DISPOSITION_PROSPECTIONS);

  const groupement = useGroupement(
    'pre-prospections',
    catalogueUtile,
    useCallback(() => setPage(0), []),
  );

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  // Mêmes filtres pour la liste et les groupes : la somme des effectifs doit égaler le total.
  const filtresServeur = {
    search: debouncedSearch || undefined,
    etape: filters.etape.length > 0 ? filters.etape : undefined,
    origine: filters.origine.length > 0 ? filters.origine : undefined,
    commercial: filters.commercial.length > 0 ? filters.commercial : undefined,
    trancheId: filters.trancheId.length > 0 ? filters.trancheId : undefined,
    dateDebut: filters.dateDebut ? `${filters.dateDebut}T00:00:00` : undefined,
    dateFin: filters.dateFin ? `${filters.dateFin}T23:59:59` : undefined,
    ouvertes: ouvertesDepuisArchive(filters.archive),
  };

  const enGroupes = groupement.actif;

  const clesFiltres = [
    debouncedSearch,
    filters.etape.join(','),
    filters.origine.join(','),
    filters.commercial.join(','),
    filters.trancheId.join(','),
    filters.dateDebut,
    filters.dateFin,
    filters.archive,
    page,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listPreProspections(filtresServeur, { page, size: DEFAULT_PAGE_SIZE }),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'pre-prospections',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listPreProspectionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'pre-prospections-groupes',
  );

  const lignesGroupes = useLignesGroupes<ProspectionListItemDto>(
    (cle, taille) =>
      listPreProspections(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}`,
  );

  const actionsLigne = useActionsLigneProspection({
    entite: 'pré-prospection',
    onMutation: () => {
      void liste.refetch();
      void groupes.refetch();
    },
  });

  const data = liste.data;
  const rows = data?.content ?? [];
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  // `origine` porte le code du référentiel : filtrer sur `code`, pas `description`.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  return (
    <PageShell
      title="Pré-prospections"
      crumbs={[{ label: 'Ventes' }, { label: 'Pré-prospections' }]}
      fullHeight
      icon={<UserPlus />}
      accent="var(--sec-preprospection)"
      accentBg="var(--sec-preprospection-bg)"
      actions={
        <>
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/pre-prospections/import')}>
            <Upload data-icon="inline-start" /> Importer des leads
          </Button>
          <Button type="button" size="sm" onClick={() => navigate('/pre-prospections/nouveau')}>
            <Plus data-icon="inline-start" /> Nouvelle pré-prospection
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <ProspectionFilterBar
          state={filters}
          onChange={setFilter}
          etapeItems={ETAPE_ITEMS}
          origineItems={origineItems}
          commercialItems={commercialItems}
          trancheItems={trancheItems}
        />

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {enGroupes
                  ? pluriel(pageAffichee.totalElements, 'groupe')
                  : `${pluriel(pageAffichee.totalElements, 'pré-prospection')} au total`}
              </div>
              {colonnes.catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
            </div>
            {/* `min-w-0` : sans lui la largeur de la table remonte la chaîne flex et
                élargit la page. La bande reste hors du test « vide » : sinon sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title={hasActiveProspectionFilters(filters) ? 'Aucun résultat' : 'Rien ce mois-ci'}
                  message={
                    hasActiveProspectionFilters(filters)
                      ? 'Aucune pré-prospection ne correspond aux filtres actifs.'
                      : 'Aucune pré-prospection sur le mois en cours.'
                  }
                  action={
                    hasActiveProspectionFilters(filters) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(0);
                          setFilters(emptyProspectionFilters());
                        }}
                      >
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(0);
                          setFilters((f) => ({ ...f, dateDebut: '', dateFin: '' }));
                        }}
                      >
                        <CalendarRange data-icon="inline-start" /> Toutes les périodes
                      </Button>
                    )
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <ProspectionTable
                    cleOrdre="pre-prospections"
                    rows={enGroupes ? [] : rows}
                    colonnes={colonnes.colonnes}
                    entite="pré-prospection"
                    onOuvrir={(prospectionId) => navigate(`/pre-prospections/${prospectionId}`)}
                    bandeauRegroupement={false}
                    actions={actionsLigne.rendu}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
                  />
                </EtatColonnes>
              )}
            </div>
            <div className="shrink-0">
              <Pagination
                page={pageAffichee.page}
                totalPages={pageAffichee.totalPages}
                totalElements={pageAffichee.totalElements}
                onPageChange={setPage}
              />
            </div>
          </ResultsRegion>
        )}
      </div>

      {/* La fermeture rafraîchit la liste : une création avec doublons se ferme
          ici sans naviguer vers la fiche. */}
      {nouveau && (
        <Suspense fallback={null}>
          <NouvellePreProspectionDialog
            onClose={() => {
              void navigate('/pre-prospections');
              void liste.refetch();
              void groupes.refetch();
            }}
          />
        </Suspense>
      )}

      {actionsLigne.boites}
    </PageShell>
  );
}
