import { useState } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, ErrorState } from './ui';
import { getSyntheseAnnuelle } from '../lib/api';
import { useApi } from '../lib/useApi';
import { formatCurrency, formatMontantCompact, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';
import type { PointMensuelDto, UUID } from '../types';

/* Trois blocs qui ne s'additionnent pas : l'échéancier est du dû, les
   encaissements du réalisé, les ventes un sous-ensemble des dossiers. Les
   garder séparés, chacun avec son unité. */

const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MOIS_LONG = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/** Tracé seul : l'axe et la légende vivent hors de cette hauteur, sinon les
 * étiquettes de mois sont rognées et la carte défile. */
const H_TRACE = 104;

/** Mois au-delà duquel l'échéancier est « à venir » : 12 pour une année passée, 0 pour une future. */
function moisPivotPour(annee: number, anneeCourante: number): number {
  if (annee < anneeCourante) return 12;
  if (annee > anneeCourante) return 0;
  return new Date().getMonth() + 1;
}

/** Hauteur en % ; un mois non nul garde au moins 2 % pour rester visible. */
function hauteurBarre(montant: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max((montant / max) * 100, montant > 0 ? 2 : 0);
}

/** `trancheId` : administrateur seul, le parent ne le passe pas pour un autre rôle. */
export default function SyntheseAnnuelle({ trancheId }: { trancheId?: UUID } = {}) {
  const anneeCourante = new Date().getFullYear();
  const [annee, setAnnee] = useState(anneeCourante);
  const { data, loading, error } = useApi(() => getSyntheseAnnuelle(annee, trancheId), [annee, trancheId]);
  const [survole, setSurvole] = useState<number | null>(null);

  const echeancier = data?.echeancier ?? [];
  const max = echeancier.reduce((m, p) => Math.max(m, p.montant), 0);
  const total = echeancier.reduce((s, p) => s + p.montant, 0);
  const moisPivot = moisPivotPour(annee, anneeCourante);
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
          <section className="min-w-0">
            <div className="mb-1 flex items-baseline gap-2">
              <h3 className="text-label font-semibold text-foreground">Échéancier</h3>
              <span className="text-micro text-muted-foreground">montants dus, pas encaissés</span>
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
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />

              <div className="flex h-full items-end gap-[2px]">
                {echeancier.map((p) => {
                  const aVenir = p.mois > moisPivot;
                  const hauteur = hauteurBarre(p.montant, max);
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

            {/* Légende obligatoire : l'état échu / à venir ne doit pas passer par la seule teinte. */}
            {moisPivot > 0 && moisPivot < 12 && (
              <div className="mt-1.5 flex items-center gap-3 text-micro text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-[2px] bg-(--brand)" /> échu
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-[2px] bg-(--brand)/35" /> à venir
                </span>
                <span>— un montant dû peut porter sur un mois futur</span>
              </div>
            )}

            {/* Table `sr-only` : l'infobulle ne se survole ni au clavier ni au lecteur d'écran. */}
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
                  {/* Pas « prix moins reste à payer » : les frais n'y entrent pas,
                      d'où « déjà réglé » et non « encaissé sur ces ventes ». */}
                  <dt className="text-muted-foreground">Déjà réglé</dt>
                  <dd className="tabular-nums text-foreground">{v ? formatCurrency(v.montantRegle) : '—'}</dd>
                </div>
              </dl>

              {/* Sans cette ligne, `nombreDossiers` se lirait comme le total des ventes,
                  alors qu'il ne couvre que les dossiers pourvus d'une date d'avance. */}
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

function InfobulleMois({ point, aVenir }: Readonly<{ point: PointMensuelDto; aVenir: boolean }>) {
  const pluriel = point.lignes > 1 ? 's' : '';
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 shadow-md">
      <div className="text-micro font-medium text-foreground">
        {MOIS_LONG[point.mois - 1]}
        {aVenir && <span className="ml-1 font-normal text-muted-foreground">(à venir)</span>}
      </div>
      <div className="text-body font-semibold tabular-nums text-foreground">{formatCurrency(point.montant)}</div>
      {/* Seul `lignes` distingue « mois vide » de « mois à zéro ». */}
      <div className="text-micro tabular-nums text-muted-foreground">
        {point.lignes === 0 ? 'aucune échéance' : `${point.lignes} échéance${pluriel}`}
      </div>
    </div>
  );
}
