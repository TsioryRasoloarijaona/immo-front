import type { ReactNode } from 'react';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PeriodeFiltre from './PeriodeFiltre';
import { cn } from '../../lib/utils';

/** Panneau « Filtres » : une ligne (date, période, recherche, champs libres) puis une boîte à cocher par filtre. */
export default function PanneauFiltresCoches({
  ferme,
  onBasculer,
  puces,
  champDate,
  periode,
  recherche,
  onReinitialiser,
  champs,
  children,
}: Readonly<{
  ferme: boolean;
  onBasculer: () => void;
  /** Résumé des filtres actifs, affiché quand le panneau est replié. */
  puces: string[];
  champDate?: { items: { label: string; value: string }[]; valeur: string; onChange: (valeur: string) => void };
  periode: { debut: string; fin: string; onChange: (debut: string, fin: string) => void };
  recherche: { valeur: string; onChange: (valeur: string) => void; placeholder: string };
  onReinitialiser: () => void;
  champs?: ReactNode;
  children?: ReactNode;
}>) {
  return (
    <section aria-label="Filtres" className="shrink-0 border-y border-border bg-muted/40">
      <div className="flex min-h-10 flex-wrap items-center gap-2 px-3 py-1">
        <button
          type="button"
          className="flex items-center gap-1.5 text-body font-semibold text-foreground"
          aria-expanded={!ferme}
          onClick={onBasculer}
        >
          <ChevronDown aria-hidden className={cn('size-3.5 text-muted-foreground transition-transform', ferme && '-rotate-90')} />
          Filtres
        </button>
        {ferme && (
          <span className="flex min-w-0 gap-1 overflow-hidden">
            {puces.map((p) => (
              <span key={p} className="inline-flex h-5.5 items-center rounded-full bg-(--neutral-bg) px-2 text-body whitespace-nowrap text-foreground">
                {p}
              </span>
            ))}
          </span>
        )}
        <span className="flex-1" />
        {champDate && (
          <span className="flex items-center gap-1.5 text-body text-muted-foreground">
            Date
            <Select items={champDate.items} value={champDate.valeur} onValueChange={(v) => champDate.onChange(v as string)}>
              <SelectTrigger aria-label="Champ de date">
                <SelectValue />
              </SelectTrigger>
              {/* Libellés OMRAN longs : la liste déborde la largeur du déclencheur. */}
              <SelectContent alignItemWithTrigger={false} align="start" className="w-auto min-w-(--anchor-width) max-w-[min(30rem,90vw)]">
                <SelectGroup>
                  {champDate.items.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="whitespace-normal">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </span>
        )}
        <PeriodeFiltre debut={periode.debut} fin={periode.fin} onChange={periode.onChange} />
        {champs}
        <span className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="w-57.5 pl-7"
            aria-label="Recherche"
            placeholder={recherche.placeholder}
            value={recherche.valeur}
            onChange={(e) => recherche.onChange(e.target.value)}
          />
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onReinitialiser}>
          <RotateCcw data-icon="inline-start" /> Réinitialiser
        </Button>
      </div>
      {!ferme && <div className="flex gap-2 overflow-x-auto px-3 pb-3">{children}</div>}
    </section>
  );
}
