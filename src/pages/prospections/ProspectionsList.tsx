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
import { DEFAULT_PAGE_SIZE, listProspections, listProspectionsGroupes, listTranches } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { useGroupement, useLignesGroupes } from '../../lib/groupement';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection } from '../../lib/referentiels';
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

/* Chargée à la demande : ce formulaire tire une dizaine de référentiels et son
   propre sélecteur de prospect. L'importer en statique l'aurait fait entrer
   dans le lot de la liste, payé par tous ceux qui ne créent rien. */
const NouvelleProspectionDialog = lazy(() => import('./NewProspection'));

/* `nouveau` vient de la route `/prospections/nouveau`, qui rend cette liste
   avec la boîte ouverte par-dessus. Une prop plutôt qu'un état local : c'est
   l'URL qui porte l'intention, donc le bouton Retour ferme la boîte et le lien
   reste partageable. */
export default function ProspectionsList({ nouveau }: { nouveau?: boolean } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux, commerciauxLoading } = useAppData();
  const origines = useOriginesProspection();

  /* Un commercial ouvre la liste sur **ses** prospections (décision
     utilisateur du 28/09). Même résolution que la fiche et le menu de ligne :
     le compte connecté est un commercial s'il figure dans la liste. Un compte
     sans fiche commercial garde le filtre vide et voit tout. */
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const defauts = emptyProspectionFilters(ownCommercial?.id);
  /* Tant que la liste des commerciaux n'est pas arrivée, le défaut n'est pas
     connu. Interroger quand même afficherait un instant les prospections de
     toute l'équipe avant de se restreindre. */
  const attenteDefaut = commerciauxLoading && !!user?.employeeId;

  /* L'état ne garde que **ce que l'utilisateur a modifié** ; les défauts sont
     dérivés à chaque rendu. La liste des commerciaux arrive après le montage
     sur un rechargement direct : un état initial figé raterait le défaut, et
     le rattraper par un effet poserait un état depuis un effet. Dérivé, le
     filtre Commercial suit le défaut jusqu'à ce qu'on y touche — le vider
     compte comme y toucher.

     `?periode=toutes` ouvre la liste sans borne de date. Le tableau de bord en
     a besoin : son lien « Toutes les prospections » annonce l'arriéré complet
     des relances, que le mois courant par défaut masquerait presque en
     entier. Lu une seule fois, à l'ouverture — ensuite la barre décide. */
  const [searchParams] = useSearchParams();
  const [modifs, setModifs] = useState<Partial<ProspectionFilterBarState>>(() =>
    searchParams.get('periode') === 'toutes' ? { dateDebut: '', dateFin: '' } : {},
  );
  const [page, setPage] = useState(0);
  const filters: ProspectionFilterBarState = { ...defauts, ...modifs };
  const debouncedSearch = useDebouncedValue(filters.search);
  // Clé de stockage distincte de celle des pré-prospections : les deux écrans
  // partagent le DTO mais pas les colonnes qu'on veut y voir.
  const catalogue = useColonnesProspections();
  const colonnes = useColonnesVisibles('prospections', catalogue.data, DISPOSITION_PROSPECTIONS);
  // `demandees` vaut `undefined` tant que la sélection ne s'écarte pas des
  // défauts — le hook porte cette règle et la raison qui la rend portante.
  const colonnesDemandees = colonnes.demandees;

  /* Changer d'axe de groupement, d'ordre ou de granularité change le jeu de
     résultats : rester page 7 en passant de 38 groupes à 5 afficherait un
     écran vide sans rien qui l'explique. */
  const groupement = useGroupement(
    'prospections',
    catalogue.data,
    /* `setPage` en dépendance, bien qu'il soit stable : depuis que les filtres
       sont dérivés, le compilateur React l'infère comme dépendance et refuse
       de compiler le composant si la liste déclarée ne la nomme pas
       (`react-hooks/preserve-manual-memoization`). Sans effet à l'exécution. */
    useCallback(() => setPage(0), [setPage]),
  );

  const [avances, setAvances] = useState<FiltresAvancesState>(emptyFiltresAvances());
  const filtresAvances = toFiltresAvances(avances);
  // Sérialisée pour la clé de dépendance : quinze critères dont sept listes,
  // qu'aucune comparaison de références ne rendrait stable d'un rendu à
  // l'autre. `undefined` quand rien n'est actif, ce qui produit exactement la
  // même clé qu'avant l'ouverture du volet.
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

  /* Mêmes filtres des deux côtés, **volet avancé compris** : c'est la
     condition pour que la somme des effectifs des groupes égale le total de la
     liste. Un critère appliqué d'un seul côté la casserait en silence. */
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

  /* Une liste repliée reste **une seule** grille : les en-têtes de groupe s'y
     intercalent et chacun s'ouvre sur place. La pagination du bas numérote
     alors les groupes, et chaque groupe pagine ses propres lignes par lots. */
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

  /* Pas de `colonnes` ici : un groupe ne porte pas de ligne. C'est aussi ce
     qui évite la vue légataire — la demander coûte une requête de plus, et
     aucune de ses colonnes n'est groupable de toute façon. */
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes && !attenteDefaut
        ? listProspectionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE }, { filtres: filtresAvances })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps, attenteDefaut],
    'prospections-groupes',
  );

  /* Les lignes d'un groupe déplié : le **même endpoint que la liste**,
     restreint par `groupeColonne`/`groupeValeur`/`granularite`. Mêmes colonnes
     demandées — une ligne doit se lire pareil dépliée ou à plat.

     La clé de remise à zéro comprend les filtres, l'axe de groupement et la
     page : dans les trois cas les groupes affichés changent, et des lignes
     déjà chargées appartiendraient à des en-têtes qui ne sont plus là. */
  const lignesGroupes = useLignesGroupes<ProspectionListItemDto>(
    (cle, taille) =>
      listProspections(
        filtresServeur,
        /* Tri **déterministe**, et c'est une exigence du chargement par lots,
           pas une préférence : « en charger davantage » redemande la page 0
           avec une taille plus grande, ce qui suppose que le lot précédent en
           soit le préfixe. Mesuré sans départage, il ne l'est pas toujours —
           le groupe « 2024 » des dossiers ressortait dans un ordre différent
           d'un appel à l'autre, les dates ex æquo étant départagées par le
           plan SQL du moment. `id` tranche. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        {
          colonnes: colonnesDemandees,
          filtres: filtresAvances,
          depliage: groupement.depliagePour(cle),
        },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  /* Le menu « ⋯ » de chaque ligne : les gestes de la fiche sans l'ouvrir.
     Après une mutation, la liste (ou les groupes) se recharge — données
     précédentes visibles pendant l'aller-retour, comme tout refetch. */
  const actionsLigne = useActionsLigneProspection({
    entite: 'prospection',
    onMutation: () => {
      liste.refetch();
      groupes.refetch();
    },
  });

  const data = liste.data;
  const rows = data?.content ?? [];
  /** La page qui pilote le décompte et la pagination — groupes ou lignes. */
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  // Aggregate fetches for the filter dropdowns — independent of the
  // prospections query above.
  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  // `origine` on ProspectionListItemDto stores the référentiel *code*, not
  // necessarily `description` — same code/description mismatch as tier-types
  // on ProspectsList (e.g. "Bouche à Oreille" vs "BOUCHE À OREILLE"). Filter
  // on `code` for correctness even where the two happen to match today.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

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

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul par
            construction, si bien qu'un test sur lui rallumerait l'etat de
            chargement plein ecran a chaque changement de granularite — par
            dessus des groupes deja affiches. */}
        {(loading || attenteDefaut) && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {enGroupes
                  ? `${pageAffichee.totalElements} groupe${pageAffichee.totalElements > 1 ? 's' : ''}`
                  : `${pageAffichee.totalElements} prospection${pageAffichee.totalElements > 1 ? 's' : ''} au total`}
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
            {/* Seul conteneur de défilement de la liste, sur les deux axes :
                c'est lui qui a une hauteur bornée, donc lui seul peut placer
                une barre horizontale visible sous les lignes plutôt qu'au pied
                de la table entière. `min-w-0`/`min-h-0` l'autorisent à
                rétrécir sous la taille de son contenu — sans quoi il grandit
                au lieu de défiler. (Ce qui empêche la *fenêtre* de défiler est
                ailleurs : le `min-w-0` de `SidebarInset`, voir Layout.tsx.)

                La bande et le fil d'Ariane sont **hors** du test « y a-t-il des
                lignes » : un groupe qui ne rend rien doit garder sa sortie vers
                les groupes, sinon l'écran est sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                /* Les filtres avancés comptent ici au même titre que la barre :
                   un résultat vide dû au seul volet, replié, s'annoncerait sinon
                   « aucune prospection enregistrée » — et le bouton de remise à
                   zéro ne rendrait pas la main puisqu'il ne toucherait pas au
                   volet. Les deux sont donc réinitialisés ensemble.

                   Sans filtre actif la liste est bornée au mois courant : un
                   résultat vide veut dire « rien ce mois-ci », pas « rien
                   d'enregistré » — d'où la sortie vers toutes les périodes. Et
                   pour un commercial elle est bornée à son compte : le message
                   le dit, sinon « aucune prospection » passerait pour un
                   constat sur toute l'équipe. */
                <EmptyState
                  title={filtresActifs ? 'Aucun résultat' : 'Rien ce mois-ci'}
                  message={
                    filtresActifs
                      ? 'Aucune prospection ne correspond aux filtres actifs.'
                      : ownCommercial
                        ? "Vous n'avez aucune prospection sur le mois en cours."
                        : 'Aucune prospection sur le mois en cours.'
                  }
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
              ) : /* Le catalogue porte les libellés d'en-tête : sans lui il n'y
                     a pas de tableau à dessiner, seulement des lignes sans
                     colonnes. Mis en cache au niveau du module, il n'est
                     rechargé qu'une fois par session. */
              colonnes.colonnes.length > 0 ? (
                <ProspectionTable
                  cleOrdre="prospections"
                  /* En mode groupé la grille ne lit pas `rows` : chaque groupe
                     porte ses propres lignes. */
                  rows={enGroupes ? [] : rows}
                  colonnes={colonnes.colonnes}
                  onOuvrir={(prospectionId) => navigate(`/prospections/${prospectionId}`)}
                  bandeauRegroupement={false}
                  actions={actionsLigne.rendu}
                  groupes={
                    enGroupes && groupement.colonneGroupee
                      ? {
                          liste: groupes.data?.content ?? [],
                          colonneLibelle: groupement.colonneGroupee.libelle,
                          agregats: groupement.agregatsActifs,
                          /* Les totaux plein périmètre, servis par l'enveloppe.
                             Sans eux, un total de bas de grille ne pourrait
                             porter que sur les groupes ouverts. */
                          totaux: groupes.data?.totaux ?? {},
                          nombreTotal: groupes.data?.nombreTotal ?? 0,
                          estOuvert: lignesGroupes.estOuvert,
                          etat: lignesGroupes.etat,
                          basculer: lignesGroupes.basculer,
                          chargerPlus: lignesGroupes.chargerPlus,
                          lignesChargees: lignesGroupes.lignesChargees,
                        }
                      : undefined
                  }
                />
              ) : catalogue.error ? (
                <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
              ) : (
                <LoadingState />
              )}
            </div>
            <div className="shrink-0">
              {/* Une seule pagination, et elle numérote ce qui est à l'écran :
                  les groupes quand la liste est repliée, les lignes sinon. */}
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

      {/* `fallback={null}` : la boîte s'ouvre dès que son lot arrive. Un
          indicateur clignoterait sur un chargement de quelques millisecondes,
          et le voile de la modale dit déjà que quelque chose se passe. */}
      {nouveau && (
        <Suspense fallback={null}>
          <NouvelleProspectionDialog onClose={() => navigate('/prospections')} />
        </Suspense>
      )}

      {actionsLigne.boites}
    </PageShell>
  );
}
