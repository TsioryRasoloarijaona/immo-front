import { cn } from '../../lib/utils';
import { idEtape, idRepere, type LienReperes } from './maquettes/reperes';

/**
 * Étapes numérotées d'un guide. Une étape qui a sa pastille sur la maquette (`presents`) se relie à elle : survoler
 * l'étape ou focaliser son numéro met la pastille en évidence, et inversement.
 */
export default function EtapesGuide({
  etapes,
  reperes,
  presents = [],
}: Readonly<{ etapes: readonly string[]; reperes?: LienReperes; presents?: readonly number[] }>) {
  return (
    <ol className="-mx-2 flex flex-col gap-1">
      {etapes.map((etape, i) => {
        const n = i + 1;
        const lien = reperes && presents.includes(n) ? reperes : undefined;
        return (
          <li
            key={etape}
            id={idEtape(n)}
            onMouseEnter={lien && (() => lien.onActif(n))}
            onMouseLeave={lien && (() => lien.onActif(null))}
            className={cn('flex gap-3 rounded-lg px-2 py-1 transition-colors', lien?.actif === n && 'bg-muted')}
          >
            <Numero n={n} lien={lien} />
            <span className="pt-0.5 text-body leading-relaxed text-foreground">{etape}</span>
          </li>
        );
      })}
    </ol>
  );
}

const PASTILLE = 'flex size-6 shrink-0 items-center justify-center rounded-full bg-(--brand-bg) text-micro font-semibold text-(--brand) tabular-nums';

function Numero({ n, lien }: Readonly<{ n: number; lien?: LienReperes }>) {
  if (!lien) {
    return (
      <span aria-hidden className={PASTILLE}>
        {n}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Montrer l'étape ${n} sur l'illustration`}
      onFocus={() => lien.onActif(n)}
      onBlur={() => lien.onActif(null)}
      onClick={() => document.getElementById(idRepere(n))?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}
      className={cn(PASTILLE, 'hover:ring-2 hover:ring-(--brand)/40', lien.actif === n && 'ring-2 ring-(--brand)')}
    >
      {n}
    </button>
  );
}
