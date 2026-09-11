import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { DEFAULT_PAGE_SIZE, listEncaissements, type EncaissementChampDate } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { referentielItems, useComptesReferentiel, useDepotsReferentiel, useEntitesReferentiel, useTypesReglement } from '../../lib/referentiels';
// `formatCurrency`/`formatDate` ne sont plus importés ici : DataGrid formate
// lui-même selon le `type` de colonne (MONTANT, DATE), ce qui garantit que les
// neuf écrans de liste formatent identiquement.
import { ENCAISSEMENT_ETAT_LABELS, encaissementEtatLabel, encaissementEtatTone } from '../../lib/domain';
import type { EncaissementDto } from '../../types';

/* `valeur` sur les deux colonnes à pastille : sans elle, tri et filtre
   porteraient sur le code d'état brut (`IN_WORK`) alors que l'utilisateur voit
   et tape le libellé. On compare toujours ce qui est affiché. */
const COLONNES: ColonneGrille<EncaissementDto>[] = [
  {
    nom: 'etat',
    libelle: 'État',
    largeur: 9,
    valeur: (r) => encaissementEtatLabel(r.etat),
    rendu: (r) => <Badge tone={encaissementEtatTone(r.etat)}>{encaissementEtatLabel(r.etat)}</Badge>,
  },
  { nom: 'dateDocument', libelle: 'Date pièce', type: 'DATE', largeur: 9, classe: 'text-muted-foreground' },
  { nom: 'dateReglement', libelle: 'Date rgt', type: 'DATE', largeur: 9, classe: 'text-muted-foreground' },
  { nom: 'tierNom', libelle: 'Tiers', largeur: 16, classe: 'font-medium text-foreground', titre: (r) => r.tierNom || undefined },
  { nom: 'dossierCode', libelle: 'Dossier', largeur: 11, classe: 'text-muted-foreground', titre: (r) => r.dossierCode || undefined },
  { nom: 'typeLibelle', libelle: 'Type', largeur: 12, classe: 'text-muted-foreground', titre: (r) => r.typeLibelle || undefined },
  { nom: 'montantBrut', libelle: 'Montant brut', type: 'MONTANT', largeur: 11, classe: 'text-foreground' },
  { nom: 'montantBrutRestant', libelle: 'Restant', type: 'MONTANT', largeur: 11, classe: 'text-muted-foreground' },
  { nom: 'reference', libelle: 'Réf.', largeur: 7, classe: 'text-muted-foreground', titre: (r) => r.reference || undefined },
  {
    nom: 'comptabilise',
    libelle: 'Compt.',
    type: 'BOOLEEN',
    largeur: 5,
    rendu: (r) => <Badge tone={r.comptabilise ? 'success' : 'neutral'}>{r.comptabilise ? 'Oui' : 'Non'}</Badge>,
  },
];

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
  const [comptabilise, setComptabilise] = useState<ComptabiliseFilter>('all');
  const [champDate, setChampDate] = useState<ChampDate>('DATE_PIECE');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantDe, setMontantDe] = useState('');
  const [montantA, setMontantA] = useState('');
  const [page, setPage] = useState(0);

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
    setComptabilise('all');
    setChampDate('DATE_PIECE');
    setDateDebut('');
    setDateFin('');
    setMontantDe('');
    setMontantA('');
  }

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
  const hasActiveFilters =
    !!search || !!reference || entiteId.length > 0 || typeId.length > 0 || etat.length > 0 || !!compteId || !!depotId || comptabilise !== 'all' || champDate !== 'DATE_PIECE' || !!dateDebut || !!dateFin || !!montantDe || !!montantA;

  const { data, loading, error } = useApi(
    () =>
      listEncaissements(
        {
          search: debouncedSearch || undefined,
          reference: reference || undefined,
          entiteId: entiteId.length > 0 ? entiteId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
          etat: etat.length > 0 ? etat : undefined,
          compteId: compteId || undefined,
          depotId: depotId || undefined,
          comptabilise: comptabilise === 'yes' ? true : comptabilise === 'no' ? false : undefined,
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
          montantDe: montantDe ? Number(montantDe) : undefined,
          montantA: montantA ? Number(montantA) : undefined,
        },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [debouncedSearch, reference, entiteId.join(','), typeId.join(','), etat.join(','), compteId, depotId, comptabilise, champDate, dateDebut, dateFin, montantDe, montantA, page],
    'encaissements',
  );
  const rows = data?.content ?? [];

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

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {(data?.totalElements ?? 0)} encaissement{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
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
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  rows={rows}
                  colonnes={COLONNES}
                  onOuvrir={(id) => navigate(`/encaissements/${id}`)}
                  libelleLigne={(r) => `Ouvrir le règlement ${r.reference || ''}`.trim()}
                />
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
