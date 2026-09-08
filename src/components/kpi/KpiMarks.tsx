import type { ReactNode } from 'react';
import { formatNumber, formatPercent } from '../../lib/format';

/* ---------------------------------------------------------------------------
   Les marques des écrans KPI — jauges de taux et barres de classement.
   Tout est en CSS : aucune bibliothèque de graphiques n’est installée, et une
   barre horizontale ancrée à zéro n’en demande pas.

   **Une seule teinte, `--chart-1`.** Ces marques comparent des *grandeurs*
   (« qui en a fait le plus », « quelle part du portefeuille ») et non des
   *identités* : la couleur n’a rien à distinguer, elle porte l’intensité. Les
   cinq tons `--chart-1..5` forment une rampe catégorielle qui, vérifiée pour
   cet usage, échoue à la séparation daltonienne comme à la séparation en vision
   normale (ΔE 6,7 et 9,9 en clair) ; les employer ici pour colorer des barres
   qui mesurent toutes la même chose ajouterait ce défaut sans rien apporter.
   `--chart-1` seul passe le contraste sur les deux fonds de carte.
--------------------------------------------------------------------------- */

/** Portion remplie d’une jauge, bornée à 0–100 %. */
function pourcentage(ratio: number): number {
  return Math.max(0, Math.min(100, ratio * 100));
}

/**
 * Une jauge de taux, avec son effectif.
 *
 * Deux règles du contrat serveur passent par ce composant :
 *
 * 1. **`null` n’est pas `0`.** « Aucun appel passé » et « des appels, aucun
 *    rendez-vous » sont deux situations opposées. Un `ratio` nul affiche « — »
 *    sur une piste vide, visuellement distinct d’un vrai 0 % — qui, lui, est un
 *    remplissage nul mais mesuré.
 * 2. **Un taux se lit avec son effectif.** Sur une période courte le
 *    dénominateur est faible et le pourcentage très bruyant : la fraction brute
 *    est donc affichée à côté, jamais le seul pourcentage.
 *
 * La piste est un pas clair du même ramp que le remplissage (`--chart-1-track`)
 * et non un gris neutre, pour que la jauge se lise sur toute sa longueur.
 *
 * Aucun seuil de couleur : le backend n’expose ni objectif ni cible, donc
 * teinter « bon / mauvais » reviendrait à inventer un barème.
 */
export function RatioStat({
  label,
  ratio,
  numerateur,
  denominateur,
  aide,
}: {
  label: string;
  ratio: number | null | undefined;
  numerateur: number | null | undefined;
  denominateur: number | null | undefined;
  aide?: string;
}) {
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

/**
 * Une ligne de classement : nom, barre proportionnelle, valeur.
 *
 * La barre est mise à l’échelle du **maximum du jeu affiché**, pas de 100 :
 * l’objet du classement est l’écart entre les commerciaux, et rapporter à une
 * borne arbitraire écraserait tout le monde contre la gauche.
 *
 * La valeur est posée au bout de la barre — un libellé direct par ligne, ce que
 * la lecture d’un classement court demande ; l’axe est inutile ici.
 */
export function RankBarRow({
  label,
  value,
  max,
  sub,
  href,
}: {
  label: string;
  value: number;
  max: number;
  sub?: ReactNode;
  href?: string;
}) {
  // `max` nul (personne n’a rien fait) : toutes les barres restent à zéro
  // plutôt que de diviser par zéro et produire des NaN% de largeur.
  const largeur = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="min-w-0 flex-1 truncate text-body text-foreground" title={label}>
        {label}
        {sub && <span className="ml-1.5 text-micro text-muted-foreground">{sub}</span>}
      </span>
      <span className="h-3 w-[45%] max-w-90 shrink-0 overflow-hidden rounded-sm" aria-hidden>
        {/* Bout arrondi côté valeur, carré à la ligne de base — la barre part
            toujours de zéro, jamais d’un fond de graphe flottant. */}
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

/**
 * Une famille d’indicateurs, avec la phrase qui dit ce qu’elle mesure.
 *
 * C’est ici que se dit la distinction la plus facile à perdre du contrat :
 * l’**activité** est comptée pour celui qui l’a saisie, le **portefeuille** pour
 * le commercial assigné. Sans cette phrase, deux blocs de chiffres voisins
 * paraissent parler de la même chose alors qu’ils comptent différemment.
 */
export function KpiFamilySection({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: ReactNode;
}) {
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
