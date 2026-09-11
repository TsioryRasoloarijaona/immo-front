import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionTable from '../../components/ProspectionTable';
import BandeGroupement from '../../components/BandeGroupement';
import { DEFAULT_PAGE_SIZE, listPreProspections, listPreProspectionsGroupes, listTranches } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { useGroupement, useLignesGroupes } from '../../lib/groupement';
import type { ProspectionListItemDto } from '../../types';
import { DISPOSITION_PROSPECTIONS } from '../../lib/dispositions';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection } from '../../lib/referentiels';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  hasActiveProspectionFilters,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

// Pré-prospections are raw, not-yet-qualified leads — Omran stores them in
// the same table as qualified Prospections (see CLAUDE.md) but this app
// treats the two as fully separate sections/routes, not tabs on one page,
// since they're different workflows (a pré-prospection has to go through
// "créer la fiche prospect" before it becomes a real Prospection). Same
// filter bar and real server-side filtering as ProspectionsList/DossiersList
// — GET /api/pre-prospections accepts the same param set as
// /api/prospections as of the docs/api-docsV4.json 88-route revision.
export default function PreProspectionsList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);
  // `GET /api/pre-prospections` **n'accepte pas `?colonnes=`** : il sert
  // toujours les colonnes historiques. Les groupes ACTIVITE et CONVERSION
  // viennent d'une vue légataire qui exclut les pré-prospections par
  // construction — les proposer ici serait offrir des colonnes vides. Le
  // catalogue est donc filtré, et rien n'est envoyé au serveur.
  const catalogue = useColonnesProspections();
  // Filtre par *groupe*, posé ici et non dans la disposition : celle-ci est
  // partagée avec les prospections, qui servent bien ces deux groupes. Il se
  // compose avec le filtre par nom que le hook applique ensuite.
  const catalogueUtile = catalogue.data.filter((c) => c.groupe !== 'ACTIVITE' && c.groupe !== 'CONVERSION');
  // Clé distincte de celle des prospections : même DTO, mais les colonnes
  // utiles ne sont pas les mêmes sur un lead non qualifié.
  const colonnes = useColonnesVisibles('pre-prospections', catalogueUtile, DISPOSITION_PROSPECTIONS);

  /* Le groupement lit `catalogueUtile` et non le catalogue brut : ACTIVITE et
     CONVERSION sont écartés ici pour la même raison que pour les colonnes, et
     le serveur les refuse de toute façon au groupement — elles viennent d'une
     vue qui exclut les pré-prospections. Deux barrières qui disent la même
     chose, dont une seule suffirait ; c'est la moins chère à maintenir. */
  const groupement = useGroupement(
    'pre-prospections',
    catalogueUtile,
    useCallback(() => setPage(0), []),
  );

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  /* Mêmes filtres des deux côtés : c'est la condition pour que la somme des
     effectifs des groupes égale le total de la liste. */
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
    filters.ouvertes,
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

  /* Les lignes d'un groupe déplié : le **même endpoint que la liste**,
     restreint par `groupeColonne`/`groupeValeur`/`granularite`. Mêmes colonnes
     demandées — une ligne doit se lire pareil dépliée ou à plat.

     La clé de remise à zéro comprend les filtres, l'axe de groupement et la
     page : dans les trois cas les groupes affichés changent, et des lignes
     déjà chargées appartiendraient à des en-têtes qui ne sont plus là. */
  const lignesGroupes = useLignesGroupes<ProspectionListItemDto>(
    (cle, taille) =>
      listPreProspections(
        filtresServeur,
        /* Tri **déterministe**, et c'est une exigence du chargement par lots,
           pas une préférence : « en charger davantage » redemande la page 0
           avec une taille plus grande, ce qui suppose que le lot précédent en
           soit le préfixe. Mesuré sans départage, il ne l'est pas toujours —
           le groupe « 2024 » des dossiers ressortait dans un ordre différent
           d'un appel à l'autre, les dates ex æquo étant départagées par le
           plan SQL du moment. `id` tranche. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}`,
  );

  const data = liste.data;
  const rows = data?.content ?? [];
  /** La page qui pilote le décompte et la pagination — groupes ou lignes. */
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  // See ProspectionsList.tsx — filter on `code`, not `description`.
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
                  : `${pageAffichee.totalElements} pré-prospection${pageAffichee.totalElements > 1 ? 's' : ''} au total`}
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
            {/* `min-w-0` : voir ProspectionsList — sans lui la largeur de la
                table remonte la chaîne flex et élargit la page entière.

                La bande et le fil d'Ariane sont **hors** du test « y a-t-il des
                lignes » : un groupe qui ne rend rien doit garder sa sortie vers
                les groupes. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title={hasActiveProspectionFilters(filters) ? 'Aucun résultat' : 'Rien à afficher'}
                  message={
                    hasActiveProspectionFilters(filters)
                      ? 'Aucune pré-prospection ne correspond aux filtres actifs.'
                      : "Aucune pré-prospection n'est encore enregistrée."
                  }
                  action={
                    hasActiveProspectionFilters(filters) ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setFilters(emptyProspectionFilters())}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : colonnes.colonnes.length > 0 ? (
                <ProspectionTable
                  /* En mode groupé la grille ne lit pas `rows` : chaque groupe
                     porte ses propres lignes. */
                  rows={enGroupes ? [] : rows}
                  colonnes={colonnes.colonnes}
                  entite="pré-prospection"
                  onOuvrir={(prospectionId) => navigate(`/pre-prospections/${prospectionId}`)}
                  bandeauRegroupement={false}
                  groupes={
                    enGroupes && groupement.colonneGroupee
                      ? {
                          liste: groupes.data?.content ?? [],
                          colonneLibelle: groupement.colonneGroupee.libelle,
                          agregats: groupement.colonnesAgregats,
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
    </PageShell>
  );
}
