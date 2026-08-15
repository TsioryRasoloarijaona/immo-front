import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { formatCurrency } from '../../../lib/format';
import type { Article, ArticleRef } from '../../../types';

function toArticleRef(a: Article): ArticleRef {
  return {
    id: a.id,
    code: a.code,
    description: a.description,
    area: a.area,
    salePrice: a.salePrice,
    type: a.type,
    category: a.category,
    isUnderItem: a.isUnderItem,
  };
}

export default function StepLots({
  articles,
  lots,
  onChange,
}: {
  articles: Article[];
  lots: ArticleRef[];
  onChange: (lots: ArticleRef[]) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => `${a.code} ${a.description} ${a.category} ${a.type}`.toLowerCase().includes(q));
  }, [articles, search]);

  const selectedIds = new Set(lots.map((l) => l.id));

  function toggle(a: Article) {
    if (selectedIds.has(a.id)) {
      onChange(lots.filter((l) => l.id !== a.id));
    } else {
      onChange([...lots, toArticleRef(a)]);
    }
  }

  function remove(id: string) {
    onChange(lots.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Lot(s) réservé(s)">
        {lots.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Aucun lot sélectionné — choisissez-en au moins un dans la liste ci-dessous.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lots.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-[var(--brand-bg)] py-1 pr-1.5 pl-2.5 text-xs font-semibold text-[var(--brand)]"
              >
                {l.code} · {formatCurrency(l.salePrice)}
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  aria-label={`Retirer ${l.code}`}
                  className="rounded-full p-0.5 hover:bg-[var(--brand-border)]"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card padded={false}>
        <div className="border-b border-border p-3.5">
          <InputGroup className="max-w-[340px]">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Rechercher un code, une description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </InputGroup>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="Aucun résultat" />
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-1 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-9" />
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Superficie</TableHead>
                  <TableHead className="text-right">Prix de vente</TableHead>
                  <TableHead>Titré</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 200).map((a) => {
                  const checked = selectedIds.has(a.id);
                  return (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => toggle(a)}>
                      <TableCell>
                        <input type="checkbox" checked={checked} readOnly className="size-3.5 accent-[var(--brand)]" />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{a.code}</TableCell>
                      <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.area ? `${a.area} m²` : '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
                      <TableCell>
                        <Badge tone={a.isTitled ? 'success' : 'neutral'}>{a.isTitled ? 'Titré' : 'Non titré'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
