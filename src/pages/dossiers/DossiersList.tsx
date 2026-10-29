import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FileText, Ruler } from 'lucide-react';
import { ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import EtatVideListe from '../../components/liste/EtatVideListe';
import SelecteurDocumentsEnLot from '../../components/dossier/liste/SelecteurDocumentsEnLot';
import DossierTable from '../../components/DossierTable';
import BandeGroupement from '../../components/BandeGroupement';
import HoteReajustementSuperficies from '../../components/dossier/HoteReajustementSuperficies';
import FicheDossierFenetre from '../../components/dossier/fiche/FicheDossierFenetre';
import { voisinsDe } from '../../lib/fenetreFiche';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import FiltreEntiteProjetTranche from '../../components/liste/FiltreEntiteProjetTranche';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import OptionsListeDossiers from '../../components/dossier/liste/OptionsListeDossiers';
import TotauxDossiers from '../../components/dossier/liste/TotauxDossiers';
import {
  DEFAULT_PAGE_SIZE,
  DOSSIER_BATCH_DOC_LABELS,
  downloadDossiersDocumentsEnLot,
  listChampsDateDossiers,
  listDossiers,
  listDossiersGroupes,
  listStatutsDossiers,
  totauxColonnes,
  viewDossiersDocumentsEnLot,
  type DossierBatchDocKind,
  type DossierFilterParams,
} from '../../lib/api';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { useExportListe } from '../../lib/useExportListe';
import { useColonnesVisibles } from '../../lib/colonnes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import { DISPOSITION_DOSSIERS } from '../../lib/dispositions';
import { useColonnesDossiers } from '../../lib/referentiels';
import { CASCADE_VIDE, pucesCascade, useCascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import { useAppData, commercialLabel } from '../../lib/appData';
import { usePreview } from '../../lib/previewContext';
import { debutMoisISO, finMoisISO, pluriel } from '../../lib/format';
import { useTotauxNature } from '../../lib/totauxDossiers';
import { useTotauxServeur } from '../../lib/totauxServeur';
import {
  AGREGATS_TOTAUX,
  colonnesListe,
  exigeLesSortis,
  filtreStatuts,
  libelleStatut,
  optionsListe,
  optionsStatuts,
  ouvrirLigne,
  totauxDossiersActifs,
  totauxSurDossiers,
  uniteDeLigne,
} from '../../lib/dossierListe';
import type { DossierListItemDto } from '../../types';

const BATCH_DOC_ITEMS = (Object.entries(DOSSIER_BATCH_DOC_LABELS) as [DossierBatchDocKind, string][]).map(([value, label]) => ({ label, value }));

/** Référence stable : un `[]` neuf à chaque rendu invaliderait `dossiersParId`. */
const EMPTY: DossierListItemDto[] = [];

const TRI_LISTE = ['docDate,desc'];

const GROUPEMENT_ET_LIBRES = 'Le regroupement ne porte que sur des dossiers : retirez « Libre » du filtre de statut.';

/** Repli tant que `GET /api/dossiers/champs-date` n'a pas répondu. */
const CHAMP_DATE_DEFAUT = [{ label: 'Date réservation', value: 'RESERVATION' }];

export default function DossiersList() {
  const navigate = useNavigate();
  // `/dossiers/:id` rend cette même page : la liste (filtres, page, sélection) reste montée sous la fenêtre.
  const { id: idOuvert } = useParams();
  const { search: rechercheUrl } = useLocation();
  const { ouvrirFicheProspection, ouvrirFicheArticle } = usePreview();
  const { commerciaux } = useAppData();
  const { user } = useAuth();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('dossiers'));
  const [reajustementOuvert, setReajustementOuvert] = useState(false);
  const [selecteurDocOuvert, setSelecteurDocOuvert] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState<string[]>([]);
  const [selection, setSelection] = useState<SelectionCascade>(CASCADE_VIDE);
  const cascade = useCascadeTranches(selection);
  const trancheId = cascade.params().trancheId;
  const [champDate, setChampDate] = useState('RESERVATION');
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [commercial, setCommercial] = useState('all');
  const [inclureSortis, setInclureSortis] = useState(false);
  const [ordreOmran, setOrdreOmran] = useState(false);
  const [page, setPage] = useState(0);

  const statutsServeur = useApi(() => listStatutsDossiers(), [], 'dossiers-statuts');
  const champsDate = useApi(() => listChampsDateDossiers(), [], 'dossiers-champs-date');
  const statusItems = optionsStatuts(statutsServeur.data ?? []);
  const champDateItems = champsDate.data?.map((c) => ({ label: c.libelle, value: c.code })) ?? CHAMP_DATE_DEFAUT;

  // `selectedLabels` garde un libellé par id même quand la ligne a quitté la page ou le filtre.
  const [batchDocKind, setBatchDocKind] = useState<DossierBatchDocKind | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [batchBusy, setBatchBusy] = useState<'view' | 'download' | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const catalogue = useColonnesDossiers();
  const colonnes = useColonnesVisibles('dossiers-omran', catalogue.data, DISPOSITION_DOSSIERS);
  // Toujours explicite : les champs des icônes de ligne ne sont pas dans la sélection par défaut du serveur.
  const colonnesDemandees = colonnesListe(colonnes.demandees, catalogue.data, DISPOSITION_DOSSIERS.toujoursDemandees ?? []);

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
  const groupement = useGroupement(
    'dossiers',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );
  const filtreStatut = filtreStatuts(status);
  const groupementBloque = filtreStatut.lignes === 'LIBRES' ? GROUPEMENT_ET_LIBRES : undefined;

  /* Mêmes filtres pour la liste, les groupes, les totaux et l'export : la somme des effectifs doit
     égaler le total de la liste. Le statut est filtré par le serveur, sur les codes `StrStatus`. */
  const filtresServeur: DossierFilterParams = {
    search: debouncedSearch || undefined,
    trancheId,
    commercial: commercial !== 'all' ? commercial : undefined,
    champDate: dateDebut || dateFin ? champDate : undefined,
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
    ...filtreStatut,
    ...optionsListe(inclureSortis, ordreOmran),
  };

  const enGroupes = groupement.actif && !groupementBloque;

  const clesFiltres = [
    debouncedSearch,
    status.join(','),
    trancheId?.join(',') ?? '',
    champDate,
    dateDebut,
    dateFin,
    commercial,
    inclureSortis,
    ordreOmran,
    page,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : // Tri sur `docDate` (propriété d'entité), pas `dateDocument` (champ du DTO) : sinon 400.
          listDossiers(filtresServeur, { page, size: DEFAULT_PAGE_SIZE, sort: TRI_LISTE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'dossiers',
  );

  // Σ en tête : `totaux` de `/groupes` porte sur tout le résultat filtré, pas sur la page.
  const totaux = useApi(
    () =>
      filtreStatut.lignes === 'LIBRES'
        ? Promise.resolve(null)
        : listDossiersGroupes(
            filtresServeur,
            { groupBy: 'statut', agregats: [...AGREGATS_TOTAUX], inclureSansValeur: true },
            { page: 0, size: 1 },
          ),
    [...clesFiltres.slice(0, -1)],
    'dossiers-totaux',
  );

  const totauxNature = useTotauxNature(filtresServeur, clesFiltres.slice(0, -1), colonnes.colonnes);

  // Σ par colonne sur tout le filtre (hors `page`), sur les dossiers seuls.
  const totauxServeur = totauxSurDossiers(
    useTotauxServeur(
      colonnes.colonnes,
      (agregats) => totauxColonnes('dossiers', filtresServeur, agregats),
      clesFiltres.slice(0, -1).join('|'),
      totauxDossiersActifs(enGroupes, filtreStatut.lignes),
      'dossiers-totaux-colonnes',
    ),
    filtreStatut.lignes,
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listDossiersGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'dossiers-groupes',
  );

  const lignesGroupes = useLignesGroupes<DossierListItemDto>(
    (cle, taille) =>
      listDossiers(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const dossiers = data?.content ?? EMPTY;
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : dossiers.length === 0;
  // Inclut les lignes des groupes dépliés : sinon cocher dans un groupe ne retrouverait pas le dossier.
  const dossiersVisibles = enGroupes ? lignesGroupes.lignesChargees : dossiers;

  const dossiersParId = useMemo(
    () => new Map(dossiersVisibles.map((d) => [d.id, d])),
    [dossiersVisibles],
  );

  // `nouveau` et `onglet` ne concernent que la fiche ouverte par le lien : ils ne suivent pas ‹ ›, ni un autre dossier.
  const rechercheConservee = (() => {
    const p = new URLSearchParams(rechercheUrl);
    p.delete('nouveau');
    p.delete('onglet');
    const s = p.toString();
    return s ? `?${s}` : '';
  })();
  const ouvrirChemin = (chemin: string) => void navigate(`${chemin}${rechercheConservee}`);
  // ‹ › : lignes de la page affichée seulement ; en groupes, ou pour un lot libre, ils restent inactifs.
  const voisins = voisinsDe(
    enGroupes ? [] : dossiers.filter((d) => !d.libre).map((d) => d.id),
    idOuvert,
    (id) => ouvrirChemin(`/dossiers/${id}`),
  );

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    groupement.reinitialiser();
    setSearch('');
    setStatus([]);
    setSelection(CASCADE_VIDE);
    setChampDate('RESERVATION');
    setDateDebut(debutMoisISO());
    setDateFin(finMoisISO());
    setCommercial('all');
    setInclureSortis(false);
    setOrdreOmran(false);
  }

  function toutesLesPeriodes() {
    setPage(0);
    setDateDebut('');
    setDateFin('');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || status.length > 0 || trancheId !== undefined || champDate !== 'RESERVATION' || dateDebut !== debutMoisISO() || dateFin !== finMoisISO() || commercial !== 'all' || inclureSortis;

  const paramsExport = { ...filtresServeur, colonnes: colonnes.visibles, sort: TRI_LISTE };
  const exportListe = useExportListe('/api/dossiers/export', paramsExport, 'dossiers');
  const uniteLigne = uniteDeLigne(filtreStatut.lignes);

  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));
  const puces = [
    ...puceSelection('Statut', statusItems, status),
    ...pucesCascade(cascade, selection),
    ...puceUnique(commercialItems, commercial === 'all' ? null : commercial),
    ...(inclureSortis ? ['Annulés inclus'] : []),
    ...(ordreOmran ? ['Ordre OMRAN'] : []),
    ...(search ? [`« ${search} »`] : []),
  ];
  const unite = enGroupes ? 'groupe' : uniteLigne;
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;

  function periodeChangee(debut: string, fin: string) {
    setPage(0);
    setDateDebut(debut);
    setDateFin(fin);
  }

  function fermerSelecteurDoc() {
    setSelecteurDocOuvert(false);
    setBatchDocKind(null);
    clearSelection();
  }

  function toggleSelected(d: DossierListItemDto) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(d.id)) next.delete(d.id);
      else next.add(d.id);
      return next;
    });
    setSelectedLabels((prev) => ({ ...prev, [d.id]: d.code || d.clientNom || d.id }));
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectedLabels({});
    setBatchError(null);
  }

  async function handleBatchDocument(action: 'view' | 'download') {
    if (!batchDocKind || selectedIds.size === 0) return;
    setBatchBusy(action);
    setBatchError(null);
    try {
      const ids = Array.from(selectedIds);
      if (action === 'view') await viewDossiersDocumentsEnLot(batchDocKind, ids);
      else await downloadDossiersDocumentsEnLot(batchDocKind, ids, `${batchDocKind}-lot.pdf`);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBatchBusy(null);
    }
  }

  return (
    <PageListe titre="Dossiers de vente">
      <EnteteListe titre="Dossiers de vente" lignes={decompte}>
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
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        champDate={{
          items: champDateItems,
          valeur: champDate,
          onChange: (v) => {
            // Date d'annulation : seuls les sortis la portent, on coche « Inclure annulés / désistés ».
            setInclureSortis((avant) => avant || exigeLesSortis(v));
            resetAndSet(setChampDate, v);
          },
        }}
        periode={{ debut: dateDebut, fin: dateFin, onChange: periodeChangee }}
        recherche={{
          valeur: search,
          onChange: (v) => resetAndSet(setSearch, v),
          placeholder: 'Client, CIN, mobile, co-acquéreur, article, code…',
        }}
        onReinitialiser={resetFilters}
      >
        <BoiteFiltre titre="Statut" mode="multiple" items={statusItems} valeur={status} onChange={(v) => resetAndSet(setStatus, v)} />
        <FiltreEntiteProjetTranche valeur={selection} onChange={(sel) => resetAndSet(setSelection, sel)} cascade={cascade} />
        <BoiteFiltre
          titre="Commercial"
          mode="unique"
          items={commercialItems}
          valeur={commercial === 'all' ? null : commercial}
          onChange={(v) => resetAndSet(setCommercial, v ?? 'all')}
        />
        <OptionsListeDossiers
          inclureSortis={inclureSortis}
          onInclureSortis={(v) => resetAndSet(setInclureSortis, v)}
          ordreOmran={ordreOmran}
          onOrdreOmran={(v) => resetAndSet(setOrdreOmran, v)}
        />
      </PanneauFiltresCoches>

      {selecteurDocOuvert && (
        <SelecteurDocumentsEnLot
          types={BATCH_DOC_ITEMS}
          type={batchDocKind}
          onType={(t) => setBatchDocKind(t as DossierBatchDocKind | null)}
          ids={selectedIds}
          libelles={selectedLabels}
          occupe={batchBusy}
          erreur={batchError}
          onVoir={() => void handleBatchDocument('view')}
          onTelecharger={() => void handleBatchDocument('download')}
          onRetirer={removeSelected}
          onViderSelection={clearSelection}
          onFermer={fermerSelecteurDoc}
        />
      )}

      {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
          chargement plein écran se rallumerait par-dessus les groupes. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <TotauxDossiers totaux={totaux.data} montants={totauxNature.data} colonnes={colonnes.colonnes} />
            {/* `min-w-0` : sans lui la largeur de la table remonte la chaîne flex et
                élargit la page. La bande reste hors du test « vide » : sinon sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} bloque={groupementBloque} />
              {vide ? (
                <EtatVideListe
                  filtresActifs={hasActiveFilters}
                  sujet="dossier de vente"
                  surMois="Aucun dossier de vente réservé sur le mois en cours."
                  onReinitialiser={resetFilters}
                  onToutesPeriodes={toutesLesPeriodes}
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <DossierTable
                    cleOrdre="dossiers-omran"
                    rows={enGroupes ? [] : dossiers}
                    colonnes={colonnes.colonnes}
                    // `enGroupes` et non `groupement.actif` : un filtre de statut bloque le groupement.
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, { statut: libelleStatut }, enGroupes)}
                    onOuvrir={(id) => ouvrirLigne(dossiersParId.get(id), id, ouvrirChemin, ouvrirFicheArticle)}
                    onOuvrirProspection={(prospectionId) => ouvrirFicheProspection(prospectionId, false)}
                    bandeauRegroupement={false}
                    totauxServeur={totauxServeur}
                    selection={
                      batchDocKind
                        ? {
                            ids: selectedIds,
                            onToggle: (id) => {
                              const d = dossiersParId.get(id);
                              // Un lot libre n'a pas de dossier : aucun document à générer.
                              if (d && !d.libre) toggleSelected(d);
                            },
                            onToggleAll: (tous) => {
                              const ids = tous.filter((id) => !dossiersParId.get(id)?.libre);
                              setSelectedIds(new Set(ids));
                              setSelectedLabels((prev) => {
                                const next = { ...prev };
                                for (const id of ids) {
                                  const d = dossiersParId.get(id);
                                  if (d) next[id] = d.code || d.clientNom || d.id;
                                }
                                return next;
                              });
                            },
                          }
                        : undefined
                    }
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
      <BarreEtatListe
        lignes={decompte ?? '—'}
        selection={selectedIds.size > 0 ? pluriel(selectedIds.size, 'dossier coché', 'dossiers cochés') : 'aucune'}
        alerte={exportListe.erreur}
      />
      <BarreOutilsFlottante
        cle="dossiers"
        ligneSelectionnee={selectedIds.size > 0}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
        propres={[
          { id: 'generer', libelle: 'Générer un document…', icone: FileText, onClick: () => setSelecteurDocOuvert(true) },
          ...(estAdministrateur(user)
            ? [{ id: 'superficies', libelle: 'Réajuster les superficies', icone: Ruler, onClick: () => setReajustementOuvert(true) }]
            : []),
        ]}
      />
      {idOuvert && <FicheDossierFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => ouvrirChemin('/dossiers')} />}
      <HoteReajustementSuperficies ouvert={reajustementOuvert} onFermer={() => setReajustementOuvert(false)} />
    </PageListe>
  );
}
