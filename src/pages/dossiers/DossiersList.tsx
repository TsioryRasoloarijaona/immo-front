import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { formatCurrency, formatDate, formatPercent } from '../../lib/format';
import { DOSSIER_STATUS_PIPELINE } from '../../lib/dossierStatus';

export default function DossiersList() {
  const { dossiers, getDossierStatus, loading, error } = useStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const statusItems = [
    { label: 'Tous les statuts', value: 'all' },
    ...DOSSIER_STATUS_PIPELINE.map((s) => ({ label: s, value: s })),
    { label: 'Annulé', value: 'Annulé' },
    { label: 'Désistement', value: 'Désistement' },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dossiers.filter((d) => {
      const derived = getDossierStatus(d.id).label;
      if (status !== 'all' && derived !== status) return false;
      if (q) {
        const clientName = d.client?.name ?? '';
        const hay = `${clientName} ${d.code} ${d.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dossiers, search, status, getDossierStatus]);

  if (loading) return <PageShell title="Dossiers de vente"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dossiers de vente"><ErrorState message={error} /></PageShell>;

  return (
    <PageShell title="Dossiers de vente" crumbs={[{ label: 'Ventes' }, { label: 'Dossiers' }]}>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un client, code de dossier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select items={statusItems} value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} dossier{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Article</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Probabilité</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const derived = getDossierStatus(d.id);
                return (
                  <TableRow
                    key={d.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ouvrir le dossier ${d.client?.name ?? d.code}`}
                    className="cursor-pointer"
                    onClick={() => navigate(`/dossiers/${d.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/dossiers/${d.id}`);
                    }}
                  >
                    <TableCell className="font-medium text-foreground">{d.client?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{d.code}</TableCell>
                    <TableCell><Badge tone={derived.tone}>{derived.label}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{d.article?.code ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(d.price)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPercent(d.probabilityOfFinalisation)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
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
