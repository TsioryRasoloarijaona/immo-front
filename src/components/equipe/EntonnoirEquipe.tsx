import { Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { formatNumber, formatPercent } from '../../lib/format';
import type { EntonnoirDto } from '../../types';

/** Entonnoir de cohorte : chaque barre est relative aux arrivés, le taux à l'étape précédente. */
export default function EntonnoirEquipe({
  data,
  loading,
  error,
}: Readonly<{ data: EntonnoirDto | null; loading: boolean; error: string | null }>) {
  const arrives = data?.etapes[0]?.nombre ?? 0;
  return (
    <Card title="Entonnoir">
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          {arrives === 0 ? (
            <EmptyState title="Aucun lead sur la période" message="Aucune pré-prospection ni prospection créée sur ces projets entre ces dates." />
          ) : (
            <div className="flex flex-col gap-2">
              <ol className="flex flex-col gap-1.5">
                {data.etapes.map((e, i) => (
                  <li key={e.code} className="grid grid-cols-[minmax(110px,160px)_1fr_auto] items-center gap-2.5">
                    <span className="truncate text-body text-foreground">{e.libelle ?? e.code}</span>
                    <span className="h-3 rounded-sm bg-muted" aria-hidden>
                      <span
                        className="block h-full rounded-sm bg-(--sec-accent)"
                        style={{ width: `${Math.max(1, (e.nombre / arrives) * 100)}%` }}
                      />
                    </span>
                    <span className="w-36 text-right text-body tabular-nums">
                      <strong className="font-semibold text-foreground">{formatNumber(e.nombre)}</strong>
                      {i > 0 && <span className="text-micro text-muted-foreground"> · {formatPercent(e.tauxPassage)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-micro text-muted-foreground">
                Leads créés sur la période, et l’étape la plus avancée atteinte par chacun à ce jour. Taux = passage
                depuis l’étape précédente. Délai médian pré-prospect → dossier :{' '}
                <strong className="font-medium text-foreground">
                  {data.delaiMedianJours == null ? '—' : `${formatNumber(data.delaiMedianJours)} j`}
                </strong>
                .
              </p>
            </div>
          )}
        </ResultsRegion>
      )}
    </Card>
  );
}
