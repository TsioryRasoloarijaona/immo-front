import type { ReactNode } from 'react';
import { Badge } from '../../components/ui';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatPercentValue } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { BadgeTone } from '../../types';

/** Le statut d'un décompte est celui de sa facture (BuyDocumentStatus), lu par son libellé. */
function toneStatutFacture(libelle: string): BadgeTone {
  const l = libelle.toUpperCase();
  if (l.includes('REJET') || l.includes('ANNUL')) return 'warning';
  if (l.includes('VALID') || l.includes('REGL') || l.includes('CLOT')) return 'success';
  if (l.includes('COURS') || l.includes('DDE')) return 'progress';
  return 'neutral';
}

export function BadgeStatutFacture({ libelle }: Readonly<{ libelle: string | null }>) {
  if (!libelle) return <span className="text-muted-foreground">—</span>;
  return <Badge tone={toneStatutFacture(libelle)}>{libelle}</Badge>;
}

/** La valeur peut dépasser 100 % : seule la barre est plafonnée. */
export function BarreAvancement({ pct }: Readonly<{ pct: number | null }>) {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  const largeur = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-(--neutral-bg)"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={largeur}
        aria-label="Avancement"
      >
        <div className={cn('h-full rounded-full', pct > 100 ? 'bg-(--amber)' : 'bg-(--brand)')} style={{ width: `${largeur}%` }} />
      </div>
      <span className="tabular-nums text-body text-foreground">{formatPercentValue(pct)}</span>
    </div>
  );
}

/** Ligne libellé / montant d'un tableau de montants à deux colonnes. */
export function LigneMontant({
  libelle,
  valeur,
  fort,
  separe,
}: Readonly<{ libelle: string; valeur: number | null | undefined; fort?: boolean; separe?: boolean }>) {
  return (
    <tr className={cn(separe && 'border-t border-border')}>
      <td className={cn('py-1 pr-4 text-muted-foreground', fort && 'font-semibold text-foreground')}>{libelle}</td>
      <td className={cn('py-1 text-right tabular-nums text-foreground', fort && 'font-semibold')}>{formatCurrency(valeur)}</td>
    </tr>
  );
}

const LIGNES_SQUELETTE = Array.from({ length: 8 }, (_, i) => `squelette-${String(i)}`);

export function SqueletteGrille() {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-3" aria-busy="true" aria-label="Chargement">
      {LIGNES_SQUELETTE.map((cle) => (
        <Skeleton key={cle} className="h-5 w-full" />
      ))}
    </div>
  );
}

/** Bloc de cartes de montants en tête de fiche. */
export function BandeCartes({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
