import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Info, RotateCcw, Search, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import EncaissementTable from '../../components/EncaissementTable';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import BoutonExporter from '../../components/BoutonExporter';
import FiltreTiers, { type TiersChoisi } from '../../components/encaissements/FiltreTiers';
import BandeTotalEncaissements from '../../components/encaissements/BandeTotalEncaissements';
import {
  DEFAULT_PAGE_SIZE,
  listEncaissements,
  listEncaissementsGroupes,
  totauxColonnes,
  type EncaissementChampDate,
} from '../../lib/api';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_ENCAISSEMENTS } from '../../lib/dispositions';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import {
  referentielItems,
  useColonnesEncaissements,
  useComptesReferentiel,
  useDepotsReferentiel,
  useEntitesReferentiel,
  useTranchesFiltre,
  useTypesReglement,
} from '../../lib/referentiels';
import { ENCAISSEMENT_ETAT_LABELS, encaissementEtatLabel } from '../../lib/domain';
import { debutMoisISO, finMoisISO, pluriel } from '../../lib/format';
import type { EncaissementDto } from '../../types';

type ComptabiliseFilter = 'all' | 'yes' | 'no';
const COMPTABILISE_PARAM: Record<ComptabiliseFilter, boolean | undefined> = { all: undefined, yes: true, no: false };
type ChampDate = EncaissementChampDate;

const ETAT_ITEMS: { label: string; value: string }[] = Object.entries(ENCAISSEMENT_ETAT_LABELS).map(([value, label]) => ({ label, value }));

const CHAMP_DATE_ITEMS: { label: string; value: ChampDate }[] = [
  { label: 'Date pièce', value: 'DATE_PIECE' },
  { label: 'Date échéance', value: 'DATE_ECHEANCE' },
  { label: 'Date règlement', value: 'DATE_REGLEMENT' },
  { label: 'Pointage prévu', value: 'POINTAGE_PREVU' },
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
  const [tiers, setTiers] = useState<TiersChoisi | null>(null);
  const [comptabilise, setComptabilise] = useState<ComptabiliseFilter>('all');
  const [champDate, setChampDate] = useState<ChampDate>('DATE_PIECE');
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [montantDe, setMontantDe] = useState('');
  const [montantA, setMontantA] = useState('');
  const [page, setPage] = useState(0);

  // Plusieurs colonnes servies par défaut sont des clés UUID : voir `DISPOSITION_ENCAISSEMENTS`.
  const catalogue = useColonnesEncaissements();
  const colonnes = useColonnesVisibles('encaissements', catalogue.data, DISPOSITION_ENCAISSEMENTS);
  const colonnesDemandees = colonnes.demandees;

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
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
    setTiers(null);
    groupement.reinitialiser();
    setComptabilise('all');
    setChampDate('DATE_PIECE');
    setDateDebut(debutMoisISO());
    setDateFin(finMoisISO());
    setMontantDe('');
    setMontantA('');
  }

  function toutesLesPeriodes() {
    setPage(0);
    setDateDebut('');
    setDateFin('');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || !!reference || entiteId.length > 0 || typeId.length > 0 || etat.length > 0 || !!compteId || !!depotId || trancheId.length > 0 || !!tiers || comptabilise !== 'all' || champDate !== 'DATE_PIECE' || dateDebut !== debutMoisISO() || dateFin !== finMoisISO() || !!montantDe || !!montantA;

  // Mêmes filtres pour la liste et les groupes : la somme des effectifs doit égaler le total.
  const filtresServeur = {
          search: debouncedSearch || undefined,
          reference: reference || undefined,
          entiteId: entiteId.length > 0 ? entiteId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
          etat: etat.length > 0 ? etat : undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          tierId: tiers?.id,
          compteId: compteId || undefined,
          depotId: depotId || undefined,
          comptabilise: COMPTABILISE_PARAM[comptabilise],
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
          montantDe: montantDe ? Number(montantDe) : undefined,
          montantA: montantA ? Number(montantA) : undefined,
  };

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
    tiers?.id,
    comptabilise,
    champDate,
    dateDebut,
    dateFin,
    montantDe,
    montantA,
    page,
  ];

  // Σ par colonne sur tout le filtre (hors `page`) ; colonnes affichées seulement.
  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes('encaissements', filtresServeur, agregats),
    clesFiltres.slice(0, -1).join('|'),
    !enGroupes,
    'encaissements-totaux-colonnes',
  );

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listEncaissements(filtresServeur, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'encaissements',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listEncaissementsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'encaissements-groupes',
  );

  const lignesGroupes = useLignesGroupes<EncaissementDto>(
    (cle, taille) =>
      listEncaissements(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const rows = data?.content ?? [];
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({
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
      actions={
        <BoutonExporter
          chemin="/api/encaissements/export"
          params={{ ...filtresServeur, colonnes: colonnes.visibles }}
          nomListe="encaissements"
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <div className="flex shrink-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
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
              {/* Un règlement remonte dès qu'une de ses échéances porte sur un lot de
                  la tranche : à cheval sur deux tranches, il remonte pour les deux. */}
              <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={trancheId} onChange={(v) => resetAndSet(setTrancheId, v)} items={trancheItems} />
              <FiltreTiers choisi={tiers} onChoisir={(t) => resetAndSet(setTiers, t)} />
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw data-icon="inline-start" /> Réinitialiser
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select items={compteItems} value={compteId} onValueChange={(v) => resetAndSet(setCompteId, v)}>
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
              <Select items={depotItems} value={depotId} onValueChange={(v) => resetAndSet(setDepotId, v)}>
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

        {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
            chargement plein écran se rallumerait par-dessus les groupes. */}
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-body text-muted-foreground">
                {pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'encaissement')}
              </span>
              {/* Un règlement non imputé n'a aucune ligne : l'API ne le sert jamais, alors
                  que l'écran légataire l'affiche. Sans cette mention, l'écart des totaux
                  passerait pour un bug. */}
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
            {/* La bande reste hors du test « vide » : un groupe vide garde sa sortie. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title={hasActiveFilters ? 'Aucun résultat' : 'Rien ce mois-ci'}
                  message={
                    hasActiveFilters
                      ? 'Aucun encaissement ne correspond aux filtres actifs.'
                      : 'Aucun encaissement daté du mois en cours.'
                  }
                  action={
                    hasActiveFilters ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={toutesLesPeriodes}>
                        <CalendarRange data-icon="inline-start" /> Toutes les périodes
                      </Button>
                    )
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <EncaissementTable
                    cleOrdre="encaissements"
                    rows={enGroupes ? [] : rows}
                    colonnes={colonnes.colonnes}
                    onOuvrir={(id) => navigate(`/encaissements/${id}`)}
                    bandeauRegroupement={false}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, { etat: encaissementEtatLabel })}
                    totauxServeur={totauxServeur}
                  />
                </EtatColonnes>
              )}
            </div>
            {/* Liste plate seulement : en groupes, chaque groupe porte déjà ses totaux serveur. */}
            {!enGroupes && <BandeTotalEncaissements filtres={filtresServeur} cle={clesFiltres.slice(0, -1).join('|')} />}
            {/* Sur `pageAffichee` : en mode groupes `liste.data` est nul et la pagination disparaîtrait. */}
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
    </PageShell>
  );
}
