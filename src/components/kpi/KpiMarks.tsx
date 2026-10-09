import type { ReactNode } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';

/* Une seule teinte, `--chart-1` : la rampe `--chart-1..5` échoue à la séparation
   daltonienne, et `--chart-1` seul passe le contraste sur les deux fonds. */

function pourcentage(ratio: number): number {
  return Math.max(0, Math.min(100, ratio * 100));
}

/** `null` n'est pas `0` : « aucun appel » et « des appels, aucun RDV » sont
 * opposés. La fraction brute reste affichée, un taux sur un petit effectif est
 * bruyant. Pas de seuil de couleur : le backend n'expose aucune cible. */
export function RatioStat({
  label,
  ratio,
  numerateur,
  denominateur,
  aide,
}: Readonly<{
  label: string;
  ratio: number | null | undefined;
  numerateur: number | null | undefined;
  denominateur: number | null | undefined;
  aide?: string;
}>) {
  const mesurable = ratio !== null && ratio !== undefined && !Number.isNaN(ratio);
  const largeur = mesurable ? pourcentage(ratio) : 0;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3.5 py-3">
      <span className="text-body font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-page font-semibold tracking-tight text-foreground">{formatPercent(ratio)}</span>
        <span className="text-micro tabular-nums text-muted-foreground">
          {formatNumber(numerateur)} / {formatNumber(denominateur)}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-(--chart-1-track)"
        role="img"
        aria-label={
          mesurable
            ? `${label} : ${formatPercent(ratio)} (${formatNumber(numerateur)} sur ${formatNumber(denominateur)})`
            : `${label} : non mesurable, aucun élément sur la période`
        }
      >
        {mesurable && <div className="h-full rounded-full bg-(--chart-1)" style={{ width: `${largeur}%` }} />}
      </div>
      {aide && <span className="text-micro text-muted-foreground">{aide}</span>}
      {!mesurable && (
        <span className="text-micro text-muted-foreground">Aucun élément sur la période — rien à mesurer.</span>
      )}
    </div>
  );
}

/** Échelle = maximum du jeu affiché, pas 100 : c'est l'écart entre commerciaux qui compte. */
export function RankBarRow({
  label,
  value,
  max,
  sub,
  href,
}: Readonly<{
  label: string;
  value: number;
  max: number;
  sub?: ReactNode;
  href?: string;
}>) {
  const largeur = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="min-w-0 flex-1 truncate text-body text-foreground" title={label}>
        {label}
        {sub && <span className="ml-1.5 text-micro text-muted-foreground">{sub}</span>}
      </span>
      <span className="h-3 w-[45%] max-w-90 shrink-0 overflow-hidden rounded-sm" aria-hidden>
        <span
          className="block h-full rounded-r-[4px] bg-(--chart-1)"
          style={{ width: `${largeur}%`, minWidth: value > 0 ? '2px' : undefined }}
        />
      </span>
      <span className="w-16 shrink-0 text-right text-body font-semibold tabular-nums text-foreground">
        {formatNumber(value)}
      </span>
      {href && <span className="sr-only">{href}</span>}
    </div>
  );
}

/** `description` est obligatoire : l'activité est comptée pour qui l'a saisie, le
 * portefeuille pour le commercial assigné — sans elle, les deux blocs se confondent. */
export function KpiFamilySection({
  titre,
  description,
  children,
}: Readonly<{
  titre: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-label font-semibold text-foreground">{titre}</h2>
        <p className="max-w-180 text-micro text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
