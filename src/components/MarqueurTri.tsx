import { Link } from 'react-router-dom';
import { Copy, ShieldAlert, Check } from 'lucide-react';
import type { ProspectionDetailDto } from '../types';

/* Le marqueur de tri que l'équipe pose à la main dans le champ libre du
 * logiciel de bureau, et que le serveur normalise.
 *
 * Pourquoi ça mérite un bandeau et pas une pastille : 798 pré-prospections —
 * **20,9 % du vivier** — sont marquées doublon ou spam, et 795 d'entre elles
 * sont encore à l'étape « 1 A TRAITER ». Le marqueur ne change pas l'étape, si
 * bien que sans traitement visuel la liste présente environ 800 déchets comme
 * du travail à faire. Un badge de plus au milieu de quatre autres ne se voit
 * pas ; un bandeau, si.
 *
 * Ce qu'il ne fait pas : griser la fiche. Une fiche marquée doublon reste
 * modifiable — c'est même le geste attendu, corriger ou reclasser — et
 * l'atténuer ferait croire à une lecture seule. */

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

export default function MarqueurTri({ p }: { p: ProspectionDetailDto }) {
  // `marqueurTri` nul ne veut pas dire « pas de note » : 1 239 lignes portent
  // un texte libre non normalisé — sur une prospection c'est le plus souvent la
  // typologie recherchée (`salon_+_2_chambres`). On affiche donc la note même
  // sans marqueur, dans une forme plus discrète.
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
          {/* Le lien se conditionne à l'**id**, jamais au code : `CfgTier.Code`
              n'est pas unique en base, et sur un code ambigu le serveur renvoie
              le code sans pouvoir désigner un tiers. Un lien construit sur le
              code mènerait alors n'importe où. */}
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

      {/* La note brute reste visible à côté du marqueur : c'est elle qui a
          produit le marqueur, et elle porte parfois plus que lui. */}
      {p.noteQualification && (
        <span className="min-w-0 truncate text-micro text-muted-foreground" title={p.noteQualification}>
          « {p.noteQualification} »
        </span>
      )}
    </div>
  );
}
