import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, RotateCcw, Search, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import EncaissementTable from '../../components/EncaissementTable';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import {
  DEFAULT_PAGE_SIZE,
  listEncaissements,
  listEncaissementsGroupes,
  listTranches,
  type EncaissementChampDate,
} from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_ENCAISSEMENTS } from '../../lib/dispositions';
import { useGroupement, useLignesGroupes } from '../../lib/groupement';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import {
  referentielItems,
  useColonnesEncaissements,
  useComptesReferentiel,
  useDepotsReferentiel,
  useEntitesReferentiel,
  useTypesReglement,
} from '../../lib/referentiels';
// `formatCurrency`/`formatDate` ne sont plus importés ici : DataGrid formate
// lui-même selon le `type` de colonne (MONTANT, DATE), ce qui garantit que les
// neuf écrans de liste formatent identiquement.
import { ENCAISSEMENT_ETAT_LABELS } from '../../lib/domain';
import type { EncaissementDto } from '../../types';

type ComptabiliseFilter = 'all' | 'yes' | 'no';
type ChampDate = EncaissementChampDate;

const ETAT_ITEMS: { label: string; value: string }[] = Object.entries(ENCAISSEMENT_ETAT_LABELS).map(([value, label]) => ({ label, value }));

const CHAMP_DATE_ITEMS: { label: string; value: ChampDate }[] = [
  { label: 'Date pièce', value: 'DATE_PIECE' },
  { label: 'Date échéance', value: 'DATE_ECHEANCE' },
  { label: 'Date règlement', value: 'DATE_REGLEMENT' },
];

const COMPTABILISE_ITEMS: { label: string; value: ComptabiliseFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Comptabilisés', value: 'yes' },
  { label: 'Non comptabilisés', value: 'no' },
];

export default function EncaissementsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const entites = useEntitesReferentiel();
  const types = useTypesReglement();
  const comptes = useComptesReferentiel();
  const depots = useDepotsReferentiel();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reference, setReference] = useState('');
  const [entiteId, setEntiteId] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string[]>([]);
  const [etat, setEtat] = useState<string[]>([]);
  const [compteId, setCompteId] = useState<string | null>(null);
  const [depotId, setDepotId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [comptabilise, setComptabilise] = useState<ComptabiliseFilter>('all');
  const [champDate, setChampDate] = useState<ChampDate>('DATE_PIECE');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantDe, setMontantDe] = useState('');
  const [montantA, setMontantA] = useState('');
  const [page, setPage] = useState(0);

  /* Le catalogue remplace les dix colonnes que cet écran déclarait en dur.
     `masquees` y pèse plus qu'ailleurs : sept des vingt-sept colonnes servies
     par défaut sont des clés UUID — voir `DISPOSITION_ENCAISSEMENTS`. */
  const catalogue = useColonnesEncaissements();
  const colonnes = useColonnesVisibles('encaissements', catalogue.data, DISPOSITION_ENCAISSEMENTS);
  /* `undefined` tant que la sélection ne s'écarte pas des défauts — le hook
     porte cette règle. Elle pèse ici : mesuré, les 27 colonnes par défaut
     coûtent 572–694 ms sur une page de 20, une sélection de 16 en coûte
     307–378. Décocher allège vraiment la requête. */
  const colonnesDemandees = colonnes.demandees;

  /* Changer d'axe de groupement, d'ordre ou de granularité change le jeu de
     résultats : rester page 7 en passant de 38 groupes à 5 afficherait un
     écran vide sans rien qui l'explique. */
  const groupement = useGroupement(
    'encaissements',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setReference('');
    setEntiteId([]);
    setTypeId([]);
    setEtat([]);
    setCompteId(null);
    setDepotId(null);
    setTrancheId([]);
    groupement.reinitialiser();
    setComptabilise('all');
    setChampDate('DATE_PIECE');
    setDateDebut('');
    setDateFin('');
    setMontantDe('');
    setMontantA('');
  }

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
  const hasActiveFilters =
    !!search || !!reference || entiteId.length > 0 || typeId.length > 0 || etat.length > 0 || !!compteId || !!depotId || trancheId.length > 0 || comptabilise !== 'all' || champDate !== 'DATE_PIECE' || !!dateDebut || !!dateFin || !!montantDe || !!montantA;

  /* Les filtres serveur, **mot pour mot les mêmes** pour la liste et pour les
     groupes. C'est la condition de l'invariant qui rend l'écran lisible : la
     somme des effectifs des groupes égale le total de la liste. */
  const filtresServeur = {
          search: debouncedSearch || undefined,
          reference: reference || undefined,
          entiteId: entiteId.length > 0 ? entiteId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
          etat: etat.length > 0 ? etat : undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          compteId: compteId || undefined,
          depotId: depotId || undefined,
          comptabilise: comptabilise === 'yes' ? true : comptabilise === 'no' ? false : undefined,
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
          montantDe: montantDe ? Number(montantDe) : undefined,
          montantA: montantA ? Number(montantA) : undefined,
  };

  /* Une liste repliée reste **une seule** grille : les en-têtes de groupe s'y
     intercalent et chacun s'ouvre sur place. La pagination du bas numérote
     alors les groupes, et chaque groupe pagine ses propres lignes par lots. */
  const enGroupes = groupement.actif;

  const clesFiltres = [
    debouncedSearch,
    reference,
    entiteId.join(','),
    typeId.join(','),
    etat.join(','),
    compteId,
    depotId,
    trancheId.join(','),
    comptabilise,
    champDate,
    dateDebut,
    dateFin,
    montantDe,
    montantA,
    page,
  ];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listEncaissements(filtresServeur, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'encaissements',
  );

  /* Pas de `colonnes` ici : un groupe ne porte pas de ligne. */
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listEncaissementsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'encaissements-groupes',
  );

  /* Les lignes d'un groupe déplié : le **même endpoint que la liste**,
     restreint par `groupeColonne`/`groupeValeur`/`granularite`. Mêmes colonnes
     demandées — une ligne doit se lire pareil dépliée ou à plat. */
  const lignesGroupes = useLignesGroupes<EncaissementDto>(
    (cle, taille) =>
      listEncaissements(
        filtresServeur,
        /* Tri déterministe : « en charger davantage » redemande la page 0 avec
           une taille plus grande, ce qui suppose que le lot précédent en soit
           le préfixe. Sans départage, ce n'est pas garanti — voir le même
           `sort` sur les trois autres écrans. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const rows = data?.content ?? [];
  /** La page qui pilote le décompte et la pagination — groupes ou lignes. */
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  /* Même source que les filtres Tranche des écrans Dossiers et Prospections :
     un seul appel, 16 tranches dans le portefeuille réel, et `size: 500` pour
     ne pas dépendre de la pagination. Indépendant de la requête principale. */
  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({
    label: t.description || t.code || t.id,
    value: t.id,
  }));

  const entiteItems = referentielItems(entites.data);
  const typeItems = referentielItems(types.data);
  const compteItems = referentielItems(comptes.data);
  const depotItems = referentielItems(depots.data);

  return (
    <PageShell
      title="Encaissements"
      crumbs={[{ label: 'Ventes' }, { label: 'Encaissements' }]}
      fullHeight
      icon={<Wallet />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <Card padded={false} className="shrink-0">
          <div className="flex flex-col gap-2.5 p-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <InputGroup className="min-w-55 flex-1">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Recherche multi-critère — référence, tiers…"
                  value={search}
                  onChange={(e) => resetAndSet(setSearch, e.target.value)}
                />
              </InputGroup>
              <Input
                placeholder="Référence"
                className="w-35"
                value={reference}
                onChange={(e) => resetAndSet(setReference, e.target.value)}
              />
              <MultiSelectDropdown label="Entité" placeholder="Toutes" value={entiteId} onChange={(v) => resetAndSet(setEntiteId, v)} items={entiteItems} />
              <MultiSelectDropdown label="Type" placeholder="Tous" value={typeId} onChange={(v) => resetAndSet(setTypeId, v)} items={typeItems} />
              <MultiSelectDropdown label="État" placeholder="Tous" value={etat} onChange={(v) => resetAndSet(setEtat, v)} items={ETAT_ITEMS} />
              {/* Le filtre traverse règlement → ligne → échéance → article :
                  un règlement remonte dès qu'une seule de ses échéances porte
                  sur un lot de la tranche, et un règlement à cheval sur deux
                  tranches remonte pour les deux. */}
              <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={trancheId} onChange={(v) => resetAndSet(setTrancheId, v)} items={trancheItems} />
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw data-icon="inline-start" /> Réinitialiser
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Select items={compteItems} value={compteId} onValueChange={(v) => resetAndSet(setCompteId, v as string | null)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Compte…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {compteItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select items={depotItems} value={depotId} onValueChange={(v) => resetAndSet(setDepotId, v as string | null)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dépôt…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {depotItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select items={COMPTABILISE_ITEMS} value={comptabilise} onValueChange={(v) => resetAndSet(setComptabilise, v as ComptabiliseFilter)}>
                <SelectTrigger className="w-45">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COMPTABILISE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select items={CHAMP_DATE_ITEMS} value={champDate} onValueChange={(v) => resetAndSet(setChampDate, v as ChampDate)}>
                <SelectTrigger className="w-38">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CHAMP_DATE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <InputGroup className="w-32.5">
                  <InputGroupInput type="date" aria-label="Du" value={dateDebut} onChange={(e) => resetAndSet(setDateDebut, e.target.value)} />
                </InputGroup>
                <InputGroup className="w-32.5">
                  <InputGroupInput type="date" aria-label="Au" value={dateFin} onChange={(e) => resetAndSet(setDateFin, e.target.value)} />
                </InputGroup>
              </div>
              <div className="flex items-center gap-1.5">
                <Input type="number" placeholder="Montant de" className="w-30" value={montantDe} onChange={(e) => resetAndSet(setMontantDe, e.target.value)} />
                <Input type="number" placeholder="à" className="w-24" value={montantA} onChange={(e) => resetAndSet(setMontantA, e.target.value)} />
              </div>
            </div>
          </div>
        </Card>

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul par
            construction, si bien qu'un test sur lui rallumerait l'état de
            chargement plein écran par-dessus des groupes déjà affichés. */}
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-body text-muted-foreground">
                {enGroupes
                  ? `${pageAffichee.totalElements} groupe${pageAffichee.totalElements > 1 ? 's' : ''}`
                  : `${pageAffichee.totalElements} encaissement${pageAffichee.totalElements > 1 ? 's' : ''}`}
              </span>
              {/* Pourquoi cette mention est ici plutôt que nulle part.
                  Un règlement encaissé mais pas encore imputé à une échéance
                  n'a aucune ligne, donc ne satisfait pas le critère « rattaché
                  à une échéance de dossier de vente » sur lequel la liste
                  repose : l'API ne le sert jamais, aucun filtre ne le
                  ramènera. L'écran légataire, lui, les affiche.

                  Sans cette phrase, un opérateur qui compare les deux totaux
                  constate un écart et conclut à un bug. Le chiffre n'est pas
                  repris — le spec l'établit à 16 pièces pour 6 435 400 DH,
                  mais cette liste ne les voit pas et l'afficher reviendrait à
                  recopier une mesure qu'on ne peut pas rafraîchir. */}
              <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
                <Info aria-hidden className="size-3 shrink-0" />
                Les règlements pas encore imputés à une échéance ne figurent pas dans cette liste.
              </span>
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
            {/* La bande est **hors** du test « y a-t-il des lignes » : un groupe
                qui ne rend rien doit garder sa sortie vers les groupes, sinon
                l'écran est sans issue. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                  message={
                    hasActiveFilters
                      ? 'Aucun encaissement ne correspond aux filtres actifs.'
                      : "Aucun encaissement n'est encore enregistré."
                  }
                  action={
                    hasActiveFilters ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : /* Le catalogue porte les libellés d'en-tête : sans lui il n'y
                     a pas de tableau à dessiner, seulement des lignes sans
                     colonnes. Mis en cache au niveau du module. */
              colonnes.colonnes.length > 0 ? (
                <EncaissementTable
                  /* En mode groupé la grille ne lit pas `rows` : chaque groupe
                     porte ses propres lignes. */
                  rows={enGroupes ? [] : rows}
                  colonnes={colonnes.colonnes}
                  onOuvrir={(id) => navigate(`/encaissements/${id}`)}
                  bandeauRegroupement={false}
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
              {data && (
                <Pagination
                  page={pageAffichee.page}
                  totalPages={pageAffichee.totalPages}
                  totalElements={pageAffichee.totalElements}
                  onPageChange={setPage}
                />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
