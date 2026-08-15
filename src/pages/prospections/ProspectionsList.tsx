import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { formatCurrency, formatDate, isPastOrToday } from '../../lib/format';
import { natureBadgeTone, prospectionDisplayName } from '../../lib/domain';

type ClosedFilter = 'all' | 'open' | 'closed';
type StageTab = 'qualified' | 'pre';

function FilterSelect({
  value,
  onChange,
  placeholder,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: { label: string; value: string }[];
}) {
  const allItems = [{ label: placeholder, value: 'all' }, ...items];
  return (
    <Select items={allItems} value={value} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger className="w-full sm:w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function ProspectionsList() {
  const { prospections, loading, error, commercials, isQualifiedProspection } = useStore();
  const { data } = useData();
  const navigate = useNavigate();

  const [stageTab, setStageTab] = useState<StageTab>('qualified');
  const [search, setSearch] = useState('');
  const [nature, setNature] = useState('all');
  const [origin, setOrigin] = useState('all');
  const [commercial, setCommercial] = useState('all');
  const [closedFilter, setClosedFilter] = useState<ClosedFilter>('open');

  // Omran gates a raw lead behind two distinct stages before a sale file can
  // exist — Pré-Prospection (no linked contact / no assigned commercial yet)
  // and qualified Prospection. Surfaced as tabs so the gate is visible at a
  // glance rather than buried in a column. See instructions/FIX-prospection-pipeline.md.
  const { preCount, qualifiedCount } = useMemo(() => {
    let pre = 0;
    for (const p of prospections) if (!isQualifiedProspection(p.id)) pre += 1;
    return { preCount: pre, qualifiedCount: prospections.length - pre };
  }, [prospections, isQualifiedProspection]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prospections.filter((p) => {
      if (!isQualifiedProspection(p.id) !== (stageTab === 'pre')) return false;
      if (closedFilter === 'open' && p.isClosed) return false;
      if (closedFilter === 'closed' && !p.isClosed) return false;
      if (nature !== 'all' && p.nature !== nature) return false;
      if (origin !== 'all' && p.origin !== origin) return false;
      if (commercial !== 'all' && p.commercial !== commercial) return false;
      if (q) {
        const hay = `${prospectionDisplayName(p)} ${p.code} ${p.phone} ${p.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [prospections, stageTab, search, nature, origin, commercial, closedFilter, isQualifiedProspection]);

  if (loading) return <PageShell title="Prospections"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Prospections"><ErrorState message={error} /></PageShell>;
  if (!data) return null;

  return (
    <PageShell title="Prospections" crumbs={[{ label: 'Ventes' }, { label: 'Prospections' }]}>
      <Tabs value={stageTab} onValueChange={(v) => setStageTab(v as StageTab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="qualified">
            Prospections <Badge tone="neutral" className="ml-1">{qualifiedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pre">
            Pré-prospections <Badge tone="neutral" className="ml-1">{preCount}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {stageTab === 'pre' && (
        <p className="-mt-2 mb-4 max-w-[640px] text-[12.5px] text-muted-foreground">
          Leads bruts pas encore qualifiés — sans contact lié et/ou sans commercial assigné. Ils
          doivent être transformés en prospection avant qu'un dossier de vente puisse être ouvert.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, code, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <FilterSelect
          value={closedFilter}
          onChange={(v) => setClosedFilter(v as ClosedFilter)}
          placeholder="Toutes"
          items={[
            { label: 'Ouvertes', value: 'open' },
            { label: 'Clôturées', value: 'closed' },
          ]}
        />
        <FilterSelect
          value={nature}
          onChange={setNature}
          placeholder="Toutes les étapes"
          items={data.lookups.prospectionKinds.map((k) => ({ label: k, value: k }))}
        />
        <FilterSelect
          value={origin}
          onChange={setOrigin}
          placeholder="Toutes les origines"
          items={data.lookups.prospectionOrigins.map((o) => ({ label: o, value: o }))}
        />
        <FilterSelect
          value={commercial}
          onChange={setCommercial}
          placeholder="Tous les commerciaux"
          items={commercials.map((c) => ({ label: c, value: c }))}
        />
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} prospection{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Prospect</TableHead>
                <TableHead>Étape</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Commercial</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Alerte</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const overdue = !p.isClosed && p.alertValidityDate && isPastOrToday(p.alertValidityDate);
                return (
                  <TableRow
                    key={p.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ouvrir la prospection ${prospectionDisplayName(p)}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/prospections/${p.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/prospections/${p.id}`);
                    }}
                  >
                    <TableCell className="font-medium text-foreground">{prospectionDisplayName(p)}</TableCell>
                    <TableCell>
                      <Badge tone={natureBadgeTone(p.nature, p.isClosed)}>
                        {p.isClosed ? 'Clôturée' : p.nature}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.origin || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.commercial || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.budgetMax ? formatCurrency(p.budgetMax) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {p.alertValidityDate ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-[12.5px]"
                          style={{ color: overdue ? 'var(--warning)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}
                        >
                          {overdue && <AlertTriangle className="size-[13px]" />}
                          {formatDate(p.alertValidityDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.date)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
