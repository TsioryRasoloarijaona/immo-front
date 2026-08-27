import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listEncaissements, type EncaissementChampDate } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { referentielItems, useComptesReferentiel, useDepotsReferentiel, useEntitesReferentiel, useTypesReglement } from '../../lib/referentiels';
import { formatCurrency, formatDate } from '../../lib/format';
import { ENCAISSEMENT_ETAT_LABELS, encaissementEtatLabel, encaissementEtatTone } from '../../lib/domain';

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
  const entites = useEntitesReferentiel();
  const types = useTypesReglement();
  const comptes = useComptesReferentiel();
  const depots = useDepotsReferentiel();

  const [search, setSearch] = useState('');
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

  const { data, loading, error } = useApi(
    () =>
      listEncaissements(
        {
          search: search || undefined,
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
    [search, reference, entiteId.join(','), typeId.join(','), etat.join(','), compteId, depotId, comptabilise, champDate, dateDebut, dateFin, montantDe, montantA, page],
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
        <p className="shrink-0 max-w-180 text-[12.5px] text-muted-foreground">
          Règlements de Dossiers de vente (/api/encaissements), toutes échéances confondues — reprend
          l'écran "Encaissements Vente" de l'ancien système.
        </p>

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

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            <div className="shrink-0 text-[12.5px] text-muted-foreground">
              {(data?.totalElements ?? 0)} encaissement{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-240 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[9%]">État</TableHead>
                      <TableHead className="w-[9%]">Date pièce</TableHead>
                      <TableHead className="w-[9%]">Date rgt</TableHead>
                      <TableHead className="w-[16%]">Tiers</TableHead>
                      <TableHead className="w-[11%]">Dossier</TableHead>
                      <TableHead className="w-[12%]">Type</TableHead>
                      <TableHead className="w-[11%] text-right">Montant brut</TableHead>
                      <TableHead className="w-[11%] text-right">Restant</TableHead>
                      <TableHead className="w-[7%]">Réf.</TableHead>
                      <TableHead className="w-[5%]">Compt.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow
                        key={r.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir le règlement ${r.reference || ''}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/encaissements/${r.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/encaissements/${r.id}`);
                        }}
                      >
                        <TableCell><Badge tone={encaissementEtatTone(r.etat)}>{encaissementEtatLabel(r.etat)}</Badge></TableCell>
                        <TableCell className="truncate text-muted-foreground">{formatDate(r.dateDocument)}</TableCell>
                        <TableCell className="truncate text-muted-foreground">{formatDate(r.dateReglement)}</TableCell>
                        <TableCell className="truncate font-medium text-foreground" title={r.tierNom || undefined}>{r.tierNom || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.dossierCode || undefined}>{r.dossierCode || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.typeLibelle || undefined}>{r.typeLibelle || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">{formatCurrency(r.montantBrut)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(r.montantBrutRestant)}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.reference || undefined}>{r.reference || '—'}</TableCell>
                        <TableCell>
                          <Badge tone={r.comptabilise ? 'success' : 'neutral'}>{r.comptabilise ? 'Oui' : 'Non'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
