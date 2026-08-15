import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useData } from '../../lib/useData';
import { formatCurrency, formatDate } from '../../lib/format';

export default function ArticlesList() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  const types = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.articles.map((a) => a.type).filter(Boolean))).sort();
  }, [data]);
  const typeItems = [{ label: 'Tous les types', value: 'all' }, ...types.map((t) => ({ label: t, value: t }))];

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.articles.filter((a) => {
      if (type !== 'all' && a.type !== type) return false;
      if (q && !`${a.code} ${a.description} ${a.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, type]);

  if (loading) return <PageShell title="Articles"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Articles"><ErrorState message={error} /></PageShell>;
  if (!data) return null;

  return (
    <PageShell title="Articles" crumbs={[{ label: 'Patrimoine' }, { label: 'Articles' }]}>
      <p className="mb-4 max-w-[640px] text-[12.5px] text-muted-foreground">
        Vue générale des lots de cet échantillon — le rattachement article ↔ tranche n'est pas
        fiable dans ces données, ils sont donc listés indépendamment plutôt que regroupés sous la
        mauvaise tranche.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un code, une description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select items={typeItems} value={type} onValueChange={(v) => setType(v as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {typeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} article{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Superficie</TableHead>
                <TableHead className="text-right">Prix de vente</TableHead>
                <TableHead>Titré</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-foreground">{a.code}</TableCell>
                  <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{a.type}</TableCell>
                  <TableCell className="text-muted-foreground">{a.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.area ? `${a.area} m²` : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
                  <TableCell>
                    <Badge tone={a.isTitled ? 'success' : 'neutral'}>{a.isTitled ? 'Titré' : 'Non titré'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
