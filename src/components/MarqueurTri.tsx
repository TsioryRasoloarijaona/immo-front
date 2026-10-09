import { Link } from 'react-router-dom';
import { Copy, ShieldAlert, Check } from 'lucide-react';
import type { ProspectionDetailDto } from '../types';

/* Un bandeau, pas une pastille : le marqueur ne change pas l'étape, une fiche
 * doublon/spam passerait sinon pour du travail à faire. Ne pas griser la
 * fiche : elle reste modifiable (corriger ou reclasser est le geste attendu). */

const APPARENCE = {
  DOUBLON: {
    icone: Copy,
    titre: 'Doublon',
    classe: 'border-(--warning)/40 bg-(--warning-bg) text-(--warning)',
  },
  SPAM: {
    icone: ShieldAlert,
    titre: 'Spam',
    classe: 'border-destructive/40 bg-destructive/5 text-destructive',
  },
  TRAITE: {
    icone: Check,
    titre: 'Traité',
    classe: 'border-(--success)/40 bg-(--success-bg) text-(--success)',
  },
} as const;

export default function MarqueurTri({ p }: Readonly<{ p: ProspectionDetailDto }>) {
  // `marqueurTri` nul ne veut pas dire « pas de note » : beaucoup de lignes
  // portent un texte libre non normalisé, affiché alors plus discrètement.
  if (!p.marqueurTri && !p.noteQualification) return null;

  if (!p.marqueurTri) {
    return (
      <div className="flex min-w-0 items-baseline gap-1.5 text-micro">
        <span className="shrink-0 font-medium text-muted-foreground">Note de qualification</span>
        <span className="min-w-0 truncate text-foreground" title={p.noteQualification ?? undefined}>
          {p.noteQualification}
        </span>
      </div>
    );
  }

  const { icone: Icone, titre, classe } = APPARENCE[p.marqueurTri];

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2.5 py-1.5 ${classe}`}>
      <Icone aria-hidden className="size-3.5 shrink-0" />
      <span className="text-label font-semibold">{titre}</span>

      {p.marqueurTri === 'DOUBLON' && p.doublonDeCode && (
        <span className="text-body text-foreground">
          de{' '}
          {/* Le lien se conditionne à l'id, jamais au code : `CfgTier.Code` n'est
              pas unique en base, un lien sur le code mènerait n'importe où. */}
          {p.doublonDeId ? (
            <Link to={`/prospects/${p.doublonDeId}`} className="font-medium underline underline-offset-2">
              {p.doublonDeNom || p.doublonDeCode}
            </Link>
          ) : (
            <span className="font-medium" title="Code ambigu en base — le serveur ne peut pas désigner un tiers unique.">
              {p.doublonDeCode}
            </span>
          )}
        </span>
      )}

      {p.noteQualification && (
        <span className="min-w-0 truncate text-micro text-muted-foreground" title={p.noteQualification}>
          « {p.noteQualification} »
        </span>
      )}
    </div>
  );
}
