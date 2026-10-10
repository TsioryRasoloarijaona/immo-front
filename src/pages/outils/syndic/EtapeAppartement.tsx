import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Badge, Card, EmptyState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/format';
import { useDebouncedValue } from '../../../lib/useApi';
import { cn } from '../../../lib/utils';
import { PASTILLE, sansAccents } from './donnees';
import { lotsDuMemeProprietaire, type Lot } from './lots';

/** Étape 1 : quel appartement (et, s'il le faut, les autres lots du même propriétaire). */
export default function EtapeAppartement({
  lots,
  initial,
  onValider,
}: Readonly<{ lots: Lot[]; initial: string | null; onValider: (choisis: Lot[]) => void }>) {
  const [q, setQ] = useState('');
  const recherche = useDebouncedValue(q.trim(), 200);
  const [principal, setPrincipal] = useState<Lot | null>(() => lots.find((l) => l.code === initial) ?? null);
  const [aussi, setAussi] = useState<Set<string>>(new Set());

  const visibles = useMemo(() => {
    if (recherche.length < 2) return lots;
    const r = sansAccents(recherche);
    return lots.filter((l) => sansAccents(`${l.code} ${l.proprietaires}`).includes(r));
  }, [lots, recherche]);
  const voisins = principal ? lotsDuMemeProprietaire(principal, lots) : [];

  function choisir(l: Lot) {
    setPrincipal(l);
    setAussi(new Set());
  }

  function basculer(code: string) {
    setAussi((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });
  }

  return (
    <Card title="1. Quel appartement ?">
      <div className="relative mb-2 w-full sm:w-72">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code, propriétaire…" aria-label="Rechercher un appartement" className="pl-8" />
      </div>
      {visibles.length === 0 ? (
        <EmptyState title="Aucun appartement" message="Aucun appartement ne correspond, ou aucun n’a cet exercice." />
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-auto rounded-md border border-border">
          {visibles.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                aria-pressed={principal?.code === l.code}
                onClick={() => choisir(l)}
                className={cn('flex w-full flex-wrap items-center gap-x-3 px-3 py-1.5 text-left text-body hover:bg-muted', principal?.code === l.code && 'bg-muted font-medium')}
              >
                <span className="w-24 font-mono">{l.code}</span>
                <span className="min-w-0 flex-1 truncate">{l.proprietaires}</span>
                <Badge tone={PASTILLE[l.pastille].ton}>{PASTILLE[l.pastille].libelle}</Badge>
                <span className="w-28 text-right">{formatCurrency(l.reste)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {voisins.length > 0 && (
        <fieldset className="mt-3 flex flex-col gap-1">
          <legend className="mb-1 text-label font-medium text-foreground">Le même propriétaire règle aussi… (un seul reçu)</legend>
          {voisins.map((v) => (
            <label key={v.code} className="flex items-center gap-2 text-body">
              <input type="checkbox" checked={aussi.has(v.code)} onChange={() => basculer(v.code)} className="size-4 accent-(--primary)" />
              <span className="font-mono">{v.code}</span>
              <span className="text-muted-foreground">reste à payer {formatCurrency(v.reste)}</span>
            </label>
          ))}
        </fieldset>
      )}

      <Button type="button" className="mt-4" disabled={!principal} onClick={() => principal && onValider([principal, ...voisins.filter((v) => aussi.has(v.code))])}>
        Continuer
      </Button>
    </Card>
  );
}
