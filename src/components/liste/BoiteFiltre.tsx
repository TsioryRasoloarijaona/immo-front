import type { ReactNode } from 'react';
import { formatNumber } from '../../lib/format';

export interface ItemFiltre {
  value: string;
  label: string;
  compte?: number;
}

type Selection =
  | { mode: 'multiple'; valeur: string[]; onChange: (valeur: string[]) => void }
  | { mode: 'unique'; valeur: string | null; onChange: (valeur: string | null) => void };

/**
 * Liste à cocher d'un filtre. « Tout » = `[]` (multiple) ou `null` (unique) = aucun filtre :
 * toutes les cases s'affichent cochées, et la dernière case cochée ne se décoche pas.
 */
export default function BoiteFiltre({
  titre,
  items,
  ...selection
}: Readonly<{ titre: string; items: ItemFiltre[] } & Selection>) {
  function estCochee(v: string): boolean {
    if (selection.mode === 'unique') return selection.valeur === v;
    return selection.valeur.length === 0 || selection.valeur.includes(v);
  }

  function basculer(v: string) {
    if (selection.mode === 'unique') {
      selection.onChange(selection.valeur === v ? null : v);
      return;
    }
    const courant = selection.valeur;
    const choisis = new Set(courant.length === 0 ? items.map((i) => i.value) : courant);
    if (choisis.has(v)) {
      if (choisis.size === 1) return;
      choisis.delete(v);
    } else {
      choisis.add(v);
    }
    const suivant = items.map((i) => i.value).filter((x) => choisis.has(x));
    selection.onChange(suivant.length === items.length ? [] : suivant);
  }

  function toutSelectionner() {
    if (selection.mode === 'unique') selection.onChange(null);
    else selection.onChange([]);
  }

  return (
    <CadreBoiteFiltre
      titre={titre}
      action={
        <button type="button" className="text-micro font-medium text-(--brand) hover:underline" onClick={toutSelectionner}>
          Tout
        </button>
      }
    >
      {items.map((item) => (
        <label key={item.value} title={item.label} className={CLASSE_LIGNE}>
          <input
            type={selection.mode === 'unique' ? 'radio' : 'checkbox'}
            className="m-0 accent-(--brand)"
            checked={estCochee(item.value)}
            readOnly
            onClick={() => basculer(item.value)}
          />
          <span className="truncate">{item.label}</span>
          {item.compte !== undefined && (
            <span className="ml-auto pl-2 text-micro text-muted-foreground tabular-nums">{formatNumber(item.compte)}</span>
          )}
        </label>
      ))}
    </CadreBoiteFiltre>
  );
}

/** Ligne à cocher d'une boîte : réutilisée par les boîtes qui ne sont pas une liste de valeurs (cases « Options »). */
export const CLASSE_LIGNE =
  'flex h-5.25 cursor-pointer items-center gap-2 rounded-sm px-1.5 text-body whitespace-nowrap text-foreground hover:bg-muted';

/** Cadre d'une boîte du panneau : en-tête (titre, action) et liste de 94 px. */
export function CadreBoiteFiltre({ titre, action, children }: Readonly<{ titre: string; action?: ReactNode; children: ReactNode }>) {
  return (
    <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col rounded-lg border border-border bg-card">
      <header className="flex h-6.5 items-center justify-between gap-2 border-b border-border pr-2 pl-2.5">
        <span className="truncate text-micro font-semibold tracking-wide text-muted-foreground uppercase" title={titre}>
          {titre}
        </span>
        {action}
      </header>
      <div className="h-23.5 overflow-auto p-1">{children}</div>
    </div>
  );
}
