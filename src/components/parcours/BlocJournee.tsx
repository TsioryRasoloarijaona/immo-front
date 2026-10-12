import type { ReactNode } from 'react';
import { Card } from '../ui';
import { formatNumber } from '../../lib/format';
import { cn } from '../../lib/utils';

/** Carte de « Ma journée » : titre, total, lignes ou message vide ; `alerte` = ton d'alerte (en retard). */
export default function BlocJournee({
  titre,
  sousTitre,
  total,
  affichees,
  alerte = false,
  vide,
  pied,
  children,
}: Readonly<{
  titre: string;
  sousTitre?: string;
  total: number;
  affichees: number;
  alerte?: boolean;
  vide: string;
  pied?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Card
      accent={alerte ? 'var(--warning)' : undefined}
      title={
        <span className="flex items-baseline gap-2">
          {titre}
          {sousTitre && <span className="text-micro font-normal text-muted-foreground">{sousTitre}</span>}
        </span>
      }
      action={<span className={cn('text-label font-semibold tabular-nums', alerte && total > 0 && 'text-(--warning)')}>{formatNumber(total)}</span>}
      padded={false}
    >
      {total === 0 ? (
        <p className="px-4 py-5 text-body text-muted-foreground">{vide}</p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}
      {total > affichees && (
        <p className="border-t border-border px-4 py-2 text-micro text-muted-foreground">
          + {formatNumber(total - affichees)} autres
        </p>
      )}
      {pied && <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">{pied}</div>}
    </Card>
  );
}
