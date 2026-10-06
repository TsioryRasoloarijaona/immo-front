import type { ReactNode } from 'react';
import { Banknote, Info } from 'lucide-react';
import AdminGuard from '../../utilisateurs/AdminGuard';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';

/** Cadre commun des écrans « Ordres de virement » : réservé à
 * l'administrateur (le module Outils l'est en entier), fil d'Ariane
 * Outils › Ordres de virement › écran, et le bandeau qui dit que tout est
 * fictif — sans lui, un essai en réunion passerait pour un vrai virement. */
export default function CadreVirements({
  ecran,
  fullHeight,
  children,
}: {
  ecran: string;
  fullHeight?: boolean;
  children: ReactNode;
}) {
  return (
    <AdminGuard
      title={ecran}
      crumbs={[{ label: 'Outils' }, { label: 'Ordres de virement' }, { label: ecran }]}
      icon={<Banknote />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight={fullHeight}
    >
      <div className={cn('flex flex-col gap-3', fullHeight && 'h-full min-h-0')}>
        <p className="flex shrink-0 items-center gap-1.5 text-micro text-muted-foreground">
          <Info aria-hidden className="size-3.5 shrink-0" />
          Maquette : données fictives, rien n'est enregistré ni envoyé à la banque. Les modifications sont perdues au
          rechargement.
        </p>
        {children}
      </div>
    </AdminGuard>
  );
}

/** Le bloc `Select` de l'app, ramené à une ligne pour les listes courtes. */
export function ChoixSimple<V extends string>({
  id,
  items,
  value,
  onChange,
  className,
}: {
  id?: string;
  items: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v as V)}>
      <SelectTrigger id={id} className={cn('w-full', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
