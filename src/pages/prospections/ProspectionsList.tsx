import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listPreProspections, listProspections } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatDate } from '../../lib/format';
import { PIPELINE_STAGES, etapeBadgeTone, prospectionDisplayName } from '../../lib/domain';

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
  const navigate = useNavigate();
  const { commerciaux } = useAppData();

  const [stageTab, setStageTab] = useState<StageTab>('qualified');
  const [search, setSearch] = useState('');
  const [etape, setEtape] = useState('all');
  const [commercial, setCommercial] = useState('all');
  const [ouvertes, setOuvertes] = useState<'all' | 'open' | 'closed'>('open');
  const [qualifiedPage, setQualifiedPage] = useState(0);
  const [prePage, setPrePage] = useState(0);

  const qualified = useApi(
    () =>
      listProspections(
        {
          search: search || undefined,
          etape: etape !== 'all' ? etape : undefined,
          commercial: commercial !== 'all' ? commercial : undefined,
          ouvertes: ouvertes === 'open' ? true : undefined,
        },
        { page: qualifiedPage, size: DEFAULT_PAGE_SIZE },
      ),
    [search, etape, commercial, ouvertes, qualifiedPage],
  );
  const pre = useApi(() => listPreProspections({ page: prePage, size: DEFAULT_PAGE_SIZE }), [prePage]);

  function changeStageTab(tab: StageTab) {
    setStageTab(tab);
  }

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setQualifiedPage(0);
    setter(v);
  }

  const current = stageTab === 'qualified' ? qualified : pre;
  const rows =
    stageTab === 'pre'
      ? (pre.data?.content ?? []).filter((p) => {
          if (ouvertes === 'open' && p.fermee) return false;
          if (ouvertes === 'closed' && !p.fermee) return false;
          if (search && !`${prospectionDisplayName(p)} ${p.code ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
      : qualified.data?.content ?? [];

  const etapeItems = PIPELINE_STAGES.map((s) => ({ label: s, value: s }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  return (
    <PageShell title="Prospections" crumbs={[{ label: 'Ventes' }, { label: 'Prospections' }]}>
      <Tabs value={stageTab} onValueChange={(v) => changeStageTab(v as StageTab)} className="mb-3">
        <TabsList>
          <TabsTrigger value="qualified">Prospections</TabsTrigger>
          <TabsTrigger value="pre">
            Pré-prospections <Badge tone="neutral" className="ml-1">{pre.data?.totalElements ?? 0}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {stageTab === 'pre' && (
        <p className="-mt-2 mb-3 max-w-[640px] text-[12.5px] text-muted-foreground">
          Leads bruts pas encore qualifiés. Ouvrez-en un pour créer sa fiche prospect puis le transformer en prospection.
          Recherche/filtres s'appliquent uniquement à la page chargée — l'API ne les accepte pas encore sur cet endpoint.
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, code…"
            value={search}
            onChange={(e) => resetAndSet(setSearch, e.target.value)}
          />
        </InputGroup>
        <FilterSelect
          value={ouvertes}
          onChange={(v) => resetAndSet(setOuvertes, v as 'all' | 'open' | 'closed')}
          placeholder="Toutes"
          items={[
            { label: 'Ouvertes', value: 'open' },
            { label: 'Clôturées', value: 'closed' },
          ]}
        />
        {stageTab === 'qualified' && (
          <>
            <FilterSelect value={etape} onChange={(v) => resetAndSet(setEtape, v)} placeholder="Toutes les étapes" items={etapeItems} />
            <FilterSelect value={commercial} onChange={(v) => resetAndSet(setCommercial, v)} placeholder="Tous les commerciaux" items={commercialItems} />
          </>
        )}
      </div>

      {current.loading && <LoadingState />}
      {current.error && <ErrorState message={current.error} />}
      {!current.loading && !current.error && (
        <>
          <div className="mb-2.5 text-[12.5px] text-muted-foreground">
            {(stageTab === 'qualified' ? qualified.data?.totalElements : pre.data?.totalElements) ?? rows.length} prospection{rows.length > 1 ? 's' : ''} au total
          </div>
          {rows.length === 0 ? (
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
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
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
                        <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.commercialNom || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.prix ? formatCurrency(p.prix) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {stageTab === 'qualified' && qualified.data && (
            <Pagination
              page={qualified.data.page}
              totalPages={qualified.data.totalPages}
              totalElements={qualified.data.totalElements}
              onPageChange={setQualifiedPage}
            />
          )}
          {stageTab === 'pre' && pre.data && (
            <Pagination
              page={pre.data.page}
              totalPages={pre.data.totalPages}
              totalElements={pre.data.totalElements}
              onPageChange={setPrePage}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
