import { lazy, Suspense, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarRange, Plus, RotateCcw, Users } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionFiltresAvances from '../../components/ProspectionFiltresAvances';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import { useActionsLigneProspection } from '../../components/ActionsLigneProspection';
import { DEFAULT_PAGE_SIZE, listProspections, listProspectionsGroupes } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { pluriel } from '../../lib/format';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection, useTranchesFiltre } from '../../lib/referentiels';
import {
  PIPELINE_STAGES,
  countActiveFiltresAvances,
  emptyFiltresAvances,
  emptyProspectionFilters,
  hasActiveProspectionFilters,
  ouvertesDepuisArchive,
  toFiltresAvances,
  type FiltresAvancesState,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

const NouvelleProspectionDialog = lazy(() => import('./NewProspection'));

// `nouveau` vient de la route `/prospections/nouveau` : l'URL porte l'intention, Retour ferme la boîte.
export default function ProspectionsList({ nouveau }: Readonly<{ nouveau?: boolean }> = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux, commerciauxLoading } = useAppData();
  const origines = useOriginesProspection();

  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const defauts = emptyProspectionFilters(ownCommercial?.id);
  // Défaut inconnu tant que les commerciaux n'ont pas répondu : sinon l'équipe entière s'afficherait un instant.
  const attenteDefaut = commerciauxLoading && !!user?.employeeId;

  /* L'état ne garde que les modifications ; les défauts sont dérivés, car les
     commerciaux arrivent après le montage. `?periode=toutes` (lien du tableau
     de bord) n'est lu qu'à l'ouverture. */
  const [searchParams] = useSearchParams();
  const [modifs, setModifs] = useState<Partial<ProspectionFilterBarState>>(() =>
    searchParams.get('periode') === 'toutes' ? { dateDebut: '', dateFin: '' } : {},
  );
  const [page, setPage] = useState(0);
  const filters: ProspectionFilterBarState = { ...defauts, ...modifs };
  const debouncedSearch = useDebouncedValue(filters.search);
  const catalogue = useColonnesProspections();
  const colonnes = useColonnesVisibles('prospections', catalogue.data, DISPOSITION_PROSPECTIONS);
  const colonnesDemandees = colonnes.demandees;

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
  const groupement = useGroupement(
    'prospections',
    catalogue.data,
    /* `setPage` déclaré bien que stable : le compilateur React l'infère et
       refuse sinon de compiler (`react-hooks/preserve-manual-memoization`). */
    useCallback(() => setPage(0), [setPage]),
  );

  const [avances, setAvances] = useState<FiltresAvancesState>(emptyFiltresAvances());
  const filtresAvances = toFiltresAvances(avances);
  // Sérialisée pour la clé de dépendance : des listes qu'aucune comparaison de références ne stabilise.
  const cleAvances = filtresAvances ? JSON.stringify(filtresAvances) : '';
  const filtresActifs = hasActiveProspectionFilters(filters, defauts) || countActiveFiltresAvances(avances) > 0;

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setModifs((m) => ({ ...m, [key]: value }));
  }

  function setAvance<K extends keyof FiltresAvancesState>(key: K, value: FiltresAvancesState[K]) {
    setPage(0);
    setAvances((f) => ({ ...f, [key]: value }));
  }

  /* Mêmes filtres pour la liste et les groupes, volet avancé compris : la somme
     des effectifs doit égaler le total de la liste. */
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
    cleAvances,
  ];

  const liste = useApi(
    () =>
      enGroupes || attenteDefaut
        ? Promise.resolve(null)
        : listProspections(
            filtresServeur,
            { page, size: DEFAULT_PAGE_SIZE },
            { colonnes: colonnesDemandees, filtres: filtresAvances },
          ),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps, attenteDefaut],
    'prospections',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes && !attenteDefaut
        ? listProspectionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE }, { filtres: filtresAvances })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps, attenteDefaut],
    'prospections-groupes',
  );

  const lignesGroupes = useLignesGroupes<ProspectionListItemDto>(
    (cle, taille) =>
      listProspections(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        {
          colonnes: colonnesDemandees,
          filtres: filtresAvances,
          depliage: groupement.depliagePour(cle),
        },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const actionsLigne = useActionsLigneProspection({
    entite: 'prospection',
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
  // `origine` porte le *code* du référentiel, pas forcément sa `description` : filtrer sur `code`.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  let messageVide = 'Aucune prospection sur le mois en cours.';
  if (filtresActifs) messageVide = 'Aucune prospection ne correspond aux filtres actifs.';
  else if (ownCommercial) messageVide = "Vous n'avez aucune prospection sur le mois en cours.";

  const grille = (
    <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
      <ProspectionTable
        cleOrdre="prospections"
        rows={enGroupes ? [] : rows}
        colonnes={colonnes.colonnes}
        onOuvrir={(prospectionId) => navigate(`/prospections/${prospectionId}`)}
        bandeauRegroupement={false}
        actions={actionsLigne.rendu}
        groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
      />
    </EtatColonnes>
  );

  return (
    <PageShell
      title="Prospections"
      crumbs={[{ label: 'Ventes' }, { label: 'Prospections' }]}
      fullHeight
      icon={<Users />}
      accent="var(--sec-prospection)"
      accentBg="var(--sec-prospection-bg)"
      actions={
        <Button type="button" size="sm" onClick={() => navigate('/prospections/nouveau')}>
          <Plus data-icon="inline-start" /> Nouvelle prospection
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <ProspectionFilterBar
          state={filters}
          onChange={setFilter}
          etapeItems={ETAPE_ITEMS}
          origineItems={origineItems}
          commercialItems={commercialItems}
          trancheItems={trancheItems}
          defauts={defauts}
          extra={
            <ProspectionFiltresAvances
              state={avances}
              onChange={setAvance}
              onReset={() => {
                setPage(0);
                setAvances(emptyFiltresAvances());
              }}
            />
          }
        />

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {(loading || attenteDefaut) && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {enGroupes
                  ? pluriel(pageAffichee.totalElements, 'groupe')
                  : `${pluriel(pageAffichee.totalElements, 'prospection')} au total`}
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
            {/* Seul conteneur de défilement, sur les deux axes : sans `min-w-0`/`min-h-0`
                il grandirait au lieu de défiler. La bande reste hors du test « vide »,
                sinon un groupe vide laisse l'écran sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                /* Les filtres avancés comptent comme la barre et sont réinitialisés
                   avec elle : un volet replié rendrait sinon le vide inexplicable. */
                <EmptyState
                  title={filtresActifs ? 'Aucun résultat' : 'Rien ce mois-ci'}
                  message={messageVide}
                  action={
                    filtresActifs ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(0);
                          groupement.reinitialiser();
                          setModifs({});
                          setAvances(emptyFiltresAvances());
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
                          setModifs((m) => ({ ...m, dateDebut: '', dateFin: '' }));
                        }}
                      >
                        <CalendarRange data-icon="inline-start" /> Toutes les périodes
                      </Button>
                    )
                  }
                />
              ) : (
                grille
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

      {nouveau && (
        <Suspense fallback={null}>
          <NouvelleProspectionDialog onClose={() => navigate('/prospections')} />
        </Suspense>
      )}

      {actionsLigne.boites}
    </PageShell>
  );
}
