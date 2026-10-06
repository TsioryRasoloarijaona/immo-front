import type { ReactNode } from 'react';
import { Banknote, RotateCcw } from 'lucide-react';
import AdminGuard from '../../utilisateurs/AdminGuard';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';
import { rechargerContexte, useContexteVirement } from './contexte';
import type { Meta, Moi } from './types';

export interface ContexteCharge {
  moi: Moi;
  meta: Meta;
  /** Avance après chaque écriture : à mettre dans les dépendances des `useApi`. */
  revision: number;
}

/** Cadre commun des écrans « Ordres de virement » : visibilité du module
 * (`AdminGuard`, rôle CRM — inchangée), fil d'Ariane, puis le contexte du
 * service (`/moi`, `/meta`) chargé avant de rendre l'écran.
 *
 * `adminSeulement` : réservé à `moi.admin` — le niveau qui vient du service,
 * pas des rôles CRM (§12). */
export default function CadreVirements({
  ecran,
  fullHeight,
  adminSeulement,
  children,
}: {
  ecran: string;
  fullHeight?: boolean;
  adminSeulement?: boolean;
  children: (ctx: ContexteCharge) => ReactNode;
}) {
  const { moi, meta, erreur, accesRefuse, revision } = useContexteVirement();

  let contenu: ReactNode;
  if (accesRefuse) {
    contenu = <EmptyState title="Accès réservé" message={accesRefuse} />;
  } else if (erreur && !(moi && meta)) {
    contenu = (
      <div className="flex flex-col items-center">
        <ErrorState message={erreur} />
        <Button type="button" variant="outline" size="sm" onClick={rechargerContexte}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  } else if (!moi || !meta) {
    contenu = <LoadingState />;
  } else if (adminSeulement && !moi.admin) {
    contenu = (
      <EmptyState
        title="Réservé aux administrateurs"
        message="Cet écran est réservé aux administrateurs du service des virements."
      />
    );
  } else {
    contenu = children({ moi, meta, revision });
  }

  return (
    <AdminGuard
      title={ecran}
      crumbs={[{ label: 'Outils' }, { label: 'Ordres de virement' }, { label: ecran }]}
      icon={<Banknote />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight={fullHeight}
    >
      <div className={cn('flex flex-col gap-3', fullHeight && 'h-full min-h-0')}>{contenu}</div>
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
