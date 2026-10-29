import { lazy, Suspense, useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FicheProspection } from './ProspectionDetail';
import { voisinsDe } from '../../lib/fenetreFiche';
import { ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import EtatVideListe from '../../components/liste/EtatVideListe';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionFiltresAvances from '../../components/ProspectionFiltresAvances';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import { useActionsLigneProspection } from '../../components/ActionsLigneProspection';
import BasculeVue from '../../components/parcours/BasculeVue';
import KanbanProspections from '../../components/parcours/KanbanProspections';
import { lireVueProspections, memoriserVueProspections, type VueProspections } from '../../lib/kanban';
import {
  DEFAULT_PAGE_SIZE,
  listProspections,
  listProspectionsGroupes,
  paramsExportProspections,
  totauxColonnes,
} from '../../lib/api';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useColonnesVisibles } from '../../lib/colonnes';
import { pluriel } from '../../lib/format';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useExportListe } from '../../lib/useExportListe';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection, useTranchesFiltre } from '../../lib/referentiels';
import {
  PIPELINE_STAGES,
  countActiveFiltresAvances,
  emptyFiltresAvances,
  emptyProspectionFilters,
  filtresServeurProspection,
  hasActiveProspectionFilters,
  paramsBarre,
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
  // `/prospections/:id` rend cette même page : la liste (filtres, page) reste montée sous la fenêtre.
  const { id: idOuvert } = useParams();
  const { search: rechercheUrl } = useLocation();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux, commerciauxLoading } = useAppData();
  const origines = useOriginesProspection();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('prospections'));

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
  const [vue, setVue] = useState<VueProspections>(lireVueProspections);
  const kanban = vue === 'kanban';
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
  // Aboutie et date visée vivent dans la barre mais partent avec les filtres avancés (même objet serveur).
  const filtresAvances = filtresServeurProspection(avances, filters);
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
  const filtresServeur = paramsBarre(filters, debouncedSearch);

  const enGroupes = groupement.actif;

  const clesFiltresSeuls = [
    debouncedSearch,
    filters.etape.join(','),
    filters.origine.join(','),
    filters.commercial.join(','),
    filters.trancheId.join(','),
    filters.dateDebut,
    filters.dateFin,
    filters.archive,
    cleAvances,
  ];
  const clesFiltres = [...clesFiltresSeuls, page];
  const listeSuspendue = enGroupes || attenteDefaut || kanban;

  // Hors `page` : les totaux portent sur tout le filtre. Colonnes affichées : un Σ masqué n'est pas demandé.
  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes('prospections', filtresServeur, agregats, filtresAvances),
    clesFiltresSeuls.join('|'),
    !listeSuspendue,
    'prospections-totaux',
  );

  const liste = useApi(
    () =>
      listeSuspendue
        ? Promise.resolve(null)
        : listProspections(
            filtresServeur,
            { page, size: DEFAULT_PAGE_SIZE },
            { colonnes: colonnesDemandees, filtres: filtresAvances },
          ),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps, attenteDefaut, kanban],
    'prospections',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes && !attenteDefaut && !kanban
        ? listProspectionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE }, { filtres: filtresAvances })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps, attenteDefaut, kanban],
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
      totauxServeur?.reessayer();
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

  const surMois = ownCommercial
    ? "Vous n'avez aucune prospection sur le mois en cours."
    : 'Aucune prospection sur le mois en cours.';

  function resetFilters() {
    setPage(0);
    groupement.reinitialiser();
    setModifs({});
    setAvances(emptyFiltresAvances());
  }

  function toutesLesPeriodes() {
    setPage(0);
    setModifs((m) => ({ ...m, dateDebut: '', dateFin: '' }));
  }

  const exportListe = useExportListe(
    '/api/prospections/export',
    paramsExportProspections(filtresServeur, filtresAvances, colonnes.visibles),
    'prospections',
  );
  const ouvrirChemin = (chemin: string) => void navigate(`${chemin}${rechercheUrl}`);
  // ‹ › : lignes de la page affichée seulement ; en groupes ou en Kanban ils restent inactifs.
  const voisins = voisinsDe(enGroupes || kanban ? [] : rows.map((r) => r.id), idOuvert, (id) => ouvrirChemin(`/prospections/${id}`));
  const unite = enGroupes ? 'groupe' : 'prospection';
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;

  const grille = (
    <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
      <ProspectionTable
        cleOrdre="prospections"
        rows={enGroupes ? [] : rows}
        colonnes={colonnes.colonnes}
        onOuvrir={(prospectionId) => ouvrirChemin(`/prospections/${prospectionId}`)}
        bandeauRegroupement={false}
        actions={actionsLigne.rendu}
        groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
        totauxServeur={totauxServeur}
      />
    </EtatColonnes>
  );

  return (
    <PageListe titre="Prospections">
      <EnteteListe titre="Prospections" lignes={decompte}>
        <div className="flex items-center gap-2">
          <BasculeVue
            vue={vue}
            onChange={(v) => {
              memoriserVueProspections(v);
              setVue(v);
            }}
          />
          {colonnes.catalogueServi.length > 0 && (
            <ColumnSelector
              compact
              catalogue={colonnes.catalogueServi}
              visibles={colonnes.visibles}
              onBasculer={colonnes.basculer}
              onReinitialiser={colonnes.reinitialiser}
              estDefaut={colonnes.estDefaut}
            />
          )}
        </div>
      </EnteteListe>
      <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />
      <ProspectionFilterBar
        state={filters}
        onChange={setFilter}
        etapeItems={ETAPE_ITEMS}
        origineItems={origineItems}
        commercialItems={commercialItems}
        trancheItems={trancheItems}
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        onReinitialiser={resetFilters}
        champs={
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {/* En Kanban, liste et groupes ne chargent rien (`null`) : seul le tableau s'affiche. */}
        {kanban && (
          <KanbanProspections
            filtres={filtresServeur}
            avances={filtresAvances}
            cle={clesFiltres.join('|')}
            onOuvrir={(id) => ouvrirChemin(`/prospections/${id}`)}
          />
        )}
        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {(loading || attenteDefaut) && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            {/* Seul conteneur de défilement, sur les deux axes : sans `min-w-0`/`min-h-0`
                il grandirait au lieu de défiler. La bande reste hors du test « vide »,
                sinon un groupe vide laisse l'écran sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                /* Les filtres avancés comptent comme la barre et sont réinitialisés
                   avec elle : un volet replié rendrait sinon le vide inexplicable. */
                <EtatVideListe
                  filtresActifs={filtresActifs}
                  sujet="prospection"
                  surMois={surMois}
                  onReinitialiser={resetFilters}
                  onToutesPeriodes={toutesLesPeriodes}
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

      {idOuvert && <FicheProspection key={idOuvert} id={idOuvert} pre={false} voisins={voisins} onFermer={() => ouvrirChemin('/prospections')} />}

      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="prospections"
        ligneSelectionnee={false}
        nouveau={{ libelle: 'Nouvelle prospection', onClick: () => void navigate('/prospections/nouveau') }}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
