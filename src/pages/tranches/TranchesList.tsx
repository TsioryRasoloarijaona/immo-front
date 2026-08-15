import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { useData } from '../../lib/useData';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import { standingClass } from '../../lib/domain';

const MODULE_FLAGS: { key: 'isForSale' | 'isForRent' | 'isForProject' | 'isForBuy' | 'isForSav'; label: string }[] = [
  { key: 'isForSale', label: 'Vente' },
  { key: 'isForRent', label: 'Location' },
  { key: 'isForProject', label: 'Projet' },
  { key: 'isForBuy', label: 'Achat' },
  { key: 'isForSav', label: 'SAV' },
];

export default function TranchesList() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.tranches;
    return data.tranches.filter((t) =>
      `${t.description} ${t.programme} ${t.code} ${t.city}`.toLowerCase().includes(q),
    );
  }, [data, search]);

  if (loading) return <PageShell title="Tranches"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Tranches"><ErrorState message={error} /></PageShell>;
  if (!data) return null;

  return (
    <PageShell title="Tranches" crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}>
      <div className="mb-4">
        <InputGroup className="max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un projet, une ville, un code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">{filtered.length} tranche{filtered.length > 1 ? 's' : ''}</div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {filtered.map((t) => (
            <Link
              to={`/tranches/${t.id}`}
              key={t.id}
              className="block rounded-xl border border-border bg-card p-4.5 no-underline transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-md"
            >
              <div className="mb-2.5 flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 line-clamp-2 text-[15px] font-semibold text-foreground">{t.description}</div>
                  <div className="font-mono text-[11.5px] text-muted-foreground">{t.code} · {t.programme}</div>
                </div>
                {t.standing && (
                  <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold', standingClass(t.standing))}>
                    {t.standing}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODULE_FLAGS.map((m) => (
                  <span
                    key={m.key}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10.5px] font-semibold',
                      t[m.key] ? 'bg-[var(--brand-bg)] text-[var(--brand)]' : 'bg-[var(--neutral-bg)] text-muted-foreground'
                    )}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-border pt-3 text-[12.5px] text-muted-foreground">
                <span>{t.city ? <span className="capitalize">{t.city}</span> : 'Ville non renseignée'}</span>
                <span>Livraison : {formatDate(t.deliveryDate) === '—' ? 'non planifiée' : formatDate(t.deliveryDate)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
