import { Suspense, lazy, useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FicheProspection } from './ProspectionDetail';
import { voisinsDe } from '../../lib/fenetreFiche';
import { ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import EtatVideListe from '../../components/liste/EtatVideListe';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { useActionsLigneProspection } from '../../components/ActionsLigneProspection';
import {
  DEFAULT_PAGE_SIZE,
  listPreProspections,
  listPreProspectionsGroupes,
  totauxPreProspections,
} from '../../lib/api';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useColonnesVisibles } from '../../lib/colonnes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { pluriel } from '../../lib/format';
import EtatColonnes from '../../components/EtatColonnes';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useExportListe } from '../../lib/useExportListe';
import { useColonnesProspections, useOriginesProspection } from '../../lib/referentiels';
import { useCascadeTranches } from '../../lib/cascadeTranches';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  hasActiveProspectionFilters,
  paramsBarre,
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
  // `/pre-prospections/:id` rend cette même page : la liste (filtres, page) reste montée sous la fenêtre.
  const { id: idOuvert } = useParams();
  const { search: rechercheUrl } = useLocation();
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('pre-prospections'));

  // Archivé : Tous par défaut, comme OMRAN qui ne filtre pas IsClosed sur cette liste.
  const defauts = emptyProspectionFilters(undefined, 'tous');
  const [filters, setFilters] = useState<ProspectionFilterBarState>(defauts);
  const cascade = useCascadeTranches(filters);
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);
  const filtresActifs = hasActiveProspectionFilters(filters, defauts);
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
    ...paramsBarre(filters, debouncedSearch, cascade.params().trancheId),
    inclureSansTranche: filters.sansTranche || undefined,
  };

  const enGroupes = groupement.actif;

  const clesFiltresSeuls = [
    debouncedSearch,
    filters.etape.join(','),
    filters.origine.join(','),
    filters.commercial.join(','),
    filtresServeur.trancheId?.join(',') ?? '',
    filters.sansTranche,
    filters.dateDebut,
    filters.dateFin,
    filters.archive,
  ];
  const clesFiltres = [...clesFiltresSeuls, page];

  // Hors `page` : les totaux portent sur tout le filtre et ne bougent pas d'une page à l'autre.
  // Colonnes affichées, pas le catalogue : un Σ d'une colonne masquée ne doit être ni demandé ni compté.
  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxPreProspections(filtresServeur, agregats),
    clesFiltresSeuls.join('|'),
    !enGroupes,
    'pre-prospections-totaux',
  );

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
      totauxServeur?.reessayer();
    },
  });

  const data = liste.data;
  const rows = data?.content ?? [];
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  // `origine` porte le code du référentiel : filtrer sur `code`, pas `description`.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  function resetFilters() {
    setPage(0);
    groupement.reinitialiser();
    setFilters(defauts);
  }

  function toutesLesPeriodes() {
    setPage(0);
    setFilters((f) => ({ ...f, dateDebut: '', dateFin: '' }));
  }

  const exportListe = useExportListe('/api/pre-prospections/export', { ...filtresServeur, colonnes: colonnes.visibles }, 'pre-prospections');
  const ouvrirChemin = (chemin: string) => void navigate(`${chemin}${rechercheUrl}`);
  // ‹ › : lignes de la page affichée seulement ; en groupes ils restent inactifs.
  const voisins = voisinsDe(enGroupes ? [] : rows.map((r) => r.id), idOuvert, (id) => ouvrirChemin(`/pre-prospections/${id}`));
  const unite = enGroupes ? 'groupe' : 'pré-prospection';
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;

  return (
    <PageListe titre="Pré-prospections">
      <EnteteListe titre="Pré-prospections" lignes={decompte}>
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
      </EnteteListe>
      <ProspectionFilterBar
        state={filters}
        onChange={setFilter}
        etapeItems={ETAPE_ITEMS}
        origineItems={origineItems}
        commercialItems={commercialItems}
        cascade={cascade}
        mode="pre-prospections"
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        onReinitialiser={resetFilters}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            {/* `min-w-0` : sans lui la largeur de la table remonte la chaîne flex et
                élargit la page. La bande reste hors du test « vide » : sinon sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EtatVideListe
                  filtresActifs={filtresActifs}
                  sujet="pré-prospection"
                  surMois="Aucune pré-prospection sur le mois en cours."
                  onReinitialiser={resetFilters}
                  onToutesPeriodes={toutesLesPeriodes}
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <ProspectionTable
                    cleOrdre="pre-prospections"
                    rows={enGroupes ? [] : rows}
                    colonnes={colonnes.colonnes}
                    entite="pré-prospection"
                    onOuvrir={(prospectionId) => ouvrirChemin(`/pre-prospections/${prospectionId}`)}
                    bandeauRegroupement={false}
                    actions={actionsLigne.rendu}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
                    totauxServeur={totauxServeur}
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

      {idOuvert && <FicheProspection key={idOuvert} id={idOuvert} pre voisins={voisins} onFermer={() => ouvrirChemin('/pre-prospections')} />}

      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="pre-prospections"
        ligneSelectionnee={false}
        nouveau={{ libelle: 'Nouvelle pré-prospection', onClick: () => void navigate('/pre-prospections/nouveau') }}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
          { id: 'importer', onClick: () => void navigate('/pre-prospections/import') },
        ]}
      />
    </PageListe>
  );
}
