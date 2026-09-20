import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, ErrorState } from './ui';
import { getSyntheseAnnuelle } from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatMontantCompact, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';
import type { PointMensuelDto } from '../types';

/* ---------------------------------------------------------------------------
   La synthèse annuelle — l'écran d'accueil du logiciel de bureau.

   **Trois blocs qui ne s'additionnent pas**, et c'est la seule chose qu'il ne
   faut pas rater en les mettant côte à côte : l'échéancier est du *dû*, les
   encaissements du *réalisé*, les ventes concrétisées un *sous-ensemble des
   dossiers*. D'où trois zones nettement séparées, chacune avec son unité
   annoncée, plutôt qu'une rangée de chiffres qu'on serait tenté de soustraire
   les uns des autres.

   Forme : douze **barres**, pas une courbe, malgré le mot du spec. Ce sont
   douze sommes mensuelles discrètes, pas une grandeur échantillonnée ; un mois
   à zéro doit se lire comme une barre absente, pas comme un creux interpolé.

   Une seule teinte pour les douze barres. La distinction échu / à venir est un
   **état**, pas une valeur : elle passe par le remplissage et par une légende,
   jamais par une rampe de couleur — colorer plus foncé ce qui est plus grand
   redirait la hauteur de la barre et brûlerait le seul canal libre.
   --------------------------------------------------------------------------- */

const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MOIS_LONG = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/** Hauteur de la zone de tracé. La bande d'axe et la légende vivent **hors**
 * de cette hauteur : un conteneur dimensionné sur le seul tracé rogne ses
 * étiquettes de mois et fabrique une barre de défilement dans la carte. */
const H_TRACE = 104;

export default function SyntheseAnnuelle() {
  const anneeCourante = new Date().getFullYear();
  const [annee, setAnnee] = useState(anneeCourante);
  const { data, loading, error } = useApi(() => getSyntheseAnnuelle(annee), [annee]);
  const [survole, setSurvole] = useState<number | null>(null);

  const echeancier = data?.echeancier ?? [];
  const max = echeancier.reduce((m, p) => Math.max(m, p.montant ?? 0), 0);
  const total = echeancier.reduce((s, p) => s + (p.montant ?? 0), 0);
  /* Le mois de bascule n'existe que sur l'année en cours : une année passée
     est échue de bout en bout, une année à venir ne l'est nulle part. */
  const moisPivot = annee < anneeCourante ? 12 : annee > anneeCourante ? 0 : new Date().getMonth() + 1;
  /* Étiquette directe sur le seul mois le plus fort — pas un nombre sur chaque
     barre, qui ne se lit pas. L'axe et l'infobulle portent le reste. */
  const moisMax = max > 0 ? echeancier.find((p) => p.montant === max)?.mois : undefined;

  const v = data?.ventesConcretisees;
  const e = data?.encaissements;

  return (
    <Card
      title="Synthèse annuelle"
      accent="var(--sec-accent)"
      padded={false}
      action={
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={() => setAnnee((a) => a - 1)}
            disabled={annee <= anneeCourante - 6}
            aria-label="Année précédente"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="min-w-11 text-center text-label font-semibold tabular-nums text-foreground">{annee}</span>
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            onClick={() => setAnnee((a) => a + 1)}
            disabled={annee >= anneeCourante}
            aria-label="Année suivante"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      }
    >
      {error && <div className="p-3"><ErrorState message={error} /></div>}

      {!error && (
        <div className="grid grid-cols-1 gap-3 p-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* ---------------------------------------------------------------
              Bloc 1 — l'échéancier. Du *dû*, et le sous-titre le dit : c'est
              la confusion la plus facile de tout cet écran, et celle qui
              ferait lire une prévision comme un réalisé.
              --------------------------------------------------------------- */}
          <section className="min-w-0">
            <div className="mb-1 flex items-baseline gap-2">
              <h3 className="text-label font-semibold text-foreground">Échéancier</h3>
              <span className="text-micro text-muted-foreground">montants dus, pas encaissés</span>
              {/* L'étiquette directe du seul extrême — ni un nombre sur
                  chaque barre, qui ne se lit pas, ni une étiquette flottante
                  au-dessus du tracé, qui se cognerait à ce titre. */}
              {moisMax !== undefined && (
                <span className="shrink-0 text-micro text-muted-foreground">
                  max {MOIS_LONG[moisMax - 1].toLowerCase()} {formatMontantCompact(max)}
                </span>
              )}
              <span className="ml-auto shrink-0 text-label font-semibold tabular-nums text-foreground">
                {loading && !data ? '—' : formatCurrency(total)}
              </span>
            </div>

            <div className="relative" style={{ height: H_TRACE }}>
              {/* Filet de base plein, une nuance au-dessus de la surface. Pas
                  de pointillés : sur une grille ils se lisent comme un seuil
                  ou une projection alors qu'ils ne sont qu'un repère. */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

              <div className="flex h-full items-end gap-[2px]">
                {echeancier.map((p) => {
                  const aVenir = p.mois > moisPivot;
                  const hauteur = max > 0 ? Math.max((p.montant / max) * 100, p.montant > 0 ? 2 : 0) : 0;
                  return (
                    <div
                      key={p.mois}
                      className="relative flex h-full min-w-0 flex-1 items-end"
                      onMouseEnter={() => setSurvole(p.mois)}
                      onMouseLeave={() => setSurvole(null)}
                    >
                      <div
                        className={cn(
                          'w-full rounded-t-[4px] transition-[height]',
                          aVenir ? 'bg-(--brand)/35' : 'bg-(--brand)',
                          survole === p.mois && 'outline-2 outline-offset-[-2px] outline-(--brand)',
                        )}
                        style={{ height: `${hauteur}%` }}
                      />
                      {survole === p.mois && <InfobulleMois point={p} aVenir={aVenir} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* La bande d'axe, hors de la hauteur de tracé. */}
            <div className="flex gap-[2px] pt-1">
              {MOIS.map((m, i) => (
                <span
                  key={i}
                  className={cn(
                    'min-w-0 flex-1 text-center text-micro tabular-nums',
                    i + 1 > moisPivot ? 'text-muted-foreground/60' : 'text-muted-foreground',
                  )}
                >
                  {m}
                </span>
              ))}
            </div>

            {/* Deux états, donc une légende : l'information n'est jamais
                portée par la seule teinte. */}
            {moisPivot > 0 && moisPivot < 12 && (
              <div className="mt-1.5 flex items-center gap-3 text-micro text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-[2px] bg-(--brand)" /> échu
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-[2px] bg-(--brand)/35" /> à venir
                </span>
                {/* Pourquoi les mois à venir sont là et doivent y rester. */}
                <span>— un montant dû peut porter sur un mois futur</span>
              </div>
            )}

            {/* La vue tabulaire : l'infobulle ne se survole pas au clavier ni
                au lecteur d'écran. */}
            <table className="sr-only">
              <caption>Échéancier {annee} — montants dus par mois</caption>
              <thead>
                <tr><th scope="col">Mois</th><th scope="col">Montant dû</th><th scope="col">Échéances</th></tr>
              </thead>
              <tbody>
                {echeancier.map((p) => (
                  <tr key={p.mois}>
                    <th scope="row">{MOIS_LONG[p.mois - 1]}</th>
                    <td>{formatCurrency(p.montant)}</td>
                    <td>{p.lignes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ---------------------------------------------------------------
              Blocs 2 et 3 — des nombres, pas des graphiques. Un compteur de
              dossiers et deux totaux ne gagnent rien à devenir des barres, et
              une barre unique n'est pas un graphique.
              --------------------------------------------------------------- */}
          <section className="flex min-w-0 flex-col gap-2">
            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-label font-semibold text-foreground">Ventes concrétisées</h3>
                <span className="ml-auto text-hero font-semibold tabular-nums text-foreground">
                  {v ? formatNumber(v.nombreDossiers) : '—'}
                </span>
              </div>
              <dl className="mt-1 flex flex-col gap-0.5 text-body">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Prix de vente</dt>
                  <dd className="tabular-nums text-foreground">{v ? formatCurrency(v.prixTotal) : '—'}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  {/* Ce n'est pas « prix moins reste à payer » : les frais
                      n'entrent pas dans ce montant. Le libellé reste donc
                      « déjà réglé » et non « encaissé sur ces ventes ». */}
                  <dt className="text-muted-foreground">Déjà réglé</dt>
                  <dd className="tabular-nums text-foreground">{v ? formatCurrency(v.montantRegle) : '—'}</dd>
                </div>
              </dl>

              {/* Le trou d'assiette, affiché plutôt que subi — c'est la raison
                  d'être du compteur côté serveur. Sans cette ligne,
                  « nombreDossiers » se lirait comme le total des ventes de
                  l'année alors qu'il ne couvre que les dossiers pourvus d'une
                  date d'avance. */}
              {!!v?.dossiersSansDateAvance && (
                <p className="mt-1.5 flex items-start gap-1.5 border-t border-border pt-1.5 text-micro text-(--amber)">
                  <Info aria-hidden className="mt-px size-3 shrink-0" />
                  <span>
                    <strong className="tabular-nums">{formatNumber(v.dossiersSansDateAvance)} dossiers</strong> restent hors
                    de ce décompte, faute de date d'avance — toutes années confondues.
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-lg bg-muted/30 px-3 py-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-label font-semibold text-foreground">Encaissements</h3>
                <span className="text-micro text-muted-foreground">réellement entré en caisse</span>
                <span className="ml-auto text-hero font-semibold tabular-nums text-foreground">
                  {e ? formatMontantCompact(e.montantTotal) : '—'}
                </span>
              </div>
              <p className="mt-0.5 text-body text-muted-foreground">
                {e ? `${formatCurrency(e.montantTotal)} sur ${formatNumber(e.nombreLignes)} règlements` : '—'}
              </p>
              {/* Pourquoi ce total ne se rapproche pas de l'échéancier. */}
              <p className="mt-1 text-micro text-muted-foreground">
                Crédits seuls — un décaissement n'est pas un encaissement négatif.
              </p>
            </div>
          </section>
        </div>
      )}
    </Card>
  );
}

/** La valeur exacte, au survol. L'axe porte un montant abrégé ; celui-ci ne
 * remplace jamais le chiffre entier, il y renvoie. */
function InfobulleMois({ point, aVenir }: { point: PointMensuelDto; aVenir: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 shadow-md">
      <div className="text-micro font-medium text-foreground">
        {MOIS_LONG[point.mois - 1]}
        {aVenir && <span className="ml-1 font-normal text-muted-foreground">(à venir)</span>}
      </div>
      <div className="text-body font-semibold tabular-nums text-foreground">{formatCurrency(point.montant)}</div>
      {/* `lignes` est la seule colonne qui sépare « mois vide » de « mois à
          zéro » — deux situations différentes que le montant seul confond. */}
      <div className="text-micro tabular-nums text-muted-foreground">
        {point.lignes === 0 ? 'aucune échéance' : `${point.lignes} échéance${point.lignes > 1 ? 's' : ''}`}
      </div>
    </div>
  );
}
