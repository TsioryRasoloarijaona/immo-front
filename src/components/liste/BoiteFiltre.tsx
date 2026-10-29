import type { ReactNode } from 'react';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { formatNumber } from '../../lib/format';

/** Au-delà, la boîte devient une liste déroulante : elle n'affiche que 4 lignes. Personnes : toujours déroulante. */
const SEUIL_DEROULANT = 8;
const LISTE_DE_PERSONNES = /commercia|utilisateur|vendeur|créé par/i;

export interface ItemFiltre {
  value: string;
  label: string;
  compte?: number;
}

type Selection =
  | { mode: 'multiple'; valeur: string[]; onChange: (valeur: string[]) => void }
  | { mode: 'unique'; valeur: string | null; onChange: (valeur: string | null) => void };

/**
 * Liste à cocher d'un filtre. Rien de coché = `[]` (multiple) ou `null` (unique) = aucun filtre, tout s'affiche ;
 * cocher une valeur restreint la liste à elle.
 */
export default function BoiteFiltre({
  titre,
  items,
  ...selection
}: Readonly<{ titre: string; items: ItemFiltre[] } & Selection>) {
  function estCochee(v: string): boolean {
    if (selection.mode === 'unique') return selection.valeur === v;
    return selection.valeur.includes(v);
  }

  function basculer(v: string) {
    if (selection.mode === 'unique') {
      selection.onChange(selection.valeur === v ? null : v);
      return;
    }
    const choisis = new Set(selection.valeur);
    if (choisis.has(v)) choisis.delete(v);
    else choisis.add(v);
    selection.onChange(items.map((i) => i.value).filter((x) => choisis.has(x)));
  }

  function effacer() {
    if (selection.mode === 'unique') selection.onChange(null);
    else selection.onChange([]);
  }

  const filtre = selection.mode === 'unique' ? selection.valeur !== null : selection.valeur.length > 0;

  if (items.length > SEUIL_DEROULANT || LISTE_DE_PERSONNES.test(titre)) {
    return (
      <div className="flex max-w-62.5 min-w-32.5 flex-[1_1_160px] flex-col gap-1">
        <span className="truncate pl-0.5 text-micro font-semibold tracking-wide text-muted-foreground uppercase" title={titre}>
          {titre}
        </span>
        {selection.mode === 'unique' ? (
          <ChoixUnique items={items} tous="Tous" value={selection.valeur} placeholder="Tous" largeur="w-full" onChange={selection.onChange} />
        ) : (
          <MultiSelectDropdown ariaLabel={titre} placeholder="Tous" items={items} value={selection.valeur} onChange={selection.onChange} className="max-w-none" />
        )}
      </div>
    );
  }

  return (
    <CadreBoiteFiltre
      titre={titre}
      action={
        filtre ? (
          <button type="button" className="text-micro font-medium text-(--brand) hover:underline" onClick={effacer}>
            Effacer
          </button>
        ) : (
          <span className="text-micro text-muted-foreground">Tous</span>
        )
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
