import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RotateCcw, Users } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionFiltresAvances from '../../components/ProspectionFiltresAvances';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import TableauGroupes, { BandeauGroupeOuvert } from '../../components/TableauGroupes';
import { DEFAULT_PAGE_SIZE, listProspections, listProspectionsGroupes, listTranches } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { libelleGroupeAffiche, useGroupement } from '../../lib/groupement';
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
  toFiltresAvances,
  type FiltresAvancesState,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

export default function ProspectionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);
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
    useCallback(() => setPage(0), []),
  );

  const [avances, setAvances] = useState<FiltresAvancesState>(emptyFiltresAvances());
  const filtresAvances = toFiltresAvances(avances);
  // Sérialisée pour la clé de dépendance : quinze critères dont sept listes,
  // qu'aucune comparaison de références ne rendrait stable d'un rendu à
  // l'autre. `undefined` quand rien n'est actif, ce qui produit exactement la
  // même clé qu'avant l'ouverture du volet.
  const cleAvances = filtresAvances ? JSON.stringify(filtresAvances) : '';
  const filtresActifs = hasActiveProspectionFilters(filters) || countActiveFiltresAvances(avances) > 0;

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
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
    ouvertes: filters.ouvertes === 'open' ? true : filters.ouvertes === 'closed' ? false : undefined,
  };

  const enGroupes = groupement.actif && !groupement.ouvert;

  const clesFiltres = [
    debouncedSearch,
    filters.etape.join(','),
    filters.origine.join(','),
    filters.commercial.join(','),
    filters.trancheId.join(','),
    filters.dateDebut,
    filters.dateFin,
    filters.ouvertes,
    page,
    cleAvances,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listProspections(
            filtresServeur,
            { page, size: DEFAULT_PAGE_SIZE },
            { colonnes: colonnesDemandees, filtres: filtresAvances, depliage: groupement.depliage },
          ),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'prospections',
  );

  /* Pas de `colonnes` ici : un groupe ne porte pas de ligne. C'est aussi ce
     qui évite la vue légataire — la demander coûte une requête de plus, et
     aucune de ses colonnes n'est groupable de toute façon. */
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listProspectionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE }, { filtres: filtresAvances })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'prospections-groupes',
  );

  const data = liste.data;
  const rows = data?.content ?? [];
  /** La page qui pilote le décompte et la pagination — groupes ou lignes. */
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;

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
        {loading && !pageAffichee && <LoadingState />}
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
              {groupement.ouvert && groupement.colonneGroupee && (
                <BandeauGroupeOuvert
                  colonneLibelle={groupement.colonneGroupee.libelle}
                  groupeLibelle={groupement.ouvert.libelle}
                  nombre={liste.data?.totalElements ?? 0}
                  onRetour={() => groupement.ouvrir(null)}
                />
              )}
              {enGroupes ? (
                (groupes.data?.content.length ?? 0) === 0 ? (
                  <EmptyState title="Aucun groupe" message="Aucune prospection ne correspond aux filtres actifs." />
                ) : (
                  <TableauGroupes
                    groupes={groupes.data?.content ?? []}
                    colonneGroupee={groupement.colonneGroupee!}
                    agregats={groupement.agregeables.filter((c) => groupement.agregats.includes(c.nom))}
                    onOuvrir={(g) => groupement.ouvrir({ cle: g.cle, libelle: libelleGroupeAffiche(g) })}
                  />
                )
              ) : rows.length === 0 ? (
                /* Les filtres avancés comptent ici au même titre que la barre :
                   un résultat vide dû au seul volet, replié, s'annoncerait sinon
                   « aucune prospection enregistrée » — et le bouton de remise à
                   zéro ne rendrait pas la main puisqu'il ne toucherait pas au
                   volet. Les deux sont donc réinitialisés ensemble. */
                <EmptyState
                  title={filtresActifs || groupement.ouvert ? 'Aucun résultat' : 'Rien à afficher'}
                  message={
                    groupement.ouvert
                      ? 'Ce groupe ne contient aucune prospection avec les filtres actifs.'
                      : filtresActifs
                        ? 'Aucune prospection ne correspond aux filtres actifs.'
                        : "Aucune prospection n'est encore enregistrée."
                  }
                  action={
                    filtresActifs && !groupement.ouvert ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPage(0);
                          groupement.reinitialiser();
                          setFilters(emptyProspectionFilters());
                          setAvances(emptyFiltresAvances());
                        }}
                      >
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : /* Le catalogue porte les libellés d'en-tête : sans lui il n'y
                     a pas de tableau à dessiner, seulement des lignes sans
                     colonnes. Mis en cache au niveau du module, il n'est
                     rechargé qu'une fois par session. */
              colonnes.colonnes.length > 0 ? (
                <ProspectionTable
                  rows={rows}
                  colonnes={colonnes.colonnes}
                  onOuvrir={(prospectionId) => navigate(`/prospections/${prospectionId}`)}
                  bandeauRegroupement={false}
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
    </PageShell>
  );
}
