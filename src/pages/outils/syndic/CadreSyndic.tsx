import type { ReactNode } from 'react';
import { Building, RotateCcw } from 'lucide-react';
import AdminGuard from '../../utilisateurs/AdminGuard';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { rechargerContexte, useContexteVirement } from '../virements/contexte';

export interface ContexteSyndic {
  /** Avance après chaque écriture (`rafraichir()` de `virements/contexte`) : à mettre dans les deps des `useApi`. */
  revision: number;
  /** Administrateur du service : seul à voir et enregistrer les réglages. */
  admin: boolean;
}

/** Même service, même identité que les virements : on réutilise leur contexte (`/moi`). */
export default function CadreSyndic({
  ecran,
  fullHeight,
  children,
}: Readonly<{ ecran: string; fullHeight?: boolean; children: (ctx: ContexteSyndic) => ReactNode }>) {
  const { moi, erreur, accesRefuse, revision } = useContexteVirement();

  let contenu: ReactNode;
  if (accesRefuse) {
    contenu = <EmptyState title="Accès réservé" message={accesRefuse} />;
  } else if (erreur && !moi) {
    contenu = (
      <div className="flex flex-col items-center">
        <ErrorState message={erreur} />
        <Button type="button" variant="outline" size="sm" onClick={rechargerContexte}>
          <RotateCcw data-icon="inline-start" /> Réessayer
        </Button>
      </div>
    );
  } else if (moi) {
    contenu = children({ revision, admin: moi.admin });
  } else {
    contenu = <LoadingState />;
  }

  return (
    <AdminGuard
      title={ecran}
      crumbs={[{ label: 'Outils' }, { label: 'Syndic' }, { label: ecran }]}
      icon={<Building />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      fullHeight={fullHeight}
    >
      <div className={cn('flex flex-col gap-3', fullHeight && 'h-full min-h-0')}>{contenu}</div>
    </AdminGuard>
  );
}
